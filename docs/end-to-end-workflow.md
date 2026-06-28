# End-to-End Workflow

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25

This document traces a single business event — a Bromley planning application — through the target P1 workflow. Each stage is mapped to the exact code that would handle it. Where code does not exist or is not connected, the gap is stated explicitly.

---

## Target Workflow

```
CAPTURED → ANALYSED → ESTIMATED → VERIFIED → CONFIRMED
→ HITL_REQUIRED → APPROVED → EXECUTED → RECORDED → CLOSED
```

---

## Example Event: Bromley Planning Application

**Source:** Bromley London Borough planning portal
**Event:** New residential development application submitted — reference `24/AP/1234`
**Estimated value:** £2.4M development — potential opportunity for legal or compliance services

---

## Step-by-Step Trace

---

### CAPTURED

**Expected behaviour:** Accuracy PIE detects the planning application and creates an opportunity record.

**Code that would handle it:** NONE. Accuracy PIE does not exist in this repository.

**What actually happens:** Nothing. No system detects or captures planning applications.

**Gap:** Accuracy PIE source must be located before CAPTURED can function.

**Status:** ✗ BLOCKED — source unknown

---

### ANALYSED

**Expected behaviour:** PIE scores the opportunity using deterministic rules. Score factors might include: development value, postcode, application type, applicant company status.

**Code that would handle it:** NONE.

**What actually happens:** Nothing.

**Status:** ✗ BLOCKED — no source

---

### ESTIMATED

**Expected behaviour:** PIE assigns an estimated revenue value to the opportunity. E.g. `£2.4M development → estimated legal fee: £18,000`.

**Code that would handle it:** NONE.

**What actually happens:** Nothing.

**Status:** ✗ BLOCKED — no source

---

### VERIFIED

**Expected behaviour:** PIE attaches the source reference (`24/AP/1234`) and verifies the company associated with the application against Companies House data. This is where FineGuard's CH API becomes relevant.

**Closest existing code:**
- `server/services/companiesHouse.ts` — `CompaniesHouseService.getCompanyProfile(companyNumber)`
- `CompaniesHouseService.getComplianceStatus(companyNumber)` — returns risk level

**What actually happens:** The CH API service can be called on-demand. But it is only triggered by `POST /api/compliance-bundle` from the FineGuard UI. It is not triggered by any automated pipeline.

**Status:** ✗ BLOCKED — no automated trigger; manual lookup only via FineGuard UI

---

### CONFIRMED

**Expected behaviour:** Opportunity is confirmed as viable and sent to UltAi for task creation.

**Code that would handle it:** The UltAi `POST /api/intake` endpoint exists and accepts a matter description. It could theoretically receive an opportunity payload.

**Current UltAi intake endpoint:**
```
POST /api/intake
Body: { clientName, clientEmail, clientPhone, matterType, urgency, description, claimValue }
Returns: { ok: true, matterRef: 'MAT-...', urgency }
```

**Gap:** This endpoint accepts human-entered form data, not machine-sent opportunity payloads. It has no `sourceRef` field to link back to a PIE opportunity. It has no `workflowState` field. The caller (PIE) does not exist.

**Status:** ✗ BLOCKED — PIE does not exist; endpoint exists but has no machine-readable source link

---

### HITL_REQUIRED

**Expected behaviour:** A human operator reviews the opportunity before it proceeds to approval.

**Closest existing code:**
- `src/pages/Queue.tsx` — ClerkOS task queue (shows allocations to clerks)
- `server/trpc/routers/allocations.ts` — allocation CRUD with priority levels (`low`, `medium`, `high`, `urgent`)

**What actually happens:** A clerk can be assigned a task via `allocations.create` in the tRPC layer. The allocation shows in the queue. This is the closest approximation to HITL review.

**Gap:** The allocation is not connected to an intake form or PIE opportunity. There is no handoff between `intake_forms` (brand-suite schema) and `clerk_allocations` (ClerkOS schema). A human would need to manually create an allocation after seeing an intake form in the admin panel.

**Status:** ~ PARTIAL — allocation system exists but is manually triggered, not automatically from intake

---

### APPROVED

**Expected behaviour:** Operator approves the opportunity. System marks it approved and proceeds to execution.

**Closest existing code:**
- `cases.transition` tRPC procedure — transitions a case through the 4-state machine (`open → in_progress`)
- This writes an audit event: `{ entityType: 'case', action: 'transition:open→in_progress' }`

**Gap:** There is no `APPROVED` state. The 4-state machine (`open`, `in_progress`, `on_hold`, `closed`) does not map to the 10-state target lifecycle. Approval is represented by `open → in_progress` transition at best.

**Status:** ~ PARTIAL — transition exists, audit event written, but no APPROVED state

---

### EXECUTED

**Expected behaviour:** The follow-up action is performed. For a planning application, this might be: sending a letter to the applicant, registering their company for FineGuard monitoring, or creating a legal case.

**Closest existing code:**

**Path 1 — FineGuard monitoring activation:**
- User navigates to `/compliance-bundle`
- Enters company number (from planning application)
- `POST /api/compliance-bundle` → CH lookup → compliance data returned
- User clicks "Activate Protection"
- `POST /api/stripe/checkout` → Stripe session created
- User completes payment
- `POST /api/stripe/webhook` → `monitored_companies` inserted

**Path 2 — UltAi case work:**
- Admin creates case via tRPC `cases.create`
- Admin creates allocation via tRPC `allocations.create`
- Clerk works case through `in_progress → closed`
- Each transition writes audit event

**Gap:** These two paths are not connected. Activating FineGuard monitoring does not create a ClerkOS case. Closing a ClerkOS case does not confirm FineGuard monitoring. Neither path is triggered by a PIE opportunity.

**Status:** ~ PARTIAL — execution paths exist independently, not connected

---

### RECORDED

**Expected behaviour:** VaultLine records an immutable audit event covering the entire workflow.

**Closest existing code:**
```typescript
// server/trpc/db.ts
export async function writeAuditEvent(event: InsertAuditEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(event);
}
```

**What actually gets recorded today:**
- Case creation: `{ entityType: 'case', action: 'create', tenantId, entityId, actorId }`
- Case transition: `{ entityType: 'case', action: 'transition:open→in_progress' }`
- Allocation creation: `{ entityType: 'allocation', action: 'create' }`
- Document upload: `{ entityType: 'document', action: 'upload' }`

**What does NOT get recorded:**
- `POST /api/intake` submission — no audit event
- `POST /api/compliance-bundle` call — no audit event
- Stripe payment — no audit event
- FineGuard monitoring activation — no audit event
- Any PIE event — PIE does not exist

**Status:** ~ PARTIAL — VaultLine CAN record events, but only from tRPC layer. Brand-suite events are not recorded.

---

### CLOSED

**Expected behaviour:** The workflow is formally closed. All records are immutable.

**Closest existing code:**
- `cases.transition` → `{ status: 'closed' }` — closes the ClerkOS case, writes audit event

**Status:** ~ PARTIAL — case close works and is audited, but no end-to-end closure from PIE through all systems

---

## Bromley Planning Application: Full Trace Summary

```
Event: Bromley 24/AP/1234 — New development application

CAPTURED        → ✗ BLOCKED    PIE does not exist
ANALYSED        → ✗ BLOCKED    No scoring logic
ESTIMATED       → ✗ BLOCKED    No value estimation
VERIFIED        → ✗ BLOCKED    CH lookup exists but is not automated
CONFIRMED       → ✗ BLOCKED    No PIE→UltAi handoff mechanism
HITL_REQUIRED   → ~ PARTIAL    Allocation queue exists; not wired to intake
APPROVED        → ~ PARTIAL    Case transition exists; no APPROVED state
EXECUTED        → ~ PARTIAL    FineGuard + ClerkOS both can execute; not connected
RECORDED        → ~ PARTIAL    writeAuditEvent() works from tRPC; not from REST intake
CLOSED          → ~ PARTIAL    Case close + audit works; not end-to-end
```

**0 of 10 states execute automatically.**
**4 of 10 states have partial manual implementations.**
**6 of 10 states have no implementation at all.**

---

## Minimal Integration Design (Using Existing Code Only)

The following describes how to connect the four P1 systems with the smallest possible changes, using only code that already exists. No new frameworks. No rewrites.

---

### Connection 1: POST /api/intake → VaultLine (writeAuditEvent)

**What it achieves:** CONFIRMED and RECORDED states are bridged. Every intake submission becomes a VaultLine audit event.

**The problem:** `writeAuditEvent()` requires a `tenantId` UUID referencing the `tenants` table. The brand-suite `POST /api/intake` has no tenant context.

**Minimal fix:**
1. Insert one system-level tenant row into `tenants` table:
   ```sql
   INSERT INTO tenants (id, name, slug, plan) VALUES
   ('00000000-0000-0000-0000-000000000001', 'UltraCore System', 'system', 'enterprise');
   ```
2. In `server/index.ts`, after inserting into `intake_forms`, add:
   ```typescript
   await writeAuditEvent({
     tenantId: '00000000-0000-0000-0000-000000000001',
     entityType: 'intake',
     entityId: intake.id,
     action: 'captured',
     metadata: JSON.stringify({ matterRef: intake.matterRef, matterType, urgency }),
   });
   ```
3. Import `writeAuditEvent` from `./trpc/db` in `server/index.ts`

**Files changed:** `server/index.ts` (2 lines), one DB seed record
**Risk:** Low — `writeAuditEvent()` is already tested; adding to brand-suite endpoint only adds a DB write

---

### Connection 2: POST /api/compliance-bundle → VaultLine (writeAuditEvent)

**What it achieves:** Every FineGuard compliance check becomes a VaultLine audit event (EXECUTED → RECORDED path).

**Minimal fix:** In `server/index.ts`, after the CH API response is returned, add:
```typescript
await writeAuditEvent({
  tenantId: '00000000-0000-0000-0000-000000000001',
  entityType: 'compliance_check',
  entityId: bundle.id,
  action: 'executed',
  metadata: JSON.stringify({
    companyNumber: formattedNumber,
    companyName: companyProfile.companyName,
    riskLevel: complianceStatus.riskLevel,
    status: complianceStatus.status,
  }),
});
```

**Files changed:** `server/index.ts` (1 block), same system tenant as above
**Risk:** Low — same pattern as above

---

### Connection 3: Stripe webhook → VaultLine (writeAuditEvent)

**What it achieves:** FineGuard payment activation becomes an auditable event. EXECUTED state for billing.

**Minimal fix:** In the Stripe webhook handler (`server/index.ts:62`), after inserting into `monitored_companies`, add:
```typescript
await writeAuditEvent({
  tenantId: '00000000-0000-0000-0000-000000000001',
  entityType: 'monitoring_activation',
  entityId: 0,
  action: 'executed',
  metadata: JSON.stringify({ companyNumber, companyName, stripeSessionId: session.id }),
});
```

**Files changed:** `server/index.ts` (1 block)
**Risk:** Low — webhook handler already has DB access

---

### Connection 4: Add sourceRef to intake_forms

**What it achieves:** When PIE is found, intake submissions can be linked back to the originating opportunity.

**Minimal fix:** Add `sourceRef` column to `intake_forms` table:
```typescript
// server/db/schema.ts
sourceRef: varchar('source_ref', { length: 100 }),
// e.g. 'PIE:24/AP/1234' or 'MANUAL'
```

And pass it through `POST /api/intake` body and `writeAuditEvent` metadata.

**Files changed:** `server/db/schema.ts` (1 field), `server/index.ts` (extract from body), `src/pages/IntakeSheet.tsx` (optional hidden field)
**Risk:** Low — additive schema change, no existing data affected

---

### What This Achieves (After 4 connections)

```
UltAi: POST /api/intake
    ↓  writeAuditEvent({ action: 'captured' })
VaultLine: clerk_audit_events row written ✓

FineGuard: POST /api/compliance-bundle
    ↓  writeAuditEvent({ action: 'executed' })
VaultLine: clerk_audit_events row written ✓

FineGuard: Stripe webhook
    ↓  writeAuditEvent({ action: 'executed' })
VaultLine: clerk_audit_events row written ✓
```

**What this does NOT achieve:**
- Accuracy PIE integration — PIE must be located first
- Automated FineGuard monitoring loop — requires scheduler + email provider
- Cross-system entity linking (no shared ID between intake and compliance)
- 10-state workflow lifecycle — that is Phase B (`packages/core-workflow`)
