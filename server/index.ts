import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, chPortfolio } from './db/schema';
import { desc, eq } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';

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

    const base = db.select().from(deploymentStatus);
    const filtered = environment && typeof environment === 'string'
      ? base.where(eq(deploymentStatus.environment, environment))
      : base;
    const deployments = await filtered
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
// COMPANIES HOUSE PORTFOLIO API
// ============================================================================

/**
 * Helper: map CH compliance status string to portfolio status field
 */
function toPortfolioStatus(chStatus: string, daysUntilDue: number): string {
  if (chStatus === 'overdue') return 'overdue';
  if (chStatus === 'warning' || daysUntilDue <= 14) return 'due_soon';
  return 'compliant';
}

/**
 * GET /api/ch/search?q=...
 * Live company search against Companies House API
 */
app.get('/api/ch/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string || '').trim();
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
 * Full company profile + compliance status from live CH API
 */
app.get('/api/ch/company/:number', async (req: Request, res: Response) => {
  try {
    const number = companiesHouseService.formatCompanyNumber(req.params.number);
    if (!companiesHouseService.validateCompanyNumber(number)) {
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
 * Returns the firm's monitored portfolio with cached compliance data
 */
app.get('/api/ch/portfolio', async (req: Request, res: Response) => {
  try {
    const entries = await db
      .select()
      .from(chPortfolio)
      .orderBy(chPortfolio.addedAt);

    const portfolio = entries.map((e) => ({
      ...e,
      complianceData: e.complianceData ? JSON.parse(e.complianceData) : null,
    }));

    res.json({ ok: true, portfolio });
  } catch (error) {
    console.error('CH portfolio fetch error:', error);
    res.status(500).json({ ok: false, error: 'Failed to load portfolio' });
  }
});

/**
 * POST /api/ch/portfolio
 * Add a company to the monitored portfolio.
 * Body: { companyNumber: string, serviceType?: string }
 */
app.post('/api/ch/portfolio', async (req: Request, res: Response) => {
  try {
    const { companyNumber, serviceType } = req.body as { companyNumber?: string; serviceType?: string };

    if (!companyNumber) {
      return res.status(400).json({ ok: false, error: 'companyNumber is required' });
    }

    const formatted = companiesHouseService.formatCompanyNumber(companyNumber);
    if (!companiesHouseService.validateCompanyNumber(formatted)) {
      return res.status(400).json({ ok: false, error: 'Invalid company number format' });
    }

    // Validate company exists in CH and fetch live compliance data
    const profile = await companiesHouseService.getCompanyProfile(formatted);
    if (!profile) {
      return res.status(404).json({ ok: false, error: 'Company not found in Companies House register' });
    }

    const compliance = await companiesHouseService.getComplianceStatus(formatted);

    // Determine minimum days until due across all deadlines
    const allDays = [
      compliance.accountsStatus.daysUntilDue,
      compliance.confirmationStatementStatus.daysUntilDue,
    ];
    const minDays = Math.min(...allDays);
    const portfolioStatus = toPortfolioStatus(compliance.status, minDays);

    // Upsert — if already tracked, refresh compliance data
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

      return res.json({ ok: true, message: 'Company already in portfolio — compliance data refreshed', companyName: profile.companyName });
    }

    const [entry] = await db
      .insert(chPortfolio)
      .values({
        companyNumber: formatted,
        companyName: profile.companyName,
        serviceType: serviceType || null,
        complianceStatus: portfolioStatus,
        complianceData: JSON.stringify(compliance),
        lastSynced: new Date(),
      })
      .returning();

    console.log(`📋 Added to portfolio: ${profile.companyName} (${formatted}) — ${portfolioStatus}`);
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
 * Remove a company from the monitored portfolio
 */
app.delete('/api/ch/portfolio/:number', async (req: Request, res: Response) => {
  try {
    const number = companiesHouseService.formatCompanyNumber(req.params.number);
    const deleted = await db
      .delete(chPortfolio)
      .where(eq(chPortfolio.companyNumber, number))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ ok: false, error: 'Company not found in portfolio' });
    }

    console.log(`🗑 Removed from portfolio: ${number}`);
    res.json({ ok: true, message: 'Company removed from portfolio' });
  } catch (error) {
    console.error('CH remove portfolio error:', error);
    res.status(500).json({ ok: false, error: 'Failed to remove company' });
  }
});

/**
 * POST /api/ch/portfolio/sync
 * Re-sync compliance data for all portfolio companies from live CH API
 */
app.post('/api/ch/portfolio/sync', async (req: Request, res: Response) => {
  try {
    const entries = await db.select().from(chPortfolio);

    if (entries.length === 0) {
      return res.json({ ok: true, synced: 0, message: 'Portfolio is empty' });
    }

    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    // Sync concurrently in batches of 3 to avoid rate limiting
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

            const allDays = [
              compliance.accountsStatus.daysUntilDue,
              compliance.confirmationStatementStatus.daysUntilDue,
            ];
            const portfolioStatus = toPortfolioStatus(compliance.status, Math.min(...allDays));

            await db
              .update(chPortfolio)
              .set({
                companyName: profile.companyName,
                complianceStatus: portfolioStatus,
                complianceData: JSON.stringify(compliance),
                lastSynced: new Date(),
              })
              .where(eq(chPortfolio.companyNumber, entry.companyNumber));

            synced++;
            console.log(`✅ Synced: ${profile.companyName} — ${portfolioStatus}`);
          } catch (err) {
            failed++;
            errors.push(`${entry.companyNumber}: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }),
      );
      // Brief pause between batches to respect CH API rate limits
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

/**
 * PATCH /api/ch/portfolio/:number
 * Update metadata for a portfolio entry (serviceType, etc.)
 */
app.patch('/api/ch/portfolio/:number', async (req: Request, res: Response) => {
  try {
    const number = companiesHouseService.formatCompanyNumber(req.params.number);
    const { serviceType } = req.body as { serviceType?: string };

    const [updated] = await db
      .update(chPortfolio)
      .set({ serviceType: serviceType ?? null })
      .where(eq(chPortfolio.companyNumber, number))
      .returning();

    if (!updated) return res.status(404).json({ ok: false, error: 'Company not found in portfolio' });
    res.json({ ok: true, entry: updated });
  } catch (error) {
    res.status(500).json({ ok: false, error: 'Failed to update entry' });
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

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
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
});
