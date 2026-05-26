# Minimum Changes Required

**Authority:** apps/registry.json  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r (HEAD: 4de0414)  
**Date:** 2026-05-26  
**Scope:** Smallest safe changes to move from current state to a provable end-to-end workflow.  
**Constraint:** Do not create new applications, frameworks, microservices, or large abstractions.

---

## Prerequisites (environmental — not code changes)

These must be done per environment before any code change matters.

### ENV-1 — Set DATABASE_URL

**Why:** Without it, all DB writes are silent no-ops (`server/trpc/db.ts:28`).  
**Action:** Configure `DATABASE_URL` as a PostgreSQL connection string in the deployment environment (Vercel env vars, Azure App Service settings, `.env.local` for local dev).  
**Rollback:** Remove the env var.

### ENV-2 — Run migrations

**Why:** Tables must exist before inserts.  
**Command:**
```bash
npm run db:migrate          # brand-suite tables
npm run db:migrate:clerkos  # ClerkOS tables including clerk_audit_events
```
**Rollback:** Drop migrated tables manually or restore from backup.

### ENV-3 — Seed system tenant

**Why:** `clerk_audit_events.tenant_id` FK references `tenants.id`. Without the system tenant row, all brand-suite audit writes fail with constraint error.  
**Command:**
```bash
npm run db:seed:clerkos
```
This inserts `id='00000000-0000-0000-0000-000000000001'` into `tenants` with `ON CONFLICT DO NOTHING`.  
**Rollback:** The seed is idempotent. To remove: `DELETE FROM tenants WHERE id = '00000000-0000-0000-0000-000000000001'` (cascades to `clerk_audit_events` rows).

### ENV-4 — Set ADMIN_API_KEY

**Why:** All `/api/internal/*` routes (scheduler, operations control plane, resilience) require `X-ADMIN-KEY: <value>`.  
**Action:** Set `ADMIN_API_KEY` in environment. Choose any non-empty string.  
**Rollback:** Remove the env var (routes become inaccessible, not broken).

---

## Code Change 1 — UNIQUE constraint on intake_forms.source_ref

**Priority:** P3 (nice-to-have for safety; not required for proof)  
**Gap addressed:** Gap 8 in integration-gaps.md  
**File to change:** New brand-suite migration  
**Size:** 1 SQL statement in 1 new file

**Change:**
```sql
-- migrations/0002_unique_source_ref.sql
ALTER TABLE intake_forms ADD CONSTRAINT intake_forms_source_ref_unique UNIQUE (source_ref);
```

**Why smallest:** The idempotency check in `server/app.ts:562` already does a SELECT before INSERT. Adding the constraint enforces this at the DB level under concurrent delivery without changing any application code.

**Rollback:**
```sql
ALTER TABLE intake_forms DROP CONSTRAINT intake_forms_source_ref_unique;
```

**Risk:** LOW. If duplicate `source_ref` rows already exist in the database, the migration will fail. Pre-check:
```sql
SELECT source_ref, COUNT(*) FROM intake_forms WHERE source_ref IS NOT NULL GROUP BY source_ref HAVING COUNT(*) > 1;
```

---

## Code Change 2 — FineGuard cron trigger (when external scheduler is available)

**Priority:** P2 (required for automated monitoring)  
**Gap addressed:** Gap 5  
**File to change:** None in this repo — external cron configuration only

**Required:** An external cron (Vercel Cron, GitHub Actions schedule, Azure Logic App, or system cron) must call:
```
GET <base-url>/api/internal/run-compliance-check
X-ADMIN-KEY: <ADMIN_API_KEY value>
```
on a schedule (suggested: every 24 hours).

**If using Vercel Cron** (`vercel.json` addition — 1 JSON key):
```json
{
  "crons": [
    {
      "path": "/api/internal/run-compliance-check",
      "schedule": "0 6 * * *"
    }
  ]
}
```
Note: Vercel Cron requests do not carry the `X-ADMIN-KEY` header. The scheduler endpoint would need a secondary auth mechanism (e.g. `CRON_SECRET` check) or the admin key check relaxed for `GET` requests from `127.0.0.1`. This is a small targeted change if chosen.

**Rollback:** Remove the cron entry from `vercel.json`.

---

## Code Change 3 — COMPANIES_HOUSE_API_KEY for on-demand compliance checks

**Priority:** P1 for the EXECUTED lifecycle state via FineGuard  
**Gap addressed:** Gap 4  
**File to change:** None — environment only

**Action:** Set `COMPANIES_HOUSE_API_KEY` in the deployment environment. Obtain a key from [developer.company-information.service.gov.uk](https://developer.company-information.service.gov.uk).

**No code change required.** `server/services/companiesHouse.ts` already reads this key; `server/app.ts:711` already returns 503 when absent.

**Rollback:** Remove the env var.

---

## What Is NOT Required to Prove the Workflow

The following are out of scope per the objective (do not create, do not implement):

| Item | Why out of scope |
|---|---|
| `packages/core-workflow` (10-state lifecycle) | Registry marks it P2; objective says "do not build core-workflow yet" |
| Email delivery provider | Alerts are audited; email is P2 |
| Azure provisioning verification | Proof requires PostgreSQL only; Azure SDK paths are not on the critical chain |
| Accuracy PIE source code | External system; receiving endpoint already built |
| New tRPC procedures | Existing endpoints cover PIE→UltAi→FineGuard→VaultLine |
| New UI pages | No UI work required for workflow proof |

---

## Minimum Action Plan to Achieve End-to-End Proof

In order, smallest first:

```
1. ENV-1: Set DATABASE_URL           [environmental — 5 minutes]
2. ENV-2: Run migrations             [command — 2 minutes]
3. ENV-3: Seed system tenant         [command — 1 minute]
4. ENV-4: Set ADMIN_API_KEY          [environmental — 2 minutes]
5. ENV-5: Set COMPANIES_HOUSE_API_KEY [environmental — depends on key provisioning]

6. CODE-1: UNIQUE on source_ref     [1 migration file — 30 minutes including test]

7. SIMULATE: POST /api/pie/opportunity with Bromley payload
   → Verify intake_forms row created
   → Verify clerk_audit_events has 3 rows (captured, evaluated, triggered)
   → Verify monitored_companies has 1 row
```

Steps 1-4 are prerequisite for any database operation.  
Step 5 is required only for the on-demand compliance check (EXECUTED state).  
Step 6 is optional but safe.  
Step 7 is the proof itself.

---

## Rollback Notes

All environmental changes (ENV-1 through ENV-5) are non-destructive: removing the env var returns the system to its previous state. No data is lost by removing a key.

Code Change 1 (UNIQUE constraint) is reversible with a single `ALTER TABLE DROP CONSTRAINT`. If the migration fails due to pre-existing duplicates, no change is applied.

No existing code is modified by any change in this document. All changes are additive (new migration, new env var, new cron config).
