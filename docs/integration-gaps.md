# Integration Gaps

**Authority:** apps/registry.json  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r (HEAD: 4de0414)  
**Date:** 2026-05-26  
**Evidence source:** Direct source inspection. Every gap entry names the specific file and line where evidence was found or absent.

---

## Gap 1 — Accuracy PIE system is absent from this repository

**Severity:** P1 BLOCKER for end-to-end proof  
**Registry status:** `accuracy-pie: { status: "unverified", sourceRepo: "unknown — requires verification" }`

**Evidence found:**
- `POST /api/pie/opportunity` endpoint: `server/app.ts:538` — fully implemented
- `PieOpportunitySchema` (Zod): `server/lib/pie-schema.ts` — defines the inbound contract
- `buildSourceRef()`: `server/lib/pie-schema.ts:40` — canonical `PIE:<externalRef>` format

**Evidence absent:**
- No PIE source code in this repository
- No PIE deployment URL confirmed
- No webhook configuration pointing PIE → `POST /api/pie/opportunity`
- Registry entry has `sourceRepo: "unknown — requires verification"`

**Effect:** The receiving side is fully built. The sender does not exist in code we can inspect or deploy.

**Not a code bug.** This is an architectural gap: PIE is an external or separate system. Until PIE is located and configured to POST to this endpoint, Step 1 of the workflow must be simulated manually or by test fixture.

---

## Gap 2 — 10-state lifecycle not implemented

**Severity:** P1 structural gap  
**Registry:** `targetLifecycle.package = "packages/core-workflow"` — does not exist in the repo

**Evidence found:**
- `server/engine/clerkOS.engine.ts:9` — `CaseStatus = 'open' | 'in_progress' | 'closed' | 'on_hold'`
- `server/engine/clerkOS.engine.ts:17` — 4-state transition map (open/in_progress/on_hold/closed)
- `server/drizzle/schema.ts:93` — `cases.status` stored as `varchar(32)`, comment says `open | in_progress | closed | on_hold`
- `apps/registry.json:173-187` — target states: CAPTURED, ANALYSED, ESTIMATED, VERIFIED, CONFIRMED, HITL_REQUIRED, APPROVED, EXECUTED, RECORDED, CLOSED

**Evidence absent:**
- No `packages/core-workflow` directory
- No CAPTURED, ANALYSED, ESTIMATED, VERIFIED, CONFIRMED, HITL_REQUIRED, APPROVED, EXECUTED, RECORDED state values in any schema or engine
- No mapping between 4-state ClerkOS states and 10 target states

**Approximate mapping (inferred, not coded):**

| Target state | ClerkOS approximation |
|---|---|
| CAPTURED | `open` (new case created) |
| ANALYSED | `in_progress` |
| ESTIMATED | `in_progress` |
| VERIFIED | `in_progress` |
| CONFIRMED | `in_progress` |
| HITL_REQUIRED | `on_hold` |
| APPROVED | `in_progress` (after hold resolved) |
| EXECUTED | `in_progress` |
| RECORDED | audit event written (no case status change) |
| CLOSED | `closed` |

**Effect:** Workflow states cannot be explicitly transitioned through the target lifecycle. State tracking is coarse. HITL gating is not enforced by code.

---

## Gap 3 — DATABASE_URL required; not present in CI

**Severity:** P1 runtime blocker  
**Files:** `server/trpc/db.ts:28`, `server/db/index.ts`

**Evidence found:**
- `server/trpc/db.ts:28`: `const url = process.env.DATABASE_URL ?? ENV.databaseUrl; if (!url) return null;`
- `server/trpc/db.ts:244`: `const db = await getDb(); if (!db) return;` — audit write is silently skipped
- `server/app.ts:1021`: scheduler endpoint returns 503 if `!process.env.DATABASE_URL`
- CI workflow (`.github/workflows/ci.yml`): no DATABASE_URL set → integration tests skip via `skipIfNoDb()`

**Effect:** Without DATABASE_URL:
- `writeAuditEvent()` is a silent no-op
- All intake/bundle/compliance inserts throw (using the brand-suite `db` which requires the env var)
- VaultLine records nothing
- Scheduler returns 503

**Not a code bug.** The code handles absence gracefully. The gap is environmental.

---

## Gap 4 — COMPANIES_HOUSE_API_KEY required for FineGuard compliance checks

**Severity:** P1 for on-demand compliance checks; P2 for auto-activation (auto-activation does NOT require CH API)  
**File:** `server/app.ts:711`

**Evidence found:**
```typescript
if (!companiesHouseService) {
  return res.status(503).json({ ok: false, error: 'Companies House integration not configured (COMPANIES_HOUSE_API_KEY missing)' });
}
```
- `server/services/companiesHouse.ts` — CH API client; returns null if key absent
- `server/lib/fineguard-rules.ts` — pure rules; no CH API dependency
- `server/lib/pie-fineguard.ts` — auto-activation; uses intake fields only, not CH API

**Effect:** `POST /api/compliance-bundle` returns 503 without the key. Auto-activation via PIE path works without it.

---

## Gap 5 — FineGuard scheduler has no external cron trigger

**Severity:** P2  
**File:** `server/app.ts:1009`

**Evidence found:**
- `GET /api/internal/run-compliance-check` — endpoint exists, fully implemented
- Scheduler acquires distributed lease, iterates monitored companies, calls CH API, writes audit events
- Endpoint is gated by `X-ADMIN-KEY` header

**Evidence absent:**
- No cron job configured in any deployment file
- No Azure Logic App, Vercel Cron, or GitHub Actions schedule pointing to this endpoint

**Effect:** Scheduled compliance monitoring never runs automatically. The endpoint can be called manually.

---

## Gap 6 — No email delivery mechanism for FineGuard alerts

**Severity:** P2  
**Registry:** `fineguard: { remainingBlockers: ["No email delivery provider configured"] }`

**Evidence found:**
- `server/app.ts:1140-1155`: scheduler logs `compliance.alert.required` and writes audit event when `alertRequired=true`
- No email sending code anywhere in the repository
- No SMTP, SendGrid, Resend, or equivalent client imported

**Effect:** Alerts are detected and logged + audited. They are not delivered to users.

---

## Gap 7 — System tenant row must be seeded per environment

**Severity:** P1 for audit writes  
**File:** `server/app.ts:41`

**Evidence found:**
```typescript
const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';
```
- `server/drizzle/schema.ts:36` — `tenants.id` is UUID foreign key; `clerk_audit_events.tenantId` references it with `onDelete: 'cascade'`
- `server/drizzle/seed.ts` — seeds the system tenant row (requires `npm run db:seed:clerkos`)

**Effect:** If the system tenant row does not exist in the database, all `writeAuditEvent()` calls for brand-suite operations will fail with a foreign key constraint violation. The audit write failure is caught and logged (`vaultline.write.failed`) but the intake/bundle operation succeeds.

---

## Gap 8 — No UNIQUE constraint on `intake_forms.source_ref`

**Severity:** P3 (low — sequential delivery is the expected mode)  
**File:** `server/db/schema.ts:37`

**Evidence found:**
```typescript
sourceRef: varchar('source_ref', { length: 100 }),  // no unique index
```
- Idempotency check (`server/app.ts:562`): `SELECT ... WHERE source_ref = sourceRef LIMIT 1` — race-condition window exists under concurrent delivery

**Effect:** Two simultaneous deliveries of the same `externalRef` from PIE could both pass the idempotency check and insert two rows before either commits. Risk is low under normal sequential PIE delivery.

---

## Gap 9 — Azure VaultLine resources provisioning status unverified

**Severity:** P2 for VaultLine Azure deployment; does not block local/Vercel deployment  
**Registry:** `vaultline: { remainingBlockers: ["Azure resource provisioning status unverified"] }`

**Evidence found:**
- `deploy/main.bicep` — provisions Azure PostgreSQL, Blob Storage, Service Bus, Durable Functions, Key Vault
- `azure-functions/src/index.ts` — ClerkOSBundleHub orchestrator
- `server/services/blobStorage.ts`, `server/services/serviceBus.ts` — Azure SDK clients

**Evidence absent:**
- No confirmation that Bicep has been deployed (`az deployment group create` output)
- No Azure Function URL confirmed
- No `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_SERVICE_BUS_CONNECTION_STRING` in any env file

**Effect:** Azure-backed features (blob storage, service bus, durable function orchestration) are unconfirmed at runtime. The `clerk_audit_events` table (PostgreSQL) does not depend on Azure — it works on any Postgres instance.

---

## Gap Summary Table

| # | Gap | Severity | Blocks end-to-end proof? |
|---|---|---|---|
| 1 | Accuracy PIE system absent from repo | P1 | YES — Step 1 cannot auto-fire |
| 2 | 10-state lifecycle not implemented | P1 | YES — states ANALYSED through APPROVED have no code |
| 3 | DATABASE_URL not provisioned | P1 | YES — all DB writes fail without it |
| 4 | COMPANIES_HOUSE_API_KEY absent | P1 | Partial — on-demand check blocked; auto-activation unblocked |
| 5 | FineGuard scheduler has no cron trigger | P2 | No — endpoint works manually |
| 6 | No email delivery for alerts | P2 | No — alerts audited, not delivered |
| 7 | System tenant not seeded per environment | P1 | YES — audit FK constraint fails without it |
| 8 | No UNIQUE on intake_forms.source_ref | P3 | No — sequential delivery is safe |
| 9 | Azure provisioning status unverified | P2 | No — PostgreSQL audit path does not require Azure |
