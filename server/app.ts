import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Stripe from 'stripe';
import alertRouter from './routes/alerts';
import companiesRouter from './routes/companies';
import voiceReceptionRouter from './routes/voiceReception';
import governanceRouter from './routes/governance';
import { governanceMiddleware } from './governance/middleware';
import pieRouter from './routes/pie';
import { db } from './db/index';
import { deploymentStatus, leads, intakeForms, complianceBundles, contacts, monitoredCompanies, auditLeads, zapierSubscriptions } from './db/schema';
import { desc, eq } from 'drizzle-orm';
import { companiesHouseService } from './services/companiesHouse';
import { runSalesAgent } from './services/salesAgent';
import { sendAuditReady, sendAgentMessage } from './services/emailService';
import { subscribe, unsubscribe, fire, listByEvent, type ZapierEvent } from './services/zapierWebhook';

dotenv.config();

export function createApp() {
  const app = express();
  const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' }) : null;

  // Stripe webhook — must be before express.json()
  app.post(
    '/api/stripe/webhook',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
      const sig = req.headers['stripe-signature'] as string;
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (!webhookSecret) return res.status(500).json({ error: 'Stripe webhook secret not configured' });
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
            await db.insert(monitoredCompanies).values({ companyNumber, companyName, stripeSessionId: session.id }).onConflictDoNothing();
          } catch (err) {
            console.error('Error persisting monitored company:', err);
            return res.status(500).json({ error: 'Database error' });
          }
        }
      }
      res.json({ received: true });
    }
  );

  app.use(cors());
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), geolocation=()');
    next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use('/api/governance', governanceRouter);
  app.use('/api/pie', pieRouter);
  app.use('/api/alerts', alertRouter);
  app.use('/api/companies', companiesRouter);
  // Governance middleware: governs all non-GET/health/stream voice-reception requests
  app.use('/api/voice-reception', governanceMiddleware());
  app.use('/api/voice-reception', voiceReceptionRouter);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });

  // ── Health ────────────────────────────────────────────────────────────────
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

  // ── Stripe ────────────────────────────────────────────────────────────────
  app.post('/api/stripe/checkout', async (req: Request, res: Response) => {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const { companyNumber, companyName } = req.body;
    if (!companyNumber || !companyName) return res.status(400).json({ error: 'companyNumber and companyName are required' });
    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) return res.status(500).json({ error: 'STRIPE_PRICE_ID not configured' });
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
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
    if (!companyNumber || typeof companyNumber !== 'string') return res.status(400).json({ error: 'companyNumber query param is required' });
    try {
      const [row] = await db.select().from(monitoredCompanies).where(eq(monitoredCompanies.companyNumber, companyNumber)).limit(1);
      res.json({ monitored: !!row, activatedAt: row?.activatedAt ?? null });
    } catch (err) {
      console.error('Error checking protection status:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Deployments ───────────────────────────────────────────────────────────
  app.post('/api/deployments/record', async (req: Request, res: Response) => {
    try {
      const token = req.headers['x-deploy-token'];
      if (!token || token !== DEPLOY_RECORD_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
      const { environment, status, commit, workflowRun } = req.body;
      if (!environment || !status || !commit || !workflowRun) return res.status(400).json({ error: 'Missing required fields' });
      if (!['dev', 'staging', 'prod'].includes(environment)) return res.status(400).json({ error: 'Invalid environment' });
      if (!['success', 'failed', 'in_progress'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const [deployment] = await db.insert(deploymentStatus).values({ environment, status, commit: commit.substring(0, 50), workflowRun: workflowRun.toString() }).returning();
      res.status(201).json({ success: true, id: deployment.id });
    } catch (error) {
      console.error('Error recording deployment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/deployments/status', async (_req: Request, res: Response) => {
    try {
      const all = await db.select().from(deploymentStatus).orderBy(desc(deploymentStatus.deployedAt));
      const latest = new Map();
      for (const d of all) { if (!latest.has(d.environment)) latest.set(d.environment, d); }
      res.json({ deployments: Array.from(latest.values()) });
    } catch (error) {
      console.error('Error fetching deployment status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/deployments/history', async (req: Request, res: Response) => {
    try {
      const { environment, limit = '50' } = req.query;
      let query = db.select().from(deploymentStatus);
      if (environment && typeof environment === 'string') query = query.where(eq(deploymentStatus.environment, environment)) as any;
      const deployments = await query.orderBy(desc(deploymentStatus.deployedAt)).limit(parseInt(limit as string));
      res.json({ deployments });
    } catch (error) {
      console.error('Error fetching deployment history:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Leads ─────────────────────────────────────────────────────────────────
  app.post('/api/lead', async (req: Request, res: Response) => {
    try {
      const { name, email, company, product, phone, message } = req.body;
      if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email are required' });
      const leadId = `LEAD-${Date.now()}`;
      const [lead] = await db.insert(leads).values({ leadId, name, email, company: company || null, product: product || null, phone: phone || null, message: message || null }).returning();
      fire('new_lead', { id: lead.id, leadId: lead.leadId, name, email, company: company ?? null, product: product ?? null, phone: phone ?? null, createdAt: lead.createdAt }).catch((err) => console.error('[zapier] fire new_lead error:', err));
      res.status(201).json({ ok: true, message: "Thank you for your interest! We'll be in touch soon.", leadId: lead.leadId });
    } catch (error) {
      console.error('Error creating lead:', error);
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

  // ── Intake ────────────────────────────────────────────────────────────────
  app.post('/api/intake', async (req: Request, res: Response) => {
    try {
      const { clientName, clientEmail, clientPhone, matterType, urgency, description, claimValue } = req.body;
      if (!clientName || !matterType || !urgency) return res.status(400).json({ ok: false, error: 'Client name, matter type, and urgency are required' });
      const matterRef = `MAT-${Date.now()}`;
      const [intake] = await db.insert(intakeForms).values({ matterRef, clientName, clientEmail: clientEmail || null, clientPhone: clientPhone || null, matterType, urgency, description: description || null, claimValue: claimValue || null }).returning();
      res.status(201).json({ ok: true, message: 'Matter intake recorded successfully', matterRef: intake.matterRef, urgency: intake.urgency });
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

  // ── Compliance bundles ────────────────────────────────────────────────────
  app.post('/api/compliance-bundle', async (req: Request, res: Response) => {
    try {
      const { companyNumber, requestorName, requestorEmail, bundleType } = req.body;
      if (!companyNumber) return res.status(400).json({ ok: false, error: 'Company number is required' });
      if (!companiesHouseService.validateCompanyNumber(companyNumber)) return res.status(400).json({ ok: false, error: 'Invalid company number format.' });
      const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber);
      const companyProfile = await companiesHouseService.getCompanyProfile(formattedNumber);
      if (!companyProfile) return res.status(404).json({ ok: false, error: 'Company not found in Companies House register.' });
      const complianceStatus = await companiesHouseService.getComplianceStatus(formattedNumber);
      const bundleId = `BUNDLE-${Date.now()}`;
      const [bundle] = await db.insert(complianceBundles).values({ bundleId, companyName: companyProfile.companyName, companyNumber: formattedNumber, requestorName: requestorName || null, requestorEmail: requestorEmail || null, bundleType: bundleType || 'full', estimatedTime: 'Generated instantly' }).returning();
      res.status(201).json({
        ok: true, message: 'Real-time compliance check complete', bundleId: bundle.bundleId,
        company: { number: companyProfile.companyNumber, name: companyProfile.companyName, status: companyProfile.companyStatus, type: companyProfile.type, incorporationDate: companyProfile.dateOfCreation },
        compliance: {
          status: complianceStatus.status, riskLevel: complianceStatus.riskLevel,
          accounts: { nextDue: complianceStatus.accountsStatus.nextDue, daysUntilDue: complianceStatus.accountsStatus.daysUntilDue, overdue: complianceStatus.accountsStatus.overdue },
          confirmationStatement: { nextDue: complianceStatus.confirmationStatementStatus.nextDue, daysUntilDue: complianceStatus.confirmationStatementStatus.daysUntilDue, overdue: complianceStatus.confirmationStatementStatus.overdue },
          overdueFilings: complianceStatus.overdueFilings.map(f => ({ type: f.type, description: f.description, dueDate: f.dueDate, daysOverdue: Math.abs(f.daysUntilDue), penaltyRisk: f.penaltyRisk })),
          upcomingDeadlines: complianceStatus.upcomingDeadlines.map(d => ({ type: d.type, description: d.description, dueDate: d.dueDate, daysUntilDue: d.daysUntilDue })),
          penalties: complianceStatus.penalties,
        },
      });
    } catch (error) {
      console.error('Error fetching Companies House data:', error);
      if (error instanceof Error && error.message.includes('COMPANIES_HOUSE_API_KEY')) return res.status(500).json({ ok: false, error: 'Companies House API not configured.' });
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

  // ── Contacts ──────────────────────────────────────────────────────────────
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) return res.status(400).json({ ok: false, error: 'Name, email, and message are required' });
      const ticketId = `TICKET-${Date.now()}`;
      const [contact] = await db.insert(contacts).values({ ticketId, name, email, subject: subject || null, message, status: 'new' }).returning();
      res.status(201).json({ ok: true, message: "Thank you for contacting us. We'll respond within 24 hours.", ticketId: contact.ticketId });
    } catch (error) {
      console.error('Error creating contact:', error);
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

  app.patch('/api/contacts/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['new', 'read', 'replied'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
      const [contact] = await db.update(contacts).set({ status }).where(eq(contacts.id, id)).returning();
      if (!contact) return res.status(404).json({ error: 'Contact not found' });
      res.json({ success: true, contact });
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Zapier ────────────────────────────────────────────────────────────────
  const ZAPIER_API_KEY = process.env.ZAPIER_API_KEY;
  const VALID_EVENTS: ZapierEvent[] = ['new_audit_lead', 'new_lead', 'deal_escalated', 'deal_closed'];

  function requireZapierAuth(req: Request, res: Response): boolean {
    if (!ZAPIER_API_KEY) return true;
    const key = req.headers['x-api-key'] ?? req.query.api_key;
    if (key !== ZAPIER_API_KEY) { res.status(401).json({ error: 'Unauthorized' }); return false; }
    return true;
  }

  app.post('/api/zapier/subscribe', async (req: Request, res: Response) => {
    if (!requireZapierAuth(req, res)) return;
    const { hookUrl, event } = req.body;
    if (!hookUrl || !event) return res.status(400).json({ error: 'hookUrl and event are required' });
    if (!VALID_EVENTS.includes(event)) return res.status(400).json({ error: `event must be one of: ${VALID_EVENTS.join(', ')}` });
    try {
      const sub = await subscribe(hookUrl, event as ZapierEvent, ZAPIER_API_KEY ?? 'none');
      res.status(201).json({ id: sub.id, hookUrl, event });
    } catch (err) { console.error('[zapier] subscribe error:', err); res.status(500).json({ error: 'Failed to subscribe' }); }
  });

  app.delete('/api/zapier/subscribe', async (req: Request, res: Response) => {
    if (!requireZapierAuth(req, res)) return;
    const { hookUrl, event } = req.body;
    if (!hookUrl || !event) return res.status(400).json({ error: 'hookUrl and event are required' });
    try { await unsubscribe(hookUrl, event as ZapierEvent); res.json({ ok: true }); }
    catch (err) { console.error('[zapier] unsubscribe error:', err); res.status(500).json({ error: 'Failed to unsubscribe' }); }
  });

  app.get('/api/zapier/sample/:event', (req: Request, res: Response) => {
    if (!requireZapierAuth(req, res)) return;
    const samples: Record<string, object> = {
      new_audit_lead: { id: 'a62fe1f7-225e-4288-b2bc-8853cb9c2f4b', tenantId: '3ed1ef2d-2d56-45f1-98ae-1c76548c2beb', email: 'sample@chambers.co.uk', name: 'Jane Barrister', chamberSize: '11-30', painPoints: ['Unbilled emails & calls'], stage: 'signed_up', createdAt: new Date().toISOString() },
      new_lead: { id: '8856a199-f568-4d03-ac36-cab598c78a41', leadId: 'LEAD-1776413871087', name: 'Alice Smith', email: 'alice@chambers.co.uk', company: 'Gray Inn', product: 'vaultline', createdAt: new Date().toISOString() },
      deal_escalated: { leadId: 'LEAD-1776413871087', email: 'alice@chambers.co.uk', reason: 'High-value close £6000 requires human approval', agentAction: 'escalate', priceMonthly: 6000, escalatedAt: new Date().toISOString() },
      deal_closed: { leadId: 'LEAD-1776413871087', email: 'alice@chambers.co.uk', priceMonthly: 2500, closedAt: new Date().toISOString() },
    };
    const sample = samples[req.params.event];
    if (!sample) return res.status(404).json({ error: 'Unknown event' });
    res.json([sample]);
  });

  app.get('/api/zapier/subscriptions', async (req: Request, res: Response) => {
    if (!requireZapierAuth(req, res)) return;
    try { res.json(await db.select().from(zapierSubscriptions)); }
    catch (err) { res.status(500).json({ error: 'Failed to fetch subscriptions' }); }
  });

  // ── Audit funnel ──────────────────────────────────────────────────────────
  app.post('/api/audit-signup', async (req: Request, res: Response) => {
    try {
      const { email, name, chamberSize, painPoints } = req.body;
      if (!email || typeof email !== 'string') return res.status(400).json({ ok: false, error: 'email is required' });
      const tenantId = crypto.randomUUID();
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const [auditLead] = await db.insert(auditLeads).values({ tenantId, email, name: name ?? null, chamberSize: chamberSize ?? null, painPoints: painPoints ? JSON.stringify(painPoints) : null }).returning();
      await sendAuditReady(email, name ?? '', tenantId, appUrl);
      fire('new_audit_lead', { id: auditLead.id, tenantId, email, name: name ?? null, chamberSize: chamberSize ?? null, painPoints: painPoints ?? [], stage: 'signed_up', createdAt: auditLead.createdAt }).catch((err) => console.error('[zapier] fire new_audit_lead error:', err));
      const agentMode = process.env.AGENT_MODE ?? 'shadow';
      const decision = await runSalesAgent(auditLead).catch((err) => { console.error('[salesAgent] error:', err); return null; });
      if (decision) {
        await db.update(auditLeads).set({ agentDecision: JSON.stringify(decision) }).where(eq(auditLeads.id, auditLead.id));
        if (agentMode === 'shadow') { console.log('[salesAgent] shadow decision:', decision); }
        else if (decision.action === 'negotiate' || decision.action === 'close') {
          await sendAgentMessage(email, 'Your chambers recovery plan', decision.message);
          if (decision.action === 'close') fire('deal_closed', { email, priceMonthly: decision.priceMonthly, closedAt: new Date().toISOString() }).catch((err) => console.error('[zapier] fire deal_closed error:', err));
        } else if (decision.action === 'escalate') {
          fire('deal_escalated', { email, reason: decision.reasoning, agentAction: 'escalate', priceMonthly: decision.priceMonthly, escalatedAt: new Date().toISOString() }).catch((err) => console.error('[zapier] fire deal_escalated error:', err));
        }
      }
      res.status(201).json({ ok: true, tenantId });
    } catch (error) {
      console.error('Error in audit-signup:', error);
      res.status(500).json({ ok: false, error: 'Failed to process signup' });
    }
  });

  app.get('/api/admin/audit-leads', async (_req: Request, res: Response) => {
    try {
      const all = await db.select().from(auditLeads).orderBy(desc(auditLeads.createdAt));
      res.json(all);
    } catch (error) {
      console.error('Error fetching audit leads:', error);
      res.status(500).json({ error: 'Failed to fetch audit leads' });
    }
  });

  // ── Error handler ─────────────────────────────────────────────────────────
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
