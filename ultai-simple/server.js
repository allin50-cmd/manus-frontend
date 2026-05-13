'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Database ──────────────────────────────────────────────────────────────────

const db = new Database(path.join(__dirname, 'ultai.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS ultai_intakes (
    id              TEXT PRIMARY KEY,
    company_name    TEXT NOT NULL,
    contact_name    TEXT NOT NULL,
    email           TEXT NOT NULL,
    phone           TEXT,
    industry        TEXT,
    company_size    TEXT,
    website         TEXT,
    business_context TEXT,
    challenges      TEXT,
    tech_stack      TEXT,
    goals_timeline  TEXT,
    status          TEXT NOT NULL DEFAULT 'new',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const insertIntake = db.prepare(`
  INSERT INTO ultai_intakes
    (id, company_name, contact_name, email, phone, industry, company_size,
     website, business_context, challenges, tech_stack, goals_timeline, status)
  VALUES
    (@id, @company_name, @contact_name, @email, @phone, @industry, @company_size,
     @website, @business_context, @challenges, @tech_stack, @goals_timeline, 'new')
`);

const updateStatus = db.prepare(
  `UPDATE ultai_intakes SET status = ? WHERE id = ?`
);

// ── Rate limit (in-memory) ────────────────────────────────────────────────────

const rl = new Map(); // ip → { count, resetAt }

function rateLimit(req, res, next) {
  const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();
  const now = Date.now();
  const window = 15 * 60 * 1000;
  const max = 10;
  const entry = rl.get(ip);

  if (!entry || now > entry.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + window });
    return next();
  }
  if (entry.count >= max) {
    return res.status(429).json({ ok: false, error: 'Too many requests. Please try again later.' });
  }
  entry.count++;
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max) {
  if (v == null || v === '') return null;
  return String(v).trim().slice(0, max || 1000);
}

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// ── POST /api/ultai-intake ────────────────────────────────────────────────────

app.post('/api/ultai-intake', rateLimit, (req, res) => {
  const {
    companyName, contactName, email, phone,
    industry, companySize, website,
    businessContext, challenges, techStack, goalsTimeline,
  } = req.body || {};

  if (!companyName || !String(companyName).trim()) {
    return res.status(400).json({ ok: false, error: 'companyName is required' });
  }
  if (!contactName || !String(contactName).trim()) {
    return res.status(400).json({ ok: false, error: 'contactName is required' });
  }
  if (!email || !EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ ok: false, error: 'A valid email address is required' });
  }

  const id = `ULTAI-${Date.now()}`;

  try {
    insertIntake.run({
      id,
      company_name:     clean(companyName, 255),
      contact_name:     clean(contactName, 255),
      email:            String(email).trim().toLowerCase().slice(0, 255),
      phone:            clean(phone, 50),
      industry:         clean(industry, 100),
      company_size:     clean(companySize, 50),
      website:          clean(website, 255),
      business_context: clean(businessContext, 2000),
      challenges:       clean(challenges, 2000),
      tech_stack:       clean(techStack, 2000),
      goals_timeline:   clean(goalsTimeline, 2000),
    });
  } catch (err) {
    console.error('DB insert error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to save intake. Please try again.' });
  }

  console.log(`✅ Intake saved: ${id} — ${companyName}`);
  res.status(201).json({ ok: true, referenceId: id, message: "Request received. We'll be in touch shortly." });
});

// ── GET /api/admin/ultai-intakes ──────────────────────────────────────────────

app.get('/api/admin/ultai-intakes', (req, res) => {
  const { search, status } = req.query;

  let rows = db.prepare('SELECT * FROM ultai_intakes ORDER BY created_at DESC').all();

  if (status && status !== 'all') {
    rows = rows.filter(r => r.status === status);
  }
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter(r =>
      r.company_name.toLowerCase().includes(q) ||
      r.contact_name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
    );
  }

  res.json({ ok: true, intakes: rows });
});

// ── PATCH /api/admin/ultai-intakes/:id/status ─────────────────────────────────

const VALID_STATUSES = new Set(['new', 'contacted', 'qualified', 'closed']);

app.patch('/api/admin/ultai-intakes/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};

  if (!status || !VALID_STATUSES.has(status)) {
    return res.status(400).json({ ok: false, error: 'status must be one of: new, contacted, qualified, closed' });
  }

  const result = updateStatus.run(status, id);
  if (result.changes === 0) {
    return res.status(404).json({ ok: false, error: 'Intake not found' });
  }

  res.json({ ok: true, id, status });
});

// ── GET /api/admin/ultai-intakes/export ──────────────────────────────────────

app.get('/api/admin/ultai-intakes/export', (req, res) => {
  const rows = db.prepare('SELECT * FROM ultai_intakes ORDER BY created_at DESC').all();

  const cols = [
    'id', 'status', 'company_name', 'contact_name', 'email', 'phone',
    'industry', 'company_size', 'website', 'business_context',
    'challenges', 'tech_stack', 'goals_timeline', 'created_at',
  ];

  const esc = v => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return /[,"\n]/.test(s) ? `"${s}"` : s;
  };

  const csv = [
    cols.join(','),
    ...rows.map(r => cols.map(c => esc(r[c])).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="ultai-intakes-${Date.now()}.csv"`);
  res.send(csv);
});

// ── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('  UltAi Intake — Simple MVP');
  console.log('  ─────────────────────────────────────');
  console.log(`  Intake form : http://localhost:${PORT}/form.html`);
  console.log(`  Admin       : http://localhost:${PORT}/admin.html`);
  console.log(`  Health      : http://localhost:${PORT}/api/health`);
  console.log('');
});
