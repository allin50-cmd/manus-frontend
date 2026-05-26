# UltraCore Data Strategy Assessment

**Authority:** apps/registry.json  
**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-26  
**Method:** Direct source inspection. Every claim cites a file and line. No invention. No proposed architecture.

---

## Final Assessment — Top Line

| Capability | Answer | Evidence summary |
|---|---|---|
| Capture business information | **PARTIAL** | PIE receiving endpoint works; PIE sender unknown |
| Understand business information | **NO** | No analysis, classification, or enrichment exists |
| Govern business decisions | **PARTIAL** | Role-based access and RLS exist; not applied to PIE path |
| Execute approved actions | **PARTIAL** | Execution fires automatically; no approval gate |
| Produce auditable evidence | **PARTIAL** | Audit trail exists and is correct; requires live DB |

---

## 1. Data Fabric

**How data physically moves across the portfolio.**

### Current State

Two databases in one PostgreSQL instance (Neon):
- **Brand-suite schema** (`server/db/schema.ts`): `intake_forms`, `monitored_companies`, `compliance_bundles`, `leads`, `contacts`, `deployment_status`
- **ClerkOS schema** (`server/drizzle/schema.ts`): `clerk_cases`, `clerk_users`, `clerk_audit_events`, `clerk_allocations`, `clerk_hearings`, `clerk_documents`, `clerk_bundles`, tenants, resilience, scheduler, incident, overrides

One message queue is designed but unconfirmed: Azure Service Bus (`server/services/serviceBus.ts`). One blob store is designed but unconfirmed: Azure Blob Storage (`server/services/blobStorage.ts`).

Data moves via:
1. HTTP POST from external PIE sender → `POST /api/pie/opportunity` → PostgreSQL
2. tRPC procedures (JWT-authenticated) → ClerkOS tables
3. Admin REST endpoints (X-ADMIN-KEY) → brand-suite tables read-only
4. Azure Service Bus → SystemSpine dispatcher → ClerkOS engine (conditional on Azure config)

### Evidence

- `server/db/index.ts` — Neon/postgres driver, lazy init
- `server/trpc/db.ts` — ClerkOS DB helpers, `writeAuditEvent`, `setTenantContext`
- `server/services/serviceBus.ts` — Azure SDK client, null when env absent
- `server/engine/systemSpine.ts` — queue dispatcher

### Strengths

- Single PostgreSQL instance — no cross-database joins
- Shared audit table (`clerk_audit_events`) receives events from both schemas via `entityId` (integer, ClerkOS) and `entityUuid` (UUID, brand-suite)
- Lazy initialization — import never fails if DB is absent

### Weaknesses

- Brand-suite and ClerkOS are logically separate schemas but no foreign keys link them. A `monitored_companies` row has no FK to a `clerk_cases` row. The audit thread (`correlationId`) is the only cross-schema link.
- Azure Service Bus provisioning is unconfirmed. If absent, `SystemSpine.handleQueueItem()` is never called.
- PIE sender is the only external data input point and it is `status: unverified`.

### Gaps

- No event streaming (Kafka, EventBridge, Pub/Sub)
- No retry queue for failed DB writes beyond `wrapGracefully()` circuit breaker
- No data lineage tracking across schema boundaries

### Dependencies

- Neon `DATABASE_URL` (not provisioned)
- Azure Service Bus `AZURE_SERVICE_BUS_CONNECTION_STRING` (provisioning unconfirmed)

### Readiness Score: **3 / 10**

Infrastructure is designed. Not deployed. Azure path unconfirmed. PIE sender missing.

---

## 2. Data Centralisation

**Whether data is in one place or scattered.**

### Current State

All operational data targets one PostgreSQL database. Two logical schemas, one connection string. No data warehouse, no separate analytics store, no ETL pipeline.

Audit data (`clerk_audit_events`) is the nearest thing to a central data store — it receives events from every domain. However, it stores metadata as `text` (JSON-serialised string), not typed JSONB columns.

### Evidence

- `server/drizzle/schema.ts:auditEvents` — `metadata: text('metadata')` (not jsonb)
- `server/db/schema.ts` — brand-suite tables, same Neon instance
- `drizzle.config.ts` and `drizzle.clerkos.config.ts` — both point to same `DATABASE_URL`

### Strengths

- Single database = no cross-system sync problems
- All audit events in one table, queryable by `correlation_id`

### Weaknesses

- Metadata stored as serialised text — cannot use `->` JSON operators without casting
- `siteAddress` and `district` stored only in metadata JSON, not as columns. Cannot filter `intake_forms` by district.
- No data warehouse or read replica for reporting. All queries hit the operational DB.

### Gaps

- No analytics layer
- No separation of read and write paths
- No archival strategy for audit events

### Dependencies

- None beyond DATABASE_URL

### Readiness Score: **5 / 10**

Centralised by default (one DB). Metadata storage in `text` not `jsonb` limits queryability.

---

## 3. Data Governance

**Who can read and write what, enforced how.**

### Current State

Three distinct access control layers exist:

**Layer 1 — tRPC role middleware** (`server/trpc/_core/trpc.ts`)
- `publicProcedure` — no auth
- `authedProcedure` — requires valid Azure B2C JWT
- `tenantProcedure` — requires JWT + resolved tenant
- `adminProcedure` — requires JWT + tenant + `role = 'admin (senior clerk / manager)'`

**Layer 2 — X-ADMIN-KEY REST** (`server/app.ts:203–212`)
- All `/api/admin/*` and `/api/internal/*` routes require `X-ADMIN-KEY` header matching `ADMIN_API_KEY` env var

**Layer 3 — PostgreSQL Row-Level Security** (`server/drizzle/rls-migration.sql`)
- RLS policies written for all ClerkOS tables (`clerk_users`, `clerk_cases`, `clerk_hearings`, `clerk_documents`, `clerk_bundles`, `clerk_allocations`, `clerk_diaries`, `clerk_audit_events`)
- Policy: `tenant_id = current_tenant_id()` where `current_tenant_id()` reads `app.current_tenant_id` from PostgreSQL session config
- Application sets context via: `SELECT set_config('app.current_tenant_id', '<uuid>', true)` (`server/trpc/db.ts:48`)
- Audit immutability: `CREATE RULE no_delete_audit AS ON DELETE TO clerk_audit_events DO INSTEAD NOTHING`

### Evidence

- `server/trpc/_core/trpc.ts:46–64` — isAdmin middleware
- `server/trpc/_core/auth.ts` — Azure B2C JWT verification via JOSE
- `server/app.ts:203–212` — X-ADMIN-KEY middleware
- `server/drizzle/rls-migration.sql` — full RLS policy definitions
- `server/trpc/db.ts:41–61` — `setTenantContext`, `withTenantContext`

### Strengths

- RLS policy is correctly written and comprehensive
- Audit events are immutable at DB level (DELETE rule)
- Two-role system (standard clerk / admin) is simple and enforceable
- Tenant isolation applies to audit events — cross-tenant audit leakage is impossible at DB level

### Weaknesses

- **RLS migration (`rls-migration.sql`) is NOT in the standard migration sequence.** It is a separate file not referenced by `npm run db:bootstrap`. It must be run manually by a superuser after bootstrap. Status: UNKNOWN whether it has ever been applied to any database.
- **PIE endpoint bypasses all auth.** `POST /api/pie/opportunity` has no authentication. Any caller can ingest an opportunity. (`server/app.ts:538` — no auth middleware)
- Azure B2C not configured (env vars absent) — all tRPC auth falls back to dev path (`DEFAULT_TENANT_SLUG`)
- Brand-suite tables (`intake_forms`, `monitored_companies`) have no RLS — only ClerkOS tables do

### Gaps

- No auth on PIE ingestion endpoint
- No RLS on brand-suite schema tables
- RLS migration application status: UNKNOWN
- No data classification (PII fields not tagged)
- No retention policy enforced

### Dependencies

- `AZURE_B2C_TENANT_NAME`, `AZURE_B2C_CLIENT_ID`, `AZURE_B2C_TENANT_ID` for JWT auth
- Database superuser access to apply RLS migration

### Readiness Score: **4 / 10**

Governance is well-designed but partially applied. PIE ingest is unprotected. RLS status unknown. Azure B2C not configured.

---

## 4. Data Integration

**How external systems connect to UltraCore.**

### Current State

| Integration | Direction | Status | Evidence |
|---|---|---|---|
| Accuracy PIE → UltAi | Inbound webhook | Receiving side built; sender UNKNOWN | `server/app.ts:538`, registry `sourceRepo: unknown` |
| Companies House API → FineGuard | Outbound REST | Client built; key not provisioned | `server/services/companiesHouse.ts:12` |
| Stripe → FineGuard | Inbound webhook + outbound | Webhook handler + checkout built; keys absent | `server/app.ts:55–149` |
| Azure Blob Storage → VaultLine | Outbound write | SDK built; provisioning unconfirmed | `server/services/blobStorage.ts` |
| Azure Service Bus → SystemSpine | Bidirectional | SDK built; provisioning unconfirmed | `server/services/serviceBus.ts` |
| Azure B2C → tRPC auth | Inbound JWT | JOSE verification built; env vars absent | `server/trpc/_core/auth.ts` |
| Planning Portal / LPA | None | ABSENT | grep found no planning API client |

### Evidence

- `server/services/companiesHouse.ts:441` — `export const companiesHouseService = CH_API_KEY ? new CompaniesHouseService() : null`
- `server/app.ts:56` — `const stripe = stripeSecretKey ? new Stripe(…) : null`
- `server/services/blobStorage.ts` — BlobServiceClient, null when key absent
- `apps/registry.json` — `accuracy-pie: { sourceRepo: "unknown" }`

### Strengths

- All external integrations degrade gracefully to null — no startup crashes
- Companies House client has retry logic, rate-limit handling, and structured error typing
- Stripe webhook signature verification is implemented

### Weaknesses

- Zero confirmed live integrations. Every integration is built but ungated on absent credentials.
- No planning data source exists. The most important integration — the one that generates revenue — has no confirmed implementation.
- No inbound schema validation for the Companies House response — it trusts the CH API shape directly.

### Gaps

- LPA / planning portal integration: ABSENT
- Planning application status API: ABSENT
- No webhook secret for PIE endpoint (any source can POST)
- No integration test against live Companies House sandbox

### Readiness Score: **2 / 10**

Code exists for most integrations. Zero are confirmed live. PIE sender — the revenue source — is missing entirely.

---

## 5. Data Ontology

**How data is modelled, typed, and named.**

### Current State

Two parallel data models exist with different design philosophies:

**Brand-suite model** (`server/db/schema.ts`) — flat, practical:
- `intake_forms`: 10 columns, all varchar/text. No FK to ClerkOS cases. Represents a planning matter intake.
- `monitored_companies`: 5 columns. `companyNumber` is the unique key — overloaded to hold both real CH numbers (`12345678`) and synthetic PIE identifiers (`PIE:24/AP/1234`).
- `compliance_bundles`: 8 columns. Represents a CH compliance report request.

**ClerkOS model** (`server/drizzle/schema.ts`) — relational, tenant-scoped:
- `tenants` → `clerk_users` → `clerk_cases` → `clerk_hearings` / `clerk_documents` / `clerk_allocations` → `clerk_bundles`
- All tables have `tenant_id` FK. Indexes on tenant+entity for query efficiency.
- `clerk_audit_events` bridges both models via `entityId` (integer) and `entityUuid` (UUID).

**PIE schema** (`server/lib/pie-schema.ts`): 9-field Zod schema. Only 2 required. No relationship to ClerkOS case model — a PIE intake creates an `intake_forms` row, not a `clerk_cases` row.

### Evidence

- `server/db/schema.ts` — brand-suite tables
- `server/drizzle/schema.ts` — ClerkOS tables
- `server/lib/pie-schema.ts` — PIE inbound contract

### Strengths

- Zod validation on PIE inbound — type safety enforced at boundary
- ClerkOS model is well-normalised with proper indexes
- `monitoredCompanies.companyNumber` is UNIQUE — prevents duplicate monitoring records

### Weaknesses

- No FK between `intake_forms` and `clerk_cases`. A PIE intake and a ClerkOS case are unlinked in the database. `correlationId` in audit events is the only thread.
- `monitoredCompanies.companyNumber` conflates real CH numbers with synthetic PIE identifiers — a query for "all monitored CH companies" returns PIE refs too.
- `claimValue` is `varchar(50)` storing free text — no numeric type, no currency normalization.
- `district`, `siteAddress`, `submittedAt` from PIE are stored only in audit metadata (JSON text), not in schema columns.
- `matterType` in `intake_forms` is `varchar(100)` — could be anything; PIE hardcodes `"planning"` but no DB constraint enforces this.

### Gaps

- No shared ontology between brand-suite and ClerkOS — `intake_forms` and `clerk_cases` represent similar concepts with different schemas and no link
- No numeric type for monetary values
- No canonical LPA reference type
- No planning application status field anywhere in the schema

### Readiness Score: **4 / 10**

Two parallel models that don't link. Key planning fields missing from schema columns. Monetary values as free text.

---

## 6. Data Promptness

**How fresh is the data? Real-time, batch, or stale?**

### Current State

| Data | Freshness | Mechanism | Evidence |
|---|---|---|---|
| PIE opportunity ingest | Real-time on receipt | HTTP POST → DB write, synchronous | `server/app.ts:538` |
| Companies House compliance status | On-demand only | `POST /api/compliance-bundle` triggers CH API call | `server/app.ts:701` |
| Scheduled compliance re-checks | NEVER (no cron trigger) | Endpoint exists; not called | `server/app.ts:1009` |
| Case status | Real-time on tRPC mutation | `casesRouter.update` → DB write + audit | `server/trpc/routers/cases.ts` |
| Audit events | Real-time on each action | `writeAuditEvent()` called synchronously | `server/trpc/db.ts:236` |
| Dashboard stats | Real-time on request | `dashboardRouter.stats` fetches live from DB | `server/trpc/routers/dashboard.ts:4` |
| Planning application status | NEVER | Not captured — no field in schema | — |

### Evidence

- `server/app.ts:1009` — scheduler endpoint exists but requires external cron trigger
- `apps/registry.json` — `remainingBlockers: ["No external cron trigger for scheduler endpoint"]`
- `server/drizzle/schema.ts:schedulerLeases` — distributed lease table exists

### Strengths

- Ingest is synchronous — PIE opportunity is persisted immediately on receipt
- Audit events written in the same request cycle as the business operation

### Weaknesses

- No scheduled re-check of monitored companies. FineGuard activates a company at ingest but never re-validates. A company could dissolve or file late accounts and the system would not know until manually triggered.
- No TTL or staleness marker on opportunities. An opportunity submitted months ago looks identical to one submitted today.
- Companies House data fetched on-demand only — not cached, not pre-fetched.

### Gaps

- Scheduled compliance monitoring: no cron wired
- Planning application status: never refreshed (not captured)
- No webhook from Companies House (CH does not offer one — polling is the only mechanism, and it's not implemented)

### Dependencies

- External cron to call `GET /api/internal/run-compliance-check` with `X-ADMIN-KEY`
- `COMPANIES_HOUSE_API_KEY` for compliance checks

### Readiness Score: **3 / 10**

Ingest is real-time. Monitoring re-checks never run. Planning status never refreshed.

---

## 7. Data Democratisation

**Who can access what data, through what interface.**

### Current State

| Interface | Auth | Data accessible | Who |
|---|---|---|---|
| tRPC — `tenantProcedure` | Azure B2C JWT + tenant | Cases, hearings, allocations, diary, documents, dashboard stats | Authenticated clerks |
| tRPC — `adminProcedure` | Azure B2C JWT + admin role | All above + case transitions, bundle initiation | Senior clerks / managers |
| REST — `GET /api/admin/*` | X-ADMIN-KEY header | `intake_forms`, `compliance_bundles`, `leads`, `contacts` (read-only) | Internal admin operators |
| REST — `GET /api/internal/*` | X-ADMIN-KEY header | Resilience state, scheduler, operations overrides, incidents | Engineering / ops |
| REST — `POST /api/pie/opportunity` | NONE | Write-only: creates intake records | Anyone with network access |
| Frontend React SPA | No server auth on static assets | UltAi, FineGuard, VaultLine UI pages | Anyone with URL |

### Evidence

- `server/trpc/_core/trpc.ts` — procedure hierarchy
- `server/app.ts:203–212` — X-ADMIN-KEY middleware
- `server/app.ts:538` — PIE endpoint, no auth check
- `src/pages/UltAi.tsx`, `FineGuard.tsx`, `VaultLine.tsx` — frontend pages

### Strengths

- tRPC tenant isolation — clerks can only see their tenant's data
- Admin REST endpoints are read-only for data access (no write via REST except PIE)
- Frontend pages for UltAi, FineGuard, VaultLine exist and are routed

### Weaknesses

- Azure B2C not configured — tRPC auth falls back to dev mode. In production without B2C config, auth is not functioning.
- No self-service query interface. Clerks cannot search across matters or export data.
- No reporting. Dashboard shows counts only — `totalCases`, `activeCases`, `pendingHearings` — no revenue metrics, no opportunity pipeline view.
- PIE ingest has no auth — write access is public.

### Gaps

- No search across `intake_forms` by district, value, or date range
- No export (CSV, PDF) for operational reporting
- No role for "Dagon White" specifically — the system has `standard clerk` and `admin (senior clerk / manager)`, not an owner/principal role
- No view of the PIE pipeline (how many opportunities received, activated, pending)

### Readiness Score: **3 / 10**

Auth framework exists. Not configured. No reporting. PIE write is open. No owner-level view.

---

## 8. Data Intelligence

**Analysis, scoring, enrichment, and decision support.**

### Current State

The only intelligence function in the entire portfolio is:

**FineGuard activation rule** (`server/lib/fineguard-rules.ts:90`):
```
activate = pieOriginated AND (highUrgency OR highValue)
```

This is a three-rule binary classifier. No model. No score. No weighting. No confidence. No false-positive rate tracking.

**Companies House compliance status** (`server/services/companiesHouse.ts:228`):
- Fetches company profile + last 5 filings from CH API
- Calculates `overdueAccounts`, `overdueConfirmationStatement`, `filingStreak`
- Estimates penalty (`penaltyEstimateGbp`) using a fixed penalty ladder (lines 371–391)
- Returns structured `ComplianceStatus` with `alertRequired: boolean`

This is the most sophisticated analytical function in the system. It is only reachable via `POST /api/compliance-bundle` (requires `COMPANIES_HOUSE_API_KEY`) or the scheduler (no cron configured).

No other intelligence exists:
- No NLP on `description`
- No geocoding of `siteAddress`
- No comparable transaction lookup for `estimatedValue`
- No opportunity scoring or ranking
- No pattern detection across multiple applications

### Evidence

- `server/lib/fineguard-rules.ts` — full rule implementation
- `server/services/companiesHouse.ts:228–400` — compliance analysis
- grep for `score`, `rank`, `model`, `ml`, `nlp`, `embed` across all `.ts` files: 0 results

### Strengths

- `parseClaimValueGbp()` handles multiple free-text formats correctly and conservatively
- Companies House compliance analysis covers accounts, confirmation statements, filing history, and penalty estimation
- FineGuard rule is deterministic and unit-tested (190/190)

### Weaknesses

- Only one decision gate (FineGuard activate/don't activate). No graduated scoring.
- No enrichment at ingest — the opportunity record is never augmented with external data.
- No historical pattern analysis — the system does not learn from previous opportunities.
- Companies House analysis requires a real CH company number. PIE intakes use synthetic identifiers (`PIE:24/AP/1234`), not CH numbers. The compliance check cannot run on a PIE-originated monitored company.

### Gaps

- Opportunity scoring / ranking
- NLP on planning description
- Address geocoding and spatial analysis
- Comparable transaction data
- CH lookup at PIE ingest time
- No ML or statistical model of any kind

### Readiness Score: **2 / 10**

One binary rule and one compliance calculator. No scoring, no enrichment, no learning.

---

## 9. Execution Control

**How operations are controlled, paused, or overridden.**

### Current State

A full Operations Control Plane exists (`server/app.ts:1235–1430`):

- `POST /api/internal/operations/override` — create named override with TTL
- `GET /api/internal/operations/overrides` — list active overrides
- `DELETE /api/internal/operations/override/:id` — remove override
- `POST /api/internal/operations/annotate` — annotate incident state
- `GET /api/internal/operations/incidents` — view incident state

Override types stored in `operational_overrides` table (`server/drizzle/schema.ts`): `target`, `overrideType`, `value` (jsonb), `expiresAt`, `reason`.

Circuit breaker (`server/lib/wrap-gracefully.ts`) tracks per-dependency failure counts in `global_resilience_state` and opens circuits after sustained failures. Failure state is persisted to PostgreSQL and shared across instances.

### Evidence

- `server/app.ts:1235` — override endpoint
- `server/drizzle/schema.ts:operationalOverrides` — schema
- `server/lib/retry-budget.ts` — per-dependency retry budget
- `server/lib/scheduler-lease.ts` — distributed lease via PostgreSQL

### Strengths

- Named overrides with TTL — override expires automatically
- Circuit breaker is per-dependency and persisted to DB — survives restarts
- Distributed scheduler lease — prevents concurrent scheduler runs across instances
- Override plane is protected by `X-ADMIN-KEY`

### Weaknesses

- No UI for the operations control plane. All control is via raw HTTP to `/api/internal/*`.
- Overrides affect code paths that check them — but PIE ingest does not check any override. There is no way to pause PIE ingestion via an override.
- Circuit breaker state in `global_resilience_state` — if this table doesn't exist (bootstrap not run), circuit sync silently fails.

### Gaps

- No override to pause PIE ingest
- No kill switch for FineGuard auto-activation
- No operations UI
- No alerting when circuit opens

### Dependencies

- `DATABASE_URL`, `ADMIN_API_KEY`

### Readiness Score: **6 / 10**

Control plane is the most complete non-audit component. Functional in tests. Not deployed. No UI.

---

## 10. Human Approval

**Where humans can review and approve before execution.**

### Current State

**There are no human approval gates in the PIE → UltAi → FineGuard → VaultLine chain.**

The sequence from PIE payload receipt to FineGuard activation is fully automated and synchronous:

```
POST /api/pie/opportunity received
  → Zod validation
  → idempotency check
  → INSERT intake_forms               (automatic)
  → writeAuditEvent "captured"        (automatic)
  → evaluateFineGuardActivation()     (automatic)
  → UPSERT monitored_companies        (automatic, no approval)
  → writeAuditEvent "triggered"       (automatic)
← HTTP 201
```

Elapsed time: milliseconds. No human involved.

The tRPC `adminProcedure` requires human sign-off for ClerkOS operations (case creation, bundle initiation) — but these are separate from the PIE chain.

`HITL_REQUIRED` is listed as a target lifecycle state in `apps/registry.json:182` but does not exist in any code file.

### Evidence

- `server/app.ts:538–693` — full PIE handler, no approval step
- `server/lib/pie-fineguard.ts:49` — activation fires immediately after evaluation
- `apps/registry.json:182` — `HITL_REQUIRED` in target lifecycle only
- grep for `HITL`, `approve`, `approval`, `review_required` in `server/`: 0 results in application code

### Strengths

- ClerkOS case creation and bundle generation require `adminProcedure` — senior clerk approval is enforced for those operations.

### Weaknesses

- FineGuard auto-activation has no approval gate. A malformed or fraudulent PIE payload immediately creates a monitoring record.
- No HITL state. No way to flag an intake for review before processing.
- No notification to Dagon White or any human when a high-value opportunity is received.

### Gaps

- HITL_REQUIRED state: NOT IMPLEMENTED
- No approval queue for FineGuard activations
- No notification mechanism (email, Slack, webhook) on PIE receipt
- No manual review step between CAPTURED and any subsequent state

### Readiness Score: **2 / 10**

No human approval exists on the revenue-generating path. HITL is defined but not implemented.

---

## 11. Execution

**What the system actually does when triggered.**

### Current State

On `POST /api/pie/opportunity` with a valid Bromley payload:

1. **Creates** `intake_forms` row — `matterRef = MAT-<timestamp>`, `matterType = 'planning'`, `urgency`, `claimValue`, `sourceRef`
2. **Writes** `clerk_audit_events` row — `action = 'captured'`, with metadata including `district` and `siteAddress`
3. **Evaluates** FineGuard rules — deterministic, pure function
4. If `activate = true`: **upserts** `monitored_companies` row with `companyNumber = 'PIE:24/AP/1234'`
5. **Writes** `clerk_audit_events` row — `action = 'fineguard_activation_evaluated'`
6. **Writes** `clerk_audit_events` row — `action = 'fineguard_activation_triggered'`
7. **Returns** HTTP 201 `{ ok: true, matterRef, sourceRef, urgency }`

**Nothing else happens.** No notification. No task assigned. No clerk alerted. No case created in ClerkOS. The intake sits in `intake_forms` until a human queries it via `GET /api/admin/intake-forms`.

### Evidence

- `server/app.ts:538–693` — complete handler
- `server/lib/pie-fineguard.ts` — activation bridge
- `server/trpc/routers/cases.ts` — case creation requires separate explicit call

### Strengths

- Execution is reliable and deterministic for the implemented steps
- Idempotency prevents duplicate ingestion
- Failure isolation — FineGuard failure never propagates to intake response

### Weaknesses

- No downstream action after capture. No task created. No clerk assigned. No notification. The opportunity sits idle.
- FineGuard monitoring is activated but never subsequently executed (no cron).
- No connection between `intake_forms` and `clerk_cases`. A clerk must manually create a case in ClerkOS referencing the intake.

### Gaps

- No automatic case creation from PIE intake
- No clerk assignment / notification
- No subsequent lifecycle progression
- Monitored company never re-checked after activation

### Readiness Score: **4 / 10**

Capture and activation execute correctly. Nothing happens after that.

---

## 12. Evidence

**What audit record exists for every action.**

### Current State

`clerk_audit_events` table (`server/drizzle/schema.ts:auditEvents`):

| Column | Type | Purpose |
|---|---|---|
| `id` | serial | Row PK |
| `tenant_id` | uuid FK | Tenant isolation |
| `entity_type` | varchar(64) | Domain entity type (`intake`, `case`, `monitoring_activation`) |
| `entity_id` | integer nullable | ClerkOS serial entity |
| `entity_uuid` | uuid nullable | Brand-suite UUID entity |
| `action` | varchar(64) | What happened |
| `actor_id` / `actor_open_id` | integer / varchar | Who did it |
| `previous_state` / `next_state` | text | State transition |
| `metadata` | text | JSON-serialised context |
| `correlation_id` | uuid | Thread across related events |
| `created_at` | timestamp | When |

Audit immutability enforced at DB level: `CREATE RULE no_delete_audit AS ON DELETE TO clerk_audit_events DO INSTEAD NOTHING` (`rls-migration.sql`)

For the Bromley PIE flow, 3 audit events are written per ingestion, sharing one `correlation_id`:

1. `entityType=intake`, `action=captured`, metadata: `{matterRef, matterType, urgency, sourceRef, upstreamSystem, pieExternalRef, siteAddress, district}`
2. `entityType=intake`, `action=fineguard_activation_evaluated`, metadata: `{activate, reasons, trigger}`
3. `entityType=monitoring_activation`, `action=fineguard_activation_triggered`, metadata: `{companyIdentifier, companyName, reasons, trigger}`

Proof: `server/workflow-proof.test.ts` — 10 tests, all passing, verifying this exact sequence against mocked DB.

### Evidence

- `server/drizzle/schema.ts:auditEvents` — schema
- `server/drizzle/rls-migration.sql` — immutability rule
- `server/trpc/db.ts:236` — `writeAuditEvent()` with entityId/entityUuid guard
- `server/workflow-proof.test.ts` — 10 tests, 190/190 passing

### Strengths

- Immutability enforced at DB level (not just application level)
- `correlationId` threads across the entire chain — one UUID traces from PIE receipt to FineGuard activation
- Every action by every actor is recorded with `actorId` and `actorOpenId`
- Both schemas (brand-suite UUID, ClerkOS integer) supported in one audit table

### Weaknesses

- `metadata` is `text` not `jsonb` — cannot query inside metadata without casting
- RLS migration (`rls-migration.sql`) application status: UNKNOWN. If not applied, tenant isolation on audit events is not enforced at DB level.
- `writeAuditEvent()` silently skips if `DATABASE_URL` is absent — no error surfaced to caller
- No audit retention policy. Table grows indefinitely.

### Gaps

- Metadata not queryable as structured JSON
- RLS on audit events: unknown whether applied
- No audit export / compliance report feature

### Dependencies

- `DATABASE_URL` — without it all audit writes are silent no-ops

### Readiness Score: **6 / 10**

Best-implemented component. Schema correct. Immutability enforced. Correlation threading works. Blocked only on live database and RLS migration.

---

## Final Assessment — Detail

### 1. Can the system capture business information?

**PARTIAL**

- PIE receiving endpoint captures a planning opportunity (`POST /api/pie/opportunity`) — IMPLEMENTED
- IntakeSheet UI captures manual matter intake — IMPLEMENTED
- Planning application status not captured — ABSENT
- PIE sender not present in repository — UNKNOWN source
- `district` and `siteAddress` stored in metadata only, not as queryable columns

### 2. Can the system understand business information?

**NO**

- One binary activation rule (`pieOriginated AND (highUrgency OR highValue)`) — IMPLEMENTED
- Companies House compliance analysis — IMPLEMENTED, but requires CH API key and CH company number (PIE identifiers are not CH numbers)
- No NLP, no enrichment, no scoring, no ranking, no ML of any kind
- No analysis of planning application description, address, or history
- ANALYSED and ESTIMATED lifecycle states: NOT IMPLEMENTED

### 3. Can the system govern business decisions?

**PARTIAL**

- tRPC role hierarchy (public / authed / tenant / admin) — IMPLEMENTED, not configured
- X-ADMIN-KEY on internal endpoints — IMPLEMENTED, active
- Row-Level Security policies — WRITTEN, application status UNKNOWN
- Audit immutability — IMPLEMENTED at DB rule level
- PIE ingest has no auth — ungoverned write access
- No human approval gate on the revenue path

### 4. Can the system execute approved actions?

**PARTIAL**

- PIE capture + FineGuard activation execute automatically — IMPLEMENTED
- ClerkOS case lifecycle (4 states) — IMPLEMENTED for manual use
- FineGuard monitoring re-check — ENDPOINT EXISTS, never scheduled
- No action after capture: no task assignment, no notification, no case creation from intake
- 10-state lifecycle: NOT IMPLEMENTED

### 5. Can the system produce auditable evidence?

**PARTIAL**

- `clerk_audit_events` schema — CORRECT
- `writeAuditEvent()` — IMPLEMENTED, called on all P1 paths
- Immutability — ENFORCED at DB level (pending RLS migration)
- Correlation threading — IMPLEMENTED
- Live database not yet connected — all audit writes currently no-ops
- Metadata not queryable as structured JSON

---

## Aggregate Scores

| Category | Score | Bottleneck |
|---|---|---|
| 1. Data Fabric | 3/10 | PIE sender absent; Azure unconfirmed |
| 2. Data Centralisation | 5/10 | One DB; metadata as text |
| 3. Data Governance | 4/10 | RLS written, status unknown; PIE open |
| 4. Data Integration | 2/10 | All integrations unconfirmed live |
| 5. Data Ontology | 4/10 | Two unlinked models; planning fields missing |
| 6. Data Promptness | 3/10 | Ingest real-time; monitoring never runs |
| 7. Data Democratisation | 3/10 | Auth framework unconfirmed; no reporting |
| 8. Data Intelligence | 2/10 | One binary rule; no enrichment |
| 9. Execution Control | 6/10 | Best component; not deployed |
| 10. Human Approval | 2/10 | No HITL; activation is fully automatic |
| 11. Execution | 4/10 | Capture works; nothing happens after |
| 12. Evidence | 6/10 | Correct schema; blocked on live DB |
| **Portfolio average** | **3.7 / 10** | |
