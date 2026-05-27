# Workflow Proof

**Authority:** apps/registry.json  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r (HEAD: 4de0414)  
**Updated:** 2026-05-26  
**Method:** Direct source inspection + test suite execution. No database available in this environment — DB-path evidence is from code tracing and prior live-run records. All claims are annotated with their evidence source.

---

## Objective

Prove that the P1 business workflow can operate end-to-end using existing code:

```
Accuracy PIE → UltAi → FineGuard → VaultLine
```

Using one simulated Bromley planning opportunity: application reference `24/AP/1234`.

---

## Test Suite — Current State

**Command executed:** `npm test`  
**Result:** 180/180 tests passing across 13 test files in 5.28s

```
Test Files  13 passed (13)
      Tests  180 passed (180)
   Start at  03:14:08
   Duration  5.28s
```

Files covered:
- `server/pie.test.ts` — PIE schema unit tests (no DB)
- `server/pie-fineguard.test.ts` — FineGuard activation bridge (mocked DB)
- `server/fineguard-rules.test.ts` — deterministic rule evaluation (no DB)
- `server/resilience-endpoint.test.ts` — resilience API
- `server/operations-endpoint.test.ts` — Operations Control Plane
- `server/lib/scheduler-lease.test.ts` — distributed lease
- `server/lib/retry-budget.test.ts` — retry budget
- `server/lib/override-engine.test.ts` — override engine
- `server/integration.test.ts` — integration tests (skip cleanly without DATABASE_URL)
- tRPC unit tests (30 tests)

---

## Files Inspected

| File | Role |
|---|---|
| `apps/registry.json` | Authority document — component status and source paths |
| `server/app.ts` | All HTTP routes |
| `server/db/schema.ts` | Brand-suite tables: intakeForms, complianceBundles, monitoredCompanies |
| `server/drizzle/schema.ts` | ClerkOS tables: clerk_audit_events, clerk_cases, operational_overrides |
| `server/engine/clerkOS.engine.ts` | 4-state lifecycle engine + audit writes |
| `server/trpc/db.ts` | writeAuditEvent(), getDb(), all ClerkOS DB helpers |
| `server/lib/pie-schema.ts` | Zod schema for PIE payload |
| `server/lib/pie-fineguard.ts` | PIE→FineGuard activation bridge |
| `server/lib/fineguard-rules.ts` | Deterministic FineGuard activation rules |
| `server/services/companiesHouse.ts` | CH API integration (referenced) |
| `server/pie.test.ts` | PIE schema tests |
| `server/pie-fineguard.test.ts` | FineGuard bridge tests |

---

## Bromley Simulation — Payload

```json
{
  "externalRef": "24/AP/1234",
  "applicantName": "Bromley Development Ltd",
  "applicantEmail": "planning@bromley-dev.co.uk",
  "description": "Residential development, 4 dwellings, Bromley Borough",
  "siteAddress": "42 High Street, Bromley BR1 1AB",
  "district": "Bromley",
  "urgency": "high",
  "estimatedValue": "£2,400,000",
  "submittedAt": "2026-05-26T09:00:00+01:00"
}
```

This payload is valid per `PieOpportunitySchema` — confirmed by `server/pie.test.ts` which tests the identical shape.

---

## Workflow Trace

### Step 1 — PIE creates opportunity

**Endpoint:** `POST /api/pie/opportunity`  
**File:** `server/app.ts:538`  
**Evidence:** Code exists and is wired. Payload validated by `PieOpportunitySchema` (Zod).

**What executes:**
1. Zod validates the payload — rejects missing `externalRef`, `applicantName`; validates email format; validates urgency enum
2. Idempotency check: `SELECT * FROM intake_forms WHERE source_ref = 'PIE:24/AP/1234'`
3. If new: `INSERT INTO intake_forms` with `matter_type='planning'`, `urgency='high'`, `claim_value='£2,400,000'`, `source_ref='PIE:24/AP/1234'`
4. `writeAuditEvent`: `entityType='intake'`, `entityUuid=<intake.id>`, `action='captured'`, metadata includes `upstreamSystem:'PIE'`, `pieExternalRef:'24/AP/1234'`, `sourceRef:'PIE:24/AP/1234'`, `district:'Bromley'`, `siteAddress`
5. FineGuard activation evaluation (see Step 3)

**Lifecycle state achieved:** CAPTURED  
**Status:** ✅ CODE EXISTS — endpoint implemented, schema validated, audit wired

**Blocker:** Accuracy PIE itself (the upstream system) is `status=unverified` in registry.json with `sourceRepo=unknown`. No PIE source code is in this repository. The receiving endpoint exists; the sender does not.

---

### Step 2 — UltAi converts opportunity into intake/task

**Endpoint:** `POST /api/intake` (manual intake) or via PIE step above  
**File:** `server/app.ts:440`  
**Evidence:** Code exists.

**What executes:**
1. `INSERT INTO intake_forms` with clientName, matterType, urgency, description
2. `writeAuditEvent`: `entityType='intake'`, `entityUuid=<intake.id>`, `action='captured'`, metadata includes `matterRef`, `matterType`, `urgency`, `sourceRef`

**Lifecycle state achieved:** CONFIRMED (manual intake path)

For the PIE path, the intake row IS the task — `matterRef=MAT-<timestamp>` is the work reference. Allocation to a clerk happens via the ClerkOS tRPC `allocations.create` router.

**ClerkOS 4-state machine** (`server/engine/clerkOS.engine.ts:17`):
```
open → in_progress | on_hold | closed
in_progress → closed | on_hold | open
on_hold → open | in_progress | closed
closed → open
```

**Status:** ✅ CODE EXISTS — intake creation implemented, audit wired  
**Gap:** Target 10-state lifecycle (CAPTURED→CLOSED) is NOT implemented. `packages/core-workflow` does not exist. Current 4-state machine does not expose individual target states.

---

### Step 3 — FineGuard creates/attaches compliance event

**Files:** `server/lib/fineguard-rules.ts`, `server/lib/pie-fineguard.ts`, `server/app.ts:673`  
**Evidence:** Code exists and is unit-tested (180/180).

**Activation rules** (`server/lib/fineguard-rules.ts:90`):
```
activate = pieOriginated AND (highUrgency OR highValue)

pieOriginated = sourceRef.startsWith("PIE:")           → true  (Bromley)
highUrgency   = urgency ∈ {"high", "critical"}         → true  (urgency='high')
highValue     = parsedClaimValue >= £1,000,000         → true  (£2,400,000)
activate      = true AND (true OR true)                → true
```

The Bromley opportunity WILL trigger FineGuard auto-activation.

**What executes** (`server/lib/pie-fineguard.ts:49`):
1. `writeAuditEvent`: `action='fineguard_activation_evaluated'`, metadata includes `activate:true`, `reasons:{pieOriginated:true, highUrgency:true, highValue:true}`, `trigger:'first_ingestion'`
2. `INSERT INTO monitored_companies` ON CONFLICT DO UPDATE — `companyNumber='PIE:24/AP/1234'`, `companyName='Bromley Development Ltd'`, `stripeSessionId='pie-activation:24/AP/1234'`
3. `writeAuditEvent`: `action='fineguard_activation_triggered'`, `entityType='monitoring_activation'`, `entityUuid=<monitored_companies.id>`

**Status:** ✅ CODE EXISTS AND UNIT-TESTED — activation rules proven, bridge wired, audit events emitted  
**Gap:** Compliance check via CH API (`POST /api/compliance-bundle`) requires `COMPANIES_HOUSE_API_KEY` env var. Without it the endpoint returns 503. The auto-activation path (above) does NOT require CH API — it uses the PIE payload fields only.

---

### Step 4 — VaultLine records audit event

**File:** `server/trpc/db.ts:236`, `server/drizzle/schema.ts:278`  
**Evidence:** Schema exists, function exists, all callers wired.

**`clerk_audit_events` schema:**
```typescript
entityType: varchar(64)
entityId: integer          // nullable — ClerkOS serial entities
entityUuid: uuid           // nullable — brand-suite UUID entities
action: varchar(64)
actorId: integer           // nullable
actorOpenId: varchar(64)   // nullable
previousState: text        // nullable
nextState: text            // nullable
metadata: text             // nullable — JSON stringified
correlationId: uuid        // nullable
createdAt: timestamp
```

**Audit events written for Bromley simulation:**

| # | entityType | action | entityUuid | metadata keys |
|---|---|---|---|---|
| 1 | intake | captured | intake_forms.id | matterRef, matterType, urgency, sourceRef, upstreamSystem, pieExternalRef, siteAddress, district |
| 2 | intake | fineguard_activation_evaluated | intake_forms.id | activate, reasons, trigger, matterRef, pieExternalRef |
| 3 | monitoring_activation | fineguard_activation_triggered | monitored_companies.id | companyIdentifier, companyName, reasons, trigger, matterRef |

All three share the same `correlationId` — traceable from a single UUID.

**`writeAuditEvent` guard** (`server/trpc/db.ts:237`):
```typescript
if (event.entityId == null && event.entityUuid == null) {
  throw new Error(`writeAuditEvent: one of entityId or entityUuid is required`);
}
```

**Status:** ✅ CODE EXISTS — schema correct, write function correct, all P1 paths wired

---

## Success Condition Assessment

```
Step 1 — PIE creates opportunity
  ✅ POST /api/pie/opportunity endpoint implemented
  ✅ PieOpportunitySchema validates Bromley payload
  ✅ intake_forms row created with sourceRef='PIE:24/AP/1234'
  ✅ clerk_audit_events row written (action='captured')
  ✅ Idempotency: replay writes ingestion_replayed, no duplicate row
  ⛔ Accuracy PIE system itself: unknown source, unknown deployment (registry: status=unverified)

Step 2 — UltAi creates task/intake
  ✅ POST /api/intake endpoint implemented
  ✅ intake_forms row persisted with matterRef
  ✅ clerk_audit_events row written (action='captured')
  ✅ ClerkOS tRPC allocations.create router exists for clerk assignment
  ⚠  10-state lifecycle not implemented — current engine is 4-state

Step 3 — FineGuard creates/attaches compliance event
  ✅ evaluateFineGuardActivation() returns activate=true for Bromley payload
  ✅ activateFineGuardForPie() upserts monitored_companies
  ✅ Two audit events emitted (evaluated + triggered)
  ✅ Failure isolation: activation failure never propagates to intake response
  ⚠  CH API compliance check (POST /api/compliance-bundle) requires COMPANIES_HOUSE_API_KEY

Step 4 — VaultLine records audit event
  ✅ clerk_audit_events schema exists and is correct
  ✅ writeAuditEvent() wired on all P1 paths
  ✅ entityUuid carries actual domain entity UUID
  ✅ correlationId threads across all events in the chain
  ⚠  Requires live DATABASE_URL — without it writeAuditEvent is a no-op (getDb returns null)
```

---

## Verdict

**B) Workflow not yet proven end-to-end.**

The code to execute every step exists and is correct. The chain cannot be called end-to-end proven because:

1. **Accuracy PIE** — the upstream system that pushes opportunities — has no source code or deployment in this repository. Its status in the registry is `unverified`. The receiving endpoint (`POST /api/pie/opportunity`) is fully implemented. The sender is not.

2. **DATABASE_URL** — all DB writes are no-ops when this env var is absent. Without a live database, no intake rows are created and no audit events are recorded.

3. **10-state lifecycle** — `packages/core-workflow` does not exist. The current ClerkOS engine has 4 states. ANALYSED, ESTIMATED, VERIFIED, HITL_REQUIRED, APPROVED states have no explicit code representation.

**What IS proven:** Given a live database and the Bromley payload delivered to `POST /api/pie/opportunity`:
- An intake row will be created (CAPTURED)
- FineGuard will auto-activate (VERIFIED/EXECUTED)
- Three audit events will be written to VaultLine (RECORDED)

The code path is complete for these three stages. Blockers are environmental and lifecycle-structural, not logic-level bugs.

---

## Audit Queryability (for when DB is available)

```sql
-- All PIE-originated intakes
SELECT * FROM intake_forms WHERE source_ref LIKE 'PIE:%';

-- Full audit trail for Bromley ref
SELECT entity_type, action, entity_uuid, correlation_id, metadata, created_at
FROM clerk_audit_events
WHERE metadata->>'sourceRef' = 'PIE:24/AP/1234'
ORDER BY created_at;

-- Stuck activations (evaluate without terminal event)
SELECT metadata->>'sourceRef', created_at
FROM clerk_audit_events
WHERE action = 'fineguard_activation_evaluated'
  AND (metadata->>'activate')::boolean = true
  AND NOT EXISTS (
    SELECT 1 FROM clerk_audit_events t
    WHERE t.correlation_id = clerk_audit_events.correlation_id
      AND t.action IN ('fineguard_activation_triggered','fineguard_activation_failed')
  );
```
