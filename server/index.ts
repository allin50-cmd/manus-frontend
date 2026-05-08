import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import { db, client } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, monitoredCompanies, chPortfolio } from './db/schema';
import { desc, eq } from 'drizzle-orm';
import { companiesHouseService, CompaniesHouseService } from './services/companiesHouse';

// Load environment variables
dotenv.config();

// Fail fast if any required environment variable is missing
const REQUIRED_ENV = [
  'DATABASE_URL',
  'DEPLOY_RECORD_TOKEN',
  'COMPANIES_HOUSE_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_PRICE_ID',
  'APP_URL',
] as const;

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`FATAL: missing required environment variable ${key}`);
    process.exit(1);
  }
}

const log = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      process.stdout.write(JSON.stringify({ level: 'info', msg, ...meta, ts: new Date().toISOString() }) + '\n');
    } else {
      console.log(`${new Date().toISOString()} ${msg}`, meta ? JSON.stringify(meta) : '');
    }
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'production') {
      process.stderr.write(JSON.stringify({ level: 'error', msg, ...meta, ts: new Date().toISOString() }) + '\n');
    } else {
      console.error(`${new Date().toISOString()} ${msg}`, meta ? JSON.stringify(meta) : '');
    }
  },
};

// Prevent unhandled rejections from silently crashing workers
process.on('unhandledRejection', (reason) => {
  log.error('Unhandled promise rejection', { reason: String(reason) });
});
// Uncaught exceptions: log, flush, exit so the container restarts cleanly
process.on('uncaughtException', (err) => {
  log.error('Uncaught exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN as string;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2023-10-16' });

// ============================================================================
// STRIPE WEBHOOK  (must be registered BEFORE express.json() to access raw body)
// ============================================================================

/**
 * POST /api/stripe/webhook
 * Receives Stripe events. On checkout.session.completed, marks the company as monitored.
 * Requires raw body — registered before express.json().
 */
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Stripe webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const companyNumber = session.metadata?.companyNumber;
      const companyName = session.metadata?.companyName;

      if (companyNumber && companyName) {
        try {
          await db
            .insert(monitoredCompanies)
            .values({
              companyNumber,
              companyName,
              stripeSessionId: session.id,
            })
            .onConflictDoNothing();

          log.info('company.monitored', { companyName, companyNumber });
        } catch (err) {
          log.error('company.monitor.failed', { error: String(err) });
          return res.status(500).json({ error: 'Database error' });
        }
      }
    }

    res.json({ received: true });
  }
);

// Security & performance middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow SWA to embed API responses
  contentSecurityPolicy: false,     // CSP is handled by staticwebapp.config.json
}));
app.use(compression());

const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = isProd
  ? [process.env.APP_URL as string]
  : [process.env.APP_URL as string, 'http://localhost:5173', 'http://localhost:3000'];
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting — applied per-route below for granularity
const apiLimiter = rateLimit({
  windowMs: 60_000,   // 1 minute
  max: 60,            // 60 req/min for general API
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const formLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,            // 10 form submissions/min (leads, intake, contact, checkout)
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  log.info('request', { method: req.method, path: req.path });
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

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(503).json({ status: 'unhealthy' });
  }
});

// ============================================================================
// STRIPE CHECKOUT API ENDPOINTS
// ============================================================================

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for FineGuard monitoring activation.
 * Body: { companyNumber: string, companyName: string }
 * Returns: { url: string }
 */
app.post('/api/stripe/checkout', formLimiter, async (req: Request, res: Response) => {
  const { companyNumber, companyName } = req.body;

  if (!companyNumber || !companyName) {
    return res.status(400).json({ error: 'companyNumber and companyName are required' });
  }

  if (companyNumber.length > 20 || companyName.length > 255) {
    return res.status(400).json({ error: 'Company number or name too long' });
  }

  const priceId = process.env.STRIPE_PRICE_ID as string;
  const appUrl = process.env.APP_URL as string;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { companyNumber, companyName },
      success_url: `${appUrl}/compliance-bundle?activated=1&company=${encodeURIComponent(companyNumber)}`,
      cancel_url: `${appUrl}/compliance-bundle`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

/**
 * GET /api/protection-status?companyNumber=12345678
 * Returns whether a company is currently being monitored.
 */
app.get('/api/protection-status', async (req: Request, res: Response) => {
  const { companyNumber } = req.query;

  if (!companyNumber || typeof companyNumber !== 'string') {
    return res.status(400).json({ error: 'companyNumber query param is required' });
  }

  try {
    const [row] = await db
      .select()
      .from(monitoredCompanies)
      .where(eq(monitoredCompanies.companyNumber, companyNumber))
      .limit(1);

    res.json({ monitored: !!row, activatedAt: row?.activatedAt ?? null });
  } catch (err) {
    console.error('Error checking protection status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Admin auth — reuses DEPLOY_RECORD_TOKEN; clients send X-Admin-Token header
const requireAdminToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== DEPLOY_RECORD_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

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

    log.info('deployment.recorded', { environment, status, commit });

    res.status(201).json({
      success: true,
      id: deployment.id,
    });
  } catch (error) {
    log.error('deployment.record.failed', { error: String(error) });
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

    if (environment && !['dev', 'staging', 'prod'].includes(environment as string)) {
      return res.status(400).json({ error: 'Invalid environment' });
    }

    const limitVal = Math.min(Math.max(parseInt(limit as string) || 50, 1), 500);
    const deployments = await db
      .select()
      .from(deploymentStatus)
      .where(environment ? eq(deploymentStatus.environment, environment as string) : undefined)
      .orderBy(desc(deploymentStatus.deployedAt))
      .limit(limitVal);

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
app.post('/api/lead', formLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, company, product, phone, message } = req.body;

    if (name?.length > 255 || email?.length > 255) {
      return res.status(400).json({ ok: false, error: 'Input too long' });
    }

    if (!name || !email) {
      return res.status(400).json({
        ok: false,
        error: 'Name and email are required',
      });
    }

    // Generate unique lead ID
    const leadId = `LEAD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

    log.info('lead.captured', { name, product });

    res.status(201).json({
      ok: true,
      message: "Thank you for your interest! We'll be in touch soon.",
      leadId: lead.leadId,
    });
  } catch (error) {
    log.error('lead.create.failed', { error: String(error) });
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
app.get('/api/admin/leads', requireAdminToken, async (req: Request, res: Response) => {
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
app.post('/api/intake', formLimiter, async (req: Request, res: Response) => {
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

    if (clientName?.length > 255 || clientEmail?.length > 255) {
      return res.status(400).json({ ok: false, error: 'Input too long' });
    }

    if (!clientName || !matterType || !urgency) {
      return res.status(400).json({
        ok: false,
        error: 'Client name, matter type, and urgency are required',
      });
    }

    // Generate unique matter reference
    const matterRef = `MAT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

    log.info('intake.created', { clientName, matterType });

    res.status(201).json({
      ok: true,
      message: 'Matter intake recorded successfully',
      matterRef: intake.matterRef,
      urgency: intake.urgency,
    });
  } catch (error) {
    log.error('intake.create.failed', { error: String(error) });
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
app.get('/api/admin/intake-forms', requireAdminToken, async (req: Request, res: Response) => {
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
app.post('/api/compliance-bundle', formLimiter, async (req: Request, res: Response) => {
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
    if (!CompaniesHouseService.validateCompanyNumber(companyNumber)) {
      return res.status(400).json({
        ok: false,
        error: 'Invalid company number format. Must be 8 digits or 2 letters + 6 digits.',
      });
    }

    // Format company number
    const formattedNumber = CompaniesHouseService.formatCompanyNumber(companyNumber);

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
    const bundleId = `BUNDLE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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

    log.info('compliance.checked', { company: companyProfile.companyName, status: complianceStatus.status, risk: complianceStatus.riskLevel });

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
app.get('/api/admin/compliance-bundles', requireAdminToken, async (req: Request, res: Response) => {
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
app.post('/api/contact', formLimiter, async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

    if (name?.length > 255 || email?.length > 255 || subject?.length > 255) {
      return res.status(400).json({ ok: false, error: 'Input too long' });
    }

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        error: 'Name, email, and message are required',
      });
    }

    // Generate unique ticket ID
    const ticketId = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
app.get('/api/admin/contacts', requireAdminToken, async (req: Request, res: Response) => {
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
app.patch('/api/contacts/:id', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({ error: 'Invalid contact ID' });
    }

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
// COMPANIES HOUSE PORTFOLIO API
// ============================================================================

// Sync is a heavy operation (one CH API round-trip per portfolio company).
// Tighter limit than the default apiLimiter to prevent quota exhaustion.
const chSyncLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { ok: false, error: 'Too many sync requests. Please wait a minute.' },
});

/**
 * Maps CH compliance status to the portfolio status field.
 * Uses the overall CH status first; falls back to days-until-due for 'warning' triage.
 */
function toPortfolioStatus(chStatus: string, daysUntilDue: number): string {
  if (chStatus === 'overdue') return 'overdue';
  if (chStatus === 'warning' || daysUntilDue <= 14) return 'due_soon';
  return 'compliant';
}

/**
 * GET /api/ch/search?q=...
 * Live company search against Companies House API. Admin-only.
 */
app.get('/api/ch/search', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const q = ((req.query.q as string) ?? '').trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ ok: false, error: 'Query must be at least 2 characters' });
    }
    const results = await companiesHouseService.searchCompanies(q, 10);
    res.json({ ok: true, results });
  } catch (error) {
    console.error('CH search error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(503).json({ ok: false, error: 'Companies House API key not configured' });
    }
    res.status(500).json({ ok: false, error: 'Search failed. Please try again.' });
  }
});

/**
 * GET /api/ch/company/:number
 * Full company profile + compliance status + officers + PSC from live CH API. Admin-only.
 */
app.get('/api/ch/company/:number', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const number = CompaniesHouseService.formatCompanyNumber(req.params.number);
    if (!CompaniesHouseService.validateCompanyNumber(number)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const [profile, compliance, officers, pscs] = await Promise.all([
      companiesHouseService.getCompanyProfile(number),
      companiesHouseService.getComplianceStatus(number),
      companiesHouseService.getOfficers(number),
      companiesHouseService.getPSC(number),
    ]);

    if (!profile) return res.status(404).json({ ok: false, error: 'Company not found' });

    res.json({ ok: true, profile, compliance, officers, pscs });
  } catch (error) {
    console.error('CH company lookup error:', error);
    res.status(500).json({ ok: false, error: 'Company lookup failed. Please try again.' });
  }
});

/**
 * GET /api/ch/portfolio
 * Returns the firm's monitored portfolio with cached compliance data. Admin-only.
 */
app.get('/api/ch/portfolio', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const entries = await db.select().from(chPortfolio).orderBy(chPortfolio.addedAt);

    const portfolio = entries.map((e) => {
      let complianceData: unknown = null;
      try {
        complianceData = e.complianceData ? JSON.parse(e.complianceData) : null;
      } catch {
        // Stored JSON is malformed — return null rather than crashing the request
        complianceData = null;
      }
      return { ...e, complianceData };
    });

    res.json({ ok: true, portfolio });
  } catch (error) {
    console.error('CH portfolio fetch error:', error);
    res.status(500).json({ ok: false, error: 'Failed to load portfolio' });
  }
});

/**
 * POST /api/ch/portfolio
 * Add a company to the monitored portfolio. Admin-only.
 * Body: { companyNumber: string, serviceType?: string }
 */
app.post('/api/ch/portfolio', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const { companyNumber, serviceType } = req.body as { companyNumber?: string; serviceType?: string };

    if (!companyNumber) {
      return res.status(400).json({ ok: false, error: 'companyNumber is required' });
    }

    const formatted = CompaniesHouseService.formatCompanyNumber(companyNumber);
    if (!CompaniesHouseService.validateCompanyNumber(formatted)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const profile = await companiesHouseService.getCompanyProfile(formatted);
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Company not found in Companies House register' });
    }

    const compliance = await companiesHouseService.getComplianceStatus(formatted);
    const minDays = Math.min(
      compliance.accountsStatus.daysUntilDue,
      compliance.confirmationStatementStatus.daysUntilDue,
    );
    const portfolioStatus = toPortfolioStatus(compliance.status, minDays);

    const existing = await db
      .select()
      .from(chPortfolio)
      .where(eq(chPortfolio.companyNumber, formatted))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(chPortfolio)
        .set({
          companyName: profile.companyName,
          serviceType: serviceType ?? existing[0].serviceType,
          complianceStatus: portfolioStatus,
          complianceData: JSON.stringify(compliance),
          lastSynced: new Date(),
        })
        .where(eq(chPortfolio.companyNumber, formatted));

      return res.json({
        ok: true,
        message: 'Company already in portfolio — compliance data refreshed',
        companyName: profile.companyName,
      });
    }

    const [entry] = await db
      .insert(chPortfolio)
      .values({
        companyNumber: formatted,
        companyName: profile.companyName,
        serviceType: serviceType ?? null,
        complianceStatus: portfolioStatus,
        complianceData: JSON.stringify(compliance),
        lastSynced: new Date(),
      })
      .returning();

    console.log(`Added to portfolio: ${profile.companyName} (${formatted}) — ${portfolioStatus}`);
    res.status(201).json({ ok: true, message: `${profile.companyName} added to portfolio`, entry });
  } catch (error) {
    console.error('CH add portfolio error:', error);
    if (error instanceof Error && error.message.includes('API key')) {
      return res.status(503).json({ ok: false, error: 'Companies House API key not configured' });
    }
    res.status(500).json({ ok: false, error: 'Failed to add company to portfolio' });
  }
});

/**
 * DELETE /api/ch/portfolio/:number
 * Remove a company from the monitored portfolio. Admin-only.
 */
app.delete('/api/ch/portfolio/:number', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const number = CompaniesHouseService.formatCompanyNumber(req.params.number);
    if (!CompaniesHouseService.validateCompanyNumber(number)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const deleted = await db
      .delete(chPortfolio)
      .where(eq(chPortfolio.companyNumber, number))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ ok: false, error: 'Company not found in portfolio' });
    }

    console.log(`Removed from portfolio: ${number}`);
    res.json({ ok: true, message: 'Company removed from portfolio' });
  } catch (error) {
    console.error('CH remove portfolio error:', error);
    res.status(500).json({ ok: false, error: 'Failed to remove company' });
  }
});

/**
 * PATCH /api/ch/portfolio/:number
 * Update metadata for a portfolio entry. Admin-only.
 * Only updates fields explicitly present in the request body.
 */
app.patch('/api/ch/portfolio/:number', requireAdminToken, async (req: Request, res: Response) => {
  try {
    const number = CompaniesHouseService.formatCompanyNumber(req.params.number);
    if (!CompaniesHouseService.validateCompanyNumber(number)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    const body = req.body as Record<string, unknown>;
    if (!('serviceType' in body)) {
      return res.status(400).json({ ok: false, error: 'No updatable fields provided' });
    }

    const serviceType = typeof body.serviceType === 'string' ? body.serviceType : null;

    const [updated] = await db
      .update(chPortfolio)
      .set({ serviceType })
      .where(eq(chPortfolio.companyNumber, number))
      .returning();

    if (!updated) return res.status(404).json({ ok: false, error: 'Company not found in portfolio' });
    res.json({ ok: true, entry: updated });
  } catch (error) {
    console.error('CH update portfolio error:', error);
    res.status(500).json({ ok: false, error: 'Failed to update entry' });
  }
});

/**
 * POST /api/ch/portfolio/sync
 * Re-sync compliance data for all portfolio companies from live CH API. Admin-only.
 */
app.post('/api/ch/portfolio/sync', requireAdminToken, chSyncLimiter, async (req: Request, res: Response) => {
  try {
    const entries = await db.select().from(chPortfolio);

    if (entries.length === 0) {
      return res.json({ ok: true, synced: 0, message: 'Portfolio is empty' });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Batch size of 3 to respect CH API rate limits
    const batchSize = 3;
    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (entry) => {
          try {
            const [profile, compliance] = await Promise.all([
              companiesHouseService.getCompanyProfile(entry.companyNumber),
              companiesHouseService.getComplianceStatus(entry.companyNumber),
            ]);

            if (!profile) { failed++; return; }

            const minDays = Math.min(
              compliance.accountsStatus.daysUntilDue,
              compliance.confirmationStatementStatus.daysUntilDue,
            );

            await db
              .update(chPortfolio)
              .set({
                companyName: profile.companyName,
                complianceStatus: toPortfolioStatus(compliance.status, minDays),
                complianceData: JSON.stringify(compliance),
                lastSynced: new Date(),
              })
              .where(eq(chPortfolio.companyNumber, entry.companyNumber));

            synced++;
          } catch (err) {
            failed++;
            errors.push(`${entry.companyNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }),
      );
      if (i + batchSize < entries.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    res.json({ ok: true, synced, failed, total: entries.length, errors });
  } catch (error) {
    console.error('CH sync error:', error);
    res.status(500).json({ ok: false, error: 'Sync failed' });
  }
});

// ============================================================================
// STATIC FILE SERVING & SPA FALLBACK
// ============================================================================

// Serve static files from dist folder
const distPath = path.join(__dirname, '../dist');
const hasDistFolder = fs.existsSync(distPath);

if (hasDistFolder) {
  app.use(express.static(distPath));
}

// SPA fallback - serve index.html for all other routes
app.get('*', (req: Request, res: Response) => {
  if (hasDistFolder) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'Frontend not bundled in this image. Use the SWA URL.' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

const server = app.listen(PORT, () => {
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
  console.log('  POST   /api/lead');
  console.log('  GET    /api/admin/leads');
  console.log('  POST   /api/intake');
  console.log('  GET    /api/admin/intake-forms');
  console.log('  POST   /api/compliance-bundle');
  console.log('  GET    /api/admin/compliance-bundles');
  console.log('  POST   /api/contact');
  console.log('  GET    /api/admin/contacts');
  console.log('  PATCH  /api/contacts/:id');
  console.log('  GET    /api/ch/search       (admin)');
  console.log('  GET    /api/ch/company/:n   (admin)');
  console.log('  GET    /api/ch/portfolio    (admin)');
  console.log('  POST   /api/ch/portfolio    (admin)');
  console.log('  DELETE /api/ch/portfolio/:n (admin)');
  console.log('  PATCH  /api/ch/portfolio/:n (admin)');
  console.log('  POST   /api/ch/portfolio/sync (admin)');
  console.log('  GET    /api/health');
  console.log('');
});

// Graceful shutdown — App Service sends SIGTERM before killing the process
function shutdown(signal: string) {
  console.log(`${signal} received; closing HTTP server…`);
  server.close(async () => {
    console.log('HTTP server closed');
    await client.end().catch(() => {});
    process.exit(0);
  });
  // Force-exit if connections linger beyond 10s
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
