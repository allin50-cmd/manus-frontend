import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
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

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

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

app.post('/api/lead', async (req: Request, res: Response) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ ok: false, error: 'Name and email required' });
  console.log(`Lead: ${name} <${email}>`);
  res.status(201).json({ ok: true, message: "Thank you, we'll be in touch.", leadId: `LEAD-${Date.now()}` });
});

app.post('/api/contact', async (req: Request, res: Response) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ ok: false, error: 'Name, email, message required' });
  res.status(201).json({ ok: true, ticketId: `TICKET-${Date.now()}` });
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
