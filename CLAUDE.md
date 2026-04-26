# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install
npm install                      # installs all deps (.npmrc sets legacy-peer-deps=true automatically)

# Development
npm run dev                      # Vite dev server (frontend only, port 5173)
npm run server:watch             # Express + tRPC backend (port 3000, hot-reload)
npm run dev:full                 # Both concurrently

# Build
npm run build                    # tsc type-check + vite bundle → dist/
npm run type-check               # tsc --noEmit only

# Test
npm test                         # vitest run (all tests)
npm run test:watch               # vitest watch
npx vitest run server/trpc/routers.test.ts   # single test file

# Demo (Docker required)
npm run demo                     # docker compose up --build → http://localhost:3000
npm run demo:down                # tear down + wipe volumes

# Database
npm run db:push                  # push schema to DB (drizzle-kit)
npm run db:studio                # Drizzle Studio GUI
npm run db:migrate               # run migration script
```

## Architecture

This codebase runs two distinct systems on a single Express server.

### Two co-existing systems

**VaultLine Brand Suite** (`server/db/schema.ts`, REST endpoints in `server/index.ts`)
Marketing landing pages and lead capture for three SaaS products (VaultLine Cloud, UltAi, FineGuard). Handled via plain REST endpoints (`/api/lead`, `/api/intake`, `/api/compliance-bundle`, `/api/stripe/*`, `/api/deployments/*`). Schema: `deployment_status`, `leads`, `intake_forms`, `compliance_bundles`, `contacts`, `monitored_companies`.

**ClerkOS** (`server/drizzle/schema.ts`, tRPC at `/api/trpc/*`)
Multi-tenant court case management system. All ClerkOS API calls go through tRPC. Schema: `tenants`, `clerk_users`, `clerk_cases`, `clerk_hearings`, `clerk_documents`, `clerk_bundles`, `clerk_allocations`, `clerk_diaries`, `clerk_audit_events`.

Both schemas are registered in `drizzle.config.ts` so drizzle-kit manages them together.

### ClerkOS request lifecycle

```
Request → Express → tRPC middleware → createContext
  → getUserFromRequest (Bearer JWT via Azure AD B2C, or x-user-open-id header in dev)
  → getTenantSlugFromRequest (x-tenant header → subdomain → DEFAULT_TENANT_SLUG env)
  → setTenantContext (writes SET LOCAL to enable PostgreSQL RLS)
  → getUserByOpenId (resolves DB user row)
  → procedure middleware chain:
      publicProcedure   — no checks
      authedProcedure   — requires ctx.user
      tenantProcedure   — requires ctx.user + ctx.tenantId + ctx.tenant
      adminProcedure    — requires role === 'admin (senior clerk / manager)'
```

### ClerkOS Engine (`server/engine/clerkOS.engine.ts`)

`ClerkOSEngine` is instantiated per-request with `(db, tenantId)`. All mutations go through it. Key responsibilities:

- **Case state machine** — `transitionCase()` enforces `VALID_TRANSITIONS`:
  - `open` → `in_progress | on_hold | closed`
  - `in_progress` → `closed | on_hold | open`
  - `on_hold` → `open | in_progress | closed`
  - `closed` → `open` (reopen only)
- **Bundle eligibility** — `canGenerateBundle()` requires case not `on_hold` + ≥1 document with `approved_for_bundle = 1`
- **Audit trail** — every state change writes to `clerk_audit_events` via `writeAuditEvent()`
- Returns `Result<T>` discriminated union (`{ ok: true, value }` or `{ ok: false, error }`) — never throws

### tRPC routers (`server/trpc/routers/`)

Each router file exports one named `*Router`. The root `appRouter` in `server/trpc/routers.ts` composes them. Routers:

| Router | Procedure level | Responsibility |
|---|---|---|
| `auth` | `authedProcedure` | Sign-in upsert, role management |
| `cases` | `tenantProcedure` / `adminProcedure` | CRUD + engine transitions |
| `hearings` | `tenantProcedure` | Hearing scheduling |
| `documents` | `tenantProcedure` | Upload, approve-for-bundle |
| `allocations` | `tenantProcedure` | Clerk task assignment |
| `diary` | `tenantProcedure` | Diary entries |
| `dashboard` | `tenantProcedure` | Aggregated stats |

### Frontend (`src/`)

React 18 + Wouter (routing) + TanStack Query + tRPC React hooks. Path alias `@/` maps to `src/`. The tRPC client is in `src/lib/trpc.ts`. All ClerkOS pages live in `src/pages/` and use `trpc.<router>.<procedure>.useQuery/useMutation()`.

Dev auth: set `localStorage.setItem('openId', 'admin-user')` — the frontend sends this as `x-user-open-id`. Set `x-tenant: alpha` to hit the seeded demo tenant.

### Authentication (dev vs production)

- **Production**: Azure AD B2C JWT in `Authorization: Bearer <token>`. Configure `AZURE_B2C_*` env vars.
- **Development**: `x-user-open-id` header bypasses JWT (only when `NODE_ENV !== 'production'`). The demo stack sets `OWNER_OPEN_ID=admin-user` which auto-grants admin role on first sign-in.

### Demo stack

`docker-compose.yml` starts PostgreSQL 16 + the app container. `demo/init.sql` creates all tables and seeds the `alpha` tenant with cases, hearings, documents, and audit events. No `.env` file needed — all vars are set in the compose file.

### Infrastructure

`deploy/main.bicep` provisions: Azure Container App (with system-assigned managed identity), PostgreSQL Flexible Server, Key Vault (RBAC-based, not access policies), Service Bus namespace, and Azure Static Web App. The managed identity is granted `Key Vault Secrets User` role. The Service Bus connection string is written to Key Vault by Bicep using `listKeys()`.

### Tests (`server/trpc/routers.test.ts`)

85 tests using Vitest. All tests mock the DB using a `makeEngineDb()` factory that returns a Drizzle-compatible object with thenable query builders (both awaitable and `.limit()`-chainable). No real database connection required.
