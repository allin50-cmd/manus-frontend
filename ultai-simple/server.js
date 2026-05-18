'use strict';

const http = require('http');
const fs   = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT   = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, 'public');

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
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=3000;');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ultai_intakes (
      id TEXT PRIMARY KEY, company_name TEXT NOT NULL, contact_name TEXT NOT NULL,
      email TEXT NOT NULL, phone TEXT, industry TEXT, company_size TEXT,
      website TEXT, business_context TEXT, challenges TEXT, tech_stack TEXT,
      goals_timeline TEXT, status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
  insertIntake = db.prepare(`
    INSERT INTO ultai_intakes
      (id,company_name,contact_name,email,phone,industry,company_size,
       website,business_context,challenges,tech_stack,goals_timeline,status)
    VALUES
      (@id,@company_name,@contact_name,@email,@phone,@industry,@company_size,
       @website,@business_context,@challenges,@tech_stack,@goals_timeline,'new')
  `);
  updateStatus = db.prepare(`UPDATE ultai_intakes SET status=? WHERE id=?`);
  listAll      = db.prepare(`SELECT * FROM ultai_intakes ORDER BY created_at DESC`);
} catch (err) {
  console.error('Fatal: failed to open/init database:', err.message);
  process.exit(1);
}

// ── Rate limit ────────────────────────────────────────────────────────────────
const rl = new Map();
const RL_MAX = 10, RL_WIN = 15 * 60_000;

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'x').split(',')[0].trim();
}

function rateOk(ip) {
  const now = Date.now(), e = rl.get(ip);
  if (!e || now > e.t) { rl.set(ip, { n: 1, t: now + RL_WIN }); return true; }
  if (e.n >= RL_MAX) return false;
  e.n++; return true;
}

setInterval(() => { const now = Date.now(); for (const [k, v] of rl) if (now > v.t) rl.delete(k); }, 30 * 60_000).unref();

// ── Helpers ───────────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const trim = (v, n) => (v == null || v === '') ? null : String(v).trim().slice(0, n || 1000);

function send(res, status, body) {
  const p = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(p) });
  res.end(res._head ? '' : p);   // omit body for HEAD requests
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (!(req.headers['content-type'] || '').startsWith('application/json')) return resolve(null);
    const buf = [];
    let size = 0, over = false;
    req.on('data', c => {
      if (over) return;
      size += c.length;
      if (size >= 65_536) { over = true; req.resume(); return reject(Object.assign(new Error(), { tooLarge: true })); }
      buf.push(c);
    })
    .on('end', () => { if (over) return; try { resolve(JSON.parse(Buffer.concat(buf).toString() || '{}')); } catch { reject(new Error('bad json')); } })
    .on('error', reject);
  });
}

function serveFile(res, abs, headOnly) {
  try {
    const data = fs.readFileSync(abs);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(abs)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' });
    res.end(headOnly ? '' : data);
  } catch { send(res, 404, { ok: false, error: 'Not found' }); }
}

// ── CSV ───────────────────────────────────────────────────────────────────────
const CSV_COLS = ['id','status','company_name','contact_name','email','phone',
                  'industry','company_size','website','business_context',
                  'challenges','tech_stack','goals_timeline','created_at'];

function csvEsc(v) {
  if (v == null) return '';
  const s = String(v).replace(/"/g, '""');
  return /[,"\n]/.test(s) ? `"${s}"` : s;
}

// ── Router ────────────────────────────────────────────────────────────────────
let _seq = 0;  // monotonic counter — appended to ms timestamp to prevent ID collisions
const PATCH_RE = /^\/api\/admin\/ultai-intakes\/([^/]+)\/status$/;
const STATUSES = new Set(['new', 'contacted', 'qualified', 'closed']);

async function handle(req, res) {
  const { pathname, searchParams } = new URL(req.url, 'http://x');
  const isHead = req.method === 'HEAD';
  const method = isHead ? 'GET' : req.method;   // normalise HEAD → GET for routing

  if (method === 'GET' && pathname === '/api/health')
    return send(res, 200, { ok: true, timestamp: new Date().toISOString() });

  if (method === 'POST' && pathname === '/api/ultai-intake') {
    let body;
    try { body = await readJson(req); }
    catch (e) { return send(res, e?.tooLarge ? 413 : 400, { ok: false, error: e?.tooLarge ? 'Request body too large' : 'Invalid JSON in request body' }); }
    const { companyName, contactName, email, phone, industry, companySize,
            website, businessContext, challenges, techStack, goalsTimeline } = body || {};

    if (!companyName || !String(companyName).trim()) return send(res, 400, { ok: false, error: 'companyName is required' });
    if (!contactName || !String(contactName).trim()) return send(res, 400, { ok: false, error: 'contactName is required' });
    if (!email || !EMAIL_RE.test(String(email).trim())) return send(res, 400, { ok: false, error: 'A valid email address is required' });
    if (!rateOk(clientIp(req))) return send(res, 429, { ok: false, error: 'Too many requests. Please try again later.' });

    const id = `ULTAI-${Date.now()}${String(++_seq).padStart(4, '0')}`;
    try {
      insertIntake.run({ id,
        company_name: trim(companyName, 255), contact_name: trim(contactName, 255),
        email: String(email).trim().toLowerCase().slice(0, 255),
        phone: trim(phone, 50), industry: trim(industry, 100), company_size: trim(companySize, 50),
        website: trim(website, 255), business_context: trim(businessContext, 2000),
        challenges: trim(challenges, 2000), tech_stack: trim(techStack, 2000),
        goals_timeline: trim(goalsTimeline, 2000),
      });
    } catch (err) { console.error('DB insert:', err); return send(res, 500, { ok: false, error: 'Failed to save intake. Please try again.' }); }

    console.log(`✅ Intake saved: ${id} — ${companyName}`);
    return send(res, 201, { ok: true, referenceId: id, message: "Request received. We'll be in touch shortly." });
  }

  if (method === 'GET' && pathname === '/api/admin/ultai-intakes') {
    const search = searchParams.get('search'), status = searchParams.get('status');
    let rows = listAll.all();
    if (status && status !== 'all') rows = rows.filter(r => r.status === status);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(r => [r.company_name, r.contact_name, r.email, r.id].some(f => f.toLowerCase().includes(q)));
    }
    return send(res, 200, { ok: true, intakes: rows });
  }

  if (method === 'GET' && pathname === '/api/admin/ultai-intakes/export') {
    const csv = [CSV_COLS.join(','), ...listAll.all().map(r => CSV_COLS.map(c => csvEsc(r[c])).join(','))].join('\n');
    res.writeHead(200, { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="ultai-intakes-${Date.now()}.csv"` });
    return res.end(isHead ? '' : csv);
  }

  const pm = method === 'PATCH' && PATCH_RE.exec(pathname);
  if (pm) {
    let body;
    try { body = await readJson(req); }
    catch (e) { return send(res, e?.tooLarge ? 413 : 400, { ok: false, error: e?.tooLarge ? 'Request body too large' : 'Invalid JSON in request body' }); }
    const { status } = body || {};
    if (!status || !STATUSES.has(status)) return send(res, 400, { ok: false, error: 'status must be one of: new, contacted, qualified, closed' });
    const result = updateStatus.run(status, pm[1]);
    return result.changes
      ? send(res, 200, { ok: true, id: pm[1], status })
      : send(res, 404, { ok: false, error: 'Intake not found' });
  }

  if (pathname.startsWith('/api/')) return send(res, 404, { ok: false, error: 'Not found' });

  if (method === 'GET') {
    const rel = pathname === '/' ? 'index.html' : pathname.slice(1);
    const abs = path.join(PUBLIC, path.normalize(rel));
    if (!abs.startsWith(PUBLIC + path.sep)) return send(res, 403, { ok: false, error: 'Forbidden' });
    return serveFile(res, abs, isHead);
  }

  send(res, 404, { ok: false, error: 'Not found' });
}

// ── Server ────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res._head = req.method === 'HEAD';   // used by send() to suppress body
  try { await handle(req, res); }
  catch (err) { console.error('Unhandled error:', err); if (!res.headersSent) send(res, 500, { ok: false, error: 'Internal server error' }); }
});

server.on('error', err => {
  console.error(err.code === 'EADDRINUSE' ? `Fatal: port ${PORT} is already in use` : `Fatal: server error: ${err.message}`);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`\n  UltAi Intake\n  Form  : http://localhost:${PORT}/form.html\n  Admin : http://localhost:${PORT}/admin.html\n  Health: http://localhost:${PORT}/api/health\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
let dying = false;
function shutdown(sig) {
  if (dying) return; dying = true;
  server.close(() => { try { db.close(); } catch (_) {} process.exit(0); });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
process.on('uncaughtException',  err    => { console.error('Uncaught:', err);    process.exit(1); });
process.on('unhandledRejection', reason => { console.error('Unhandled:', reason); });
