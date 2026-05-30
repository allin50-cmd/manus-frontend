# UltraCore Portfolio Consolidation Audit

**Date:** 2026-05-25
**Repository:** allin50-cmd/manus-frontend
**Branch:** claude/ultracore-consolidation-audit-KmP0r
**Authority:** apps/registry.json

---

## Executive Summary

The UltraCore portfolio currently lives as a single monolithic application (`vaultline-brand-suite`) in one repository. Three of four P1 systems — UltAi, FineGuard, and VaultLine — have active code in this repo. **Accuracy PIE has no verified source location.** The ClerkOS engine contains a working case state machine but uses a four-state model (`open → in_progress → on_hold → closed`) that must be extended to the ten-state target lifecycle before P1 integration can complete.

The Azure integration layer is the most mature: Blob Storage, Service Bus, and Durable Functions are all wired. The gap is operational verification — no confirmed evidence that Azure resources are provisioned, alert delivery is live, or Stripe payments are processing end-to-end.

**Consolidation priority:** stop building new features, verify what exists, extract shared packages, then wire the lifecycle.

---

## Section 1 — Portfolio Assessment

| System | Purpose | Current Role | Likely State | Consolidation Priority | Operational Risks |
|---|---|---|---|---|---|
| **Accuracy PIE** | Opportunity discovery & deterministic scoring | Revenue Discovery (P1) | Unknown — no source found in repo | Verify source immediately | Entire system may be undocumented or lost |
| **UltAi** | Intake, workflow orchestration, task management | Operations (P1) | Active — ClerkOS engine running, tRPC API live | Extract workflow to `packages/core-workflow` | Manus export may not be canonical; state machine is 4-state not 10-state |
| **FineGuard** | Companies House monitoring, alerts, risk scoring | Compliance (P1) | Partial — CH API wired, alert delivery unverified | Verify alert + email loop; extract CH adapter | Stripe checkout unconfirmed; no alert queue visible |
| **VaultLine** | Immutable audit trail & event retention | Evidence & Audit (P1) | Active (schema + Azure) — provisioning unverified | Verify Azure resources; expose audit API | Azure resources may not be deployed; bundle pipeline untested |
| **UltraCore Monorepo** | Shared platform infrastructure | Platform (P2) | In progress — exists as single monolith | Refactor into monorepo with shared packages | Breaking changes during extraction if no test coverage |

---

## Section 2 — Repository Consolidation Strategy

### Target Structure

```
ultracore/
├── apps/
│   ├── registry.json          ← canonical control document (created)
│   ├── accuracy-pie/          ← to be located and migrated
│   ├── ultai/                 ← extract from current monolith
│   ├── fineguard/             ← extract from current monolith
│   └── vaultline/             ← extract from current monolith
├── packages/
│   ├── core-workflow/         ← extract from server/engine/
│   ├── core-auth/             ← extract from server/trpc/_core/
│   ├── core-db/               ← extract from server/drizzle/ + server/trpc/db.ts
│   └── core-audit/            ← extract from auditEvents + blobStorage + serviceBus
├── docs/
│   └── CONSOLIDATION-AUDIT.md ← this document
└── azure-functions/           ← stays at root; Azure-only, VaultLine-scoped
```

### Package Justifications

**`packages/core-workflow`**
Extracts `server/engine/clerkOS.engine.ts` and `server/engine/systemSpine.ts`. This is the only place the ten-state portfolio lifecycle should be implemented. All P1 systems consume it. Reject alternative workflow engines.

**`packages/core-auth`**
Extracts `server/trpc/_core/trpc.ts` and `server/trpc/_core/context.ts`. JWT validation, tenant resolution, and role enforcement are cross-cutting. Every app needs them. Centralising prevents drift.

**`packages/core-db`**
Extracts `server/drizzle/schema.ts`, `server/db/migrate.ts`, `server/db/seed.ts`, and `server/trpc/db.ts`. One schema, one migration path, one connection pool. Multi-app sprawl with separate schemas creates split-brain risk.

**`packages/core-audit`**
Extracts `server/services/blobStorage.ts`, `server/services/serviceBus.ts`, and the `auditEvents` table write path. VaultLine is the audit system; audit writes must flow through a single package, not be scattered per app.

**Rejected packages:** No separate billing package at this stage — Stripe is called from two places and can remain in the FineGuard app until a third consumer appears. No agent framework package. No microservices split without demonstrated throughput need.

---

## Section 3 — Portfolio Verification Plan

### Week 1 Verification Checklists

#### Accuracy PIE

- [ ] Locate source repository or exported codebase
- [ ] Confirm current deployment URL (if any)
- [ ] Identify owner / last committer
- [ ] Confirm it is reachable and returning valid responses
- [ ] Document what "opportunity" means in its data model
- [ ] Check whether it has any database dependency
- [ ] Record finding in `apps/registry.json` under `accuracy-pie.sourceRepo`

#### UltAi

- [ ] Confirm `https://zhoqgoan.manus.space/` is live and returning correct content
- [ ] Confirm the Manus export in this repo is the canonical source (not a stale copy)
- [ ] Verify tRPC API responds on `/api/trpc` (auth, cases, allocations endpoints)
- [ ] Confirm PostgreSQL connection is live (run `npm run db:studio` or check logs)
- [ ] Confirm at least one tenant row exists in `tenants` table
- [ ] Confirm Azure Service Bus is configured (`AZURE_SERVICE_BUS_CONNECTION_STRING` present)
- [ ] Create one test case and step it through `open → in_progress → closed`
- [ ] Confirm audit event written for each transition
- [ ] Record deployment URL and DB connection string reference in registry

#### FineGuard

- [ ] Confirm `https://compliance-t2rtvc.manus.space/` is live
- [ ] Confirm `COMPANIES_HOUSE_API_KEY` is set and returning results for a test company number
- [ ] Manually call `companiesHouse.getCompanyProfile('00000006')` and confirm response
- [ ] Confirm at least one company is being monitored (check DB for monitored companies table or equivalent)
- [ ] Trigger a test alert and confirm it is generated in the system
- [ ] Confirm email delivery: send one alert email and verify receipt
- [ ] Open `/compliance-bundle` and complete Stripe checkout in test mode — confirm `payment_intent.succeeded` webhook fires
- [ ] Confirm Stripe webhook secret (`STRIPE_WEBHOOK_SECRET`) is configured
- [ ] Record CH API key reference, Stripe keys reference, and alert delivery method in registry

#### VaultLine

- [ ] Log in to Azure Portal and confirm the following resources exist:
  - Azure Storage Account (check `AZURE_STORAGE_ACCOUNT` env matches)
  - Blob container `clerkos-documents`
  - Azure Service Bus namespace with queue `clerkos-bundles`
  - Azure Functions app with `bundleOrchestrator`, `validateBundle`, `renderDocumentPage`, `mergeBundlePDF`, `finalizeBundle` deployed
- [ ] Upload one test document via the Documents UI and confirm blob path is written to `documents.blobPath`
- [ ] Trigger bundle generation for a case with one approved document
- [ ] Confirm orchestration reaches `ready` status (check `bundles.status` in DB)
- [ ] Confirm `bundles.pdfBlobPath` and `bundles.auditHash` are populated
- [ ] Confirm `auditEvents` table has rows for the bundle lifecycle
- [ ] Record all Azure resource names and regions in registry

---

## Section 4 — Workflow Integration Plan

### Integration Pattern

All P1 systems feed events into `packages/core-workflow`, which enforces the ten-state lifecycle and writes audit records to VaultLine via `packages/core-audit`. No system writes audit events directly to VaultLine — they go through the workflow package.

```
┌─────────────────────────────────────────────────────────┐
│                    packages/core-workflow                │
│                                                         │
│  CAPTURED → ANALYSED → ESTIMATED → VERIFIED →          │
│  CONFIRMED → HITL_REQUIRED → APPROVED →                │
│  EXECUTED → RECORDED → CLOSED                           │
│                                                         │
│  • enforces valid transitions                           │
│  • emits WorkflowEvent on every state change            │
│  • delegates audit writes to core-audit                 │
└─────────────────────────────────────────────────────────┘
```

---

#### Accuracy PIE → core-workflow → VaultLine

```
Accuracy PIE
│
│  Discovers opportunity (score > threshold)
│  Creates WorkflowItem { type: 'opportunity', source: 'pie' }
│  Calls core-workflow.capture(item)
│
▼
core-workflow
│
│  State: CAPTURED
│  Runs deterministic scoring → ANALYSED
│  Estimates value → ESTIMATED
│  Flags if HITL required → HITL_REQUIRED
│  On approval → APPROVED → EXECUTED
│
▼
core-audit (via core-workflow)
│
│  Writes AuditEvent for every transition
│  Writes to auditEvents table (PostgreSQL)
│  Sends blob reference to Azure Blob Storage
│
▼
VaultLine
  Immutable record: opportunity lifecycle complete
  RECORDED → CLOSED
```

---

#### FineGuard → core-workflow → VaultLine

```
FineGuard
│
│  Polls Companies House API (scheduled)
│  Detects filing overdue / status change / officer change
│  Creates WorkflowItem { type: 'compliance_alert', source: 'fineguard' }
│  Calls core-workflow.capture(item)
│
▼
core-workflow
│
│  State: CAPTURED
│  Analyses filing risk → ANALYSED
│  Estimates penalty exposure → ESTIMATED
│  Verifies against Companies House stream → VERIFIED
│  Flags HITL if risk score > threshold → HITL_REQUIRED
│  On approval → APPROVED
│  Sends alert email → EXECUTED
│
▼
core-audit (via core-workflow)
│
│  Writes AuditEvent: alert triggered, delivered, acknowledged
│
▼
VaultLine
  Immutable compliance record: alert lifecycle complete
  RECORDED → CLOSED
```

---

#### UltAi → core-workflow → VaultLine

```
UltAi
│
│  Client submits intake form (IntakeSheet)
│  Creates WorkflowItem { type: 'intake', source: 'ultai' }
│  Calls core-workflow.capture(item)
│
▼
core-workflow
│
│  State: CAPTURED
│  ClerkOS engine classifies intake → ANALYSED
│  Estimates work required → ESTIMATED
│  Routes to clerk for review → VERIFIED → CONFIRMED
│  HITL review if complex → HITL_REQUIRED
│  Senior clerk approval → APPROVED
│  Clerk executes tasks (bundle, hearings, docs) → EXECUTED
│
▼
core-audit (via core-workflow)
│
│  Writes AuditEvent for every case transition
│  Writes document blob references
│  Writes bundle audit hash
│
▼
VaultLine
  Immutable case record: intake-to-close lifecycle
  RECORDED → CLOSED
```

---

## Section 5 — Migration Order

### Phase 1 — Week 1: Portfolio Verification

**Objective:** Confirm the actual operational status of every P1 system before writing a single line of new code.

**Success Criteria:**
- `apps/registry.json` has `sourceRepo`, `deployment`, and `status` populated for all four P1 systems
- Accuracy PIE source location is found or formally declared missing
- FineGuard alert loop confirmed end-to-end (CH API → alert → email)
- VaultLine Azure resources confirmed provisioned and reachable
- UltAi tRPC API confirmed live with at least one tenant

**Risks:**
- Accuracy PIE may not exist as a running system → escalate immediately; do not invent a replacement
- Azure resources may not be deployed → run `deploy/main.bicep` against dev subscription

**Rollback:** Verification is read-only. No rollback needed.

---

### Phase 2 — Week 2: Repository Consolidation

**Objective:** Move from single monolith to target monorepo directory structure without breaking existing functionality.

**Success Criteria:**
- `apps/ultai/`, `apps/fineguard/`, `apps/vaultline/` directories created with correct content moved
- `packages/core-workflow/`, `packages/core-auth/`, `packages/core-db/`, `packages/core-audit/` scaffolded with extracted code
- All existing tests pass after extraction
- Build succeeds for each app independently

**Risks:**
- Import path breakage during extraction → fix systematically, run `tsc --noEmit` after each move
- Missing test coverage makes breakage invisible → write minimum smoke tests before moving

**Rollback:** Git revert to pre-extraction commit. No data migrations involved.

---

### Phase 3 — Week 3: core-workflow Implementation

**Objective:** Implement the ten-state lifecycle in `packages/core-workflow` by extending the existing ClerkOS engine.

**Success Criteria:**
- `packages/core-workflow` exports `WorkflowEngine` with all ten states
- Valid transitions enforced; invalid transitions throw typed errors
- Every state change emits a `WorkflowEvent` captured by `core-audit`
- Existing ClerkOS four-state transitions map to the ten-state model without data loss
- Unit tests cover every valid and invalid transition

**Risks:**
- Existing `cases.status` column uses four values → requires a DB migration; run with care on prod
- HITL_REQUIRED state needs a human notification mechanism not yet built → stub the interface, implement later

**Rollback:** DB migration rollback script must be written before deploying. ClerkOS engine can fall back to four-state via feature flag if migration fails.

---

### Phase 4 — Week 4: Accuracy PIE Integration

**Objective:** Wire Accuracy PIE to `packages/core-workflow` so discovered opportunities enter the portfolio lifecycle.

**Success Criteria:**
- Accuracy PIE emits `WorkflowItem` events on opportunity discovery
- Opportunities appear in CAPTURED state in UltAi queue
- EXECUTED state triggers VaultLine audit write
- Opportunities-per-week metric is visible in a dashboard query

**Risks:**
- Accuracy PIE source may not be found (Week 1 dependency) → Phase 4 cannot start without it
- Integration requires Accuracy PIE API contract to be defined → define and agree before Week 4 starts

**Rollback:** Remove PIE event emitter; system reverts to manual intake only.

---

### Phase 5 — Week 5: FineGuard Integration

**Objective:** Wire FineGuard compliance alerts through `packages/core-workflow` into VaultLine.

**Success Criteria:**
- CH API polling creates `WorkflowItem { type: 'compliance_alert' }` on detection
- Alert flows CAPTURED → ANALYSED → VERIFIED → APPROVED → EXECUTED
- Email delivery confirmed by `EXECUTED` transition
- Alert record appears in VaultLine audit trail
- Stripe payment status is checked before alert delivery (paying customers only)

**Risks:**
- CH API rate limits → implement exponential backoff in `core-workflow` consumer
- Email delivery depends on a mail provider not yet confirmed → verify in Week 1

**Rollback:** Disable CH polling cron; alerts stop generating. No data loss.

---

### Phase 6 — Week 6: UltAi Integration

**Objective:** Migrate UltAi's ClerkOS case management onto `packages/core-workflow` as its execution layer.

**Success Criteria:**
- All case transitions flow through `WorkflowEngine` not direct DB writes
- Bundle generation triggers `EXECUTED` state, not a separate queue item type
- Every case lifecycle step appears in VaultLine audit trail
- Dashboard metrics (open cases, completed tasks, hearings) unchanged

**Risks:**
- Most complex integration — UltAi is the heaviest consumer
- Diary and allocation tables are not in the lifecycle → keep them as operational data, not workflow states
- Service Bus queue items must be replayed if format changes → drain queue before migration

**Rollback:** Re-enable direct ClerkOS engine path via config flag; workflow package is bypassed.

---

## Section 6 — Scope Control

### Systems to Leave Untouched

| System | Reason |
|---|---|
| `azure-functions/` | Azure Durable Functions orchestrator is correctly placed and wired. Extract only if a second non-Azure runtime is needed. |
| `server/services/blobStorage.ts` | Moves to `packages/core-audit` in Week 2 but logic is correct — no rewrite. |
| `server/services/companiesHouse.ts` | Moves to `apps/fineguard/` in Week 2 — logic is correct, API integration working. |
| `staticwebapp.config.json` | Correct. Leave in place for Azure Static Web Apps deployment. |

### Systems to Archive

| System | Reason |
|---|---|
| P3 `BookDemo` page (`src/pages/BookDemo.tsx`) | Lead capture only. Park. Do not delete yet — monitor conversion. Archive after 90 days of zero traffic. |
| Standalone `Pricing.tsx` / `Bundles.tsx` | Merge into FineGuard app checkout flow. Archive standalone pages after FineGuard integration. |
| `IMPROVEMENTS-LOG.md`, `DEPLOYMENT-TRACKING-SETUP.md`, `COMPANIES-HOUSE-INTEGRATION-COMPLETE.md` | Historical notes. Archive to `docs/archive/`. Remove from root. |

### Systems to Merge

| System | Merge Target | Notes |
|---|---|---|
| UltAi landing page (`src/pages/UltAi.tsx`) | `apps/ultai/` | Merge into app shell |
| FineGuard landing page (`src/pages/FineGuard.tsx`) | `apps/fineguard/` | Merge into app shell |
| VaultLine landing page (`src/pages/VaultLine.tsx`) | `apps/vaultline/` | Merge into app shell |
| ClerkOS engine files | `packages/core-workflow/` | Week 2 extraction |
| tRPC core files | `packages/core-auth/` | Week 2 extraction |
| Drizzle schema + db helpers | `packages/core-db/` | Week 2 extraction |

### Systems to Monitor

| System | Metric | Threshold |
|---|---|---|
| Accuracy PIE | Opportunities discovered per week | Alert if zero for 7 days |
| FineGuard | Companies monitored count | Alert if count drops |
| VaultLine | `auditEvents` write rate | Alert if zero for 1 hour during business hours |
| UltAi | Tasks completed per week | Alert if drops >30% week-on-week |
| Azure Service Bus | Dead-letter queue depth | Alert if DLQ > 0 |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Accuracy PIE source not found | Medium | High | Escalate in Week 1; do not invent replacement; check with stakeholders |
| Azure resources not provisioned | Medium | High | Run `deploy/main.bicep` against dev; verify before Week 3 |
| DB migration breaks production data | Low | High | Write rollback script before every migration; test on a clone |
| Stripe webhooks not reaching server | Medium | Medium | Verify `STRIPE_WEBHOOK_SECRET` in Week 1; use Stripe CLI for local testing |
| CH API key expired or rate-limited | Low | Medium | Test in Week 1; add retry/backoff in Week 5 |
| Monorepo extraction breaks imports | Medium | Medium | Run `tsc --noEmit` after each file move; do not merge until green |
| HITL_REQUIRED state has no notification path | High | Medium | Stub interface in Week 3; wire real notification in Week 6 |
| Service Bus queue format change during migration | Low | Medium | Drain queue before any format change; keep old handler until confirmed empty |

---

## Appendix — Current File Inventory

### Extractable to `packages/core-workflow`
- `server/engine/clerkOS.engine.ts` — state machine, bundle eligibility, allocation validation
- `server/engine/systemSpine.ts` — queue dispatcher

### Extractable to `packages/core-auth`
- `server/trpc/_core/trpc.ts` — procedure builders, role guards
- `server/trpc/_core/context.ts` — JWT parsing, tenant resolution

### Extractable to `packages/core-db`
- `server/drizzle/schema.ts` — all table definitions
- `server/db/migrate.ts` — migration runner
- `server/db/seed.ts` — seed data
- `server/trpc/db.ts` — connection pool, audit write helper

### Extractable to `packages/core-audit`
- `server/services/blobStorage.ts` — Azure Blob client
- `server/services/serviceBus.ts` — Azure Service Bus client
- Audit write path from `server/trpc/db.ts` (`writeAuditEvent`)

### Stays in `apps/vaultline`
- `azure-functions/` — Azure Durable Functions (VaultLine only)
- `deploy/main.bicep` — Azure IaC
- VaultLine-specific UI components

### Stays in `apps/fineguard`
- `server/services/companiesHouse.ts`
- FineGuard UI + compliance bundle checkout

### Stays in `apps/ultai`
- All tRPC routers (cases, hearings, documents, allocations, diary, dashboard)
- ClerkOS-branded UI pages
