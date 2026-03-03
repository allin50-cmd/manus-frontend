import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts } from './db/schema';
import { desc, eq } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';
import {
  runZeroVarianceCheck,
  calculateComplianceScore,
  splitCTLongPeriod,
  generateIdempotencyKey,
  validateIdempotencyKey,
  mockHmrcVatSubmit,
  generateComplianceHealthPanel,
  getCTPeriod,
  getComplianceData,
  ERROR_MESSAGES,
} from './services/hmrc/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

/**
 * GET /api/health
 * Health check endpoint
 */
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.select().from(deploymentStatus).limit(1);

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ============================================================================
// DEPLOYMENT TRACKING API ENDPOINTS
// ============================================================================

/**
 * POST /api/deployments/record
 * Record a new deployment status
 * Requires X-DEPLOY-TOKEN header for authentication
 */
app.post('/api/deployments/record', async (req: Request, res: Response) => {
  try {
    // Check authentication
    const token = req.headers['x-deploy-token'];
    if (!token || token !== DEPLOY_RECORD_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { environment, status, commit, workflowRun } = req.body;

    // Validate required fields
    if (!environment || !status || !commit || !workflowRun) {
      return res.status(400).json({
        error: 'Missing required fields: environment, status, commit, workflowRun',
      });
    }

    // Validate environment
    if (!['dev', 'staging', 'prod'].includes(environment)) {
      return res.status(400).json({
        error: 'Invalid environment. Must be: dev, staging, or prod',
      });
    }

    // Validate status
    if (!['success', 'failed', 'in_progress'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: success, failed, or in_progress',
      });
    }

    // Insert deployment record
    const [deployment] = await db
      .insert(deploymentStatus)
      .values({
        environment,
        status,
        commit: commit.substring(0, 50), // Limit to 50 chars
        workflowRun: workflowRun.toString(),
      })
      .returning();

    console.log(`✅ Deployment recorded: ${environment} - ${status} - ${commit}`);

    res.status(201).json({
      success: true,
      id: deployment.id,
    });
  } catch (error) {
    console.error('Error recording deployment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/deployments/status
 * Get latest deployment status for each environment
 * Public endpoint (no authentication required)
 */
app.get('/api/deployments/status', async (req: Request, res: Response) => {
  try {
    // Get all deployments ordered by date
    const allDeployments = await db
      .select()
      .from(deploymentStatus)
      .orderBy(desc(deploymentStatus.deployedAt));

    // Get latest deployment for each environment
    const latestDeployments = new Map();
    for (const deployment of allDeployments) {
      if (!latestDeployments.has(deployment.environment)) {
        latestDeployments.set(deployment.environment, deployment);
      }
    }

    const deployments = Array.from(latestDeployments.values());

    res.json({ deployments });
  } catch (error) {
    console.error('Error fetching deployment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/deployments/history
 * Get deployment history with optional filters
 */
app.get('/api/deployments/history', async (req: Request, res: Response) => {
  try {
    const { environment, limit = '50' } = req.query;

    let query = db.select().from(deploymentStatus);

    if (environment && typeof environment === 'string') {
      query = query.where(eq(deploymentStatus.environment, environment)) as any;
    }

    const deployments = await query
      .orderBy(desc(deploymentStatus.deployedAt))
      .limit(parseInt(limit as string));

    res.json({ deployments });
  } catch (error) {
    console.error('Error fetching deployment history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// LEAD CAPTURE API ENDPOINTS
// ============================================================================

/**
 * POST /api/lead
 * Submit a demo booking lead
 */
app.post('/api/lead', async (req: Request, res: Response) => {
  try {
    const { name, email, company, product, phone, message } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        ok: false,
        error: 'Name and email are required',
      });
    }

    // Generate unique lead ID
    const leadId = `LEAD-${Date.now()}`;

    const [lead] = await db
      .insert(leads)
      .values({
        leadId,
        name,
        email,
        company: company || null,
        product: product || null,
        phone: phone || null,
        message: message || null,
      })
      .returning();

    console.log(`📧 New lead captured: ${name} - ${product || 'N/A'}`);

    res.status(201).json({
      ok: true,
      message: "Thank you for your interest! We'll be in touch soon.",
      leadId: lead.leadId,
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save lead. Please try again.',
    });
  }
});

/**
 * GET /api/admin/leads
 * Get all leads (admin endpoint)
 */
app.get('/api/admin/leads', async (req: Request, res: Response) => {
  try {
    const allLeads = await db
      .select()
      .from(leads)
      .orderBy(desc(leads.createdAt));

    res.json(allLeads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ============================================================================
// INTAKE FORM API ENDPOINTS
// ============================================================================

/**
 * POST /api/intake
 * Submit a client intake form
 */
app.post('/api/intake', async (req: Request, res: Response) => {
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      matterType,
      urgency,
      description,
      claimValue
    } = req.body;

    if (!clientName || !matterType || !urgency) {
      return res.status(400).json({
        ok: false,
        error: 'Client name, matter type, and urgency are required',
      });
    }

    // Generate unique matter reference
    const matterRef = `MAT-${Date.now()}`;

    const [intake] = await db
      .insert(intakeForms)
      .values({
        matterRef,
        clientName,
        clientEmail: clientEmail || null,
        clientPhone: clientPhone || null,
        matterType,
        urgency,
        description: description || null,
        claimValue: claimValue || null,
      })
      .returning();

    console.log(`📋 New intake form: ${clientName} - ${matterType}`);

    res.status(201).json({
      ok: true,
      message: 'Matter intake recorded successfully',
      matterRef: intake.matterRef,
      urgency: intake.urgency,
    });
  } catch (error) {
    console.error('Error creating intake form:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save intake form. Please try again.',
    });
  }
});

/**
 * GET /api/admin/intake-forms
 * Get all intake forms (admin endpoint)
 */
app.get('/api/admin/intake-forms', async (req: Request, res: Response) => {
  try {
    const allForms = await db
      .select()
      .from(intakeForms)
      .orderBy(desc(intakeForms.createdAt));

    res.json(allForms);
  } catch (error) {
    console.error('Error fetching intake forms:', error);
    res.status(500).json({ error: 'Failed to fetch intake forms' });
  }
});

// ============================================================================
// COMPLIANCE BUNDLE API ENDPOINTS
// ============================================================================

/**
 * POST /api/compliance-bundle
 * Submit a compliance bundle request with REAL-TIME Companies House lookup
 */
app.post('/api/compliance-bundle', async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyNumber,
      requestorName,
      requestorEmail,
      bundleType
    } = req.body;

    if (!companyNumber) {
      return res.status(400).json({
        ok: false,
        error: 'Company number is required',
      });
    }

    // Validate company number format
    if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid company number format. Must be 8 digits or 2 letters + 6 digits.',
      });
    }

    // Format company number
    const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber);

    // REAL-TIME: Fetch company profile from Companies House
    const companyProfile = await companiesHouseService.getCompanyProfile(formattedNumber);

    if (!companyProfile) {
      return res.status(404).json({
        ok: false,
        error: 'Company not found in Companies House register. Please check the company number.',
      });
    }

    // REAL-TIME: Get compliance status with deadlines
    const complianceStatus = await companiesHouseService.getComplianceStatus(formattedNumber);

    // Generate unique bundle ID
    const bundleId = `BUNDLE-${Date.now()}`;

    // Save to database with REAL company data
    const [bundle] = await db
      .insert(complianceBundles)
      .values({
        bundleId,
        companyName: companyProfile.companyName, // Use REAL name from Companies House
        companyNumber: formattedNumber,
        requestorName: requestorName || null,
        requestorEmail: requestorEmail || null,
        bundleType: bundleType || 'full',
        estimatedTime: 'Generated instantly', // No longer fake - we have real data!
      })
      .returning();

    console.log(`📦 Real-time compliance check: ${companyProfile.companyName} (${formattedNumber})`);
    console.log(`   Status: ${complianceStatus.status.toUpperCase()}`);
    console.log(`   Risk Level: ${complianceStatus.riskLevel.toUpperCase()}`);
    console.log(`   Overdue Filings: ${complianceStatus.overdueFilings.length}`);
    console.log(`   Upcoming Deadlines: ${complianceStatus.upcomingDeadlines.length}`);

    res.status(201).json({
      ok: true,
      message: 'Real-time compliance check complete',
      bundleId: bundle.bundleId,

      // REAL DATA from Companies House:
      company: {
        number: companyProfile.companyNumber,
        name: companyProfile.companyName,
        status: companyProfile.companyStatus,
        type: companyProfile.type,
        incorporationDate: companyProfile.dateOfCreation,
      },

      compliance: {
        status: complianceStatus.status,
        riskLevel: complianceStatus.riskLevel,

        accounts: {
          nextDue: complianceStatus.accountsStatus.nextDue,
          daysUntilDue: complianceStatus.accountsStatus.daysUntilDue,
          overdue: complianceStatus.accountsStatus.overdue,
        },

        confirmationStatement: {
          nextDue: complianceStatus.confirmationStatementStatus.nextDue,
          daysUntilDue: complianceStatus.confirmationStatementStatus.daysUntilDue,
          overdue: complianceStatus.confirmationStatementStatus.overdue,
        },

        overdueFilings: complianceStatus.overdueFilings.map(f => ({
          type: f.type,
          description: f.description,
          dueDate: f.dueDate,
          daysOverdue: Math.abs(f.daysUntilDue),
          penaltyRisk: f.penaltyRisk,
        })),

        upcomingDeadlines: complianceStatus.upcomingDeadlines.map(d => ({
          type: d.type,
          description: d.description,
          dueDate: d.dueDate,
          daysUntilDue: d.daysUntilDue,
        })),

        penalties: complianceStatus.penalties,
      },
    });
  } catch (error) {
    console.error('Error fetching Companies House data:', error);

    // Check if it's an API key error
    if (error instanceof Error && error.message.includes('COMPANIES_HOUSE_API_KEY')) {
      return res.status(500).json({
        ok: false,
        error: 'Companies House API not configured. Please contact support.',
      });
    }

    res.status(500).json({
      ok: false,
      error: 'Failed to fetch company information. Please try again.',
    });
  }
});

/**
 * GET /api/admin/compliance-bundles
 * Get all compliance bundle requests (admin endpoint)
 */
app.get('/api/admin/compliance-bundles', async (req: Request, res: Response) => {
  try {
    const allBundles = await db
      .select()
      .from(complianceBundles)
      .orderBy(desc(complianceBundles.createdAt));

    res.json(allBundles);
  } catch (error) {
    console.error('Error fetching compliance bundles:', error);
    res.status(500).json({ error: 'Failed to fetch compliance bundles' });
  }
});

// ============================================================================
// CONTACT FORM API ENDPOINTS
// ============================================================================

/**
 * POST /api/contact
 * Submit a contact form
 */
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Name, email, and message are required',
      });
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${Date.now()}`;

    const [contact] = await db
      .insert(contacts)
      .values({
        ticketId,
        name,
        email,
        subject: subject || null,
        message,
        status: 'new',
      })
      .returning();

    console.log(`💬 New contact: ${name}`);

    res.status(201).json({
      ok: true,
      message: "Thank you for contacting us. We'll respond within 24 hours.",
      ticketId: contact.ticketId,
    });
  } catch (error) {
    console.error('Error creating contact:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to save contact form. Please try again.',
    });
  }
});

/**
 * GET /api/admin/contacts
 * Get all contacts (admin endpoint)
 */
app.get('/api/admin/contacts', async (req: Request, res: Response) => {
  try {
    const allContacts = await db
      .select()
      .from(contacts)
      .orderBy(desc(contacts.createdAt));

    res.json(allContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

/**
 * PATCH /api/contacts/:id
 * Update contact status
 */
app.patch('/api/contacts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['new', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be: new, read, or replied',
      });
    }

    const [contact] = await db
      .update(contacts)
      .set({ status })
      .where(eq(contacts.id, id))
      .returning();

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json({ success: true, contact });
  } catch (error) {
    console.error('Error updating contact:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await db.select().from(deploymentStatus).limit(1);

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
    });
  }
});

// ============================================================================
// FINEGUARD — HMRC CORE LOGIC API ENDPOINTS
// ============================================================================

/**
 * POST /api/hmrc/vat/validate
 * Zero-Variance Engine: compare internal records vs HMRC draft return.
 * Blocks submission and returns error codes on any discrepancy.
 *
 * Body: HmrcVatReturn (draft from HMRC MTD API)
 */
app.post('/api/hmrc/vat/validate', async (req: Request, res: Response) => {
  try {
    const hmrcDraft = req.body;

    if (!hmrcDraft?.periodKey) {
      return res.status(400).json({
        ok: false,
        error: 'Request body must be a valid HMRC VAT return draft with a periodKey.',
      });
    }

    const result = await runZeroVarianceCheck(hmrcDraft);

    if (result.passed) {
      return res.json({
        ok: true,
        passed: true,
        message: 'Zero-Variance check passed. Return is cleared for submission.',
        result,
      });
    }

    // Map errors to human-readable format for the UI
    const userFacingErrors = result.errors.map(e => ({
      code: e.code,
      field: e.field,
      humanReadable: e.humanReadable,
      blocking: e.blocking,
      variance: `£${(Math.abs(e.variance) / 100).toFixed(2)}`,
    }));

    return res.status(422).json({
      ok: false,
      passed: false,
      message: 'Zero-Variance check failed. Submission blocked.',
      errors: userFacingErrors,
      summary: result.summary,
      checkedAt: result.checkedAt,
    });
  } catch (error) {
    console.error('Zero-Variance check error:', error);
    res.status(500).json({ ok: false, error: 'Internal error during variance check.' });
  }
});

/**
 * POST /api/hmrc/vat/submit
 * Idempotency-safe VAT return submission.
 * Uses UUID key to prevent duplicate filings during API timeouts.
 *
 * Body: { vrn, periodKey, idempotencyKey? }
 * If idempotencyKey is omitted, a new one is generated and returned.
 */
app.post('/api/hmrc/vat/submit', async (req: Request, res: Response) => {
  try {
    const { vrn, periodKey, idempotencyKey: providedKey } = req.body;

    if (!vrn || !periodKey) {
      return res.status(400).json({
        ok: false,
        error: 'vrn (VAT Registration Number) and periodKey are required.',
      });
    }

    // Generate a new key if none provided (first attempt)
    let idempotencyKey = providedKey;
    if (!idempotencyKey) {
      const record = generateIdempotencyKey('/organisations/vat/returns', { vrn, periodKey });
      idempotencyKey = record.key;
    }

    // Check for immediate duplicate before calling HMRC
    const { isDuplicate, record: existingRecord } = validateIdempotencyKey(idempotencyKey);
    if (isDuplicate) {
      return res.status(409).json({
        ok: false,
        isDuplicate: true,
        idempotencyKey,
        message: ERROR_MESSAGES['ERR_DUP_001'],
        hmrcCorrelationId: existingRecord?.hmrcCorrelationId,
        errorCode: 'ERR_DUP_001',
      });
    }

    // Perform idempotency-safe submission
    const result = await mockHmrcVatSubmit(vrn, periodKey, idempotencyKey);

    const statusCode = result.success ? 201 : result.isDuplicate ? 409 : 500;
    return res.status(statusCode).json({
      ok: result.success,
      ...result,
    });
  } catch (error) {
    console.error('VAT submission error:', error);
    res.status(500).json({ ok: false, error: 'Submission failed. Please retry using the same idempotency key.' });
  }
});

/**
 * POST /api/hmrc/vat/idempotency-key
 * Generate a new UUID idempotency key for a submission session.
 * The client should store this and reuse it on retries.
 *
 * Body: { vrn, periodKey }
 */
app.post('/api/hmrc/vat/idempotency-key', (req: Request, res: Response) => {
  try {
    const { vrn, periodKey } = req.body;
    if (!vrn || !periodKey) {
      return res.status(400).json({ ok: false, error: 'vrn and periodKey are required.' });
    }
    const record = generateIdempotencyKey('/organisations/vat/returns', { vrn, periodKey });
    res.json({
      ok: true,
      idempotencyKey: record.key,
      expiresAt: record.expiresAt,
      message: 'Store this key and reuse it on all retry attempts for this submission.',
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to generate idempotency key.' });
  }
});

/**
 * GET /api/hmrc/compliance/score
 * Calculates the weighted compliance score for a company.
 *
 * Query: ?companyNumber=12345678
 */
app.get('/api/hmrc/compliance/score', async (req: Request, res: Response) => {
  try {
    const { companyNumber } = req.query;
    if (!companyNumber || typeof companyNumber !== 'string') {
      return res.status(400).json({ ok: false, error: 'companyNumber query parameter is required.' });
    }

    const data = await getComplianceData(companyNumber);
    const result = calculateComplianceScore(
      {
        timeliness: data.timeliness,
        accuracy: data.accuracy,
        completeness: data.completeness,
        risk: data.risk,
      },
      data.previousScore,
    );

    res.json({
      ok: true,
      companyNumber,
      score: result.score,
      grade: result.grade,
      trend: result.trend,
      breakdown: result.breakdown,
      calculatedAt: result.calculatedAt,
    });
  } catch (error) {
    console.error('Compliance score error:', error);
    res.status(500).json({ ok: false, error: 'Failed to calculate compliance score.' });
  }
});

/**
 * GET /api/hmrc/compliance/health
 * Aggregated compliance health panel for the FineGuard dashboard.
 *
 * Query: ?companyNumber=12345678
 */
app.get('/api/hmrc/compliance/health', async (req: Request, res: Response) => {
  try {
    const { companyNumber } = req.query;
    if (!companyNumber || typeof companyNumber !== 'string') {
      return res.status(400).json({ ok: false, error: 'companyNumber query parameter is required.' });
    }

    // Fetch real Companies House data where available
    let companyName = 'Unknown Company';
    let chData = {};
    try {
      const profile = await companiesHouseService.getCompanyProfile(companyNumber);
      if (profile) {
        companyName = profile.companyName;
        const compliance = await companiesHouseService.getComplianceStatus(companyNumber);
        chData = {
          accountsNextDue: compliance.accountsStatus.nextDue,
          accountsDaysUntilDue: compliance.accountsStatus.daysUntilDue,
          accountsOverdue: compliance.accountsStatus.overdue,
          confirmationStatementNextDue: compliance.confirmationStatementStatus.nextDue,
          csDaysUntilDue: compliance.confirmationStatementStatus.daysUntilDue,
          csOverdue: compliance.confirmationStatementStatus.overdue,
          estimatedPenalty: compliance.penalties?.reduce((s: number, p: { estimated: number }) => s + p.estimated * 100, 0) ?? 0,
        };
      }
    } catch (_) {
      // If Companies House API is unavailable, fall through with empty CH data
    }

    const scoreData = await getComplianceData(companyNumber);

    // Build mock VAT / CT / SA data (production: pull from HMRC API)
    const today = new Date();
    const nextVatDue = new Date(today);
    nextVatDue.setDate(nextVatDue.getDate() + 37); // Typical ~37 days to next quarter end
    const nextCTDue = new Date(today);
    nextCTDue.setMonth(nextCTDue.getMonth() + 3);

    const panel = generateComplianceHealthPanel({
      companyNumber,
      companyName,
      vat: {
        nextReturnDue: nextVatDue.toISOString().split('T')[0],
        daysUntilDue: 37,
        outstandingReturns: 0,
        lastVarianceCheckPassed: true,
        lastReturnDate: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedPenalty: 0,
      },
      ct: {
        nextCT600Due: nextCTDue.toISOString().split('T')[0],
        daysUntilDue: 90,
        requiresLongPeriodSplit: false,
        estimatedPenalty: 0,
      },
      sa: {
        nextSADue: `${today.getUTCFullYear()}-01-31`,
        daysUntilDue: 334,
        outstandingReturns: 0,
        estimatedPenalty: 0,
      },
      ch: chData,
      scoreInputs: {
        timeliness: scoreData.timeliness,
        accuracy: scoreData.accuracy,
        completeness: scoreData.completeness,
        risk: scoreData.risk,
      },
      previousScore: scoreData.previousScore,
    });

    res.json({ ok: true, panel });
  } catch (error) {
    console.error('Compliance health panel error:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate compliance health panel.' });
  }
});

/**
 * POST /api/hmrc/ct/split-period
 * Corporation Tax Long-Period Splitter.
 * Detects accounting periods > 12 months and generates two CT600 returns.
 *
 * Body: { periodRef } — refers to a mock CT period key, OR
 * Body: { companyNumber, companyName, periodStart, periodEnd, taxableProfit,
 *          capitalAllowances, adjustments } for custom periods.
 */
app.post('/api/hmrc/ct/split-period', async (req: Request, res: Response) => {
  try {
    const { periodRef, ...customPeriod } = req.body;

    let period;

    if (periodRef) {
      period = await getCTPeriod(periodRef);
      if (!period) {
        return res.status(404).json({
          ok: false,
          error: `CT period '${periodRef}' not found. Available: CT-12M, CT-18M, CT-14M`,
        });
      }
    } else if (customPeriod.companyNumber && customPeriod.periodStart && customPeriod.periodEnd) {
      period = {
        companyNumber: customPeriod.companyNumber,
        companyName: customPeriod.companyName || 'Unknown Company',
        periodStart: customPeriod.periodStart,
        periodEnd: customPeriod.periodEnd,
        taxableProfit: Number(customPeriod.taxableProfit) || 0,
        capitalAllowances: Number(customPeriod.capitalAllowances) || 0,
        adjustments: Number(customPeriod.adjustments) || 0,
      };
    } else {
      return res.status(400).json({
        ok: false,
        error: 'Provide either periodRef or {companyNumber, periodStart, periodEnd, taxableProfit}.',
      });
    }

    const result = splitCTLongPeriod(period);

    res.json({
      ok: true,
      requiresSplit: result.requiresSplit,
      splitReason: result.splitReason,
      originalPeriod: {
        start: result.originalPeriod.periodStart,
        end: result.originalPeriod.periodEnd,
      },
      returns: result.returns.map(r => ({
        ...r,
        taxDueFormatted: `£${(r.taxDue / 100).toFixed(2)}`,
        taxableProfitFormatted: `£${(r.taxableProfit / 100).toFixed(2)}`,
        capitalAllowancesFormatted: `£${(r.capitalAllowances / 100).toFixed(2)}`,
        ctRatePercent: `${(r.corporationTaxRate * 100).toFixed(0)}%`,
      })),
    });
  } catch (error) {
    console.error('CT period split error:', error);
    res.status(500).json({ ok: false, error: 'Failed to process CT period split.' });
  }
});

/**
 * GET /api/hmrc/errors
 * Returns the full human-readable error message catalogue.
 * Useful for populating the UI error state library.
 */
app.get('/api/hmrc/errors', (_req: Request, res: Response) => {
  const catalogue = Object.entries(ERROR_MESSAGES).map(([code, message]) => ({
    code,
    message,
    module: code.startsWith('ERR_V') ? 'MTD_VAT'
      : code.startsWith('ERR_CT') ? 'CORPORATION_TAX'
      : code.startsWith('ERR_SA') ? 'SELF_ASSESSMENT'
      : 'SYSTEM',
  }));

  res.json({ ok: true, totalErrors: catalogue.length, errors: catalogue });
});

// ============================================================================
// STATIC FILE SERVING & SPA FALLBACK
// ============================================================================

// Serve static files from dist folder
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// SPA fallback - serve index.html for all other routes
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 VaultLine Brand Suite Server');
  console.log('================================');
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}`);
  console.log('');
  console.log('API Endpoints:');
  console.log('  POST   /api/deployments/record');
  console.log('  GET    /api/deployments/status');
  console.log('  GET    /api/deployments/history');
  console.log('  POST   /api/leads');
  console.log('  GET    /api/leads');
  console.log('  POST   /api/intake');
  console.log('  GET    /api/intake');
  console.log('  POST   /api/compliance-bundles');
  console.log('  GET    /api/compliance-bundles');
  console.log('  POST   /api/contacts');
  console.log('  GET    /api/contacts');
  console.log('  PATCH  /api/contacts/:id');
  console.log('  GET    /health');
  console.log('');
  console.log('FineGuard HMRC Endpoints:');
  console.log('  POST   /api/hmrc/vat/validate          (Zero-Variance Engine)');
  console.log('  POST   /api/hmrc/vat/submit             (Idempotent submission)');
  console.log('  POST   /api/hmrc/vat/idempotency-key   (Generate UUID key)');
  console.log('  GET    /api/hmrc/compliance/score       (Weighted score formula)');
  console.log('  GET    /api/hmrc/compliance/health      (Health panel aggregator)');
  console.log('  POST   /api/hmrc/ct/split-period        (CT Long-Period Splitter)');
  console.log('  GET    /api/hmrc/errors                 (Error catalogue)');
  console.log('');
});
