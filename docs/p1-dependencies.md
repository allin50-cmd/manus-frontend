# P1 System Dependencies

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25

All dependencies listed here are derived from direct source inspection. UNKNOWN means no evidence found.

---

## Dependency Map

### Accuracy PIE

| Dependency | Status | Evidence |
|---|---|---|
| Deployment URL | UNKNOWN | Not found in any file |
| Database | UNKNOWN | No schema found |
| Auth | UNKNOWN | — |
| Email provider | UNKNOWN | — |
| Billing | UNKNOWN | — |
| VaultLine audit write | UNKNOWN | No source to inspect |
| UltAi integration | UNKNOWN | No outbound API call found |
| CH API | UNKNOWN | — |
| External data source | UNKNOWN | Planning data source not identified |

**Outbound calls made:** UNKNOWN

**Inbound calls expected:** UNKNOWN

---

### UltAi

| Dependency | Required | Status | Variable |
|---|---|---|---|
| PostgreSQL | Yes | Code present; DB must be provisioned | `DATABASE_URL` |
| Azure AD B2C | For tRPC auth | Code present; configured via env | `AZURE_B2C_TENANT_NAME`, `AZURE_B2C_CLIENT_ID`, `AZURE_B2C_TENANT_ID`, `AZURE_B2C_POLICY` |
| Default tenant slug | For dev fallback | Code present | `DEFAULT_TENANT_SLUG` |
| Owner Open ID | Admin bootstrap | Code present | `OWNER_OPEN_ID` |
| Email provider | No — but needed | ABSENT | Not configured |
| VaultLine audit write | Partial | `writeAuditEvent()` called only from tRPC layer | `DATABASE_URL` (same connection) |
| Accuracy PIE inbound | Not wired | No inbound API, no webhook listener | — |
| FineGuard outbound | None | UltAi does not call FineGuard | — |
| Azure Service Bus | Optional | Graceful no-op if absent | `AZURE_SERVICE_BUS_CONNECTION_STRING` |

**Outbound API calls made by UltAi:**
- None to external P1 systems
- tRPC procedures call `writeAuditEvent()` internally (same process, same DB)
- `systemSpine` sends to Azure Service Bus (`clerkos-bundles` queue) for bundle generation

**Inbound API calls received by UltAi:**
- `POST /api/intake` — from `IntakeSheet.tsx` frontend (no auth required)
- `POST /api/lead` — from `BookDemo.tsx` frontend (no auth required)
- tRPC `/api/trpc/cases.*` — from ClerkOS dashboard frontend (Azure AD B2C auth)
- tRPC `/api/trpc/allocations.*` — from ClerkOS dashboard frontend
- tRPC `/api/trpc/hearings.*` — from ClerkOS dashboard frontend
- tRPC `/api/trpc/documents.*` — from ClerkOS dashboard frontend

**Missing dependencies that block the PIE → UltAi path:**
1. No inbound webhook or API endpoint for receiving PIE opportunities
2. No `opportunities` table or data model
3. No `workflowState` field on any record
4. No `sourceRef` field to link intake to originating PIE opportunity

---

### FineGuard

| Dependency | Required | Status | Variable |
|---|---|---|---|
| PostgreSQL | Yes | Code present; DB must be provisioned | `DATABASE_URL` |
| Companies House API key | Yes (throws) | Code present; key must be provisioned | `COMPANIES_HOUSE_API_KEY` |
| Stripe secret key | For checkout | Code present; graceful disable if absent | `STRIPE_SECRET_KEY` |
| Stripe webhook secret | For webhook validation | Required for webhook | `STRIPE_WEBHOOK_SECRET` |
| Stripe price ID | For subscription creation | Required for checkout | `STRIPE_PRICE_ID` |
| App URL | For Stripe redirects | Defaults to `http://localhost:PORT` | `APP_URL` |
| Email provider | For alerts | ABSENT — not configured anywhere | Not configured |
| Alert scheduler | For monitoring loop | ABSENT — no scheduler exists | Not applicable |
| VaultLine audit write | Not wired | Neither FineGuard endpoint calls `writeAuditEvent()` | — |
| UltAi integration | Not wired | FineGuard does not call UltAi | — |

**Outbound API calls made by FineGuard:**
- `GET https://api.company-information.service.gov.uk/company/{number}` — CH profile
- `GET https://api.company-information.service.gov.uk/company/{number}/filing-history` — CH filings
- Stripe API: `stripe.checkout.sessions.create()` — checkout session
- `stripe.webhooks.constructEvent()` — webhook verification (inbound)

**Inbound API calls received by FineGuard:**
- `POST /api/compliance-bundle` — from `ComplianceBundle.tsx` (no auth)
- `POST /api/stripe/checkout` — from `ComplianceBundle.tsx` (no auth)
- `POST /api/stripe/webhook` — from Stripe (signature-verified)
- `GET /api/protection-status` — from `ComplianceBundle.tsx` (no auth)

**Missing dependencies that block the FineGuard → VaultLine path:**
1. No `writeAuditEvent()` call in `POST /api/compliance-bundle`
2. No `writeAuditEvent()` call in Stripe webhook handler
3. No shared tenant identity between brand-suite schema and ClerkOS schema
4. No email provider for alert delivery
5. No scheduled task or timer to check `monitored_companies` against CH API

---

### VaultLine

| Dependency | Required | Status | Variable |
|---|---|---|---|
| PostgreSQL | Yes | Code present; schema must be migrated | `DATABASE_URL` |
| `tenants` table populated | Yes (foreign key) | Must have at least one row | (via DB migration + seeding) |
| Azure Blob Storage | For document storage | Graceful no-op if absent | `AZURE_STORAGE_CONNECTION_STRING` |
| Azure Service Bus | For bundle trigger | Graceful no-op if absent | `AZURE_SERVICE_BUS_CONNECTION_STRING` |
| Azure Durable Functions | For bundle pipeline | Separate deployment (`azure-functions/`) | Not an env var — Azure resource |
| Email provider | None needed | Not applicable | — |
| Billing | None needed | Not applicable | — |

**Inbound calls that write audit events (current):**
- tRPC `cases.create` → `{ entityType: 'case', action: 'create' }`
- tRPC `cases.update` → `{ entityType: 'case', action: 'update' }`
- tRPC `cases.transition` → `{ entityType: 'case', action: 'transition:X→Y' }`
- tRPC `allocations.create` → `{ entityType: 'allocation', action: 'create' }`
- tRPC `allocations.update` → `{ entityType: 'allocation', action: 'status_change:X' }`
- tRPC `hearings.create/update` → `{ entityType: 'hearing' }`
- tRPC `documents.create/approveForBundle` → `{ entityType: 'document' }`
- `ClerkOSEngine.transitionCase()` → `{ entityType: 'case', action: 'transition' }`
- `ClerkOSEngine.initiateBundle()` → `{ entityType: 'bundle', action: 'initiate' }`
- `SystemSpine.handleAllocationEscalation()` → `{ entityType: 'allocation', action: 'escalate:urgent' }`

**Inbound calls that do NOT write audit events (gap):**
- `POST /api/intake`
- `POST /api/compliance-bundle`
- `POST /api/stripe/webhook`
- Any PIE-originated event (PIE does not exist)

**Missing dependencies that block the full pipeline reaching VaultLine:**
1. No system-level tenant for brand-suite events (brand-suite schema has no `tenants` table)
2. `writeAuditEvent()` requires a `tenantId` UUID — brand-suite endpoints have no tenant context
3. Azure resource provisioning unverified — Bicep may not have been run
4. ClerkOS schema initial migration not confirmed run

---

## Dependency Graph (Current State)

```
Accuracy PIE
    │
    │  ← NO SOURCE FOUND
    │
    ▼
  UNKNOWN ──────────────────────────────────────────── no connection anywhere

IntakeSheet.tsx
    │
    │  POST /api/intake
    │
    ▼
intake_forms table (brand-suite schema)
    │
    │  ← NO writeAuditEvent() call
    │  ← NO connection to clerk_cases
    │  ← NO connection to clerk_audit_events
    │
    ▼
  DEAD END (data sits in intake_forms, never flows further)

ComplianceBundle.tsx
    │
    │  POST /api/compliance-bundle
    │
    ▼
CH API (real-time lookup)
    │
    ▼
compliance_bundles table (brand-suite schema)
    │
    │  ← NO writeAuditEvent() call
    │  ← NO alert sent
    │  ← NO connection to clerk_audit_events
    │
    ▼
  DEAD END

Stripe webhook
    │
    ▼
monitored_companies table (brand-suite schema)
    │
    │  ← NO writeAuditEvent() call
    │  ← NO monitoring loop started
    │
    ▼
  DEAD END

ClerkOS tRPC (cases/allocations/hearings/documents)
    │
    │  writeAuditEvent()
    │
    ▼
clerk_audit_events (ClerkOS schema = VaultLine)
    │
    ▼
  VaultLine receives events ← ONLY from tRPC layer
```

---

## Missing Dependencies Summary

| # | Missing Item | Blocks | Type |
|---|---|---|---|
| 1 | Accuracy PIE source code | Entire PIE → UltAi path | External — cannot fix without locating PIE |
| 2 | PIE inbound endpoint on UltAi | PIE → UltAi handoff | API endpoint needed |
| 3 | `sourceRef` field on intake | Traceability | Schema field |
| 4 | `writeAuditEvent()` call in `POST /api/intake` | UltAi → VaultLine | Code change |
| 5 | `writeAuditEvent()` call in `POST /api/compliance-bundle` | FineGuard → VaultLine | Code change |
| 6 | `writeAuditEvent()` call in Stripe webhook | FineGuard activation → VaultLine | Code change |
| 7 | System tenant in `tenants` table | All brand-suite → VaultLine writes | DB seed record |
| 8 | Email provider (Resend / SendGrid / etc.) | FineGuard alert delivery | Package + env var |
| 9 | FineGuard alert scheduler | FineGuard monitoring loop | Scheduled function |
| 10 | ClerkOS initial DB migration | All ClerkOS/VaultLine functionality | `npm run db:push:clerkos` |
