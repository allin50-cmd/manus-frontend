# Blockers

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25

Ordered by severity. Each blocker states the exact file and line where the gap exists or where the fix must be applied.

---

## CRITICAL — Stops Everything

---

### BLOCKER-01: Accuracy PIE has no known source

**System:** Accuracy PIE
**Severity:** Critical
**Impact:** The entire PIE → UltAi → FineGuard → VaultLine pipeline has no starting point. No opportunities are generated. No CAPTURED state exists.

**Evidence:** Zero files in `allin50-cmd/manus-frontend` relate to Accuracy PIE. `apps/registry.json` records `sourceRepo: "unknown — requires verification"`. No planning application schema, no scoring algorithm, no outbound API call to UltAi.

**What is needed:**
- Locate the Accuracy PIE source repository (stakeholder action — cannot be done from code)
- Identify its database and deployment URL
- Identify how it currently outputs opportunities (API, webhook, queue, DB write)
- Update `apps/registry.json` with confirmed values

**Cannot proceed** on the PIE → UltAi connection without this.

**Action:** STAKEHOLDER — not a code fix.

---

### BLOCKER-02: Brand-suite intake does not write to VaultLine

**System:** UltAi → VaultLine
**Severity:** Critical
**Impact:** Every `POST /api/intake` call (the public intake form) creates a record in `intake_forms` and then stops. No audit event is written. The UltAi → VaultLine link is broken.

**Exact location:**
- File: `server/index.ts`
- Line: 441 (`app.post('/api/intake', ...)`)
- After line 478 (after `db.insert(intakeForms)...`): `writeAuditEvent()` is never called

**Root cause:** `writeAuditEvent()` requires a `tenantId` UUID referencing the `tenants` table. The brand-suite intake endpoint has no tenant context. The `tenants` table is in the ClerkOS schema (`server/drizzle/schema.ts`), which is a different schema from the brand-suite tables (`server/db/schema.ts`), though both use the same `DATABASE_URL`.

**Minimum fix required:**
1. Insert a system-level tenant into `tenants` table — one row, UUID `00000000-0000-0000-0000-000000000001`
2. Add `import { writeAuditEvent } from './trpc/db';` to `server/index.ts`
3. Call `writeAuditEvent({ tenantId: SYSTEM_TENANT_ID, entityType: 'intake', entityId: intake.id, action: 'captured', ... })` after the `intake_forms` insert

**Files:** `server/index.ts`, one DB seed/migration record
**Risk:** Low — additive

---

### BLOCKER-03: FineGuard compliance check does not write to VaultLine

**System:** FineGuard → VaultLine
**Severity:** Critical
**Impact:** Every compliance check and every Stripe payment leaves no audit trace. FineGuard cannot "prove actions" because no actions are recorded.

**Exact locations:**

Location A — compliance bundle endpoint:
- File: `server/index.ts`
- Line: ~600 (inside `POST /api/compliance-bundle` handler, after `db.insert(complianceBundles)`)
- `writeAuditEvent()` is never called

Location B — Stripe webhook:
- File: `server/index.ts`
- Line: ~74 (inside `checkout.session.completed` handler, after `db.insert(monitoredCompanies)`)
- `writeAuditEvent()` is never called

**Minimum fix required:**
- Same system tenant as BLOCKER-02
- Add `writeAuditEvent()` calls at both locations with relevant metadata

**Files:** `server/index.ts`
**Risk:** Low — additive

---

### BLOCKER-04: No system tenant exists to anchor brand-suite audit events

**System:** UltAi + FineGuard → VaultLine
**Severity:** Critical (prerequisite for BLOCKER-02 and BLOCKER-03)
**Impact:** `writeAuditEvent()` has `tenantId: uuid().notNull()` with a foreign key to `tenants`. Without a valid tenant row, any call to `writeAuditEvent()` from brand-suite endpoints will throw a foreign key violation.

**Exact location:**
- File: `server/drizzle/schema.ts`, line ~60
- `tenantId: uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' })`

**Root cause:** The `tenants` table is in the ClerkOS schema (`server/drizzle/schema.ts`). Brand-suite REST endpoints operate without tenant context. The two schemas share `DATABASE_URL` but have no shared entity.

**Minimum fix required:**
1. Confirm ClerkOS schema is migrated: `npm run db:push:clerkos` (or `db:migrate:clerkos`)
2. Insert system tenant:
   ```sql
   INSERT INTO tenants (id, name, slug, plan) VALUES
   ('00000000-0000-0000-0000-000000000001', 'UltraCore System', 'system', 'enterprise')
   ON CONFLICT (slug) DO NOTHING;
   ```
3. Store this UUID as `SYSTEM_TENANT_ID` constant in `server/index.ts`

**Files:** One migration or seed script
**Risk:** Low — additive

---

### BLOCKER-05: ClerkOS schema has not been migrated

**System:** UltAi + VaultLine
**Severity:** Critical
**Impact:** The 9 ClerkOS tables (`tenants`, `clerk_users`, `clerk_cases`, `clerk_hearings`, `clerk_documents`, `clerk_bundles`, `clerk_allocations`, `clerk_diaries`, `clerk_audit_events`) do not exist in the database until a migration is run. All tRPC procedures will fail with "relation does not exist" errors.

**Exact location:**
- File: `server/drizzle/schema.ts` — schema definition exists
- File: `drizzle.clerkos.config.ts` — migration config exists (created in previous cycle)
- Migration not yet generated or run

**Fix:**
```bash
npm run db:push:clerkos    # push schema directly (dev)
# or
npm run db:generate:clerkos && npm run db:migrate:clerkos   # migration-based (prod)
```

**Prerequisite:** `DATABASE_URL` must be set to a running PostgreSQL instance.

**Files:** No code change — operational task
**Risk:** Medium — will modify production DB schema if run against production

---

## HIGH — Breaks P1 Success Metrics

---

### BLOCKER-06: No FineGuard alert scheduler

**System:** FineGuard
**Severity:** High
**Impact:** Companies in `monitored_companies` are never re-checked. The core FineGuard promise ("alerts delivered") has zero implementation. Customers pay via Stripe but receive no service.

**Exact location:**
- File: `server/index.ts` — Stripe webhook inserts into `monitored_companies` (line ~74) and stops
- No cron job, timer, background worker, or scheduled Azure Function exists

**What is needed:**
- A scheduled task that: reads all `monitored_companies`, calls `CompaniesHouseService.getComplianceStatus()` for each, identifies companies moving to `overdue` or `warning`, writes a VaultLine audit event, sends an alert email

**Prerequisite:** BLOCKER-07 (email provider) must be resolved first

**Files:** `server/index.ts` or a new scheduled endpoint — this is the smallest scope to avoid introducing new architecture

---

### BLOCKER-07: No email provider

**System:** FineGuard (primary), UltAi (secondary)
**Severity:** High
**Impact:** FineGuard cannot deliver alerts. Intake form submissions cannot send confirmation emails. Demo bookings are not acknowledged. These are all stated success metrics.

**Exact location:** No email import exists anywhere in `server/index.ts` or any server file.

**What is needed:**
- Select one provider (Resend, SendGrid, Mailgun, or SES)
- Add one env var (e.g. `RESEND_API_KEY`)
- Add one npm package (e.g. `npm install resend`)
- Write one `sendEmail()` wrapper function

**This is the only item in this blockers list that requires adding a new package.**

**Decision required from stakeholder:** Which email provider?

---

### BLOCKER-08: Azure resources not confirmed provisioned

**System:** VaultLine
**Severity:** High
**Impact:** VaultLine's document storage (Azure Blob), queue (Azure Service Bus), and bundle pipeline (Azure Durable Functions) may not exist as live Azure resources.

**Evidence:** `deploy/main.bicep` defines the IaC. `deploy/parameters.prod.json` has placeholder values (`<sub-id>`, `<prod-b2c-client-id>`). No deployment confirmation log exists in this repository.

**Exact locations:**
- File: `deploy/parameters.dev.json` — `<sub-id>` and `<dev-b2c-client-id>` are placeholders, not real values
- File: `deploy/parameters.prod.json` — same

**What is needed:**
- Run `az deployment group create --resource-group rg-clerkos-dev --template-file deploy/main.bicep --parameters @deploy/parameters.dev.json` against a real Azure subscription
- Confirm the 5 environment variables (`AZURE_STORAGE_CONNECTION_STRING`, `AZURE_SERVICE_BUS_CONNECTION_STRING`, etc.) are set in the deployed environment

**Action:** OPERATIONAL — not a code fix. Requires Azure subscription access.

---

## MEDIUM — Limits Traceability

---

### BLOCKER-09: No sourceRef field on intake_forms

**System:** UltAi
**Severity:** Medium
**Impact:** When Accuracy PIE is found and connected, there is no way to link a UltAi intake record back to the originating PIE opportunity. The `MAT-...` reference has no `sourceRef` field.

**Exact location:**
- File: `server/db/schema.ts`, lines 37–52
- `intake_forms` table has no `source_ref` column

**Minimum fix:**
```typescript
// server/db/schema.ts — add to intakeForms table definition
sourceRef: varchar('source_ref', { length: 100 }),
```

Then pass through `POST /api/intake` body and into `writeAuditEvent` metadata.

**Files:** `server/db/schema.ts`, `server/index.ts`
**Risk:** Low — additive column

---

### BLOCKER-10: Tests verify procedure existence, not behaviour

**System:** All
**Severity:** Medium
**Impact:** The test suite has 30 passing tests, but most test that procedures exist (`expect(caller.cases.list).toBeDefined()`), not that they execute correctly with a real database. Integration failures (wrong schema, missing DB, foreign key violations) will not be caught until runtime.

**Exact location:**
- File: `server/trpc/routers.test.ts` — tests use mock contexts, no DB connection

**What is needed:**
- At minimum, one integration test that: connects to a test DB, inserts a tenant, creates a case, verifies a `clerk_audit_events` row was written

**Risk:** This is a quality gap, not a production blocker.

---

### BLOCKER-11: Admin endpoints authenticated but not role-scoped

**System:** All
**Severity:** Medium
**Impact:** The `X-ADMIN-KEY` middleware protects `/api/admin/*` endpoints with a single static key. Any holder of the key can read all leads, intake forms, and compliance bundles for all customers. There is no per-user or per-tenant scope.

**Exact location:**
- File: `server/index.ts`, lines 137–146 (admin middleware)

**What is needed:** For now, the single key is acceptable. Before multi-tenant production use, the key should be replaced with Azure AD B2C token verification (same pattern as tRPC auth). Not urgent until the system has multiple paying customers.

---

## Blocker Resolution Order

| # | Blocker | Who | Unblocks |
|---|---|---|---|
| 1 | BLOCKER-01: Locate Accuracy PIE | Stakeholder | PIE → UltAi path |
| 2 | BLOCKER-05: Run ClerkOS schema migration | Engineering | BLOCKER-04 |
| 3 | BLOCKER-04: Insert system tenant | Engineering | BLOCKER-02, BLOCKER-03 |
| 4 | BLOCKER-02: Intake → writeAuditEvent | Engineering | UltAi → VaultLine |
| 5 | BLOCKER-03: FineGuard → writeAuditEvent | Engineering | FineGuard → VaultLine |
| 6 | BLOCKER-07: Select email provider | Stakeholder | BLOCKER-06 |
| 7 | BLOCKER-06: Implement alert scheduler | Engineering | FineGuard monitoring loop |
| 8 | BLOCKER-08: Provision Azure resources | Operations | VaultLine blob + bundle pipeline |
| 9 | BLOCKER-09: Add sourceRef field | Engineering | PIE traceability |
| 10 | BLOCKER-10: Integration tests | Engineering | CI reliability |

---

## Smallest Set of Code Changes to Achieve PIE → UltAi → FineGuard → VaultLine

Assuming Accuracy PIE is found and exposes an outbound API (BLOCKER-01 resolved):

**Change 1** — Run ClerkOS migration: `npm run db:push:clerkos` (operational, no code)

**Change 2** — Insert system tenant (one SQL statement or seed script, no code)

**Change 3** — `server/index.ts`: add `writeAuditEvent` import and 3 calls (intake, compliance bundle, Stripe webhook) — ~15 lines

**Change 4** — `server/db/schema.ts`: add `sourceRef` to `intake_forms` — 1 line

**Change 5** — `server/index.ts`: add `POST /api/opportunity` endpoint to receive PIE events — ~20 lines (uses existing `intake_forms` insert pattern + `writeAuditEvent`)

**Change 6** — Email provider: `npm install resend` + 1 wrapper function + 1 env var — ~15 lines

**Change 7** — FineGuard scheduler: `GET /api/internal/run-compliance-check` endpoint (callable by a cron/timer) that reads `monitored_companies`, calls `CompaniesHouseService`, sends alert email, writes audit event — ~50 lines in `server/index.ts`

**Total estimate: ~100 lines across 2 files, 1 migration, 1 npm package.**

No new frameworks. No new architecture. Uses only existing code patterns.
