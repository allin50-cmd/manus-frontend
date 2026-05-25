# Workflow Proof

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25
**Method:** Direct source inspection + live execution against test database.

---

## Objective

Prove that UltAi, FineGuard, and VaultLine can participate in a single business event — a Bromley planning application — by tracing it through the 10-state workflow using existing code only.

---

## Code Changes Made (Business Proof Layer)

These changes connect the brand-suite REST layer to VaultLine's audit trail.

### Change 1 — `writeAuditEvent` import + SYSTEM_TENANT_ID constant

**File:** `server/index.ts` — line 11

```typescript
import { getUserByOpenId, getTenantBySlug, setTenantContext, writeAuditEvent } from './trpc/db';

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';
```

**Why:** `writeAuditEvent()` requires a `tenantId` UUID foreign-keyed to the `tenants` table. Brand-suite REST endpoints have no user/tenant context. The system tenant row bridges the two schemas.

**System tenant seed (one-time, per environment):**
```sql
INSERT INTO tenants (id, name, slug, plan) VALUES
('00000000-0000-0000-0000-000000000001', 'UltraCore System', 'system', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
```

---

### Change 2 — UltAi: `POST /api/intake` → VaultLine

**File:** `server/index.ts` — after `db.insert(intakeForms)`

```typescript
await writeAuditEvent({
  tenantId: SYSTEM_TENANT_ID,
  entityType: 'intake',
  entityId: intake.id,
  action: 'captured',
  metadata: JSON.stringify({
    matterRef: intake.matterRef,
    matterType,
    urgency,
    sourceRef: (req.body.sourceRef as string) || 'MANUAL',
  }),
}).catch(e => console.error('VaultLine write failed (intake):', e));
```

**Workflow state achieved:** CAPTURED → RECORDED

---

### Change 3 — FineGuard: `POST /api/compliance-bundle` → VaultLine

**File:** `server/index.ts` — after `db.insert(complianceBundles)`

```typescript
await writeAuditEvent({
  tenantId: SYSTEM_TENANT_ID,
  entityType: 'compliance_check',
  entityId: bundle.id,
  action: 'executed',
  metadata: JSON.stringify({
    bundleId: bundle.bundleId,
    companyNumber: formattedNumber,
    companyName: companyProfile.companyName,
    riskLevel: complianceStatus.riskLevel,
    status: complianceStatus.status,
    overdueFilings: complianceStatus.overdueFilings.length,
  }),
}).catch(e => console.error('VaultLine write failed (compliance-bundle):', e));
```

**Workflow state achieved:** EXECUTED → RECORDED

---

### Change 4 — FineGuard: Stripe webhook → VaultLine

**File:** `server/index.ts` — after `db.insert(monitoredCompanies)`

```typescript
await writeAuditEvent({
  tenantId: SYSTEM_TENANT_ID,
  entityType: 'monitoring_activation',
  entityId: 0,
  action: 'executed',
  metadata: JSON.stringify({ companyNumber, companyName, stripeSessionId: session.id }),
}).catch(e => console.error('VaultLine write failed (stripe webhook):', e));
```

**Workflow state achieved:** EXECUTED (billing activation) → RECORDED

---

### Change 5 — `sourceRef` field on `intake_forms`

**File:** `server/db/schema.ts` — `intakeForms` table

```typescript
sourceRef: varchar('source_ref', { length: 100 }),
```

**Why:** When Accuracy PIE is found, intake submissions can be linked to the originating opportunity (e.g. `sourceRef: 'PIE:24/AP/1234'`). Without this field, the link is lost.

---

## Bromley Planning Application — Workflow Trace

**Event:** Bromley London Borough — residential development application `24/AP/1234`

| State | System | Code Path | Status |
|---|---|---|---|
| CAPTURED | Accuracy PIE | No source found | ✗ BLOCKED — PIE unknown |
| ANALYSED | Accuracy PIE | No scoring logic | ✗ BLOCKED — PIE unknown |
| ESTIMATED | Accuracy PIE | No value estimation | ✗ BLOCKED — PIE unknown |
| VERIFIED | FineGuard | `CompaniesHouseService.getCompanyProfile()` | ~ MANUAL — CH lookup works on-demand |
| CONFIRMED | UltAi | `POST /api/intake` → `intake_forms` | ✓ CODE EXISTS — intake saves + VaultLine notified |
| HITL_REQUIRED | UltAi/ClerkOS | `allocations.create` tRPC | ~ PARTIAL — manual allocation only |
| APPROVED | ClerkOS | `cases.transition` tRPC | ~ PARTIAL — maps to `open→in_progress` |
| EXECUTED | FineGuard | `POST /api/compliance-bundle` → CH API | ✓ CODE EXISTS — compliance check + VaultLine notified |
| RECORDED | VaultLine | `writeAuditEvent()` | ✓ NOW WIRED — intake, compliance, Stripe all write audit rows |
| CLOSED | ClerkOS | `cases.transition` → `closed` | ~ PARTIAL — case close + audit works |

---

## What VaultLine Now Records

After these changes, the following events write to `clerk_audit_events`:

| Event | entityType | action | Previously |
|---|---|---|---|
| UltAi intake form submitted | `intake` | `captured` | NOT RECORDED |
| FineGuard compliance check | `compliance_check` | `executed` | NOT RECORDED |
| Stripe monitoring activation | `monitoring_activation` | `executed` | NOT RECORDED |
| ClerkOS case created | `case` | `create` | already recorded |
| ClerkOS case transition | `case` | `transition:X→Y` | already recorded |
| ClerkOS allocation created | `allocation` | `create` | already recorded |

---

## Live Execution Evidence

**Database:** `vaultline_test` (PostgreSQL 16, local)
**Test run date:** 2026-05-25

**Step 1 — Both schemas migrated:**
```
npm run db:generate:clerkos && npm run db:migrate:clerkos
→ 9 ClerkOS tables created

npm run db:generate && npm run db:migrate
→ 6 brand-suite tables created

Total: 15 tables in database
```

**Step 2 — System tenant seeded:**
```
npm run db:seed:clerkos
→ System tenant ready: 00000000-0000-0000-0000-000000000001
```

**Step 3 — Build and tests:**
```
npm run build  →  ✓ built in 4.51s  (zero TypeScript errors)
npm test       →  36/36 tests passing (30 unit + 6 integration)
```

**Step 4 — Integration test result (VaultLine audit events written):**

```sql
SELECT entity_type, action, metadata FROM clerk_audit_events ORDER BY created_at;

   entity_type    |  action  |  metadata
------------------+----------+--------------------------------------------------
 compliance_check | executed | {"companyNumber":"00445790","companyName":"TESCO PLC","riskLevel":"low","status":"compliant","overdueFilings":0}
 intake           | captured | {"matterRef":"MAT-TEST-...","matterType":"planning","urgency":"high","sourceRef":"PIE:24/AP/1234"}
 compliance_check | executed | {"companyNumber":"00445790","companyName":"TESCO PLC","riskLevel":"low","status":"compliant","overdueFilings":0}
(3 rows)
```

`sourceRef: "PIE:24/AP/1234"` is present in the audit trail — the Bromley planning application reference propagates end-to-end from intake submission through to VaultLine.

---

## Success Condition Checklist

```
□ PIE creates opportunity     — UNKNOWN (PIE source not found — stakeholder action required)
☑ UltAi creates task          — PROVEN: POST /api/intake → intake_forms + clerk_audit_events row confirmed
☑ FineGuard creates event     — PROVEN: POST /api/compliance-bundle → compliance_bundles + clerk_audit_events row confirmed
☑ VaultLine records event     — PROVEN: 3 audit rows in clerk_audit_events from live DB test
```

---

## What This Does Not Achieve

- Accuracy PIE integration — PIE source must be located (stakeholder action)
- Automated FineGuard monitoring loop — requires scheduler + email provider
- Cross-system entity linking — no shared ID between `intake_forms` and `compliance_bundles`
- 10-state workflow automation — states CAPTURED→ESTIMATED remain blocked on PIE

**Minimum remaining actions for fully automated pipeline:**
1. Locate Accuracy PIE — stakeholder
2. Select email provider — stakeholder
3. Seed system tenant into each environment database — engineering
4. Build FineGuard alert scheduler (`GET /api/internal/run-compliance-check`) — ~50 lines
