import express, { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import helmet from 'helmet';
import morgan from 'morgan';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import swaggerUi from 'swagger-ui-express';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, monitoredCompanies, auditLeads, zapierSubscriptions, barristers, briefs } from './db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';
import { subscribe, unsubscribe, fire, listByEvent, type ZapierEvent } from './services/zapierWebhook';
import { validateBody } from './middleware/validate.js';
import {
  LeadSchema, IntakeSchema, ContactSchema, AuditSignupSchema,
  BarristerSchema, BriefSchema, NoteSchema,
} from './schemas/index.js';
import clerksRouter from './routes/clerks.js';
import { fgQueue, type AuditJobData } from './queue/fgQueue.js';
import { openApiSpec } from './openapi.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Startup environment validation ───────────────────────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'COMPANIES_HOUSE_API_KEY'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`[STARTUP ERROR] Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}
// ─────────────────────────────────────────────────────────────────────────────

const app = express();
app.use(compression());
app.use(helmet({
  contentSecurityPolicy: false, // disabled — SPA serves its own CSP via static hosting
  crossOriginEmbedderPolicy: false,
}));
app.use(morgan('[:date[iso]] :method :url :status :res[content-length]b - :response-time ms'));
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

// ── Rate limiting ────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

const submitLimiter = rateLimit({
  windowMs: 60 * 1000,  // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Submission rate limit exceeded. Please wait a moment.' },
});

app.use('/api/', apiLimiter);
app.use('/api/lead', submitLimiter);
app.use('/api/intake', submitLimiter);
app.use('/api/contact', submitLimiter);
app.use('/api/audit-signup', submitLimiter);
app.use('/api/compliance-bundle', submitLimiter);
// ─────────────────────────────────────────────────────────────────────────────

// Stripe client – only initialised when key is present
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

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
    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Stripe webhook secret not configured' });
    }

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

          console.log(`✅ Company monitored: ${companyName} (${companyNumber})`);
        } catch (err) {
          console.error('Error persisting monitored company:', err);
          return res.status(500).json({ error: 'Database error' });
        }
      }
    }

    res.json({ received: true });
  }
);

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
// STRIPE CHECKOUT API ENDPOINTS
// ============================================================================

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout session for FineGuard monitoring activation.
 * Body: { companyNumber: string, companyName: string }
 * Returns: { url: string }
 */
app.post('/api/stripe/checkout', async (req: Request, res: Response) => {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const { companyNumber, companyName } = req.body;

  if (!companyNumber || !companyName) {
    return res.status(400).json({ error: 'companyNumber and companyName are required' });
  }

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    return res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' });
  }

  const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

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
app.post('/api/lead', submitLimiter, validateBody(LeadSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, company, product, phone, message } = req.body;

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

    // Fire Zapier trigger (non-blocking)
    fire('new_lead', {
      id: lead.id,
      leadId: lead.leadId,
      name,
      email,
      company: company ?? null,
      product: product ?? null,
      phone: phone ?? null,
      createdAt: lead.createdAt,
    }).catch((err) => console.error('[zapier] fire new_lead error:', err));

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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const [allLeads, [{ count: total }]] = await Promise.all([
      db.select().from(leads).orderBy(desc(leads.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(leads),
    ]);

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data: allLeads, pagination: { page, limit, total: Number(total) } });
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
app.post('/api/intake', submitLimiter, validateBody(IntakeSchema), async (req: Request, res: Response) => {
  try {
    const { clientName, clientEmail, clientPhone, matterType, urgency, description, claimValue } = req.body;

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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const [allForms, [{ count: total }]] = await Promise.all([
      db.select().from(intakeForms).orderBy(desc(intakeForms.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(intakeForms),
    ]);

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data: allForms, pagination: { page, limit, total: Number(total) } });
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
app.post('/api/contact', submitLimiter, validateBody(ContactSchema), async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;

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
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit as string) || 50));
    const offset = (page - 1) * limit;

    const [allContacts, [{ count: total }]] = await Promise.all([
      db.select().from(contacts).orderBy(desc(contacts.createdAt)).limit(limit).offset(offset),
      db.select({ count: sql`count(*)` }).from(contacts),
    ]);

    res.setHeader('Cache-Control', 'private, no-store');
    res.json({ data: allContacts, pagination: { page, limit, total: Number(total) } });
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

    res.setHeader('Cache-Control', 'no-store');
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
// VERSION ENDPOINT
// ============================================================================

/**
 * GET /api/version
 * Returns runtime version and environment info.
 */
app.get('/api/version', (_req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.json({
    version: process.env.npm_package_version ?? '1.0.0',
    env: process.env.NODE_ENV ?? 'production',
    uptime: Math.floor(process.uptime()),
  });
});

// API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'Allin50 API Docs',
  customCss: '.swagger-ui .topbar { display: none }',
}));

// ============================================================================
// ZAPIER REST-HOOK ENDPOINTS
// ============================================================================

const ZAPIER_API_KEY = process.env.ZAPIER_API_KEY;

function requireZapierAuth(req: Request, res: Response): boolean {
  if (!ZAPIER_API_KEY) return true; // auth disabled if no key configured
  const key = req.headers['x-api-key'] ?? req.query.api_key;
  if (key !== ZAPIER_API_KEY) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

const VALID_EVENTS: ZapierEvent[] = ['new_audit_lead', 'new_lead', 'deal_escalated', 'deal_closed'];

/**
 * POST /api/zapier/subscribe
 * Zapier calls this when a user turns on a Zap.
 * Body: { hookUrl, event }
 */
app.post('/api/zapier/subscribe', async (req: Request, res: Response) => {
  if (!requireZapierAuth(req, res)) return;
  const { hookUrl, event } = req.body;
  if (!hookUrl || !event) return res.status(400).json({ error: 'hookUrl and event are required' });
  if (!VALID_EVENTS.includes(event)) return res.status(400).json({ error: `event must be one of: ${VALID_EVENTS.join(', ')}` });
  try {
    const sub = await subscribe(hookUrl, event as ZapierEvent, ZAPIER_API_KEY ?? 'none');
    res.status(201).json({ id: sub.id, hookUrl, event });
  } catch (err) {
    console.error('[zapier] subscribe error:', err);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * DELETE /api/zapier/subscribe
 * Zapier calls this when a user turns off a Zap.
 * Body: { hookUrl, event }
 */
app.delete('/api/zapier/subscribe', async (req: Request, res: Response) => {
  if (!requireZapierAuth(req, res)) return;
  const { hookUrl, event } = req.body;
  if (!hookUrl || !event) return res.status(400).json({ error: 'hookUrl and event are required' });
  try {
    await unsubscribe(hookUrl, event as ZapierEvent);
    res.json({ ok: true });
  } catch (err) {
    console.error('[zapier] unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

/**
 * GET /api/zapier/sample/:event
 * Returns sample payload Zapier shows when building a Zap.
 */
app.get('/api/zapier/sample/:event', (req: Request, res: Response) => {
  if (!requireZapierAuth(req, res)) return;
  const samples: Record<string, object> = {
    new_audit_lead: {
      id: 'a62fe1f7-225e-4288-b2bc-8853cb9c2f4b',
      tenantId: '3ed1ef2d-2d56-45f1-98ae-1c76548c2beb',
      email: 'sample@chambers.co.uk',
      name: 'Jane Barrister',
      chamberSize: '11-30',
      painPoints: ['Unbilled emails & calls', 'Prep time not captured'],
      stage: 'signed_up',
      createdAt: new Date().toISOString(),
    },
    new_lead: {
      id: '8856a199-f568-4d03-ac36-cab598c78a41',
      leadId: 'LEAD-1776413871087',
      name: 'Alice Smith',
      email: 'alice@chambers.co.uk',
      company: 'Gray Inn',
      product: 'vaultline',
      createdAt: new Date().toISOString(),
    },
    deal_escalated: {
      leadId: 'LEAD-1776413871087',
      email: 'alice@chambers.co.uk',
      reason: 'High-value close £6000 requires human approval',
      agentAction: 'escalate',
      priceMonthly: 6000,
      escalatedAt: new Date().toISOString(),
    },
    deal_closed: {
      leadId: 'LEAD-1776413871087',
      email: 'alice@chambers.co.uk',
      priceMonthly: 2500,
      closedAt: new Date().toISOString(),
    },
  };
  const sample = samples[req.params.event];
  if (!sample) return res.status(404).json({ error: 'Unknown event' });
  res.json([sample]);
});

/**
 * GET /api/zapier/subscriptions
 * Admin view of all active subscriptions.
 */
app.get('/api/zapier/subscriptions', async (req: Request, res: Response) => {
  if (!requireZapierAuth(req, res)) return;
  try {
    const rows = await db.select().from(zapierSubscriptions);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// ============================================================================
// AUDIT FUNNEL ENDPOINTS
// ============================================================================

/**
 * POST /api/audit-signup
 * Creates an audit lead tenant, sends audit-ready email, and (in non-shadow
 * mode) runs the sales agent to determine the next best action.
 */
app.post('/api/audit-signup', submitLimiter, validateBody(AuditSignupSchema), async (req: Request, res: Response) => {
  try {
    const { email, name, chamberSize, painPoints } = req.body;

    const tenantId = crypto.randomUUID();

    const [auditLead] = await db
      .insert(auditLeads)
      .values({
        tenantId,
        email,
        name: name ?? null,
        chamberSize: chamberSize ?? null,
        painPoints: painPoints ? JSON.stringify(painPoints) : null,
      })
      .returning();

    console.log(`📊 Audit signup: ${email} (tenant ${tenantId})`);

    const jobData: AuditJobData = {
      tenantId: auditLead.tenantId,
      email,
      companyName: name,
      chamberSize,
      painPoints: painPoints ? JSON.stringify(painPoints) : undefined,
      leadId: auditLead.id,
    };
    await fgQueue.add('audit-signup', jobData);

    res.status(201).json({ ok: true, tenantId });
  } catch (error) {
    console.error('Error in audit-signup:', error);
    res.status(500).json({ ok: false, error: 'Failed to process signup' });
  }
});

/**
 * GET /api/admin/audit-leads
 * Returns all audit leads for the admin dashboard.
 */
app.get('/api/admin/audit-leads', async (req: Request, res: Response) => {
  try {
    const all = await db
      .select()
      .from(auditLeads)
      .orderBy(desc(auditLeads.createdAt));

    res.json(all);
  } catch (error) {
    console.error('Error fetching audit leads:', error);
    res.status(500).json({ error: 'Failed to fetch audit leads' });
  }
});

// ============================================================================
// LAW CLERKS API
// ============================================================================

// Law Clerks routes
app.use('/api/clerks', clerksRouter);

// ============================================================================
// DELETE ENDPOINTS & ADDITIONAL UTILITY ENDPOINTS
// ============================================================================

/**
 * DELETE /api/admin/leads/:id
 * Delete a lead by ID
 */
app.delete('/api/admin/leads/:id', async (req: Request, res: Response) => {
  try {
    await db.delete(leads).where(eq(leads.id, req.params.id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

/**
 * DELETE /api/admin/contacts/:id
 * Delete a contact by ID
 */
app.delete('/api/admin/contacts/:id', async (req: Request, res: Response) => {
  try {
    await db.delete(contacts).where(eq(contacts.id, req.params.id));
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

/**
 * GET /api/stats
 * Public summary stats endpoint (used by homepage)
 * Returns counts: leads, intakeForms, barristers, briefs, contacts
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const [
      [leadsRow],
      [intakeFormsRow],
      [barristersRow],
      [briefsRow],
      [contactsRow],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(leads),
      db.select({ count: sql<number>`count(*)` }).from(intakeForms),
      db.select({ count: sql<number>`count(*)` }).from(barristers),
      db.select({ count: sql<number>`count(*)` }).from(briefs),
      db.select({ count: sql<number>`count(*)` }).from(contacts),
    ]);

    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({
      leads: Number(leadsRow.count),
      intakeForms: Number(intakeFormsRow.count),
      barristers: Number(barristersRow.count),
      briefs: Number(briefsRow.count),
      contacts: Number(contactsRow.count),
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
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

// Global error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
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
  console.log('Law Clerks API Endpoints:');
  console.log('  GET    /api/clerks/stats');
  console.log('  GET    /api/clerks/diary');
  console.log('  POST   /api/clerks/barristers');
  console.log('  GET    /api/clerks/barristers');
  console.log('  GET    /api/clerks/barristers/:id');
  console.log('  PUT    /api/clerks/barristers/:id');
  console.log('  POST   /api/clerks/briefs');
  console.log('  GET    /api/clerks/briefs');
  console.log('  GET    /api/clerks/briefs/:id');
  console.log('  PUT    /api/clerks/briefs/:id');
  console.log('  POST   /api/clerks/notes');
  console.log('  GET    /api/clerks/notes');
  console.log('');
});

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

const shutdown = () => {
  console.log('\n[SHUTDOWN] Gracefully closing server...');
  server.close(() => {
    console.log('[SHUTDOWN] Server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('[SHUTDOWN] Force exit after timeout.');
    process.exit(1);
  }, 10_000);
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
