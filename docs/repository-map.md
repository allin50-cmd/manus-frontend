# Repository Map

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Package name:** vaultline-brand-suite (v1.0.0)
**Audit Date:** 2026-05-25

---

## Repository Root

```
manus-frontend/
├── apps/
│   └── registry.json                    ← Portfolio control document (created 2026-05-25)
├── azure-functions/
│   ├── host.json                        ← Durable Functions config (ClerkOSBundleHub)
│   ├── package.json                     ← Azure Functions dependencies
│   └── src/
│       └── index.ts                     ← Bundle orchestrator + 4 activity functions
├── deploy/
│   ├── main.bicep                       ← Azure IaC (all resources)
│   ├── parameters.dev.json              ← Dev environment parameters
│   └── parameters.prod.json             ← Prod environment parameters
├── docs/
│   ├── CONSOLIDATION-AUDIT.md           ← Phase 1 audit (created 2026-05-25)
│   ├── verification-report.md           ← This audit cycle
│   ├── deployment-inventory.md          ← This audit cycle
│   ├── repository-map.md                ← This document
│   └── consolidation-plan.md            ← This audit cycle
├── server/
│   ├── index.ts                         ← Express server entry point
│   ├── db/                              ← Brand-suite database layer
│   │   ├── index.ts                     ← PostgreSQL connection (postgres driver)
│   │   ├── schema.ts                    ← Brand-suite schema (6 tables)
│   │   ├── migrate.ts                   ← Migration runner
│   │   └── seed.ts                      ← Seed data
│   ├── drizzle/                         ← ClerkOS database layer
│   │   └── schema.ts                    ← ClerkOS schema (9 tables)
│   ├── engine/
│   │   ├── clerkOS.engine.ts            ← Case state machine + bundle eligibility
│   │   ├── systemSpine.ts               ← Queue dispatcher
│   │   └── types.ts                     ← Shared type aliases
│   ├── services/
│   │   ├── blobStorage.ts               ← Azure Blob Storage client
│   │   ├── companiesHouse.ts            ← Companies House API adapter
│   │   └── serviceBus.ts               ← Azure Service Bus client
│   └── trpc/
│       ├── _core/
│       │   ├── auth.ts                  ← Azure AD B2C JWT verification
│       │   ├── context.ts               ← tRPC context types
│       │   ├── env.ts                   ← Typed env wrapper
│       │   └── trpc.ts                  ← Procedure builders + role guards
│       ├── db.ts                        ← ClerkOS DB connection + helpers
│       ├── routers.ts                   ← tRPC router assembly
│       ├── routers.test.ts              ← tRPC router tests (vitest)
│       └── routers/
│           ├── allocations.ts           ← Clerk allocation CRUD
│           ├── auth.ts                  ← Auth endpoints (me, tenant, logout)
│           ├── cases.ts                 ← Case CRUD + transitions
│           ├── dashboard.ts             ← Dashboard stats
│           ├── diary.ts                 ← Clerk diary
│           ├── documents.ts             ← Document upload + bundle approval
│           └── hearings.ts             ← Hearing CRUD
├── src/
│   ├── App.tsx                          ← React router (ClerkOS operational routes only)
│   ├── main.tsx                         ← React entry point
│   ├── index.css                        ← Global styles
│   ├── components/
│   │   ├── layout/                      ← ClerkOS layout shell
│   │   ├── ui/                          ← Radix UI component library
│   │   ├── admin/                       ← Admin components
│   │   └── ErrorBoundary.tsx
│   ├── contexts/
│   │   └── ThemeContext.tsx
│   ├── lib/
│   │   └── trpc.ts                      ← tRPC client
│   └── pages/
│       ├── Dashboard.tsx                ← ROUTED — ClerkOS dashboard
│       ├── Cases.tsx                    ← ROUTED — Case management
│       ├── Hearings.tsx                 ← ROUTED — Hearing management
│       ├── Documents.tsx               ← ROUTED — Document management
│       ├── Queue.tsx                    ← ROUTED — Task queue
│       ├── Diary.tsx                    ← ROUTED — Clerk diary
│       ├── Bundles.tsx                  ← ROUTED — Bundle management
│       ├── NotFound.tsx                 ← ROUTED — 404
│       ├── About.tsx                    ← NOT ROUTED — unlinked
│       ├── Admin.tsx                    ← NOT ROUTED — unlinked
│       ├── BookDemo.tsx                 ← NOT ROUTED — P3 parked
│       ├── ComplianceBundle.tsx         ← NOT ROUTED — FineGuard checkout
│       ├── FineGuard.tsx               ← NOT ROUTED — FineGuard landing
│       ├── IntakeSheet.tsx             ← NOT ROUTED — UltAi intake
│       ├── Pricing.tsx                  ← NOT ROUTED — P3 parked
│       ├── Team.tsx                     ← NOT ROUTED — unlinked
│       └── VaultLine.tsx               ← NOT ROUTED — VaultLine landing
├── .github/
│   └── workflows/
│       ├── azure-static-web-apps-ci-cd.yml   ← CI/CD pipeline 1 (npm, Azure SWA)
│       └── deploy-vaultline.yml              ← CI/CD pipeline 2 (pnpm, Azure App Service)
├── .env.example                         ← 5 env vars documented (incomplete)
├── drizzle.config.ts                    ← Points to server/db/schema.ts ONLY
├── drizzle/                             ← Migration output directory (empty or gitignored)
├── Dockerfile                           ← Container image definition
├── index.html                           ← Vite entry HTML
├── package.json                         ← npm package (name: vaultline-brand-suite)
├── package-lock.json                    ← npm lock file
├── staticwebapp.config.json             ← Azure Static Web Apps routing config
├── tailwind.config.ts                   ← Tailwind CSS config
├── tsconfig.json                        ← TypeScript config (currently broken)
├── vite.config.ts                       ← Vite bundler config
└── vitest.config.ts                     ← Vitest test config (server/**/*.test.ts)
```

---

## Database Schemas

### Schema A — Brand Suite (`server/db/schema.ts`)

Managed by `drizzle-kit` (via `drizzle.config.ts`). PostgreSQL. Connected via `DATABASE_URL`.

| Table | Purpose | System |
|---|---|---|
| `deployment_status` | CI/CD deployment records | Infrastructure |
| `leads` | Demo booking form submissions | UltAi / BookDemo |
| `intake_forms` | Client matter intake forms | UltAi |
| `compliance_bundles` | Companies House compliance check requests | FineGuard |
| `contacts` | General contact form submissions | All |
| `monitored_companies` | Stripe-activated FineGuard monitoring | FineGuard |

### Schema B — ClerkOS (`server/drizzle/schema.ts`)

**NOT managed by `drizzle-kit`.** No migration path. PostgreSQL. Connected via same `DATABASE_URL`.

| Table | Purpose | System |
|---|---|---|
| `tenants` | Multi-tenant accounts | UltAi / UltraCore |
| `clerk_users` | Users scoped to tenant | UltAi |
| `clerk_cases` | Legal cases | UltAi |
| `clerk_hearings` | Case hearings | UltAi |
| `clerk_documents` | Case documents + blob references | UltAi / VaultLine |
| `clerk_bundles` | Generated PDF bundles | UltAi / VaultLine |
| `clerk_allocations` | Clerk task assignments | UltAi |
| `clerk_diaries` | Clerk diary entries | UltAi |
| `clerk_audit_events` | Immutable audit trail | VaultLine |

---

## API Surface

### REST API (Express — `server/index.ts`)

| Method | Path | System | Auth |
|---|---|---|---|
| POST | `/api/stripe/webhook` | FineGuard | Stripe signature |
| POST | `/api/stripe/checkout` | FineGuard | None |
| GET | `/api/protection-status` | FineGuard | None |
| POST | `/api/deployments/record` | Infrastructure | `X-DEPLOY-TOKEN` header |
| GET | `/api/deployments/status` | Infrastructure | None |
| GET | `/api/deployments/history` | Infrastructure | None |
| POST | `/api/lead` | UltAi / All | None |
| GET | `/api/admin/leads` | UltAi | None (unprotected) |
| POST | `/api/intake` | UltAi | None |
| GET | `/api/admin/intake-forms` | UltAi | None (unprotected) |
| POST | `/api/compliance-bundle` | FineGuard | None |
| GET | `/api/admin/compliance-bundles` | FineGuard | None (unprotected) |
| POST | `/api/contact` | All | None |
| GET | `/api/admin/contacts` | All | None (unprotected) |
| PATCH | `/api/contacts/:id` | All | None (unprotected) |
| GET | `/api/health` | Infrastructure | None |
| GET | `/health` | Infrastructure | None |

**Security note:** All `/api/admin/*` endpoints are unprotected. No authentication required.

### tRPC API (`/api/trpc` — `server/trpc/routers.ts`)

| Router | Procedures | Auth |
|---|---|---|
| `auth` | me, tenant, logout | authedProcedure / tenantProcedure |
| `cases` | create, update, list, get, transition | tenantProcedure / adminProcedure |
| `hearings` | create, update, list, getByCaseId | tenantProcedure |
| `documents` | create, getByCaseId, getSasUploadUrl, approveForBundle | tenantProcedure |
| `allocations` | create, update, list, getByClerkId | tenantProcedure |
| `diary` | create, list, getByDate | tenantProcedure |
| `dashboard` | stats | tenantProcedure |

---

## Azure Functions (`azure-functions/src/index.ts`)

| Function | Type | Purpose |
|---|---|---|
| `bundleOrchestrator` | Orchestrator | Durable Functions coordinator |
| `validateBundle` | Activity | Check documents approved and case eligible |
| `renderDocumentPage` | Activity | Render individual document pages |
| `mergeBundlePDF` | Activity | Merge rendered pages into PDF, upload to blob |
| `finalizeBundle` | Activity | Write blob path, audit hash, mark bundle ready |
| `failBundle` | Activity | Referenced in orchestrator — implementation not confirmed |

Durable Functions hub name: `ClerkOSBundleHub`

---

## P1 System Source Ownership

| System | Primary Source Files | Secondary Source Files | Not Routed In App.tsx |
|---|---|---|---|
| Accuracy PIE | NONE IN REPO | — | — |
| UltAi | `server/engine/`, `server/trpc/routers/`, `src/pages/{Dashboard,Cases,Hearings,Documents,Queue,Diary,Bundles}.tsx` | `src/pages/IntakeSheet.tsx`, `src/pages/Team.tsx` | IntakeSheet, Team |
| FineGuard | `server/services/companiesHouse.ts`, `server/index.ts` (compliance routes), `server/db/schema.ts` (monitored_companies, compliance_bundles) | `src/pages/FineGuard.tsx`, `src/pages/ComplianceBundle.tsx` | FineGuard, ComplianceBundle |
| VaultLine | `server/drizzle/schema.ts` (clerk_audit_events), `server/trpc/db.ts` (writeAuditEvent), `server/services/blobStorage.ts`, `azure-functions/src/index.ts` | `src/pages/VaultLine.tsx`, `deploy/main.bicep` | VaultLine |

---

## P3 Systems in Registry — Status

The following P3 systems referenced in the portfolio definition are NOT present in this repository:

- GroundBreaker AI — UNKNOWN location
- PIE OS — UNKNOWN location
- FineGuardPro — UNKNOWN location
- ClerkOS — partially embedded in UltAi codebase (engine)
- UltraCore Edge — UNKNOWN location
- German Accounting App — UNKNOWN location
- EPC Pro — UNKNOWN location
- LandMine — UNKNOWN location

P3 systems are parked. No action required.
