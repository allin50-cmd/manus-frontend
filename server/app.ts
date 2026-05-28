import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import path from 'path';
import Stripe from 'stripe';
import { fileURLToPath } from 'url';
import { db } from './db/index';
import {
  complianceBundles,
  contacts,
  deploymentStatus,
  fineGuardAlerts,
  intakeForms,
  leads,
  monitoredCompanies,
} from './db/schema';
import { companiesHouseService } from './services/companiesHouse';
import { getUserByOpenId, getTenantBySlug, setTenantContext, writeAuditEvent, getDb } from './trpc/db';
import { getUserFromRequest, getTenantSlugFromRequest } from './trpc/_core/auth';
import { appRouter } from './trpc/routers';
import { desc, eq, and, gt, or, isNull } from 'drizzle-orm';
import { log, generateCorrelationId } from './lib/logger';
import { withRetry } from './lib/retry';
import { PieOpportunitySchema, buildSourceRef } from './lib/pie-schema';
import { activateFineGuardForPie } from './lib/pie-fineguard';
import { wrapGracefully } from './lib/wrap-gracefully';
import { getAllCircuitSnapshots } from './lib/circuit-breaker';
import {
  getAllDependencyStats,
  getInstanceInfo,
  getRecentTraces,
} from './lib/resilience-stats';
import { getAllGlobalCircuitState, syncGlobalCircuitState } from './lib/global-circuit-sync';
import { acquireSchedulerLease, releaseSchedulerLease, getSchedulerLeaseState } from './lib/scheduler-lease';
import { getAllActiveOverrides, evaluateOperationalOverride, invalidateOverrideCache } from './lib/override-engine';
import { operationalOverrides, operationalAnnotations } from './drizzle/schema';
import type { InsertOperationalOverride, InsertOperationalAnnotation } from './drizzle/schema';
import { writeAlertIfRequired, toAlertSeverity } from './lib/fineguard-alerts';

// System tenant for brand-suite events that have no user/tenant context.
// Row must exist in tenants table — provisioned by: npm run db:seed:clerkos
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const isVercel = Boolean(process.env.VERCEL);

export function createApp(): express.Express {
  dotenv.config();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;
  const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

  // Stripe client – only initialised when key is present
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' }) : null;

  const app = express();

  // Trust Cloudflare/Vercel reverse proxy so req.ip and req.protocol are accurate
  if (isVercel) {
    app.set('trust proxy', 1);
  }

  // ==========================================================================
  // STRIPE WEBHOOK  (must be registered BEFORE express.json() to access raw body)
  // ==========================================================================

  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const correlationId = generateCorrelationId();

      if (!stripe) {
        log({ level: 'error', event: 'stripe.webhook.unconfigured', correlationId });
        return res.status(500).json({ error: 'Stripe not configured' });
      }

      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        log({ level: 'error', event: 'stripe.webhook.secret_missing', correlationId });
        return res.status(500).json({ error: 'Stripe webhook secret not configured' });
      }

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        log({ level: 'warn', event: 'stripe.webhook.signature_failed', correlationId, error: String(err) });
        return res.status(400).json({ error: 'Invalid signature' });
      }

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyNumber = session.metadata?.companyNumber;
        const companyName = session.metadata?.companyName;

        if (companyNumber && companyName) {
          // Wrap the DB-heavy enrichment in graceful failure / circuit breaker.
          // ACK semantics: we ALWAYS return 200 to Stripe — never block the
          // webhook on our own dependency degradation. When the circuit is
          // open or the upsert fails, the activation is skipped, audited as
          // system_failure_captured, and Stripe gets its 200.
          const stripeResult = await wrapGracefully(
            {
              operation: 'stripe.webhook.activate_monitoring',
              dependency: 'stripe_webhook_processing',
              correlationId,
              upstreamSystem: 'STRIPE',
              tenantId: SYSTEM_TENANT_ID,
              entityUuid: SYSTEM_TENANT_ID, // no domain entity yet — anchor on tenant
              retryable: true,
            },
            async () => {
              const [activation] = await db
                .insert(monitoredCompanies)
                .values({ companyNumber, companyName, stripeSessionId: session.id })
                .onConflictDoUpdate({
                  target: monitoredCompanies.companyNumber,
                  set: { stripeSessionId: session.id },
                })
                .returning();
              if (!activation) throw new Error('monitored_companies upsert returned no row');
              return activation;
            },
          );

          if (stripeResult.ok) {
            const activation = stripeResult.value;
            await writeAuditEvent({
              tenantId: SYSTEM_TENANT_ID,
              entityType: 'monitoring_activation',
              entityUuid: activation.id,
              action: 'executed',
              correlationId,
              metadata: JSON.stringify({ companyNumber, companyName, stripeSessionId: session.id }),
            }).catch(e =>
              log({
                level: 'error',
                event: 'vaultline.write.failed',
                correlationId,
                endpoint: 'stripe-webhook',
                error: String(e),
              }),
            );
            log({ level: 'info', event: 'stripe.monitoring_activation', correlationId, companyNumber, companyName });
          }
          // On failure or circuit_open: wrapGracefully has already logged + audited.
          // Stripe still receives 200 below — never block the webhook.
        }
      }

      res.json({ received: true });
    },
  );

  // ==========================================================================
  // TRPC API (ClerkOS Core Engine)
  // ==========================================================================

  app.use(
    '/api/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: async ({ req, res }) => {
        let user = null;
        try {
          const authUser = await getUserFromRequest(req);
          if (authUser) {
            const slug = getTenantSlugFromRequest(req);
            const tenant = slug ? await getTenantBySlug(slug) : undefined;
            const tenantId = tenant?.id ?? null;

            if (tenantId) await setTenantContext(tenantId);

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

  // General middleware
  app.use(cors());
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));

  // Logging middleware
  app.use((req: Request, _res: Response, next: NextFunction) => {
    log({ level: 'info', event: 'request.received', method: req.method, path: req.path });
    next();
  });

  // Admin auth middleware — requires X-ADMIN-KEY header matching ADMIN_API_KEY env var
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

  // ==========================================================================
  // HEALTH CHECK ENDPOINTS
  // ==========================================================================

  app.get('/api/health', async (_req: Request, res: Response) => {
    try {
      await db.select().from(deploymentStatus).limit(1);
      res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
    } catch {
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString(), database: 'disconnected' });
    }
  });

  app.get('/health', async (_req: Request, res: Response) => {
    try {
      await db.select().from(deploymentStatus).limit(1);
      res.json({ status: 'healthy', timestamp: new Date().toISOString(), database: 'connected' });
    } catch {
      res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString(), database: 'disconnected' });
    }
  });

  // ==========================================================================
  // STRIPE CHECKOUT API ENDPOINTS
  // ==========================================================================

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

    const PORT = process.env.PORT || 3000;
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

  // ==========================================================================
  // DEPLOYMENT TRACKING API ENDPOINTS
  // ==========================================================================

  app.post('/api/deployments/record', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-deploy-token'];
      if (!token || token !== DEPLOY_RECORD_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { environment, status, commit, workflowRun } = req.body;

      if (!environment || !status || !commit || !workflowRun) {
        return res.status(400).json({
          error: 'Missing required fields: environment, status, commit, workflowRun',
        });
      }

      if (!['dev', 'staging', 'prod'].includes(environment)) {
        return res.status(400).json({ error: 'Invalid environment. Must be: dev, staging, or prod' });
      }

      if (!['success', 'failed', 'in_progress'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: success, failed, or in_progress' });
      }

      const [deployment] = await db
        .insert(deploymentStatus)
        .values({
          environment,
          status,
          commit: commit.substring(0, 50),
          workflowRun: workflowRun.toString(),
        })
        .returning();

      console.log(`✅ Deployment recorded: ${environment} - ${status} - ${commit}`);

      res.status(201).json({ success: true, id: deployment.id });
    } catch (error) {
      console.error('Error recording deployment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/deployments/status', async (_req: Request, res: Response) => {
    try {
      const allDeployments = await db
        .select()
        .from(deploymentStatus)
        .orderBy(desc(deploymentStatus.deployedAt));

      const latestDeployments = new Map();
      for (const deployment of allDeployments) {
        if (!latestDeployments.has(deployment.environment)) {
          latestDeployments.set(deployment.environment, deployment);
        }
      }

      res.json({ deployments: Array.from(latestDeployments.values()) });
    } catch (error) {
      console.error('Error fetching deployment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/deployments/history', async (req: Request, res: Response) => {
    try {
      const { environment, limit = '50' } = req.query;

      let query = db.select().from(deploymentStatus);

      if (environment && typeof environment === 'string') {
        query = query.where(eq(deploymentStatus.environment, environment)) as typeof query;
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

  // ==========================================================================
  // LEAD CAPTURE API ENDPOINTS
  // ==========================================================================

  app.post('/api/lead', async (req: Request, res: Response) => {
    const correlationId = generateCorrelationId();
    try {
      const { name, email, company, product, phone, message } = req.body;

      if (!name || !email) {
        return res.status(400).json({ ok: false, error: 'Name and email are required' });
      }

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

      log({ level: 'info', event: 'lead.captured', correlationId, leadId: lead.leadId, product: product || null });

      res.status(201).json({
        ok: true,
        message: "Thank you for your interest! We'll be in touch soon.",
        leadId: lead.leadId,
      });
    } catch (error) {
      log({ level: 'error', event: 'lead.failed', correlationId, error: String(error) });
      res.status(500).json({ ok: false, error: 'Failed to save lead. Please try again.' });
    }
  });

  app.get('/api/admin/leads', async (_req: Request, res: Response) => {
    try {
      const allLeads = await db.select().from(leads).orderBy(desc(leads.createdAt));
      res.json(allLeads);
    } catch (error) {
      console.error('Error fetching leads:', error);
      res.status(500).json({ error: 'Failed to fetch leads' });
    }
  });

  // ==========================================================================
  // INTAKE FORM API ENDPOINTS
  // ==========================================================================

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
        metadata: JSON.stringify({ matterRef: intake.matterRef, matterType, urgency, sourceRef }),
      }).catch(e =>
        log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'intake', error: String(e) }),
      );

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
      res.status(500).json({ ok: false, error: 'Failed to save intake form. Please try again.' });
    }
  });

  app.get('/api/admin/intake-forms', async (_req: Request, res: Response) => {
    try {
      const allForms = await db.select().from(intakeForms).orderBy(desc(intakeForms.createdAt));
      res.json(allForms);
    } catch (error) {
      console.error('Error fetching intake forms:', error);
      res.status(500).json({ error: 'Failed to fetch intake forms' });
    }
  });

  // ==========================================================================
  // PIE INGESTION — Accuracy PIE → VaultLine intake
  // ==========================================================================

  /**
   * POST /api/pie/opportunity
   *
   * Accepts an upstream Accuracy PIE planning opportunity and persists it
   * through the existing intake flow with full audit lineage.
   *
   * Idempotent: repeated delivery of the same externalRef returns the
   * existing matterRef and writes an ingestion_replayed audit event —
   * no duplicate intake rows are created.
   */
  app.post('/api/pie/opportunity', async (req: Request, res: Response) => {
    const correlationId = generateCorrelationId();
    const startMs = Date.now();

    const parseResult = PieOpportunitySchema.safeParse(req.body);
    if (!parseResult.success) {
      log({
        level: 'warn',
        event: 'pie.ingestion.validation_failed',
        correlationId,
        errors: parseResult.error.flatten(),
      });
      return res.status(400).json({
        ok: false,
        error: 'Invalid PIE payload',
        details: parseResult.error.flatten(),
      });
    }

    const data = parseResult.data;
    const pieExternalRef = data.externalRef;
    const sourceRef = buildSourceRef(pieExternalRef);

    try {
      // Idempotency check — look up existing intake by sourceRef
      const [existing] = await db
        .select()
        .from(intakeForms)
        .where(eq(intakeForms.sourceRef, sourceRef))
        .limit(1);

      if (existing) {
        await writeAuditEvent({
          tenantId: SYSTEM_TENANT_ID,
          entityType: 'intake',
          entityUuid: existing.id,
          action: 'ingestion_replayed',
          correlationId,
          metadata: JSON.stringify({
            matterRef: existing.matterRef,
            sourceRef,
            upstreamSystem: 'PIE',
            pieExternalRef,
            replayDetected: true,
          }),
        }).catch(e =>
          log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'pie-opportunity', error: String(e) }),
        );

        // Re-attempt FineGuard activation on replay so a previously-failed
        // activation gets a recovery path. Upsert is idempotent via
        // ON CONFLICT (company_number); the helper never throws.
        await activateFineGuardForPie({
          intake: existing,
          applicantName: data.applicantName,
          sourceRef,
          pieExternalRef,
          correlationId,
          tenantId: SYSTEM_TENANT_ID,
          trigger: 'replay_retry',
        });

        log({
          level: 'info',
          event: 'pie.ingestion.replayed',
          correlationId,
          sourceRef,
          pieExternalRef,
          existingMatterRef: existing.matterRef,
          durationMs: Date.now() - startMs,
        });

        return res.status(200).json({
          ok: true,
          replayed: true,
          message: 'PIE opportunity already ingested',
          matterRef: existing.matterRef,
          sourceRef,
        });
      }

      // First-time ingestion
      const matterRef = `MAT-${Date.now()}`;

      const [intake] = await db
        .insert(intakeForms)
        .values({
          matterRef,
          clientName: data.applicantName,
          clientEmail: data.applicantEmail || null,
          clientPhone: data.applicantPhone || null,
          matterType: 'planning',
          urgency: data.urgency,
          description: data.description || null,
          claimValue: data.estimatedValue || null,
          sourceRef,
        })
        .returning();

      if (!intake) throw new Error('Intake INSERT returned no row');

      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'intake',
        entityUuid: intake.id,
        action: 'captured',
        correlationId,
        metadata: JSON.stringify({
          matterRef: intake.matterRef,
          matterType: 'planning',
          urgency: data.urgency,
          sourceRef,
          upstreamSystem: 'PIE',
          pieExternalRef,
          siteAddress: data.siteAddress || null,
          district: data.district || null,
          submittedAt: data.submittedAt || null,
        }),
      }).catch(e =>
        log({ level: 'error', event: 'vaultline.write.failed', correlationId, endpoint: 'pie-opportunity', error: String(e) }),
      );

      log({
        level: 'info',
        event: 'pie.ingestion.captured',
        correlationId,
        matterRef: intake.matterRef,
        sourceRef,
        pieExternalRef,
        urgency: data.urgency,
        durationMs: Date.now() - startMs,
      });

      // FineGuard activation — best-effort, never throws.
      // See server/lib/pie-fineguard.ts for evaluation + upsert + audit semantics.
      await activateFineGuardForPie({
        intake,
        applicantName: data.applicantName,
        sourceRef,
        pieExternalRef,
        correlationId,
        tenantId: SYSTEM_TENANT_ID,
        trigger: 'first_ingestion',
      });

      return res.status(201).json({
        ok: true,
        replayed: false,
        message: 'PIE opportunity ingested successfully',
        matterRef: intake.matterRef,
        sourceRef,
        urgency: intake.urgency,
      });
    } catch (error) {
      log({ level: 'error', event: 'pie.ingestion.failed', correlationId, sourceRef, error: String(error) });
      res.status(500).json({ ok: false, error: 'Failed to ingest PIE opportunity. Please try again.' });
    }
  });

  // ==========================================================================
  // COMPLIANCE BUNDLE API ENDPOINTS
  // ==========================================================================

  app.post('/api/compliance-bundle', async (req: Request, res: Response) => {
    const correlationId = generateCorrelationId();
    const startMs = Date.now();
    try {
      const { companyName: _companyName, companyNumber, requestorName, requestorEmail, bundleType } = req.body;

      if (!companyNumber) {
        return res.status(400).json({ ok: false, error: 'Company number is required' });
      }

      if (!companiesHouseService) {
        return res.status(503).json({ ok: false, error: 'Companies House integration not configured (COMPANIES_HOUSE_API_KEY missing)' });
      }

      if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
        return res.status(400).json({
          ok: false,
          error: 'Invalid company number format. Must be 8 digits or 2 letters + 6 digits.',
        });
      }

      const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber);

      const companyProfile = await withRetry(
        () => companiesHouseService!.getCompanyProfile(formattedNumber),
        { label: 'ch.getCompanyProfile', correlationId, attempts: 3, baseDelayMs: 400 },
      );

      if (!companyProfile) {
        log({ level: 'warn', event: 'compliance.company_not_found', correlationId, companyNumber: formattedNumber });
        return res.status(404).json({
          ok: false,
          error: 'Company not found in Companies House register. Please check the company number.',
        });
      }

      const complianceStatus = await withRetry(
        () => companiesHouseService!.getComplianceStatus(formattedNumber),
        { label: 'ch.getComplianceStatus', correlationId, attempts: 3, baseDelayMs: 400 },
      );

      const bundleId = `BUNDLE-${Date.now()}`;

      const [bundle] = await db
        .insert(complianceBundles)
        .values({
          bundleId,
          companyName: companyProfile.companyName,
          companyNumber: formattedNumber,
          requestorName: requestorName || null,
          requestorEmail: requestorEmail || null,
          bundleType: bundleType || 'full',
          estimatedTime: 'Generated instantly',
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
      }).catch(e =>
        log({
          level: 'error',
          event: 'vaultline.write.failed',
          correlationId,
          endpoint: 'compliance-bundle',
          error: String(e),
        }),
      );

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

      res.status(201).json({
        ok: true,
        message: 'Real-time compliance check complete',
        bundleId: bundle.bundleId,
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

      if (error instanceof Error && error.message.includes('COMPANIES_HOUSE_API_KEY')) {
        return res.status(500).json({
          ok: false,
          error: 'Companies House API not configured. Please contact support.',
        });
      }

      res.status(500).json({ ok: false, error: 'Failed to fetch company information. Please try again.' });
    }
  });

  app.get('/api/admin/compliance-bundles', async (_req: Request, res: Response) => {
    try {
      const allBundles = await db.select().from(complianceBundles).orderBy(desc(complianceBundles.createdAt));
      res.json(allBundles);
    } catch (error) {
      console.error('Error fetching compliance bundles:', error);
      res.status(500).json({ error: 'Failed to fetch compliance bundles' });
    }
  });

  // ==========================================================================
  // CONTACT FORM API ENDPOINTS
  // ==========================================================================

  app.post('/api/contact', async (req: Request, res: Response) => {
    const correlationId = generateCorrelationId();
    try {
      const { name, email, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ ok: false, error: 'Name, email, and message are required' });
      }

      const ticketId = `TICKET-${Date.now()}`;

      const [contact] = await db
        .insert(contacts)
        .values({ ticketId, name, email, subject: subject || null, message, status: 'new' })
        .returning();

      log({ level: 'info', event: 'contact.captured', correlationId, ticketId: contact.ticketId });

      res.status(201).json({
        ok: true,
        message: "Thank you for contacting us. We'll respond within 24 hours.",
        ticketId: contact.ticketId,
      });
    } catch (error) {
      log({ level: 'error', event: 'contact.failed', correlationId, error: String(error) });
      res.status(500).json({ ok: false, error: 'Failed to save contact form. Please try again.' });
    }
  });

  app.get('/api/admin/contacts', async (_req: Request, res: Response) => {
    try {
      const allContacts = await db.select().from(contacts).orderBy(desc(contacts.createdAt));
      res.json(allContacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      res.status(500).json({ error: 'Failed to fetch contacts' });
    }
  });

  const ADMIN_VALID_ALERT_STATUSES = ['pending', 'acknowledged', 'resolved', 'failed'] as const;

  // GET /api/admin/alerts — FineGuard compliance alerts, newest-first.
  // Optional ?status= filter.
  app.get('/api/admin/alerts', async (req: Request, res: Response) => {
    const { status } = req.query;
    if (status !== undefined && !ADMIN_VALID_ALERT_STATUSES.includes(String(status) as typeof ADMIN_VALID_ALERT_STATUSES[number])) {
      return res.status(400).json({
        error: `Invalid status filter. Must be one of: ${ADMIN_VALID_ALERT_STATUSES.join(', ')}`,
      });
    }
    try {
      const baseQuery = db.select().from(fineGuardAlerts);
      const rows = status
        ? await baseQuery
            .where(eq(fineGuardAlerts.status, String(status)))
            .orderBy(desc(fineGuardAlerts.createdAt))
        : await baseQuery.orderBy(desc(fineGuardAlerts.createdAt));
      return res.json({ alerts: rows, total: rows.length });
    } catch (err) {
      log({ level: 'error', event: 'admin.alerts.list_failed', error: String(err) });
      return res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // PATCH /api/admin/alerts/:id/acknowledge — mark one alert as acknowledged.
  app.patch('/api/admin/alerts/:id/acknowledge', async (req: Request, res: Response) => {
    const { id } = req.params;
    const correlationId = generateCorrelationId();
    try {
      const [updated] = await db
        .update(fineGuardAlerts)
        .set({ status: 'acknowledged', updatedAt: new Date() })
        .where(eq(fineGuardAlerts.id, id))
        .returning();
      if (!updated) {
        return res.status(404).json({ error: 'Alert not found' });
      }
      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'compliance_alert',
        entityUuid: updated.id,
        action: 'alert_acknowledged',
        correlationId,
        metadata: JSON.stringify({ alertType: updated.alertType, severity: updated.severity }),
      }).catch(() => {});
      return res.json({ ok: true, alert: updated });
    } catch (err) {
      log({ level: 'error', event: 'admin.alerts.acknowledge_failed', correlationId, error: String(err) });
      return res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  app.patch('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['new', 'read', 'replied'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Must be: new, read, or replied' });
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

  // ==========================================================================
  // RESILIENCE OBSERVABILITY
  // ==========================================================================

  /**
   * GET /api/internal/resilience
   *
   * Returns a per-instance snapshot of circuit breaker state, dependency
   * success/failure counters, and a small ring buffer of recent traced
   * operations. Strictly read-only — does NOT touch the database, does
   * NOT mutate any breaker state.
   *
   * Security: gated by the same ADMIN_API_KEY as other /api/internal/*
   * routes. Returns 401 without a valid key.
   *
   * Safety: every read is wrapped in try/catch so a corrupted in-memory
   * structure cannot 500 the endpoint. A partial snapshot is preferable
   * to a failed introspection call.
   */
  app.get('/api/internal/resilience', async (req: Request, res: Response) => {
    const key = req.headers['x-admin-key'];
    if (!ADMIN_API_KEY || key !== ADMIN_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const partial: {
      circuits?: unknown;
      stats?: unknown;
      recentTraces?: unknown;
      system?: unknown;
      global?: unknown;
      overrides?: unknown;
      errors: string[];
    } = { errors: [] };

    try {
      partial.circuits = getAllCircuitSnapshots();
    } catch (e) {
      partial.errors.push(`circuits: ${String(e)}`);
    }
    try {
      partial.stats = getAllDependencyStats();
    } catch (e) {
      partial.errors.push(`stats: ${String(e)}`);
    }
    try {
      partial.recentTraces = getRecentTraces();
    } catch (e) {
      partial.errors.push(`recentTraces: ${String(e)}`);
    }
    try {
      partial.system = getInstanceInfo();
    } catch (e) {
      partial.errors.push(`system: ${String(e)}`);
    }
    try {
      const [globalCircuits, schedulerLease, overrides] = await Promise.all([
        getAllGlobalCircuitState().catch(() => ({})),
        getSchedulerLeaseState('fineguard-compliance-check').catch(() => ({ held: false, holderInstance: null, expiresAt: null })),
        getAllActiveOverrides().catch(() => ({})),
      ]);
      partial.global = { circuits: globalCircuits, schedulerLease };
      partial.overrides = overrides;
    } catch (e) {
      partial.errors.push(`global: ${String(e)}`);
    }

    return res.json({
      timestamp: new Date().toISOString(),
      circuits: partial.circuits ?? {},
      stats: partial.stats ?? {},
      recentTraces: partial.recentTraces ?? [],
      system: partial.system ?? { instanceId: 'unknown', uptimeMs: 0 },
      global: partial.global ?? { circuits: {}, schedulerLease: null },
      overrides: partial.overrides ?? {},
      ...(partial.errors.length > 0 ? { partialErrors: partial.errors } : {}),
    });
  });

  // ==========================================================================
  // FINEGUARD ALERT SCHEDULER
  // ==========================================================================

  app.get('/api/internal/run-compliance-check', async (req: Request, res: Response) => {
    const adminKey = req.headers['x-admin-key'];
    const cronSecret = process.env.CRON_SECRET;
    const isAdminCall = ADMIN_API_KEY && adminKey === ADMIN_API_KEY;
    const isCronCall = cronSecret && req.headers['authorization'] === `Bearer ${cronSecret}`;
    if (!isAdminCall && !isCronCall) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!companiesHouseService) {
      return res.status(503).json({ error: 'Companies House API not configured' });
    }

    // Fail-fast if DB is unavailable — do this before acquiring the lease so
    // we never hold a lease we cannot use.
    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'Database not configured (DATABASE_URL missing)' });
    }

    // Opportunistically sync global circuit state from Postgres so this
    // instance benefits from open-circuit signals raised by peer instances.
    syncGlobalCircuitState().catch(err =>
      log({ level: 'warn', event: 'scheduler.global_sync_failed', error: String(err) })
    );

    // Check scheduler pause override before any lease/processing work
    try {
      const pauseOverride = await evaluateOperationalOverride('scheduler', 'pause_scheduler');
      if (pauseOverride.active) {
        log({ level: 'info', event: 'scheduler.paused_by_override', reason: pauseOverride.reason });
        return res.json({ skipped: true, reason: 'scheduler_paused', overrideId: pauseOverride.overrideId });
      }
    } catch {
      // Override engine failure must not block the scheduler
    }

    // Acquire distributed lease to prevent parallel runs across instances
    const lease = await acquireSchedulerLease('fineguard-compliance-check', 5 * 60_000);
    if (!lease.acquired) {
      log({ level: 'info', event: 'scheduler.lease_busy', holderInstance: lease.holderInstance });
      return res.json({
        skipped: true,
        reason: 'lease_held_by_other_instance',
        holderInstance: lease.holderInstance,
        expiresAt: lease.expiresAt?.toISOString(),
      });
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
        const chResult = await wrapGracefully(
          {
            operation: 'scheduler.companies_house.compliance_status',
            dependency: 'companies_house_api',
            correlationId: companyCorrelationId,
            upstreamSystem: 'COMPANIES_HOUSE',
            tenantId: SYSTEM_TENANT_ID,
            entityUuid: company.id,
            errorCategory: 'external_api',
            retryable: true,
          },
          () =>
            withRetry(
              () => companiesHouseService!.getComplianceStatus(company.companyNumber),
              { label: 'ch.scheduler.getComplianceStatus', correlationId: companyCorrelationId, attempts: 3, baseDelayMs: 600 },
            ),
        );

        if (!chResult.ok) {
          // Circuit open OR all retries exhausted — wrapGracefully has
          // already logged + audited. Continue the loop for the next
          // company; do NOT abort the run.
          results.push({
            companyNumber: company.companyNumber,
            companyName: company.companyName,
            status: chResult.error === 'circuit_open' ? 'skipped' : 'error',
            riskLevel: 'unknown',
            overdueFilings: 0,
            alertRequired: false,
            error: chResult.error,
          });
          continue;
        }

        try {
          const complianceStatus = chResult.value;

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
          }).catch(e =>
            log({
              level: 'error',
              event: 'vaultline.write.failed',
              correlationId: companyCorrelationId,
              endpoint: 'scheduler',
              error: String(e),
            }),
          );

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

          // Persist alert row — idempotent, never throws (returns failedSafe on error).
          const alertResult = await writeAlertIfRequired(
            alertRequired,
            {
              tenantId: SYSTEM_TENANT_ID,
              complianceRunId: companyCorrelationId,
              alertType:
                complianceStatus.status === 'overdue' ||
                complianceStatus.overdueFilings.length > 0
                  ? 'overdue_filings'
                  : 'high_risk',
              severity: toAlertSeverity(complianceStatus.riskLevel),
              title: `Compliance alert: ${company.companyName}`,
              message: `${company.companyNumber} requires attention — status: ${complianceStatus.status}, risk: ${complianceStatus.riskLevel}, overdue filings: ${complianceStatus.overdueFilings.length}`,
              metadata: {
                schedulerRunId: runId,
                companyNumber: company.companyNumber,
                companyName: company.companyName,
                status: complianceStatus.status,
                riskLevel: complianceStatus.riskLevel,
                overdueFilings: complianceStatus.overdueFilings.length,
                upcomingDeadlines: complianceStatus.upcomingDeadlines.length,
              },
            },
            companyCorrelationId,
          );

          if (alertResult !== null && !alertResult.ok) {
            log({
              level: 'error',
              event: 'compliance.alert.persist.failed_safe',
              correlationId: alertResult.correlationId,
              error: alertResult.error,
              companyNumber: company.companyNumber,
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

      await releaseSchedulerLease('fineguard-compliance-check').catch(() => {});

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
      await releaseSchedulerLease('fineguard-compliance-check').catch(() => {});
      log({ level: 'error', event: 'scheduler.run.failed', correlationId: runId, error: String(err) });
      res.status(500).json({ error: 'Compliance check failed' });
    }
  });

  // ==========================================================================
  // FINEGUARD ALERT MANAGEMENT
  // ==========================================================================

  const VALID_ALERT_STATUSES = ['pending', 'acknowledged', 'resolved', 'failed'] as const;

  // GET /api/internal/alerts — list persisted FineGuard alerts.
  // Optional ?status= filter; ordered newest-first.
  app.get('/api/internal/alerts', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { status } = req.query;
    if (status !== undefined && !VALID_ALERT_STATUSES.includes(String(status) as typeof VALID_ALERT_STATUSES[number])) {
      return res.status(400).json({
        error: `Invalid status filter. Must be one of: ${VALID_ALERT_STATUSES.join(', ')}`,
      });
    }

    try {
      const baseQuery = db.select().from(fineGuardAlerts);
      const rows = status
        ? await baseQuery
            .where(eq(fineGuardAlerts.status, String(status)))
            .orderBy(desc(fineGuardAlerts.createdAt))
        : await baseQuery.orderBy(desc(fineGuardAlerts.createdAt));

      return res.json({ alerts: rows, total: rows.length });
    } catch (err) {
      log({ level: 'error', event: 'alerts.list_failed', error: String(err) });
      return res.status(500).json({ error: 'Failed to list alerts' });
    }
  });

  // PATCH /api/internal/alerts/:id/acknowledge — mark one alert as acknowledged.
  // Idempotent: acknowledging an already-acknowledged alert is a no-op (200).
  app.patch('/api/internal/alerts/:id/acknowledge', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    if (!process.env.DATABASE_URL) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    const { id } = req.params;
    const correlationId = generateCorrelationId();

    try {
      const [updated] = await db
        .update(fineGuardAlerts)
        .set({ status: 'acknowledged', updatedAt: new Date() })
        .where(eq(fineGuardAlerts.id, id))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: 'Alert not found' });
      }

      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'compliance_alert',
        entityUuid: updated.id,
        action: 'alert_acknowledged',
        correlationId,
        metadata: JSON.stringify({
          alertType: updated.alertType,
          severity: updated.severity,
          complianceRunId: updated.complianceRunId,
        }),
      }).catch(() => {});

      return res.json({ ok: true, alert: updated });
    } catch (err) {
      log({ level: 'error', event: 'alerts.acknowledge_failed', correlationId, error: String(err) });
      return res.status(500).json({ error: 'Failed to acknowledge alert' });
    }
  });

  // ==========================================================================
  // OPERATIONS CONTROL PLANE
  // ==========================================================================

  function requireAdmin(req: Request, res: Response): boolean {
    const key = req.headers['x-admin-key'];
    if (!ADMIN_API_KEY || key !== ADMIN_API_KEY) {
      res.status(401).json({ error: 'Unauthorized' });
      return false;
    }
    return true;
  }

  const VALID_OVERRIDE_TYPES = new Set([
    'force_open', 'force_closed', 'maintenance_mode', 'pause_scheduler', 'disable_retry_budget',
  ]);

  const KNOWN_DEPENDENCIES = new Set([
    'companies_house_api', 'fineguard_activation', 'stripe_api', 'neon_db',
    'azure_service_bus', 'scheduler',
    // Legacy aliases kept for backwards compatibility
    'stripe_webhook_processing',
  ]);

  // POST /api/internal/operations/override — create an override
  app.post('/api/internal/operations/override', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const { target, overrideType, value, expiresAt, expiresInMinutes, createdBy, reason } = req.body ?? {};
    const correlationId = generateCorrelationId();

    if (!target || !overrideType || !createdBy || !reason) {
      return res.status(400).json({ error: 'target, overrideType, createdBy, reason are required' });
    }
    if (!VALID_OVERRIDE_TYPES.has(overrideType)) {
      return res.status(400).json({ error: `Invalid overrideType. Allowed: ${[...VALID_OVERRIDE_TYPES].join(', ')}` });
    }
    if (overrideType === 'maintenance_mode' && !KNOWN_DEPENDENCIES.has(target)) {
      return res.status(400).json({ error: `maintenance_mode may only be applied to known dependencies: ${[...KNOWN_DEPENDENCIES].join(', ')}` });
    }

    // Compute effective expiry: expiresInMinutes takes precedence over expiresAt
    let effectiveExpiresAt: Date | null = null;
    if (typeof expiresInMinutes === 'number' && expiresInMinutes > 0) {
      effectiveExpiresAt = new Date(Date.now() + expiresInMinutes * 60_000);
    } else if (expiresAt) {
      effectiveExpiresAt = new Date(expiresAt);
    }

    const clerkDb = await getDb();
    if (!clerkDb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    // Warn (log) if force_closed has no expiry set
    if (overrideType === 'force_closed' && !effectiveExpiresAt) {
      log({ level: 'warn', event: 'operations.override.force_closed_no_expiry', correlationId, target, reason });
    }

    // Contradictory override check: force_open + force_closed cannot both be active on the same target
    try {
      const now = new Date();
      const existing = await clerkDb
        .select()
        .from(operationalOverrides)
        .where(or(isNull(operationalOverrides.expiresAt), gt(operationalOverrides.expiresAt, now))!);

      const activeForTarget = existing.filter((o) => o.target === target);
      const conflictType = overrideType === 'force_open' ? 'force_closed' : overrideType === 'force_closed' ? 'force_open' : null;
      if (conflictType && activeForTarget.some((o) => o.overrideType === conflictType)) {
        return res.status(400).json({
          error: `Contradictory override: ${overrideType} conflicts with existing ${conflictType} override on target "${target}"`,
        });
      }
    } catch (err) {
      log({ level: 'warn', event: 'operations.override.conflict_check_failed', correlationId, error: String(err) });
      // Allow proceed — conflict check failure must not block the write
    }

    try {
      const row: InsertOperationalOverride = {
        target,
        overrideType,
        value: value ?? {},
        expiresAt: effectiveExpiresAt,
        createdBy,
        reason,
      };
      const [created] = await clerkDb.insert(operationalOverrides).values(row).returning();
      invalidateOverrideCache();

      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'system',
        entityUuid: created.id,
        action: 'system_override_applied',
        correlationId,
        metadata: JSON.stringify({ target, overrideType, reason, expiresAt: created.expiresAt, createdBy }),
      }).catch(() => {});

      return res.status(201).json({ ok: true, override: created });
    } catch (err) {
      log({ level: 'error', event: 'operations.override.create_failed', correlationId, error: String(err) });
      return res.status(500).json({ error: 'Failed to create override' });
    }
  });

  // GET /api/internal/operations/overrides — list active overrides
  app.get('/api/internal/operations/overrides', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const clerkDb = await getDb();
    if (!clerkDb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    try {
      const now = new Date();
      const rows = await clerkDb
        .select()
        .from(operationalOverrides)
        .where(or(isNull(operationalOverrides.expiresAt), gt(operationalOverrides.expiresAt, now))!);
      return res.json({ overrides: rows });
    } catch (err) {
      log({ level: 'error', event: 'operations.overrides.list_failed', error: String(err) });
      return res.status(500).json({ error: 'Failed to list overrides' });
    }
  });

  // DELETE /api/internal/operations/override/:id — remove an override
  app.delete('/api/internal/operations/override/:id', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const { id } = req.params;
    const correlationId = generateCorrelationId();

    const clerkDb = await getDb();
    if (!clerkDb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    try {
      const existing = await clerkDb
        .select()
        .from(operationalOverrides)
        .where(eq(operationalOverrides.id, id))
        .limit(1);

      if (existing.length === 0) {
        return res.status(404).json({ error: 'Override not found' });
      }

      // Soft-expire: set expires_at = now() rather than deleting the row,
      // preserving audit history while making the override immediately inactive.
      await clerkDb
        .update(operationalOverrides)
        .set({ expiresAt: new Date() })
        .where(eq(operationalOverrides.id, id));
      invalidateOverrideCache();

      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'system',
        entityUuid: id,
        action: 'system_override_removed',
        correlationId,
        metadata: JSON.stringify({
          target: existing[0].target,
          overrideType: existing[0].overrideType,
          reason: existing[0].reason,
        }),
      }).catch(() => {});

      return res.json({ ok: true });
    } catch (err) {
      log({ level: 'error', event: 'operations.override.delete_failed', correlationId, error: String(err) });
      return res.status(500).json({ error: 'Failed to delete override' });
    }
  });

  // POST /api/internal/operations/annotate — add an incident annotation
  app.post('/api/internal/operations/annotate', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const { incidentStatus, note, createdBy } = req.body ?? {};
    const correlationId = generateCorrelationId();

    if (!incidentStatus || !note || !createdBy) {
      return res.status(400).json({ error: 'incidentStatus, note, createdBy are required' });
    }

    const clerkDb = await getDb();
    if (!clerkDb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    try {
      const row: InsertOperationalAnnotation = { incidentStatus, note, createdBy };
      const [created] = await clerkDb.insert(operationalAnnotations).values(row).returning();

      await writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'system',
        entityUuid: created.id,
        action: 'system_annotation_added',
        correlationId,
        metadata: JSON.stringify({ incidentStatus, createdBy, noteLength: note.length }),
      }).catch(() => {});

      return res.status(201).json({ ok: true, annotation: created });
    } catch (err) {
      log({ level: 'error', event: 'operations.annotate.failed', correlationId, error: String(err) });
      return res.status(500).json({ error: 'Failed to add annotation' });
    }
  });

  // GET /api/internal/operations/incidents — list recent annotations
  app.get('/api/internal/operations/incidents', async (req: Request, res: Response) => {
    if (!requireAdmin(req, res)) return;

    const clerkDb = await getDb();
    if (!clerkDb) {
      return res.status(503).json({ error: 'Database unavailable' });
    }

    try {
      const rows = await clerkDb
        .select()
        .from(operationalAnnotations)
        .orderBy(operationalAnnotations.createdAt);
      return res.json({ annotations: rows });
    } catch (err) {
      log({ level: 'error', event: 'operations.incidents.list_failed', error: String(err) });
      return res.status(500).json({ error: 'Failed to list annotations' });
    }
  });

  // ==========================================================================
  // STATIC FILE SERVING & SPA FALLBACK
  // Skipped on Vercel — Vercel serves the built frontend directly from CDN
  // ==========================================================================

  if (!isVercel) {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    // Guard: any /api/* route not matched above returns JSON 404
    app.all('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // On Vercel the CDN handles filesystem; only the API 404 guard is needed
    app.all('/api/*', (_req: Request, res: Response) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  // ==========================================================================
  // ERROR HANDLING
  // ==========================================================================

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
