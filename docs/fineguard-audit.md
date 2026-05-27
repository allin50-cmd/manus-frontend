# FineGuard Architecture Audit

**Authority:** Direct source inspection only. Every claim cites a file and line number.  
**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-27  

---

## 1. CURRENT CORE SYSTEM INVENTORY

### 1.1 Alert Engine

| Component | Status | File | Dependencies | Risk |
|---|---|---|---|---|
| FineGuard activation rules | **OPERATIONAL** | `server/lib/fineguard-rules.ts:1-105` | None (pure) | LOW |
| PIE→FineGuard bridge | **OPERATIONAL** | `server/lib/pie-fineguard.ts:1-209` | `db`, `monitoredCompanies`, `writeAuditEvent`, `wrapGracefully` | LOW |
| Compliance check scheduler | **OPERATIONAL** (no trigger) | `server/app.ts:1009-1208` | `companiesHouseService`, `db`, `scheduler-lease`, `wrapGracefully` | MEDIUM |
| FineGuard activation via Stripe | **OPERATIONAL** | `server/app.ts:109-152` | `stripe`, `monitoredCompanies` | LOW |

**Critical gap:** The compliance check scheduler exists and is fully implemented, but has **no external trigger**. `GET /api/internal/run-compliance-check` is a polling endpoint — it must be called externally on a schedule (cron, Vercel Cron, or similar). Nothing calls it.

**Alert delivery gap:** When `alertRequired = true` (line 1119), the scheduler logs a warning and records an audit event. **That is the entire alert.** No email. No webhook. No channel. The alert is written to a log that nobody reads.

---

### 1.2 Governance Rules

| Component | Status | File | Notes |
|---|---|---|---|
| Binary FineGuard gate (activate / not) | **OPERATIONAL** | `server/lib/fineguard-rules.ts:75-105` | Pure, deterministic. PIE-originated AND (highUrgency OR highValue) |
| ALLOW/MODIFY/ESCALATE/DENY engine | **OPERATIONAL** | `server/lib/execution-governance/` | Pure, deterministic. 7 rules, 4 system states |
| Operational overrides | **OPERATIONAL** | `server/lib/override-engine.ts`, `server/app.ts:1210-1480` | DB-backed, soft-expire, cache TTL 30s |
| Circuit breaker | **OPERATIONAL** | `server/lib/circuit-breaker.ts` | In-memory. Resets on cold start |
| Global circuit sync | **OPERATIONAL** | `server/lib/global-circuit-sync.ts` | Cross-instance, eventual consistency via Postgres |
| Retry budgets | **OPERATIONAL** | `server/lib/retry-budget.ts` | Per-dependency sliding window |
| Operations Control Plane | **OPERATIONAL** | `server/app.ts:1210-1430` | POST/GET/DELETE overrides, annotate incidents |

---

### 1.3 Audit / Event Store

| Component | Status | File | Notes |
|---|---|---|---|
| `clerk_audit_events` table | **OPERATIONAL** | `server/drizzle/schema.ts:278-309` | Immutable by RLS rule (not yet applied) |
| `writeAuditEvent()` | **OPERATIONAL** | `server/trpc/db.ts:236-244` | Requires tenantId + one of entityId/entityUuid |
| VaultLine audit writes (PIE path) | **OPERATIONAL** | `server/app.ts:651-669`, `server/lib/pie-fineguard.ts:76-96` | 3 events per PIE ingestion |
| VaultLine audit writes (scheduler) | **OPERATIONAL** | `server/app.ts:1119-1140` | 1 event per company per run |
| Governance audit payloads | **OPERATIONAL** | `server/lib/execution-governance/auditEvent.ts` | Returns payload; caller must persist |
| `system_failure_captured` events | **OPERATIONAL** | `server/lib/wrap-gracefully.ts:196-233` | Written on every wrapGracefully failure |
| **Replayable event history** | **PARTIAL** | `server/app.ts:567-612` | PIE replay path exists. No general event replay. No event sourcing. No replay-from-timestamp. |
| RLS immutability enforcement | **NOT APPLIED** | `server/drizzle/rls-migration.sql` | File exists but not in bootstrap. Audit rows can be deleted without it. |

---

### 1.4 Workflow Orchestration

| Component | Status | File | Notes |
|---|---|---|---|
| Case state machine (4 states) | **OPERATIONAL** | `server/engine/clerkOS.engine.ts:15-25` | `open`, `in_progress`, `on_hold`, `closed` |
| Bundle initiation | **OPERATIONAL** | `server/engine/clerkOS.engine.ts:97-132` | Inserts bundle row + queues to Service Bus |
| SystemSpine dispatcher | **OPERATIONAL** (Azure-dependent) | `server/engine/systemSpine.ts:35-145` | Routes queue items. Sends to Azure Service Bus. Falls back silently if no Service Bus. |
| Azure Durable Functions orchestrator | **STUB** | `azure-functions/src/index.ts:1-179` | Structurally complete. `validateBundle` returns empty array (line 133). `renderDocumentPage` returns empty buffer (line 152). `mergeBundlePDF` does no merging (line 165). `finalizeBundle` does no DB write (line 174). All activities are placeholders. |
| FineGuard alert workflow | **MISSING** | — | No workflow for: alert created → operator notified → operator acknowledges → case opened → resolved |
| 10-state matter lifecycle | **MISSING** | — | Only 4 states implemented. ANALYSED, ESTIMATED, VERIFIED, CONFIRMED, HITL_REQUIRED, APPROVED, EXECUTED, RECORDED do not exist. |

---

### 1.5 Operator Actions / Dashboards

| Component | Status | File | Notes |
|---|---|---|---|
| Admin dashboard (data view) | **OPERATIONAL** | `src/pages/Admin.tsx:538` | Shows leads, intakes, compliance bundles, contacts, deployment status |
| ComplianceBundle page | **OPERATIONAL** | `src/pages/ComplianceBundle.tsx:627` | On-demand CH lookup + Stripe checkout |
| FineGuard landing page | **PLACEHOLDER** | `src/pages/FineGuard.tsx:32` | 32 lines. Marketing text only. Links to ComplianceBundle. |
| Operator alert queue | **MISSING** | — | No UI for: view active alerts, acknowledge, escalate, close |
| Operator override UI | **MISSING** | — | Operations Control Plane API exists; no UI |
| Governance decision view | **MISSING** | — | No UI for: view ALLOW/ESCALATE/DENY decisions |
| Audit trail browser | **MISSING** | — | No UI for: browse `clerk_audit_events` by entity/correlation |

---

### 1.6 APIs

| Endpoint | Status | Auth | Notes |
|---|---|---|---|
| `POST /api/pie/opportunity` | **OPERATIONAL** | None | No auth. Anyone can POST. |
| `GET /api/internal/run-compliance-check` | **OPERATIONAL** | X-ADMIN-KEY | Requires `companiesHouseService` |
| `POST /api/compliance-bundle` | **OPERATIONAL** | None | On-demand CH lookup |
| `POST /api/stripe/webhook` | **OPERATIONAL** | Stripe sig | Activates monitoring on payment |
| `POST /api/stripe/checkout` | **OPERATIONAL** | None | Creates Stripe checkout session |
| `GET /api/internal/resilience` | **OPERATIONAL** | X-ADMIN-KEY | Circuit + stats + traces |
| `POST /api/internal/operations/override` | **OPERATIONAL** | X-ADMIN-KEY | Create override |
| `GET /api/internal/operations/overrides` | **OPERATIONAL** | X-ADMIN-KEY | List active overrides |
| `DELETE /api/internal/operations/override/:id` | **OPERATIONAL** | X-ADMIN-KEY | Remove override |
| `POST /api/internal/operations/annotate` | **OPERATIONAL** | X-ADMIN-KEY | Incident annotation |
| `GET /api/health` | **OPERATIONAL** | None | DB connectivity check |
| `POST /api/intake` | **OPERATIONAL** | None | Brand-suite intake form |
| Alert delivery endpoints | **MISSING** | — | No webhook-out, no email-out |

---

### 1.7 Persistence

| Store | Status | Schema | Notes |
|---|---|---|---|
| `monitored_companies` | **OPERATIONAL** | `server/db/schema.ts:86` | No status column. No `last_checked_at`. No alert history. |
| `intake_forms` | **OPERATIONAL** | `server/db/schema.ts:37` | `sourceRef` UNIQUE for idempotency |
| `compliance_bundles` | **OPERATIONAL** | `server/db/schema.ts:55` | On-demand CH result storage |
| `clerk_audit_events` | **OPERATIONAL** | `server/drizzle/schema.ts:278` | All audit writes go here |
| `operational_overrides` | **OPERATIONAL** | `server/drizzle/schema.ts:348` | Soft-expire pattern |
| `global_resilience_state` | **OPERATIONAL** | `server/drizzle/schema.ts:312` | Cross-instance circuit sync |
| `scheduler_leases` | **OPERATIONAL** | `server/drizzle/schema.ts:324` | Distributed lock |
| Alert records table | **MISSING** | — | No dedicated table for alert instances, status, delivery attempts |
| Workflow state table | **MISSING** | — | No table for: open workflows, escalations, assignments |

---

## 2. MICROSOFT DEPENDENCY ANALYSIS

### 2.1 Azure Service Bus

| Item | Assessment |
|---|---|
| **Where used** | `server/engine/systemSpine.ts:38` — sends bundle jobs; `server/services/serviceBus.ts` — client wrapper |
| **What it does** | Routes `bundle_generate`, `case_transition`, `allocation_escalate` queue items. Also intended as trigger for Azure Durable Functions orchestrator. |
| **Graceful degradation** | YES — `ServiceBusClient.send()` returns `false` silently when `AZURE_SERVICE_BUS_CONNECTION_STRING` is absent |
| **Required for MVP?** | **NO** |
| **Optional adapter?** | **YES** — the wrapper pattern is already correct. ServiceBus is behind an abstraction. |
| **What breaks without it** | Bundle jobs are dropped silently. Since the Durable Functions activities are all stubs, nothing actually breaks for MVP. |
| **Cost risk** | Medium — Service Bus Standard: ~£8/month per 1M operations |
| **Lock-in risk** | LOW — already isolated in `server/services/serviceBus.ts`. One file to swap. |
| **Recommendation** | Keep as optional adapter. Remove the hard import from production dependencies until needed. |

### 2.2 Azure Blob Storage

| Item | Assessment |
|---|---|
| **Where used** | `server/services/blobStorage.ts` — upload, SAS URL generation |
| **What it does** | Document storage for compliance bundles. SAS URLs for direct client access. |
| **Graceful degradation** | YES — returns `null` silently when unconfigured |
| **Required for MVP?** | **NO** |
| **Optional adapter?** | **YES** — already isolated. Needs a storage interface abstraction so S3, R2, or local disk can substitute. |
| **Cost risk** | Low — Blob Storage LRS: ~£0.015/GB/month |
| **Lock-in risk** | LOW — already isolated. |
| **Recommendation** | Keep as optional adapter. Add a `StorageProvider` interface so non-Azure storage can be plugged in. |

### 2.3 Azure Durable Functions

| Item | Assessment |
|---|---|
| **Where used** | `azure-functions/src/index.ts` — bundle orchestration |
| **Required for MVP?** | **NO** |
| **Optional adapter?** | Currently **NO** — it is structured as a separate deployment target |
| **What it does** | Intended to orchestrate parallel document rendering and PDF merge for compliance bundles. All activities are placeholders. |
| **Cost risk** | HIGH — Durable Functions requires Azure Functions Premium or Dedicated plan (~£80-200/month) plus Service Bus for triggers |
| **Lock-in risk** | HIGH — Durable Functions orchestration API is Azure-specific. Migrating to Step Functions or Temporal requires rewrite. |
| **Recommendation** | **Do not deploy or depend on this for MVP.** The orchestrator is all stubs. The same workflow can be implemented synchronously in a single HTTP handler for MVP. Convert to adapter pattern only after bundle generation is genuinely needed. |

### 2.4 Azure AD B2C

| Item | Assessment |
|---|---|
| **Where used** | `server/trpc/_core/auth.ts:7-67` — JWT verification |
| **Required for MVP?** | **NO** — dev fallback (`x-user-open-id` header) active in non-production |
| **Optional adapter?** | **YES** — `verifyB2CToken` is isolated behind `getUserFromRequest`. The function returns `null` when B2C is unconfigured; auth gracefully degrades. |
| **Cost risk** | Low — Azure AD B2C has a free tier (50,000 MAUs) |
| **Lock-in risk** | MEDIUM — JWT format and JWKS discovery is B2C-specific but replaceable |
| **Recommendation** | Keep as adapter. For MVP, the header fallback is sufficient. |

### 2.5 `@azure/service-bus` and `@azure/storage-blob` npm packages

| Issue | Detail |
|---|---|
| **They are in `dependencies`** | Both `@azure/service-bus` and `@azure/storage-blob` are production dependencies. They are included in every Vercel serverless function bundle even when unconfigured. |
| **Cost** | Bundle size. Cold start penalty. |
| **Risk** | Service Bus SDK is ~1.5MB. Storage Blob SDK is ~2MB. For a Vercel serverless function, cold start matters. |
| **Recommendation** | Move to `optionalDependencies` or lazy-import only when env vars are present. For MVP, the SDKs can be removed entirely since neither service is used operationally. |

---

## 3. ADAPTER / CONNECTOR REVIEW

### 3.1 What exists as adapters (correctly isolated)

| Adapter | File | Assessment |
|---|---|---|
| Companies House | `server/services/companiesHouse.ts` | **CORRECT** — exported as `companiesHouseService: CompaniesHouseService | null`. Callers guard with `if (!companiesHouseService)`. |
| Azure Blob Storage | `server/services/blobStorage.ts` | **CORRECT** — returns `null` when unconfigured. Needs a `StorageProvider` interface to become truly swappable. |
| Azure Service Bus | `server/services/serviceBus.ts` | **CORRECT** — silently no-ops. Needs a `QueueProvider` interface to become truly swappable. |
| Stripe | `server/app.ts:55-56` | **CORRECT** — `stripe = stripeSecretKey ? new Stripe(...) : null`. Routes return 503 when null. |

### 3.2 What is missing abstraction

| Gap | Detail |
|---|---|
| **Alert delivery** | No `AlertDeliveryProvider` interface. When an alert is required (line 1119), it logs to stdout. There is no abstraction layer that a Teams/Slack/Email/webhook adapter could plug into. This is the single most important missing abstraction for MVP. |
| **Queue/workflow trigger** | `SystemSpine` hardcodes `ServiceBusClient.send()`. A `QueueProvider` interface would allow an in-process queue (BullMQ, simple array, HTTP poll) to substitute without changing SystemSpine logic. |
| **Storage** | `BlobStorage` is isolated but not behind an interface. A `StorageProvider` interface would allow S3/R2/local substitution. |
| **Outbound HTTP / webhooks** | No generic webhook-out mechanism. FineGuard has no way to push alerts to external systems. |

### 3.3 What should be connectors (not core)

| Connector | Status | Recommendation |
|---|---|---|
| Companies House | Operational adapter | Stay as connector. Already correct. |
| HMRC | Not present | Add as connector when needed |
| Planning portals | Not present | Add as connector when needed |
| Stripe | Operational adapter | Stay as connector. Billing only. |
| Azure Service Bus | Operational adapter | Demote to optional connector. Not needed for MVP. |
| Durable Functions | Stub | Do not build as core. Keep as optional orchestration surface. |

---

## 4. EXECUTION GOVERNANCE REVIEW

| Capability | Status | Evidence |
|---|---|---|
| **ALLOW / MODIFY / ESCALATE / DENY** | **OPERATIONAL** | `server/lib/execution-governance/decisionGate.ts` — `evaluateExecutionGovernance()`. 7 rules, 4 system states. 51 tests passing. |
| **Alert severity states** | **PARTIAL** | `riskLevel` (low/medium/high/critical) in `GovernanceEvent`. FineGuard uses `riskLevel` from Companies House (`server/services/companiesHouse.ts`). No `severity` field on stored alerts. No dedicated alert table. |
| **Replayable audit chains** | **PARTIAL** | PIE replay path exists (`server/app.ts:567-612`). `correlationId` threads events. No general-purpose event replay. No replay-from-timestamp. `ingestion_replayed` event written but activation is re-attempted, not re-derived from stored events. |
| **Operational intervention workflows** | **PARTIAL** | Operations Control Plane allows operator overrides and annotations. No alert acknowledgement workflow. No alert-to-case escalation path. No HITL gate. |
| **Degraded-state handling** | **OPERATIONAL** | `wrapGracefully` + circuit breaker + retry budgets + `AMBER/RED/BLACK` system states. All operational. |
| **Queue-driven workflows** | **PARTIAL** | `systemSpine.ts` queue dispatcher exists. Azure Service Bus is the intended queue. No alternative queue for non-Azure environments. No FineGuard alert queue. |
| **Deterministic governance rules** | **OPERATIONAL** | Both `fineguard-rules.ts` and `execution-governance/policyEngine.ts` are pure, deterministic, fully tested. |
| **Human-in-the-loop gate** | **MISSING** | `ESCALATE` and `DENY` decisions are produced. There is no mechanism to hold execution, route to a human, record their decision, and resume. Governance produces the decision; nobody acts on it. |
| **Alert-to-case lifecycle** | **MISSING** | No flow: alert fires → case opened → assigned to operator → operator acts → case closes. |

---

## 5. MVP GAP ANALYSIS

"Operational FineGuard Alert Governance MVP" requires this workflow:

```
Event detected
→ Risk evaluated
→ Policy decision made
→ Alert classified
→ Operator workflow triggered
→ Audit event persisted
→ Replayable event history stored
```

**What exists and works:**

- ✅ Event detected (PIE ingestion, Stripe webhook, scheduled CH check)
- ✅ Risk evaluated (`evaluateFineGuardActivation`, `getComplianceStatus`)
- ✅ Policy decision made (governance gate, binary FineGuard gate)
- ✅ Audit event persisted (VaultLine writes, `clerk_audit_events`)

**What is missing:**

- ❌ Alert classified and stored — there is no `alerts` table. When `alertRequired = true` in the scheduler, the alert exists only in the JSON `metadata` column of an audit event. It cannot be queried, listed, acknowledged, or acted on.
- ❌ Operator workflow triggered — no mechanism to notify an operator when an alert fires
- ❌ Replayable event history — `correlationId` threads exist but there is no `GET /api/audit/:correlationId` endpoint or replay API

**Minimum required additions:**

| Gap | Work required | Complexity |
|---|---|---|
| `alerts` table | Add schema, migration, write on `alertRequired = true` | LOW |
| Alert list API | `GET /api/internal/alerts` — paginated, filterable by status | LOW |
| Alert acknowledge API | `PATCH /api/internal/alerts/:id/acknowledge` | LOW |
| Alert delivery hook | `AlertDeliveryProvider` interface + one concrete implementation (HTTP webhook or email) | LOW-MEDIUM |
| Scheduler external trigger | Vercel Cron or equivalent calling `run-compliance-check` | LOW |
| Audit trail query API | `GET /api/internal/audit?correlationId=&entityUuid=` | LOW |
| RLS migration applied | Run `rls-migration.sql` once on Neon | LOW |

**What should NOT be built for MVP:**

- Full 10-state matter lifecycle (ULTRA-010)
- Azure Durable Functions bundle orchestration (all stubs)
- Teams/SharePoint integration
- Monorepo consolidation (ULTRA-011)
- Any AI call-centre features

---

## 6. RECOMMENDED NEXT 30 DAYS

### Priority 1 — Make alerts real (Days 1-7)

| Task | Complexity | Op Value | Cost Impact | Priority |
|---|---|---|---|---|
| Add `alerts` table (`id`, `company_id`, `alert_type`, `risk_level`, `status`, `metadata`, `created_at`, `acknowledged_at`, `acknowledged_by`) | LOW | HIGH | None | **HIGH** |
| Write alert row when `alertRequired = true` in scheduler | LOW | HIGH | None | **HIGH** |
| `GET /api/internal/alerts` — list with status filter | LOW | HIGH | None | **HIGH** |
| `PATCH /api/internal/alerts/:id/acknowledge` | LOW | HIGH | None | **HIGH** |
| Apply RLS migration on Neon | LOW | MEDIUM | None | **HIGH** |

Outcome: For the first time, FineGuard has a queryable record of every alert it has ever fired.

---

### Priority 2 — Wire the scheduler (Days 3-10)

| Task | Complexity | Op Value | Cost Impact | Priority |
|---|---|---|---|---|
| Configure Vercel Cron job to call `run-compliance-check` daily | LOW | HIGH | None (Vercel Cron is free on Pro) | **HIGH** |
| Add `last_checked_at`, `alert_count`, `status` columns to `monitored_companies` | LOW | MEDIUM | None | **MEDIUM** |
| Add `GET /api/internal/monitored-companies` — list with last-check status | LOW | MEDIUM | None | **MEDIUM** |

Outcome: The scheduler actually runs. Results are visible. This is the first time FineGuard monitors anything automatically.

---

### Priority 3 — Alert delivery (Days 7-14)

| Task | Complexity | Op Value | Cost Impact | Priority |
|---|---|---|---|---|
| `AlertDeliveryProvider` interface (1 method: `deliver(alert)`) | LOW | HIGH | None | **HIGH** |
| HTTP webhook implementation (`POST` to a configured URL) | LOW | HIGH | None | **HIGH** |
| Email implementation (Resend or SendGrid — free tier sufficient for MVP) | MEDIUM | HIGH | ~£0/month at MVP scale | **HIGH** |

Outcome: When an alert fires, an operator receives a notification. This is the first time FineGuard actually alerts anyone.

---

### Priority 4 — Audit trail query (Days 10-21)

| Task | Complexity | Op Value | Cost Impact | Priority |
|---|---|---|---|---|
| `GET /api/internal/audit?correlationId=` — returns all events in a chain | LOW | MEDIUM | None | **MEDIUM** |
| `GET /api/internal/audit?entityUuid=` — returns all events for an entity | LOW | MEDIUM | None | **MEDIUM** |
| Alert detail page (minimal UI) showing alert + audit chain | MEDIUM | MEDIUM | None | **MEDIUM** |

Outcome: FineGuard has a replayable audit trail that operators can actually read.

---

### Priority 5 — Operator alert UI (Days 14-30)

| Task | Complexity | Op Value | Cost Impact | Priority |
|---|---|---|---|---|
| Alert inbox component in Admin.tsx | MEDIUM | HIGH | None | **MEDIUM** |
| Acknowledge / escalate / close actions | MEDIUM | HIGH | None | **MEDIUM** |
| Scheduler status indicator | LOW | MEDIUM | None | **LOW** |

Outcome: Operators can see and act on alerts without using the API directly.

---

## 7. ANTI-BLOAT REVIEW

### Architectural bloat

| Item | Assessment | Recommendation |
|---|---|---|
| **Azure Durable Functions** (`azure-functions/`) | 179-line orchestrator where every activity is a stub that returns empty data. Introduces dependency on `durable-functions`, `@azure/functions`, Service Bus trigger, Blob Storage. Costs ~£80-200/month when deployed. Zero working functionality. | **Remove from production dependencies for MVP.** Keep the file but do not deploy. Re-evaluate when bundle generation is genuinely required. |
| **`@azure/service-bus` in production deps** | Service Bus SDK (~1.5MB) bundled into every serverless function even when no `AZURE_SERVICE_BUS_CONNECTION_STRING` is set. Increases cold start time. | Move to `optionalDependencies` or remove until operationally needed. |
| **`@azure/storage-blob` in production deps** | Same issue. ~2MB. Not used for MVP. | Move to `optionalDependencies`. |
| **Two separate DB schemas** (`server/db/` and `server/drizzle/`) | `server/db/` = brand-suite schema. `server/drizzle/` = ClerkOS schema. Both hit the same Neon instance. Two separate Drizzle instances, two migration runners, two seed scripts. | Acceptable for now. Do not merge — the schemas serve different purposes. Flag for consolidation after deployment is stable. |
| **`systemSpine.ts` hardcodes Service Bus** | `handleBundleGenerate` sends directly to `ServiceBusClient.send('clerkos-bundles', ...)`. If Service Bus is not configured, the message is silently dropped. | Extract `QueueProvider` interface. For MVP, `systemSpine` can process synchronously in-process. |
| **Speculative abstractions in execution-governance** | `MODIFY` decision in `ExecutionDecision` is unreachable — no rule produces it. Documented but adds noise. | Keep as reserved; document more explicitly in types. |

### Unnecessary complexity

| Item | Detail |
|---|---|
| **`uuid` package** | `package.json` includes `uuid` as a production dependency. Node 18+ has `crypto.randomUUID()` built in. The project already uses `crypto.randomUUID()` in `server/lib/logger.ts`. | Remove `uuid` and `@types/uuid`. |
| **`wouter` AND `react-router-dom`** | Both routing libraries are in dependencies. `App.tsx` uses `wouter`. `react-router-dom` is unused or redundant. | Remove `react-router-dom` from dependencies. |
| **Multiple React query clients** | `@tanstack/react-query`, `@trpc/react-query`, `@trpc/client` — tRPC is barely used (routers exist but frontend calls `fetch()` directly in most components). | Assess whether tRPC is actually needed. If frontend doesn't use it, remove the tRPC client packages. |

### Premature scaling patterns

| Pattern | Assessment |
|---|---|
| Global circuit sync via Postgres | Operationally sound but only relevant with multiple concurrent Vercel function instances. For current usage (one Vercel function), the in-process circuit breaker is sufficient. The sync adds 2 DB writes per state change. **Keep — it is correct and the overhead is negligible.** |
| Distributed scheduler lease | Correct and necessary for Vercel. Keep. |
| Retry budget | Correct. Keep. |

---

## 8. FINAL VERDICT

### What FineGuard ACTUALLY is today

A **compliance checking engine with a silent alert system**.

It can:
- Monitor a `monitored_companies` watchlist via the Companies House API
- Detect overdue filings and calculate risk levels
- Write structured audit events to a persistent log
- Auto-activate monitoring when a PIE opportunity arrives
- Accept Stripe payment to trigger monitoring enrollment
- Evaluate governance decisions deterministically (ALLOW/ESCALATE/DENY)
- Run with full operational resilience: circuit breakers, retry budgets, override controls, graceful degradation

It cannot:
- Deliver an alert to anyone
- Show an operator a list of active alerts
- Allow an operator to acknowledge or act on an alert
- Run the compliance check automatically (no scheduler trigger)
- Prove that a real company is being monitored (schema has no `last_checked_at`)

### What FineGuard is CLOSE to becoming

A working governance alert system. The gap between "logs a warning" and "delivers an alert" is small in code terms — one table, two API endpoints, one interface with one implementation.

The compliance check scheduler is fully implemented. It has resilience, circuit breaking, retry, distributed leasing, and audit trail. It runs correctly when called. It just isn't called.

### Biggest operational strengths

1. **Resilience infrastructure is production-grade.** `wrapGracefully` + circuit breaker + retry budgets + operational overrides is a complete, tested, well-structured degraded-mode system. Most startups don't have this at all.

2. **Audit trail is correct.** Every significant action writes a structured `clerk_audit_events` row with correlation ID, entity UUID, action type, and JSON metadata. The trail is queryable and, once RLS is applied, immutable.

3. **Governance rules are deterministic and tested.** Both FineGuard activation and the execution governance engine are pure functions with 100% test coverage. They will not produce surprising results.

4. **The PIE→FineGuard→VaultLine chain is proven.** The full path from external opportunity to monitoring activation to audit log works and is tested at 241/241.

### Biggest technical weaknesses

1. **No alert delivery.** The single most critical gap. FineGuard detects a problem, writes it to a log, and stops. Nobody is told.

2. **No `alerts` table.** Alerts exist only as metadata in audit events. They cannot be listed, queried by status, acknowledged, or counted.

3. **Scheduler has no trigger.** `run-compliance-check` is complete but never runs automatically.

4. **Azure Durable Functions are stubs.** The orchestration layer is entirely placeholder code. If deployed, it would fail on the first bundle job.

5. **`POST /api/pie/opportunity` has no authentication.** Any unauthenticated caller can submit arbitrary PIE payloads. This will auto-activate FineGuard monitoring, insert rows into `monitored_companies`, and write audit events. No rate limiting, no origin validation.

### Biggest cost risks

1. **Azure Durable Functions + Service Bus** if deployed prematurely: £80-300/month for zero working functionality. Do not activate.

2. **Companies House API rate limits**: the free tier allows 600 requests/minute. At scale, the paid streaming API or cached lookups become necessary.

3. **Neon free tier**: 0.5GB storage, 1 compute unit. Sufficient for MVP. Monitor before hitting limits.

### Biggest strategic opportunities

1. **Alert delivery is one sprint.** Adding a webhook + email adapter and an `alerts` table is under a week of work. It transforms FineGuard from "detects problems silently" to "notifies operators of problems." That is the product.

2. **The governance engine is a genuine differentiator.** The execution governance module (ALLOW/ESCALATE/DENY with reason codes, system states, VaultLine integration) is more sophisticated than typical compliance tools. It should be surfaced — not buried in a library.

3. **Cloud-agnostic by near-accident.** The Azure adapters are already isolated. Removing the Azure packages from production dependencies costs one hour of work. FineGuard could run entirely on Neon + Vercel + Resend (email) for under £20/month.

### Fastest route to operational proof

```
Day 1-2:   Add alerts table + write alert on alertRequired=true
Day 3:     Wire Vercel Cron to run-compliance-check daily
Day 4-5:   Add GET /api/internal/alerts endpoint
Day 6-7:   Add AlertDeliveryProvider interface + HTTP webhook implementation
Day 8-10:  Wire one real company into monitored_companies + verify end-to-end
Day 11-14: Add Resend/SendGrid email adapter (free tier)
Day 15:    Apply RLS migration on Neon
Day 16-20: Alert inbox in Admin.tsx — view, acknowledge, close
Day 21:    Demo: company monitored → filing overdue → alert delivered → operator acknowledges
```

**Total cost at this point:** ~£15-20/month (Neon Pro, Vercel Pro, Resend free tier, Companies House free tier).

**No Azure required. No Durable Functions. No Service Bus.**
