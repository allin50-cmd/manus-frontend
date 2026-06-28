# P1 System Verification

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25
**Method:** Direct source inspection only. No live environment tested. No information invented.

---

## Verification Checklist

### Accuracy PIE

**Role:** Generate opportunities

| Field | Finding |
|---|---|
| Source code location | UNKNOWN — zero files in this repository |
| Repository | UNKNOWN |
| Branch | UNKNOWN |
| Deployment URL | UNKNOWN |
| Environment variables | UNKNOWN |
| Database connection | UNKNOWN |
| Email provider | UNKNOWN |
| Billing integration | UNKNOWN |
| Audit integration | UNKNOWN |
| Build status | UNKNOWN |
| Test status | UNKNOWN |

```
□ can create opportunity    — CANNOT VERIFY (no source)
```

**Evidence:** `apps/registry.json` records `sourceRepo: "unknown — requires verification"`. No files, imports, or references to Accuracy PIE exist anywhere in `allin50-cmd/manus-frontend`. No planning application data model, no scoring logic, no opportunity table in either database schema.

---

### UltAi

**Role:** Convert opportunities into work

| Field | Finding |
|---|---|
| Source code location | `server/index.ts` (REST), `server/trpc/routers/cases.ts`, `server/trpc/routers/allocations.ts`, `server/engine/clerkOS.engine.ts`, `src/pages/IntakeSheet.tsx` |
| Repository | `allin50-cmd/manus-frontend` (this repo) |
| Branch | `main` (canonical) |
| Deployment URL | Declared: `https://zhoqgoan.manus.space/` — live status UNVERIFIED |
| Environment variables | `DATABASE_URL` (required), `AZURE_B2C_TENANT_NAME`, `AZURE_B2C_CLIENT_ID`, `AZURE_B2C_TENANT_ID`, `DEFAULT_TENANT_SLUG`, `OWNER_OPEN_ID` |
| Database connection | PostgreSQL via `DATABASE_URL`. Two schemas. Brand-suite schema (`server/db/schema.ts`) manages `intake_forms`. ClerkOS schema (`server/drizzle/schema.ts`) manages `clerk_cases`, `clerk_allocations`. |
| Email provider | NONE — no email provider imported or configured anywhere |
| Billing integration | NONE for UltAi directly. Stripe used only for FineGuard activation. |
| Audit integration | PARTIAL — `writeAuditEvent()` called on every `cases.create`, `cases.transition`, `allocations.create`. NOT called on `POST /api/intake`. |
| Build status | PASSING (`npm run build` succeeds) |
| Test status | 30/30 passing — procedure existence tests, no DB integration tests |

```
☑ can create intake/task    — YES, via two paths (see detail below)
```

**Path A — Brand-suite intake (no audit):**
- Endpoint: `POST /api/intake` (`server/index.ts:441`)
- Saves to `intake_forms` table (`server/db/schema.ts:37`)
- Returns `matterRef` (e.g. `MAT-1748160000000`)
- **Does NOT write an audit event**
- No connection to VaultLine
- No connection to ClerkOS cases

**Path B — ClerkOS case creation (with audit):**
- Endpoint: tRPC `cases.create` (`server/trpc/routers/cases.ts:21`)
- Requires: valid tenant context + admin role + `DATABASE_URL`
- Saves to `clerk_cases` table
- Writes audit event: `{ entityType: 'case', action: 'create' }` → `clerk_audit_events`
- Connected to VaultLine audit trail
- **Requires Azure AD B2C auth token or dev `x-user-open-id` header**

**Key gap:** The user-facing intake form (IntakeSheet.tsx) uses Path A. Path B (which writes to VaultLine) requires internal auth and is only accessible via tRPC. These two paths are not connected.

---

### FineGuard

**Role:** Protect clients through compliance monitoring

| Field | Finding |
|---|---|
| Source code location | `server/services/companiesHouse.ts` (CH API), `server/index.ts:511` (`/api/compliance-bundle`), `server/index.ts:39` (Stripe webhook), `src/pages/ComplianceBundle.tsx` |
| Repository | `allin50-cmd/manus-frontend` (this repo) |
| Branch | `main` (canonical) |
| Deployment URL | Declared: `https://compliance-t2rtvc.manus.space/` — live status UNVERIFIED |
| Environment variables | `COMPANIES_HOUSE_API_KEY` (required — throws on missing), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, `APP_URL`, `DATABASE_URL` |
| Database connection | PostgreSQL via `DATABASE_URL`. Brand-suite schema: `compliance_bundles`, `monitored_companies`. |
| Email provider | NONE — no email delivery mechanism exists anywhere in the codebase |
| Billing integration | Stripe. `POST /api/stripe/checkout` creates subscription session. Webhook `checkout.session.completed` inserts into `monitored_companies`. Price: £3/month (declared in UI). |
| Audit integration | NONE — `POST /api/compliance-bundle` does NOT write a `writeAuditEvent()`. Stripe webhook does NOT write a `writeAuditEvent()`. FineGuard events produce zero audit records. |
| Build status | PASSING (shared build) |
| Test status | No dedicated FineGuard tests |

```
☑ can generate compliance data   — YES (on-demand CH API lookup works)
□ can generate compliance event  — NO (no audit event written)
□ can send alert                 — NO (no email provider, no scheduler)
```

**What the compliance bundle endpoint does:**
1. Validates company number format
2. Calls `CompaniesHouseService.getCompanyProfile()` — real CH API call
3. Calls `CompaniesHouseService.getComplianceStatus()` — calculates deadlines + penalties
4. Inserts into `compliance_bundles` table
5. Returns full compliance data to the client
6. **Does not write to `clerk_audit_events`**
7. **Does not trigger any alert**
8. **Does not notify any other system**

**What the Stripe webhook does:**
1. Verifies Stripe signature
2. On `checkout.session.completed`: inserts company into `monitored_companies`
3. **Does not write to `clerk_audit_events`**
4. **Does not start any monitoring loop**
5. **Does not send any confirmation email**

**Critical gap:** After a company is inserted into `monitored_companies` there is no code that subsequently checks its compliance status on a schedule. Monitoring is activated but never executed.

---

### VaultLine

**Role:** Prove actions through audit logging

| Field | Finding |
|---|---|
| Source code location | `server/trpc/db.ts:writeAuditEvent()` (audit write function), `server/drizzle/schema.ts:auditEvents` (table), `server/services/blobStorage.ts` (Azure Blob), `server/services/serviceBus.ts` (Azure Service Bus), `azure-functions/src/index.ts` (Durable Functions) |
| Repository | `allin50-cmd/manus-frontend` (this repo) |
| Branch | `main` (canonical) |
| Deployment URL | UNKNOWN — Azure resource URL determined at Bicep deployment time; not committed |
| Environment variables | `DATABASE_URL`, `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_ACCOUNT`, `AZURE_STORAGE_KEY`, `AZURE_STORAGE_CONTAINER` (default: `clerkos-documents`), `AZURE_SERVICE_BUS_CONNECTION_STRING` |
| Database connection | PostgreSQL via `DATABASE_URL`. ClerkOS schema: `clerk_audit_events`. |
| Email provider | NONE |
| Billing integration | NONE for VaultLine itself |
| Audit integration | VaultLine IS the audit system. `writeAuditEvent()` inserts immutable rows to `clerk_audit_events`. |
| Build status | PASSING (shared build) |
| Test status | No dedicated VaultLine audit tests |

```
☑ can write audit record   — YES, when called from tRPC layer
□ can write audit record   — NOT from brand-suite REST endpoints (no bridge)
□ Azure resources confirmed deployed — UNKNOWN
```

**`writeAuditEvent()` signature:**
```typescript
writeAuditEvent({
  tenantId: string,      // UUID — REQUIRED — foreign key to tenants table
  entityType: string,    // 'case' | 'allocation' | 'bundle' | 'document'
  entityId: number,
  action: string,
  actorId?: number,
  actorOpenId?: string,
  previousState?: string,
  nextState?: string,
  metadata?: string,
})
```

**Where VaultLine currently receives events:**
- `cases.create` → `{ entityType: 'case', action: 'create' }`
- `cases.update` → `{ entityType: 'case', action: 'update' }`
- `cases.transition` → `{ entityType: 'case', action: 'transition:open→in_progress' }`
- `allocations.create` → `{ entityType: 'allocation', action: 'create' }`
- `allocations.update` → `{ entityType: 'allocation', action: 'status_change:completed' }`
- `hearings.create/update` → `{ entityType: 'hearing' }`
- `documents.create/approve` → `{ entityType: 'document' }`
- `clerkOS.engine.transitionCase` → `{ entityType: 'case', action: 'transition' }`
- `clerkOS.engine.initiateBundle` → `{ entityType: 'bundle', action: 'initiate' }`
- `systemSpine.handleAllocationEscalation` → `{ entityType: 'allocation', action: 'escalate:urgent' }`

**Where VaultLine currently receives ZERO events:**
- `POST /api/intake` — brand-suite intake form submission
- `POST /api/compliance-bundle` — FineGuard compliance check
- `POST /api/stripe/webhook` — Stripe payment completion
- Anything originating from Accuracy PIE (which does not exist)

**Architecture constraint:**
`writeAuditEvent()` requires a `tenantId` UUID that must exist in the `tenants` table. The brand-suite schema (`server/db/schema.ts`) has no `tenants` table. The two schemas share `DATABASE_URL` but have no shared entity. To write VaultLine audit events from brand-suite events, a system-level tenant record must exist, or the schemas must share a tenant concept.

---

## Summary: What Can Each System Do Today?

| Capability | Status | Evidence |
|---|---|---|
| PIE: create opportunity | UNKNOWN | No source |
| PIE: score opportunity | UNKNOWN | No source |
| PIE: send to UltAi | UNKNOWN | No source |
| UltAi: accept intake form | YES | `POST /api/intake` → `intake_forms` |
| UltAi: create ClerkOS case | YES (auth required) | tRPC `cases.create` → `clerk_cases` |
| UltAi: write audit event on intake | NO | `POST /api/intake` has no `writeAuditEvent()` call |
| UltAi: write audit event on case | YES | tRPC `cases.create` calls `writeAuditEvent()` |
| FineGuard: lookup company CH data | YES | `POST /api/compliance-bundle` |
| FineGuard: activate Stripe subscription | YES | `POST /api/stripe/checkout` + webhook |
| FineGuard: write audit event | NO | Neither endpoint calls `writeAuditEvent()` |
| FineGuard: send alert email | NO | No email provider |
| FineGuard: run scheduled monitoring | NO | No scheduler exists |
| VaultLine: write audit event (from tRPC) | YES | `writeAuditEvent()` function |
| VaultLine: write audit event (from REST) | NO | No bridge between schemas |
| VaultLine: store document blob | YES (if Azure configured) | `blobStorage.ts` |
| VaultLine: generate PDF bundle | YES (if Azure Functions deployed) | `azure-functions/src/index.ts` |
