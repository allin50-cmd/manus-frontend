'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

// ── MIME ──────────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.js':   'text/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.ico':  'image/x-icon',
  '.svg':  'image/svg+xml',
};

// ── Database ──────────────────────────────────────────────────────────────────
let db, insertIntake, updateStatus, listAll;
try {
  db = new DatabaseSync(path.join(__dirname, 'ultai.db'));
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
  insertIntake = db.prepare(`
    INSERT INTO ultai_intakes
      (id, company_name, contact_name, email, phone, industry, company_size,
       website, business_context, challenges, tech_stack, goals_timeline, status)
    VALUES
      (@id, @company_name, @contact_name, @email, @phone, @industry, @company_size,
       @website, @business_context, @challenges, @tech_stack, @goals_timeline, 'new')
  `);
  updateStatus = db.prepare(`UPDATE ultai_intakes SET status = ? WHERE id = ?`);
  listAll      = db.prepare(`SELECT * FROM ultai_intakes ORDER BY created_at DESC`);
} catch (err) {
  console.error('Fatal: failed to open/init database:', err.message);
  process.exit(1);
}

// ── Rate limit ────────────────────────────────────────────────────────────────
const rl = new Map();
const RL_WINDOW = 15 * 60 * 1000;
const RL_MAX    = 10;

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')
    .split(',')[0].trim();
}

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = rl.get(ip);
  if (!entry || now > entry.resetAt) {
    rl.set(ip, { count: 1, resetAt: now + RL_WINDOW });
    return true;
  }
  if (entry.count >= RL_MAX) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rl) {
    if (now > entry.resetAt) rl.delete(ip);
  }
}, 30 * 60 * 1000).unref();

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(v, max) {
  if (v == null || v === '') return null;
  return String(v).trim().slice(0, max || 1000);
}

function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    const ct = (req.headers['content-type'] || '').split(';')[0].trim();
    if (ct !== 'application/json') return resolve(null);
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); }
      catch { reject(new Error('bad json')); }
    });
    req.on('error', reject);
  });
}

function serveFile(res, abs, headOnly = false) {
  try {
    const data = fs.readFileSync(abs);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream' });
    res.end(headOnly ? '' : data);
  } catch {
    send(res, 404, { ok: false, error: 'Not found' });
  }
}

// ── Router ────────────────────────────────────────────────────────────────────
const PATCH_RE       = /^\/api\/admin\/ultai-intakes\/([^/]+)\/status$/;
const VALID_STATUSES = new Set(['new', 'contacted', 'qualified', 'closed']);

async function handle(req, res) {
  const url      = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;
  const method   = req.method;
  const isHead   = method === 'HEAD';

  // Health
  if ((method === 'GET' || isHead) && pathname === '/api/health') {
    return send(res, 200, { ok: true, timestamp: new Date().toISOString() });
  }

  // Submit intake
  if (method === 'POST' && pathname === '/api/ultai-intake') {
    let body;
    try { body = await readJson(req); }
    catch { return send(res, 400, { ok: false, error: 'Invalid JSON in request body' }); }

    const { companyName, contactName, email, phone, industry, companySize,
            website, businessContext, challenges, techStack, goalsTimeline } = body || {};

    if (!companyName || !String(companyName).trim())
      return send(res, 400, { ok: false, error: 'companyName is required' });
    if (!contactName || !String(contactName).trim())
      return send(res, 400, { ok: false, error: 'contactName is required' });
    if (!email || !EMAIL_RE.test(String(email).trim()))
      return send(res, 400, { ok: false, error: 'A valid email address is required' });

    if (!checkRateLimit(clientIp(req)))
      return send(res, 429, { ok: false, error: 'Too many requests. Please try again later.' });

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
      return send(res, 500, { ok: false, error: 'Failed to save intake. Please try again.' });
    }

    console.log(`✅ Intake saved: ${id} — ${companyName}`);
    return send(res, 201, { ok: true, referenceId: id, message: "Request received. We'll be in touch shortly." });
  }

  // Admin list
  if ((method === 'GET' || isHead) && pathname === '/api/admin/ultai-intakes') {
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');
    let rows = listAll.all();
    if (status && status !== 'all') rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r =>
        r.company_name.toLowerCase().includes(q) ||
        r.contact_name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return send(res, 200, { ok: true, intakes: rows });
  }

  // CSV export — must come before the PATCH regex
  if ((method === 'GET' || isHead) && pathname === '/api/admin/ultai-intakes/export') {
    const rows = listAll.all();
    const cols = ['id', 'status', 'company_name', 'contact_name', 'email', 'phone',
                  'industry', 'company_size', 'website', 'business_context',
                  'challenges', 'tech_stack', 'goals_timeline', 'created_at'];
    const esc = v => {
      if (v == null) return '';
      const s = String(v).replace(/"/g, '""');
      return /[,"\n]/.test(s) ? `"${s}"` : s;
    };
    const csv = [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
    res.writeHead(200, {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="ultai-intakes-${Date.now()}.csv"`,
    });
    return res.end(isHead ? '' : csv);
  }

  // Status update
  const patchMatch = method === 'PATCH' && PATCH_RE.exec(pathname);
  if (patchMatch) {
    let body;
    try { body = await readJson(req); }
    catch { return send(res, 400, { ok: false, error: 'Invalid JSON in request body' }); }

    const { status } = body || {};
    if (!status || !VALID_STATUSES.has(status))
      return send(res, 400, { ok: false, error: 'status must be one of: new, contacted, qualified, closed' });

    const result = updateStatus.run(status, patchMatch[1]);
    if (result.changes === 0)
      return send(res, 404, { ok: false, error: 'Intake not found' });

    return send(res, 200, { ok: true, id: patchMatch[1], status });
  }

  // All other /api/* → 404
  if (pathname.startsWith('/api/')) {
    return send(res, 404, { ok: false, error: 'Not found' });
  }

  // Static files
  if (method === 'GET' || isHead) {
    const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
    const abs = path.join(PUBLIC, path.normalize(rel));
    if (!abs.startsWith(PUBLIC + path.sep)) {
      return send(res, 403, { ok: false, error: 'Forbidden' });
    }
    return serveFile(res, abs, isHead);
  }

  send(res, 404, { ok: false, error: 'Not found' });
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  try {
    await handle(req, res);
  } catch (err) {
    console.error('Unhandled error:', err);
    if (!res.headersSent) send(res, 500, { ok: false, error: 'Internal server error' });
  }
});

server.on('error', err => {
  if (err.code === 'EADDRINUSE') console.error(`Fatal: port ${PORT} is already in use`);
  else console.error('Fatal: server error:', err.message);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log('');
  console.log('  UltAi Intake — Simple MVP');
  console.log('  ─────────────────────────────────────');
  console.log(`  Intake form : http://localhost:${PORT}/form.html`);
  console.log(`  Admin       : http://localhost:${PORT}/admin.html`);
  console.log(`  Health      : http://localhost:${PORT}/api/health`);
  console.log('');
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n  Received ${signal} — shutting down gracefully…`);
  server.close(() => {
    try { db.close(); } catch (_) {}
    console.log('  Server and database closed. Bye.');
    process.exit(0);
  });
  setTimeout(() => {
    console.error('  Shutdown timeout — forcing exit.');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException', err => { console.error('Uncaught exception:', err); process.exit(1); });
process.on('unhandledRejection', reason => { console.error('Unhandled promise rejection:', reason); });
