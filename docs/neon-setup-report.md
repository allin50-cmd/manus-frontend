# Neon Setup Report

**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r  
**Date:** 2026-05-26  
**Scope:** Verify existing Neon implementation, document setup checklist, record command outcomes without live credentials.

---

## Files Inspected

| File | Purpose | Status |
|---|---|---|
| `server/db/index.ts` | Brand-suite DB client — Neon vs. standard PG detection | ✅ CONFIRMED correct |
| `drizzle.config.ts` | Brand-suite migration config — DIRECT_URL fallback | ✅ CONFIRMED correct |
| `drizzle.clerkos.config.ts` | ClerkOS migration config — DIRECT_URL fallback | ✅ CONFIRMED correct |
| `server/db/migrate.ts` | Brand-suite migration runner | ✅ Uses DIRECT_URL ?? DATABASE_URL |
| `server/drizzle/migrate.ts` | ClerkOS migration runner | ✅ Uses DIRECT_URL ?? DATABASE_URL |
| `server/drizzle/seed.ts` | System tenant seed (idempotent) | ✅ ON CONFLICT DO NOTHING |
| `.env.example` | Connection string documentation | ✅ Both URLs documented with Neon format |

---

## Implementation Verification

### 1. Neon URL Detection — `server/db/index.ts`

```typescript
function isNeonUrl(url: string): boolean {
  return url.includes('neon.tech');
}
```

**Finding:** Detection is correct. Neon pooler hostnames follow the pattern `ep-xxx-pooler.<region>.aws.neon.tech`; direct hostnames follow `ep-xxx.<region>.aws.neon.tech`. Both contain `neon.tech`.

**Neon path (when URL contains `neon.tech`):**
```typescript
_pool = new Pool({ connectionString: url });
_db = drizzleNeon(_pool, { schema });
```
Uses `@neondatabase/serverless` Pool — HTTP + WebSocket, correct for Vercel/serverless.

**WebSocket polyfill:**
```typescript
if (typeof WebSocket === 'undefined') {
  neonConfig.webSocketConstructor = ws;
}
```
Correct: Node.js environments (including local dev, Azure App Service) do not have native WebSocket. The `ws` package polyfill is applied before any connection attempt.

**Non-Neon path (local dev, any standard PostgreSQL):**
```typescript
const max = process.env.VERCEL ? 1 : 10;
_pgClient = postgres(url, { max, idle_timeout: 20, connect_timeout: 10 });
_db = drizzlePg(_pgClient, { schema });
```
Connection cap of 1 on Vercel (lambda concurrency), 10 locally. Correct.

**Lazy init:** `let _db: Db | undefined` — import succeeds even if `DATABASE_URL` is absent. Runtime error thrown only on first DB access, not at module load. Safe for Vercel cold starts.

**Package version:** `@neondatabase/serverless@1.1.0` — installed and loadable.

---

### 2. Migration Config — `drizzle.config.ts`

```typescript
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('Set DIRECT_URL (preferred) or DATABASE_URL for Drizzle Kit');
}
```

**Finding:** Correct. Neon's connection pooler (PgBouncer) drops transaction state required by DDL migrations. `DIRECT_URL` bypasses the pooler. The fallback to `DATABASE_URL` is safe for local dev where no pooler exists.

Applies to both configs:
- `drizzle.config.ts` → brand-suite tables (`./drizzle/` migrations folder)
- `drizzle.clerkos.config.ts` → ClerkOS tables (`./server/drizzle/migrations/` folder)

Both migration runners (`server/db/migrate.ts`, `server/drizzle/migrate.ts`) use the same `DIRECT_URL ?? DATABASE_URL` fallback pattern.

---

### 3. `.env.example` Documentation

```bash
# DATABASE_URL  — pooler URL (used by the running app)
# DIRECT_URL    — direct non-pooler URL (used by migrations only)
#
# Neon (recommended):
#   DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/dbname?sslmode=require"
#   DIRECT_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require"
```

**Finding:** Both URLs documented with correct Neon format. The distinction between pooler (DATABASE_URL) and direct (DIRECT_URL) is documented inline. No real credentials present.

---

## Migration Files

### Brand-suite (`./drizzle/`)

| File | Contents |
|---|---|
| `0000_narrow_black_tom.sql` | Initial schema: intake_forms, compliance_bundles, monitored_companies |
| `0001_unique_wolf_cub.sql` | ALTER monitored_companies.company_number → varchar(255) |
| `0002_source_ref_unique.sql` | UNIQUE constraint on intake_forms.source_ref |

Migration table: `brand_suite_migrations` (set in migrate.ts to avoid collision with Drizzle's default `__drizzle_migrations`).

### ClerkOS (`./server/drizzle/migrations/`)

| File | Contents |
|---|---|
| `0000_lowly_gressill.sql` | Initial schema: tenants, clerk_cases, clerk_audit_events |
| `0001_cold_agent_zero.sql` | Scheduler leases, resilience state, incidents |
| `0002_global_coordination.sql` | Distributed coordination tables |
| `0003_operations_control_plane.sql` | Operational overrides and annotations |

---

## Commands Run

### `npm run db:bootstrap` (without DATABASE_URL)

```
> npm run db:migrate:clerkos && npm run db:migrate && npm run db:seed:clerkos

> tsx server/drizzle/migrate.ts
Set DIRECT_URL (preferred) or DATABASE_URL before running migrations
```

**Result:** BLOCKED — expected. Both migrate scripts exit(1) when no URL is set. No tables were created. No state was changed.

---

### `npm run build`

```
✓ 1947 modules transformed.
dist/index.html                   0.41 kB │ gzip:   0.28 kB
dist/assets/index-CjprlJDA.css   44.85 kB │ gzip:   8.19 kB
dist/assets/index-DhvIuhbO.js   534.14 kB │ gzip: 149.28 kB
✓ built in 4.76s
```

**Result:** PASS. Build succeeds without DATABASE_URL. DB client uses lazy init — import does not connect.

---

### `npm test`

```
Test Files  14 passed (14)
      Tests  190 passed (190)
   Duration  3.64s
```

**Result:** PASS. All 190 tests pass. DB-dependent integration tests skip cleanly via `skipIfNoDb()`. The 10 workflow-proof tests in `server/workflow-proof.test.ts` use mocked DB and pass without credentials.

---

### `npm run type-check` + `npm run type-check:server`

Both exit 0 with no errors.

**Result:** PASS.

---

## Neon Project Setup Checklist

Steps to wire a real Neon project. Follow in order. No step requires code changes.

### Step 1 — Create Neon project (if not done)

1. Log in at [console.neon.tech](https://console.neon.tech)
2. Create a new project (or open an existing one)
3. Select the database (default: `neondb`)
4. Go to **Connection Details** → set role to the project owner role

### Step 2 — Collect connection strings

From the Neon console **Connection Details** panel, copy two strings:

| Variable | Source | Format |
|---|---|---|
| `DATABASE_URL` | Pooled connection (select "Pooled connection" toggle) | `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require` |
| `DIRECT_URL` | Direct connection (deselect "Pooled connection" toggle) | `postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require` |

The difference: pooler URL contains `-pooler` in the hostname. Direct URL does not.

### Step 3 — Set local environment variables

Create or update `.env` in the project root (this file is gitignored):

```bash
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
```

Do not commit this file. Do not share these strings.

Also set the required operational env vars (without these, runtime endpoints return 503):

```bash
ADMIN_API_KEY="any-non-empty-string-for-local-dev"
```

### Step 4 — Run bootstrap

```bash
npm run db:bootstrap
```

This runs three commands in sequence:
1. `npm run db:migrate:clerkos` — applies ClerkOS migrations (4 files) → creates `tenants`, `clerk_cases`, `clerk_audit_events`, scheduler, resilience, operations tables
2. `npm run db:migrate` — applies brand-suite migrations (3 files) → creates `intake_forms`, `compliance_bundles`, `monitored_companies`; tracking table: `brand_suite_migrations`
3. `npm run db:seed:clerkos` — inserts system tenant `00000000-0000-0000-0000-000000000001` with `ON CONFLICT DO NOTHING` (idempotent; safe to re-run)

**Expected output on success:**
```
Running ClerkOS schema migration...
ClerkOS migration completed
Running brand-suite migration from: .../drizzle
Brand-suite migration completed
Seeding ClerkOS system tenant...
System tenant ready: 00000000-0000-0000-0000-000000000001
```

### Step 5 — Build

```bash
npm run build
```

Expected: exit 0, `✓ built in ~5s`. No DATABASE_URL required at build time.

### Step 6 — Test

```bash
npm test
```

Expected: 190 tests pass. Integration tests in `server/integration.test.ts` will now RUN against the live Neon database (they skip only when DATABASE_URL is absent). These tests insert and delete rows; they are safe to run against a dev database.

### Step 7 — Manual end-to-end verification

```bash
# Start the dev server (set PORT if needed)
PORT=3000 npm run dev

# In a second terminal, POST the Bromley simulation payload:
curl -s -X POST http://localhost:3000/api/pie/opportunity \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "24/AP/1234",
    "applicantName": "Bromley Development Ltd",
    "applicantEmail": "planning@bromley-dev.co.uk",
    "description": "Residential development, 4 dwellings, Bromley Borough",
    "siteAddress": "42 High Street, Bromley BR1 1AB",
    "district": "Bromley",
    "urgency": "high",
    "estimatedValue": "£2,400,000",
    "submittedAt": "2026-05-26T09:00:00+01:00"
  }' | jq .
```

**Expected response:**
```json
{
  "ok": true,
  "replayed": false,
  "matterRef": "MAT-<timestamp>",
  "sourceRef": "PIE:24/AP/1234",
  "urgency": "high"
}
```

**Verify audit trail:**
```sql
-- Run in Neon SQL editor or psql
SELECT entity_type, action, entity_uuid, created_at
FROM clerk_audit_events
ORDER BY created_at DESC
LIMIT 5;
```

Expected rows (in order):
1. `intake` / `captured` / intake_forms UUID
2. `intake` / `fineguard_activation_evaluated` / intake_forms UUID
3. `monitoring_activation` / `fineguard_activation_triggered` / monitored_companies UUID

**Verify intake row:**
```sql
SELECT matter_ref, source_ref, urgency, claim_value FROM intake_forms
WHERE source_ref = 'PIE:24/AP/1234';
```

**Verify FineGuard activation:**
```sql
SELECT company_name, company_number, activated_at FROM monitored_companies
WHERE company_number = 'PIE:24/AP/1234';
```

---

## Blockers

| # | Blocker | Required for | Severity |
|---|---|---|---|
| B1 | `DATABASE_URL` not set in this environment | `db:bootstrap`, integration tests | P1 — must resolve to proceed |
| B2 | `DIRECT_URL` not set | Migrations (bootstrap step 1 and 2) | P1 — must resolve to proceed |
| B3 | System tenant not seeded yet | VaultLine audit writes | P1 — resolved by Step 4 above |
| B4 | `COMPANIES_HOUSE_API_KEY` absent | `POST /api/compliance-bundle` (returns 503) | P2 — auto-activation path unblocked |
| B5 | `ADMIN_API_KEY` absent | Scheduler endpoint (returns 503) | P2 — not required for basic PIE flow |

Blockers B3–B5 resolve after Step 4 (bootstrap) and setting the env vars.

---

## Rollback Instructions

All steps are reversible:

| Step | Rollback |
|---|---|
| Step 3 (env vars) | Remove `DATABASE_URL` and `DIRECT_URL` from `.env` — no data deleted |
| Step 4a (ClerkOS migrations) | `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` on the Neon database — destroys all data |
| Step 4b (brand-suite migrations) | Same as above, or individually: `DROP TABLE intake_forms, compliance_bundles, monitored_companies, brand_suite_migrations;` |
| Step 4c (seed) | `DELETE FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001';` — cascades to clerk_audit_events |
| Step 7 (Bromley simulation) | `DELETE FROM intake_forms WHERE source_ref = 'PIE:24/AP/1234';` then `DELETE FROM monitored_companies WHERE company_number = 'PIE:24/AP/1234';` and delete corresponding clerk_audit_events rows |

**Safest rollback for a full reset:** Delete the Neon database branch (Neon console → Branches → Delete) and create a fresh one. No infrastructure changes needed; the application code is unchanged.

---

## Summary

| Check | Result |
|---|---|
| `server/db/index.ts` detects Neon URL correctly | ✅ PASS — `url.includes('neon.tech')` |
| Uses `@neondatabase/serverless` Pool for Neon | ✅ PASS |
| WebSocket polyfill applied for Node.js | ✅ PASS |
| Lazy init — no connection at import | ✅ PASS |
| `drizzle.config.ts` uses `DIRECT_URL ?? DATABASE_URL` | ✅ PASS |
| `drizzle.clerkos.config.ts` uses `DIRECT_URL ?? DATABASE_URL` | ✅ PASS |
| Migration runners use `DIRECT_URL ?? DATABASE_URL` | ✅ PASS (both runners) |
| `.env.example` documents both URLs with Neon format | ✅ PASS |
| `npm run build` passes without DATABASE_URL | ✅ PASS |
| `npm test` — 190/190 tests pass without DATABASE_URL | ✅ PASS |
| TypeScript strict mode — client + server | ✅ PASS |
| `npm run db:bootstrap` without credentials | ⛔ BLOCKED — expected; exits with clear error message |
| Live Neon connection test | ⛔ NOT RUN — credentials not available in this environment |

**No code changes required.** The implementation is complete. All blockers are environmental (missing `DATABASE_URL` and `DIRECT_URL`). Follow the setup checklist above to wire a real Neon project.
