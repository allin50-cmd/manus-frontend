# Deployment Sequence

**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-27  
**Constraint:** Minimal sequence only. Evidence-based. No invented values.

---

## Prerequisites

- Node.js ≥ 18 on MacBook
- `git pull` on `claude/ultracore-consolidation-audit-KmP0r` (or merge to main)
- Neon account (neondb_owner credentials already provisioned)
- Vercel account with project creation access

---

## Step 1 — Create Neon Project

**Status:** DONE — Neon project exists.

```
Host (pooler):  ep-rough-river-abg1vkm1-pooler.eu-west-2.aws.neon.tech
Host (direct):  ep-rough-river-abg1vkm1.eu-west-2.aws.neon.tech
Database:       neondb
User:           neondb_owner
Region:         eu-west-2
```

Verify the project is active: log in to Neon console and confirm the project is not suspended.

---

## Step 2 — Configure DATABASE_URL (local)

Create `.env` in the project root on your MacBook. **Do not commit this file.**

```
DATABASE_URL="postgresql://neondb_owner:<password>@ep-rough-river-abg1vkm1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://neondb_owner:<password>@ep-rough-river-abg1vkm1.eu-west-2.aws.neon.tech/neondb?sslmode=require"
ADMIN_API_KEY="<generate: openssl rand -hex 32>"
```

`DIRECT_URL` is required for migrations (bypasses Neon's connection pooler). `DATABASE_URL` uses the pooler and is used by the running app.

---

## Step 3 — Run db:bootstrap

Must run from MacBook. TCP port 5432 is blocked in the remote Claude container.

```bash
npm ci
npm run db:bootstrap
```

`db:bootstrap` runs (`package.json:29`):
1. `tsx server/drizzle/migrate.ts` — applies 4 ClerkOS migrations under `server/drizzle/migrations/`
2. `tsx server/db/migrate.ts` — applies 4 brand-suite migrations under `drizzle/` (includes `0003_fineguard_alerts.sql`)
3. `tsx server/drizzle/seed.ts` — inserts system tenant `00000000-0000-0000-0000-000000000001`

Expected output:
```
Running ClerkOS schema migration...
ClerkOS migration completed
Running brand-suite migration from: .../drizzle
Brand-suite migration completed
Seeding ClerkOS system tenant...
System tenant seeded.
```

If any step fails, check `DIRECT_URL` is set and that the Neon project is not suspended.

---

## Step 4 — Verify Schema

In the Neon SQL editor (console.neon.tech), run:

```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expected tables (minimum):

| Table | Schema |
|---|---|
| `brand_suite_migrations` | brand-suite migration tracking |
| `clerk_audit_events` | VaultLine audit log |
| `fineguard_alerts` | FineGuard persisted compliance alerts |
| `global_resilience_state` | Circuit breaker state |
| `intake_forms` | PIE/UltAi intake records |
| `monitored_companies` | FineGuard watchlist |
| `operational_annotations` | Operations Control Plane |
| `operational_overrides` | Operations Control Plane |
| `scheduler_leases` | Distributed scheduler coordination |
| `tenants` | Multi-tenant registry |
| `deployment_status` | Deployment tracking |

Confirm system tenant exists:
```sql
SELECT id, slug, name FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001';
```

Expected: 1 row with `slug = 'system'`.

---

## Step 5 — Create Vercel Project

1. Log in to vercel.com
2. Click **Add New → Project**
3. Import from GitHub: `allin50-cmd/manus-frontend`
4. Framework preset: **Other** (do not select Next.js)
5. Build command: `npm run build`
6. Output directory: `dist`
7. Do **not** deploy yet — configure environment variables first (Step 6)

`vercel.json` is already present and configures:
- `api/index.ts` → serverless function for all `/api/*` routes
- `dist/` → static frontend
- SPA fallback: all non-API, non-file routes → `index.html`

---

## Step 6 — Configure Environment Variables in Vercel

In Vercel project → **Settings → Environment Variables**, add:

| Variable | Value | Environment |
|---|---|---|
| `DATABASE_URL` | `postgresql://neondb_owner:<password>@ep-rough-river-abg1vkm1-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require` | Production, Preview |
| `ADMIN_API_KEY` | `<same value used in local .env>` | Production, Preview |
| `CRON_SECRET` | `<generate: openssl rand -hex 32>` | Production |
| `NODE_ENV` | `production` | Production |
| `APP_URL` | `https://<your-vercel-domain>.vercel.app` | Production |

**Do not add** `DIRECT_URL` to Vercel — migrations do not run at deploy time.

`CRON_SECRET` is required for the Vercel Cron job to authenticate against `GET /api/internal/run-compliance-check`. Vercel automatically sends `Authorization: Bearer <CRON_SECRET>` on scheduled invocations. Without it, cron calls return 401 and the hourly compliance check never runs.

Optional (required to enable features):

| Variable | Required for |
|---|---|
| `COMPANIES_HOUSE_API_KEY` | FineGuard compliance checks |
| `STRIPE_SECRET_KEY` | Billing checkout |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook processing |
| `STRIPE_PRICE_ID` | Checkout session creation |
| `AZURE_B2C_TENANT_NAME` | Production authentication |
| `AZURE_B2C_TENANT_ID` | Production authentication |
| `AZURE_B2C_CLIENT_ID` | Production authentication |

---

## Step 7 — Deploy

Trigger the first deploy from the Vercel dashboard, or push to the configured branch.

```bash
git push origin main   # or merge claude/ultracore-consolidation-audit-KmP0r → main
```

Vercel will:
1. Run `npm run build` (= `tsc && vite build`)
2. Package `api/index.ts` as a serverless function
3. Serve `dist/` as static assets

Monitor the build log in the Vercel dashboard. Build time: approximately 60–90 seconds.

---

## Step 8 — Verify Health Endpoints

After deploy, replace `<domain>` with your Vercel URL.

```bash
# Basic health check (does not require auth)
curl https://<domain>/api/health

# Expected:
# {"status":"healthy","timestamp":"...","database":"connected"}
# HTTP 200

# If DB not connected:
# {"status":"unhealthy","timestamp":"...","database":"disconnected"}
# HTTP 503
```

```bash
# Admin resilience check (requires ADMIN_API_KEY)
curl -H "x-admin-key: <ADMIN_API_KEY>" https://<domain>/api/internal/resilience

# Expected: HTTP 200, JSON with circuits:{}, stats:{}, recentTraces:[]
```

If `/api/health` returns 503: `DATABASE_URL` is not set correctly in Vercel. Check the environment variable is saved to the correct environment (Production, not Preview-only).

---

## Step 9 — Execute One End-to-End Workflow

Simulate a Bromley planning opportunity entering the system.

```bash
curl -X POST https://<domain>/api/pie/opportunity \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "24/AP/1234",
    "applicantName": "Test Developer Ltd",
    "applicantEmail": "dev@example.com",
    "urgency": "high",
    "estimatedValue": "£2,400,000",
    "district": "Bromley",
    "siteAddress": "1 High Street, Bromley, BR1 1AA",
    "description": "Residential development — 24 units"
  }'
```

Expected response (HTTP 201):
```json
{
  "ok": true,
  "matterRef": "MAT-<timestamp>",
  "sourceRef": "PIE:24/AP/1234",
  "replayed": false,
  "fineGuard": {
    "activated": true,
    "reason": "high_urgency"
  }
}
```

Verify in Neon SQL editor:

```sql
-- Confirm intake row
SELECT matter_ref, source_ref, client_name, urgency, claim_value
FROM intake_forms
WHERE source_ref = 'PIE:24/AP/1234';

-- Confirm 3 audit events
SELECT action, entity_type, correlation_id, created_at
FROM clerk_audit_events
ORDER BY created_at DESC
LIMIT 5;

-- Expected actions: captured, fineguard_activation_evaluated, fineguard_activation_triggered

-- Confirm FineGuard monitoring row
SELECT company_name, company_number, status
FROM monitored_companies
WHERE company_number LIKE 'PIE:%'
ORDER BY created_at DESC
LIMIT 1;
```

All three queries returning rows confirms the full PIE → UltAi → FineGuard → VaultLine chain is live.

---

## Current Deployment State

| Step | Status |
|---|---|
| 1. Create Neon project | DONE |
| 2. Configure DATABASE_URL locally | DONE |
| 3. Run db:bootstrap | **PENDING** — run from MacBook |
| 4. Verify schema | **PENDING** — after Step 3 |
| 5. Create Vercel project | **PENDING** |
| 6. Configure environment variables | **PENDING** — now includes `CRON_SECRET` |
| 7. Deploy | **PENDING** |
| 8. Verify health endpoints | **PENDING** |
| 9. Execute end-to-end workflow | **PENDING** |
