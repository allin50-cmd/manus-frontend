import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import { complianceBundles, contacts, deploymentStatus, intakeForms, leads, monitoredCompanies } from './db/schema';
import { companiesHouseService } from './services/companiesHouse';
import { getUserByOpenId, getTenantBySlug, setTenantContext, writeAuditEvent } from './trpc/db';
import { getUserFromRequest, getTenantSlugFromRequest } from './trpc/_core/auth';
import { appRouter } from './trpc/routers';
import { desc, eq } from 'drizzle-orm';
import { log, generateCorrelationId } from './lib/logger';
import { withRetry } from './lib/retry';

// System tenant for brand-suite events that have no user/tenant context.
// Row must exist in tenants table — provisioned by: npm run db:seed:clerkos
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

// Stripe client – only initialised when key is present
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

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
        const correlationId = generateCorrelationId();
        try {
          const [activation] = await db
            .insert(monitoredCompanies)
            .values({
              companyNumber,
              companyName,
              stripeSessionId: session.id,
            })
            .onConflictDoUpdate({
              target: monitoredCompanies.companyNumber,
              set: { stripeSessionId: session.id },
            })
            .returning();

          await writeAuditEvent({
            tenantId: SYSTEM_TENANT_ID,
            entityType: 'monitoring_activation',
            entityUuid: activation.id,
            action: 'executed',
            correlationId,
            metadata: JSON.stringify({ companyNumber, companyName, stripeSessionId: session.id }),
          }).catch(e => log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'stripe-webhook', error: String(e) }));

          log({ level: 'info', event: 'stripe.monitoring_activation', correlationId, companyNumber, companyName });
        } catch (err) {
          console.error('Error persisting monitored company:', err);
          return res.status(500).json({ error: 'Database error' });
        }
      }
    }

    res.json({ received: true });
  }
);

// ============================================================================
// TRPC API (ClerkOS Core Engine)
// ============================================================================

app.use(
  '/api/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: async ({ req, res }) => {
      // 1. Resolve auth user (Azure AD B2C JWT or dev x-user-open-id header)
      let user = null;
      try {
        const authUser = await getUserFromRequest(req);
        if (authUser) {
          // 2. Resolve tenant slug from subdomain / x-tenant header / env
          const slug = getTenantSlugFromRequest(req);
          const tenant = slug ? await getTenantBySlug(slug) : undefined;
          const tenantId = tenant?.id ?? null;

          // 3. Set RLS session context so PostgreSQL policies fire
          if (tenantId) await setTenantContext(tenantId);

          // 4. Look up the DB user record (creates on first sign-in via upsertUser in auth router)
          const dbUser = await getUserByOpenId(authUser.openId, tenantId ?? undefined);
          if (dbUser) user = dbUser;

          return { user, tenantId: tenantId ?? null, tenant: tenant ?? null, req, res };
        }
      } catch {
        // graceful degradation — return null context on any error
      }
      return { user: null, tenantId: null, tenant: null, req, res };
    },
  }),
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

// Admin auth middleware — requires X-ADMIN-KEY header matching ADMIN_API_KEY env var
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;
app.use('/api/admin', (req: Request, res: Response, next: NextFunction) => {
  if (!ADMIN_API_KEY) {
    return res.status(503).json({ error: 'Admin access not configured' });
  }
  const key = req.headers['x-admin-key'];
  if (!key || key !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
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
  const correlationId = generateCorrelationId();
  const startMs = Date.now();
  try {
    const {
      clientName,
      clientEmail,
      clientPhone,
      matterType,
      urgency,
      description,
      claimValue,
      sourceRef: rawSourceRef,
    } = req.body;

    if (!clientName || !matterType || !urgency) {
      return res.status(400).json({
        ok: false,
        error: 'Client name, matter type, and urgency are required',
      });
    }

    const sourceRef = (rawSourceRef as string | undefined) || 'MANUAL';

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
        sourceRef: sourceRef !== 'MANUAL' ? sourceRef : null,
      })
      .returning();

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'intake',
      entityUuid: intake.id,
      action: 'captured',
      correlationId,
      metadata: JSON.stringify({
        matterRef: intake.matterRef,
        matterType,
        urgency,
        sourceRef,
      }),
    }).catch(e => log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'intake', error: String(e) }));

    log({
      level: 'info',
      event: 'intake.captured',
      correlationId,
      matterRef: intake.matterRef,
      matterType,
      urgency,
      sourceRef,
      durationMs: Date.now() - startMs,
    });

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
  const correlationId = generateCorrelationId();
  const startMs = Date.now();
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

    // REAL-TIME: Fetch company profile from Companies House (with retry)
    const companyProfile = await withRetry(
      () => companiesHouseService.getCompanyProfile(formattedNumber),
      { label: 'ch.getCompanyProfile', correlationId, attempts: 3, baseDelayMs: 400 },
    );

    if (!companyProfile) {
      log({ level: 'warn', event: 'compliance.company_not_found', correlationId, companyNumber: formattedNumber });
      return res.status(404).json({
        ok: false,
        error: 'Company not found in Companies House register. Please check the company number.',
      });
    }

    // REAL-TIME: Get compliance status with deadlines (with retry)
    const complianceStatus = await withRetry(
      () => companiesHouseService.getComplianceStatus(formattedNumber),
      { label: 'ch.getComplianceStatus', correlationId, attempts: 3, baseDelayMs: 400 },
    );

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

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'compliance_check',
      entityUuid: bundle.id,
      action: 'executed',
      correlationId,
      metadata: JSON.stringify({
        bundleId: bundle.bundleId,
        companyNumber: formattedNumber,
        companyName: companyProfile.companyName,
        riskLevel: complianceStatus.riskLevel,
        status: complianceStatus.status,
        overdueFilings: complianceStatus.overdueFilings.length,
      }),
    }).catch(e => log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'compliance-bundle', error: String(e) }));

    log({
      level: 'info',
      event: 'compliance.check.executed',
      correlationId,
      companyNumber: formattedNumber,
      companyName: companyProfile.companyName,
      riskLevel: complianceStatus.riskLevel,
      status: complianceStatus.status,
      overdueFilings: complianceStatus.overdueFilings.length,
      durationMs: Date.now() - startMs,
    });
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
// FINEGUARD ALERT SCHEDULER
// ============================================================================

/**
 * GET /api/internal/run-compliance-check
 *
 * Reads all monitored_companies, fetches current CH compliance status for
 * each, writes a VaultLine audit event per company, and returns a summary.
 *
 * Designed to be called by a cron / Azure timer trigger / external scheduler.
 * Protect with ADMIN_API_KEY in any environment where the port is public.
 *
 * Does not send email (email provider not yet configured — BLOCKER-07).
 * Alert data is captured in VaultLine audit events and logged to console.
 */
app.get('/api/internal/run-compliance-check', async (req: Request, res: Response) => {
  // Require admin key — this endpoint triggers real CH API calls
  const key = req.headers['x-admin-key'];
  if (!ADMIN_API_KEY || key !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!companiesHouseService) {
    return res.status(503).json({ error: 'Companies House API not configured' });
  }

  const runId = generateCorrelationId();
  const started = Date.now();
  const results: Array<{
    companyNumber: string;
    companyName: string;
    status: string;
    riskLevel: string;
    overdueFilings: number;
    alertRequired: boolean;
    error?: string;
  }> = [];

  try {
    const companies = await db.select().from(monitoredCompanies);

    log({ level: 'info', event: 'scheduler.run.start', correlationId: runId, companiesTotal: companies.length });

    for (const company of companies) {
      const companyCorrelationId = generateCorrelationId();
      try {
        // Retry CH API per company — a single company failure must not abort the batch
        const complianceStatus = await withRetry(
          () => companiesHouseService.getComplianceStatus(company.companyNumber),
          { label: 'ch.scheduler.getComplianceStatus', correlationId: companyCorrelationId, attempts: 3, baseDelayMs: 600 },
        );

        const alertRequired =
          complianceStatus.status === 'overdue' ||
          complianceStatus.riskLevel === 'high' ||
          complianceStatus.overdueFilings.length > 0;

        await writeAuditEvent({
          tenantId: SYSTEM_TENANT_ID,
          entityType: 'compliance_alert',
          entityUuid: company.id,
          action: alertRequired ? 'alert_required' : 'checked',
          correlationId: companyCorrelationId,
          metadata: JSON.stringify({
            schedulerRunId: runId,
            companyNumber: company.companyNumber,
            companyName: company.companyName,
            status: complianceStatus.status,
            riskLevel: complianceStatus.riskLevel,
            overdueFilings: complianceStatus.overdueFilings.length,
            upcomingDeadlines: complianceStatus.upcomingDeadlines.length,
            alertRequired,
          }),
        }).catch(e => log({ level: 'error', event: 'vaultline.write.failed', correlationId: companyCorrelationId, endpoint: 'scheduler', error: String(e) }));

        if (alertRequired) {
          log({
            level: 'warn',
            event: 'compliance.alert.required',
            correlationId: companyCorrelationId,
            companyNumber: company.companyNumber,
            companyName: company.companyName,
            status: complianceStatus.status,
            riskLevel: complianceStatus.riskLevel,
            overdueFilings: complianceStatus.overdueFilings.length,
          });
        }

        results.push({
          companyNumber: company.companyNumber,
          companyName: company.companyName,
          status: complianceStatus.status,
          riskLevel: complianceStatus.riskLevel,
          overdueFilings: complianceStatus.overdueFilings.length,
          alertRequired,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        log({
          level: 'error',
          event: 'scheduler.company.failed',
          correlationId: companyCorrelationId,
          companyNumber: company.companyNumber,
          error: message,
        });
        results.push({
          companyNumber: company.companyNumber,
          companyName: company.companyName,
          status: 'error',
          riskLevel: 'unknown',
          overdueFilings: 0,
          alertRequired: false,
          error: message,
        });
      }
    }

    const alertCount = results.filter(r => r.alertRequired).length;
    log({
      level: 'info',
      event: 'scheduler.run.complete',
      correlationId: runId,
      companiesChecked: results.length,
      alertsRequired: alertCount,
      durationMs: Date.now() - started,
    });

    res.json({
      ok: true,
      runId,
      durationMs: Date.now() - started,
      companiesChecked: results.length,
      alertsRequired: alertCount,
      results,
    });
  } catch (err) {
    log({ level: 'error', event: 'scheduler.run.failed', correlationId: runId, error: String(err) });
    res.status(500).json({ error: 'Compliance check failed' });
  }
});

// ============================================================================
// STATIC FILE SERVING & SPA FALLBACK
// ============================================================================

// Serve static files from dist folder
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Guard: any /api/* route that wasn't matched above has no handler
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// SPA fallback - serve index.html for all non-API routes
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
});
