import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables first
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ─── Rate limiting ────────────────────────────────────────────────────────────

// Strict limit for form submission endpoints (10 req / 15 min per IP)
const formLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, error: 'Too many requests. Please try again later.' },
});

// General API limit (100 req / 15 min per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/fg', apiLimiter);
app.use('/api/admin', apiLimiter);
app.use('/api/lead', formLimiter);
app.use('/api/contact', formLimiter);
app.use('/api/intake', formLimiter);
app.use('/api/compliance-bundle', formLimiter);

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), product: 'FineGuard' });
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ─── FineGuard API ────────────────────────────────────────────────────────────

import fineGuardRoutes from './features/fineguard/routes.js';
app.use('/api/fg', fineGuardRoutes);

import adminRoutes from './features/admin/routes.js';
app.use('/api/admin', adminRoutes);

import { adminStore } from './features/admin/store.js';
import { validateString, validateEmail, collect } from './lib/validate.js';

// ─── Legacy routes (kept for backward compatibility) ─────────────────────────
// These are non-critical and silently skip if DB is unavailable.

const DEPLOY_RECORD_TOKEN = process.env.DEPLOY_RECORD_TOKEN;

app.post('/api/deployments/record', async (req: Request, res: Response) => {
  const token = req.headers['x-deploy-token'];
  if (!token || token !== DEPLOY_RECORD_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ ok: true, message: 'Deployment recorded (legacy endpoint)' });
});

app.get('/api/deployments/status', (_req: Request, res: Response) => {
  res.json({ deployments: [] });
});

app.post('/api/lead', (req: Request, res: Response) => {
  const { name, email, company, product, phone, message } = req.body;
  const errors = collect(
    validateString(name, 'name', { required: true, maxLength: 255 }),
    validateEmail(email, 'email'),
    validateString(company, 'company', { maxLength: 255 }),
    validateString(product, 'product', { maxLength: 50 }),
    validateString(phone, 'phone', { maxLength: 50 }),
    validateString(message, 'message', { maxLength: 2000 }),
  );
  if (errors.length) return res.status(400).json({ ok: false, errors });
  const lead = adminStore.addLead({ name, email, company, product, phone, message });
  res.status(201).json({ ok: true, message: "Thank you, we'll be in touch.", leadId: lead.leadId });
});

app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  const errors = collect(
    validateString(name, 'name', { required: true, maxLength: 255 }),
    validateEmail(email, 'email'),
    validateString(subject, 'subject', { maxLength: 255 }),
    validateString(message, 'message', { required: true, maxLength: 5000 }),
  );
  if (errors.length) return res.status(400).json({ ok: false, errors });
  const contact = adminStore.addContact({ name, email, subject, message });
  res.status(201).json({ ok: true, ticketId: contact.ticketId });
});

app.post('/api/intake', (req: Request, res: Response) => {
  const { clientName, clientEmail, clientPhone, matterType, urgency, description, claimValue } = req.body;
  const VALID_URGENCY = ['low', 'medium', 'high', 'critical'];
  const errors = collect(
    validateString(clientName, 'clientName', { required: true, maxLength: 255 }),
    clientEmail ? validateEmail(clientEmail, 'clientEmail') : null,
    validateString(clientPhone, 'clientPhone', { maxLength: 50 }),
    validateString(matterType, 'matterType', { required: true, maxLength: 100 }),
    validateString(urgency, 'urgency', { required: true }),
    validateString(description, 'description', { maxLength: 5000 }),
    validateString(claimValue, 'claimValue', { maxLength: 50 }),
  );
  if (errors.length) return res.status(400).json({ ok: false, errors });
  if (!VALID_URGENCY.includes(urgency)) {
    return res.status(400).json({ ok: false, errors: [{ field: 'urgency', message: `urgency must be one of: ${VALID_URGENCY.join(', ')}` }] });
  }
  const form = adminStore.addIntakeForm({ clientName, clientEmail, clientPhone, matterType, urgency, description, claimValue });
  res.status(201).json({ ok: true, matterRef: form.matterRef });
});

app.post('/api/compliance-bundle', (req: Request, res: Response) => {
  const { companyName, companyNumber, requestorName, requestorEmail, bundleType, estimatedTime } = req.body;
  const errors = collect(
    validateString(companyName, 'companyName', { required: true, maxLength: 255 }),
    validateString(companyNumber, 'companyNumber', { required: true, maxLength: 50 }),
    validateString(requestorName, 'requestorName', { maxLength: 255 }),
    requestorEmail ? validateEmail(requestorEmail, 'requestorEmail') : null,
    validateString(bundleType, 'bundleType', { maxLength: 50 }),
    validateString(estimatedTime, 'estimatedTime', { maxLength: 100 }),
  );
  if (errors.length) return res.status(400).json({ ok: false, errors });
  const bundle = adminStore.addComplianceBundle({ companyName, companyNumber, requestorName, requestorEmail, bundleType: bundleType ?? 'full', estimatedTime });
  res.status(201).json({ ok: true, bundleId: bundle.bundleId });
});

// ─── Static file serving & SPA fallback ──────────────────────────────────────

const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─── Error handler ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('┌─────────────────────────────────────┐');
  console.log('│  FineGuard Server                   │');
  console.log('└─────────────────────────────────────┘');
  console.log(`  Port:    ${PORT}`);
  console.log(`  Env:     ${process.env.NODE_ENV ?? 'development'}`);
  console.log(`  CH API:  ${process.env.COMPANIES_HOUSE_API_KEY ? 'configured' : 'mock (set COMPANIES_HOUSE_API_KEY for live data)'}`);
  console.log('');
  console.log('  API routes:');
  console.log('  GET  /api/fg/company/search?q=...');
  console.log('  GET  /api/fg/company/:number');
  console.log('  POST /api/fg/monitoring');
  console.log('  GET  /api/fg/monitoring/:companyId');
  console.log('  GET  /api/fg/alerts');
  console.log('  PATCH /api/fg/alerts/:id/handled');
  console.log('  GET  /api/fg/history/:companyId');
  console.log('  POST /api/fg/sweep');
  console.log('  GET  /api/admin/leads');
  console.log('  GET  /api/admin/intake-forms');
  console.log('  GET  /api/admin/compliance-bundles');
  console.log('  GET  /api/admin/contacts');
  console.log('  POST /api/lead');
  console.log('  POST /api/contact');
  console.log('  POST /api/intake');
  console.log('  POST /api/compliance-bundle');
  console.log('');
});

// ─── Alert sweep scheduler ────────────────────────────────────────────────────

if (process.env.NODE_ENV !== 'test') {
  import('./jobs/alertSweep.js').then(({ startAlertSweepScheduler }) => {
    startAlertSweepScheduler();
  }).catch((err) => {
    console.error('Failed to start alert sweep scheduler:', err);
  });
}
