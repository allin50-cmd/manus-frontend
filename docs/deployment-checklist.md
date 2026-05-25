# Deployment Checklist

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

---

## Pre-Deployment

### 1. CI Quality Gate

CI runs on every push via `.github/workflows/ci.yml`:

- [ ] `npm run type-check` — client TypeScript, strict mode, zero errors
- [ ] `npm run type-check:server` — server TypeScript, strict mode, zero errors
- [ ] `npm test` — 38/38 tests pass (integration tests skip cleanly without DATABASE_URL)
- [ ] `npm run build` — production build succeeds, `dist/` produced

All four steps must pass before merge.

### 2. Database

- [ ] PostgreSQL instance provisioned (Neon, Supabase, or equivalent)
- [ ] `DATABASE_URL` confirmed reachable from Vercel datacenter
- [ ] ClerkOS schema migrated: `DATABASE_URL=<url> npm run db:migrate:clerkos`
- [ ] Brand-suite schema migrated: `DATABASE_URL=<url> npm run db:migrate`
- [ ] System tenant seeded: `DATABASE_URL=<url> npm run db:seed:clerkos`
- [ ] Combined one-shot: `DATABASE_URL=<url> npm run db:bootstrap`

### 3. Vercel Project Setup

- [ ] Project linked to `allin50-cmd/manus-frontend` repository
- [ ] Production branch set to `main`
- [ ] Build command: `npm run build` (auto-detected from `package.json`)
- [ ] Output directory: `dist`
- [ ] Node.js version: 20.x

### 4. Environment Variables (Vercel Dashboard)

Set for **Production**, **Preview**, and **Development** environments as applicable:

| Variable | Production | Preview | Dev | Notes |
|---|---|---|---|---|
| `DATABASE_URL` | Required | Required | Required | PostgreSQL connection string |
| `COMPANIES_HOUSE_API_KEY` | Required | Required | Optional | CH API key for compliance endpoints |
| `ADMIN_API_KEY` | Required | Required | Optional | Guards `/api/admin/*` and scheduler |
| `STRIPE_SECRET_KEY` | Required | Optional | Optional | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Required | Optional | Optional | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Required | Optional | Optional | Stripe subscription price ID |
| `APP_URL` | Required | Required | Optional | Public base URL, e.g. `https://app.vercel.app` |
| `DEPLOY_RECORD_TOKEN` | Optional | — | — | Token for deployment recording |
| `NODE_ENV` | `production` | — | — | Injected by Vercel automatically |
| `VERCEL` | `1` | `1` | — | Injected by Vercel automatically |

### 5. Cloudflare Configuration

- [ ] DNS: A/CNAME record pointing to Vercel deployment
- [ ] SSL/TLS mode: Full (strict) or Flexible (Vercel handles SSL)
- [ ] Cache Rules:
  - Bypass cache for `/api/*` paths (prevent stale API responses)
  - Cache `dist/assets/*` aggressively (hashed filenames, immutable)
- [ ] Security Headers via Transform Rules:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=()`
- [ ] Bot Fight Mode: ON (default)
- [ ] Stripe webhook exclusion (see Stripe Webhook section below)
- [ ] Scheduler route protection: `/api/internal/run-compliance-check` — restrict by IP allowlist or Cloudflare WAF rule if accessible from a fixed cron provider IP

---

## Stripe Webhook Invariants

**Critical:** Stripe delivers webhooks to `POST /api/stripe/webhook`.

The route is registered **before** `express.json()` middleware so that `express.raw()` can read the raw body. **Do not reorder this route.**

Cloudflare requirements for Stripe webhooks:
- Disable "Rocket Loader" for `/api/stripe/webhook`
- Ensure the path is NOT rate-limited or transformed
- Stripe IPs should bypass Bot Fight Mode: add Stripe's published IP ranges to the Cloudflare IP allowlist rule

Verify after deployment:
```
POST /api/stripe/webhook
stripe-signature: <test sig>
Content-Type: application/json

→ Expected: 400 (invalid signature) NOT 403 (Cloudflare block)
```

---

## Middleware Ordering (Must Not Change)

The following order is enforced in `server/app.ts` and is **invariant**:

1. Stripe webhook (raw body — before express.json)
2. tRPC (`/api/trpc`)
3. `cors()`
4. `express.json()`
5. `express.urlencoded()`
6. Request logging
7. Admin auth guard (`/api/admin/*`)
8. API route handlers
9. `express.static` (local runtime only)
10. `/api/*` JSON 404 guard
11. SPA fallback (local runtime only)
12. Express error handler

---

## Production Rollout Order

1. **Provision database** — run migrations, verify connectivity
2. **Set Vercel environment variables** — all Required vars above
3. **Push to `main`** — Vercel deploys automatically
4. **Verify health endpoint**: `GET https://<domain>/api/health` → `{ "status": "ok" }`
5. **Verify API 404 guard**: `GET https://<domain>/api/intake` → `404 JSON { "error": "Not found" }`
6. **Verify SPA routing**: `GET https://<domain>/vaultline` → `200 HTML` (index.html served by Vercel CDN)
7. **Test POST /api/intake** with valid body → `201`, check DB for audit event
8. **Configure Cloudflare** — DNS, cache rules, security headers
9. **Configure Stripe** — update webhook endpoint to production URL
10. **Provision cron** — point external scheduler at `GET /api/internal/run-compliance-check`

---

## Rollback Process

### Option A: Vercel Dashboard (instant)
1. Open Vercel → project → Deployments
2. Find last known-good deployment
3. Click **Promote to Production**

### Option B: Git revert
```bash
git revert HEAD
git push origin main
# Vercel redeploys automatically
```

### Database rollback
There is no automated down-migration. To roll back a schema change:
1. Identify the migration that introduced the breaking change
2. Write a reverse migration manually
3. Apply it: `DATABASE_URL=<url> tsx <reverse-migration.ts>`
4. Update `server/drizzle/migrations/meta/_journal.json` to remove the reverted entry

---

## Post-Deployment Smoke Test

Run manually after each production deployment:

```bash
BASE=https://<your-domain>
ADMIN=<ADMIN_API_KEY>

# Health
curl $BASE/api/health

# API 404 guard
curl $BASE/api/intake          # expect 404 JSON

# Unknown API route
curl $BASE/api/nonexistent     # expect 404 JSON (not HTML)

# POST intake
curl -X POST $BASE/api/intake \
  -H "Content-Type: application/json" \
  -d '{"clientName":"Smoke Test","matterType":"planning","urgency":"low","sourceRef":"SMOKE:001"}'
# expect 201 JSON with matterRef

# SPA route
curl -I $BASE/vaultline         # expect 200 with Content-Type: text/html
```

---

## Cold-Start Behavior

- On Vercel, the Express app module is loaded on first request after a cold start
- DB pool is initialized lazily — first DB operation per cold start opens the pool
- Stripe client is initialized at `createApp()` call time (module load), guarded by `STRIPE_SECRET_KEY` presence
- Expected cold-start latency: 500–2000ms (Node.js + DB pool handshake)
- DB pool is reused across warm invocations within the same function instance

---

## Known Serverless Limitations

| Constraint | Detail |
|---|---|
| No persistent state | Module-level variables may not persist between invocations (different instances) |
| Execution timeout | Default 10s (Hobby) / 60s (Pro); scheduler endpoint may time out with large company lists |
| No filesystem writes | `/tmp` is available but not shared across instances; do not write runtime data |
| No WebSockets | Vercel serverless does not support persistent WebSocket connections |
| DB pool limit | Each function instance creates its own pool (max 10 connections); use a pooler (pgBouncer/Supabase pooler) with `max: 1` for Vercel |
| `express.static` skipped | Vercel CDN serves static assets; Express never sees requests for hashed asset files |

---

## Migration / Bootstrap Procedure

### First-time environment bootstrap

```bash
# 1. Install dependencies
npm ci

# 2. Set database URL
export DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 3. Run ClerkOS schema migrations + brand-suite migrations + seed
npm run db:bootstrap
# This runs: db:migrate:clerkos → db:migrate → db:seed:clerkos

# 4. Verify (optional)
npm run db:generate:clerkos   # should report: No schema changes, nothing to migrate
```

### Re-running after schema changes

```bash
npm run db:generate:clerkos    # generates new migration SQL
npm run db:migrate:clerkos     # applies pending migrations
```

---

## Cloudflare Integration Notes

### Cache Rules (Page Rules or Cache Rules UI)

```
/api/*              → Cache: Bypass
/dist/assets/*      → Cache: Cache Everything, Edge TTL: 1 year (hashed filenames)
/*.html             → Cache: Bypass
```

### API Bypass

Ensure API routes never return cached responses. Use a Cache Rule:
- URL matches `/api/*`
- Action: Bypass Cache

### Security Headers (Transform Rule)

Apply to all responses:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Stripe Webhook Exclusion

Stripe webhooks must reach the origin without Cloudflare modification. Create a WAF Rule:
- IP Source Address: in {Stripe IP ranges}
- Action: Skip WAF (or set to Allow)
- Also skip rate limiting for this path

Stripe's current IP ranges: https://stripe.com/docs/ips

### Scheduler Route Protection

`GET /api/internal/run-compliance-check` triggers live Companies House API calls and must be protected:

Option A — Cloudflare WAF: Block all traffic to this path except from cron provider IP
Option B — Custom header: Require `X-ADMIN-KEY` (already enforced in Express middleware)
Option C — Vercel Cron: Use Vercel's built-in cron with `vercel.json` cron config (future)
