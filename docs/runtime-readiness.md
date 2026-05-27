# Runtime Readiness Report

**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-26  
**Method:** Direct source inspection only. Every claim cites a file and line number.

---

## Build Status (pre-deployment gate)

| Check | Status |
|---|---|
| TypeScript compilation | PASS |
| Vite build | PASS |
| Unit tests (190/190) | PASS |
| CI/CD pipeline | PASS |

---

## 1. Database

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `DATABASE_URL` | Pooler connection string — used by the running app (`server/db/index.ts:27`, `server/trpc/db.ts:28`) | **REQUIRED** | **SET** in `.env` (Neon, eu-west-2 pooler) | **NO** |
| `DIRECT_URL` | Non-pooler connection string — used by migrations only (`server/db/migrate.ts:16`, `server/drizzle/migrate.ts:12`) | **REQUIRED for bootstrap** (optional at runtime — falls back to `DATABASE_URL`) | **SET** in `.env` (Neon direct) | **NO** — set locally. Must be set in Vercel for any migration run from CI. |

**Notes:**
- `db:bootstrap` = `db:migrate:clerkos && db:migrate && db:seed:clerkos` (`package.json:29`)
- Both migration scripts prefer `DIRECT_URL`, fall back to `DATABASE_URL` if absent
- `db:bootstrap` cannot run from this remote container — TCP port 5432 is firewalled. Must run from local MacBook.
- RLS migration (`server/drizzle/rls-migration.sql`) is NOT in the bootstrap sequence. Applies separately as superuser. Status: **UNKNOWN — not yet applied.**

---

## 2. Admin API

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `ADMIN_API_KEY` | Protects all `/api/internal/*` and `/api/admin/*` endpoints. Required header: `X-ADMIN-KEY` (`server/app.ts:52`) | **REQUIRED** | **SET** locally (`ultracore-local-dev`). Not yet configured in Vercel. | **YES** — if absent, all admin/internal endpoints return 401. Resilience, scheduler, and override endpoints become inaccessible. |
| `DEPLOY_RECORD_TOKEN` | Protects `POST /api/deployments/record` (`server/app.ts:51, 304`) | Optional | **NOT SET** in Vercel | **NO** — endpoint returns 401 if token is missing or wrong; app continues. |

---

## 3. Authentication (Azure AD B2C)

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `AZURE_B2C_TENANT_NAME` | B2C tenant name — constructs JWKS URI (`server/trpc/_core/auth.ts:7, 12`) | Required for production auth | **NOT SET** | **NO** — if blank, `getJwks()` returns `null` and all token verification silently fails. In non-production, `x-user-open-id` header bypass applies (`auth.ts:82–91`). |
| `AZURE_B2C_TENANT_ID` | B2C tenant UUID — constructs issuer URL (`auth.ts:16`) | Required for production auth | **NOT SET** | **NO** — falls back to `AZURE_B2C_TENANT_NAME` |
| `AZURE_B2C_CLIENT_ID` | Audience check on JWT (`auth.ts:9, 55`) | Required for production auth | **NOT SET** | **NO** — if blank, audience check is skipped |
| `AZURE_B2C_POLICY` | Sign-up/sign-in policy name (`auth.ts:8`) | Required for production auth | **NOT SET** (defaults to `B2C_1_signupsignin`) | **NO** |
| `OWNER_OPEN_ID` | Azure object ID of the designated owner account. Grants admin role on first sign-in (`server/trpc/db.ts:112`) | Optional | **NOT SET** | **NO** — admin role must be assigned manually in DB |
| `DEFAULT_TENANT_SLUG` | Dev fallback tenant resolution (`auth.ts:114`) | Optional | **NOT SET** | **NO** — tenant resolved from subdomain or `X-Tenant` header instead |

**Warning:** Without B2C variables, the app accepts any `x-user-open-id` header in non-production mode as authentication. Do not deploy to production without B2C configured.

---

## 4. FineGuard — Companies House

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `COMPANIES_HOUSE_API_KEY` | API key for Companies House. Used by `companiesHouseService` (`server/services/companiesHouse.ts:12, 441`) | Required for FineGuard compliance checks | **NOT SET** in Vercel | **NO** — `companiesHouseService` is `null` when absent. Callers guard with `if (!companiesHouseService)`. Compliance scheduler runs but skips all CH lookups. |

---

## 5. Stripe Billing

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `STRIPE_SECRET_KEY` | Authenticates Stripe API (`server/app.ts:55–56`) | Required for checkout and webhooks | **NOT SET** | **NO** — `stripe` object is `null` when absent. Checkout returns 503. Webhook returns 503. App continues. |
| `STRIPE_WEBHOOK_SECRET` | Validates Stripe webhook signatures (`app.ts:81, 84`) | Required to receive Stripe webhooks | **NOT SET** | **NO** — webhook returns 400 `Missing webhook secret`. |
| `STRIPE_PRICE_ID` | Stripe price ID used in checkout session creation (`app.ts:252`) | Required for checkout to work | **NOT SET** | **NO** — checkout returns 503 if Stripe not configured. |

---

## 6. VaultLine — Audit Logging (Neon/ClerkOS)

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `DATABASE_URL` | Required for `writeAuditEvent()` to write to `clerk_audit_events` (`server/trpc/db.ts:243`) | **REQUIRED** | **SET** locally. Must be set in Vercel. | **YES** — without it, `writeAuditEvent()` silently no-ops. Audit trail does not exist. PIE ingestion appears to succeed but produces no evidence. |

**Note:** VaultLine does not have its own variables. It uses `DATABASE_URL`. The FK constraint on `clerk_audit_events` requires the system tenant (`00000000-0000-0000-0000-000000000001`) to exist — created by `db:seed:clerkos`.

---

## 7. VaultLine — Azure Blob Storage (Document storage)

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | Primary authentication for Blob Storage (`server/services/blobStorage.ts:12`) | Required for document upload/download | **NOT SET** | **NO** — storage client is not initialised. Document operations fail gracefully. |
| `AZURE_STORAGE_ACCOUNT` | Storage account name for SAS URL generation (`blobStorage.ts:10, 75`) | Required for SAS URLs | **NOT SET** | **NO** |
| `AZURE_STORAGE_KEY` | Storage account key for SAS generation (`blobStorage.ts:11, 80`) | Required for SAS URLs | **NOT SET** | **NO** |
| `AZURE_STORAGE_CONTAINER` | Container name (`blobStorage.ts:13`) | Optional | **NOT SET** (defaults to `clerkos-documents`) | **NO** |

---

## 8. Azure Service Bus (Message queue)

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Authenticates Service Bus client (`server/services/serviceBus.ts:5, 14`) | Required for message queue | **NOT SET** | **NO** — client not initialised when absent. |
| `AZURE_SERVICE_BUS_NAMESPACE` | Service Bus namespace (`serviceBus.ts:6`) | Required for Service Bus | **NOT SET** | **NO** |

---

## 9. Application Config

| Variable | Purpose | Required? | Current status | Blocking deployment? |
|---|---|---|---|---|
| `APP_URL` | Base URL for Stripe redirect URLs (`server/app.ts:258`) | Required for Stripe checkout redirects | **NOT SET** | **NO** — falls back to `http://localhost:${PORT}`. Stripe redirects will point to localhost in production. |
| `PORT` | Server listen port (`server/trpc/_core/env.ts:4`) | Optional | **NOT SET** (defaults to 3000) | **NO** |
| `NODE_ENV` | Environment flag. Disables `x-user-open-id` bypass in production (`auth.ts:82`) | Set by Vercel automatically | **NOT SET** locally (defaults to `development`) | **NO** |
| `VERCEL` | Set automatically by Vercel runtime. Controls connection pool size (`server/trpc/db.ts:31`) | Set automatically | N/A | **NO** |
| `VITE_GITHUB_REPO` | GitHub repo string for DeploymentStatusPanel UI (`src/components/admin/DeploymentStatusPanel.tsx:107`) | Optional | **NOT SET** (defaults to `owner/repo`) | **NO** — build passes without it. UI shows placeholder. |

---

## 10. Deployment Blocker Summary

| Dependency | Blocking? | What happens without it |
|---|---|---|
| `DATABASE_URL` in Vercel | **YES** | App starts but all DB routes return errors; audit trail is silent no-op; health endpoint returns 503 |
| `ADMIN_API_KEY` in Vercel | **YES** | All admin/internal endpoints inaccessible (401) |
| `db:bootstrap` run (local) | **YES** | Schema does not exist; all DB operations fail |
| `DIRECT_URL` (local, for bootstrap) | **YES** | Bootstrap fails without it (migrations require non-pooler) |
| Azure AD B2C variables | **NO** (for initial deploy) | Auth silently accepts any token in non-prod; production auth broken |
| `COMPANIES_HOUSE_API_KEY` | **NO** | FineGuard scheduler runs; CH lookups are skipped |
| Stripe variables | **NO** | Billing endpoints return 503; rest of app unaffected |
| Azure Blob/Bus variables | **NO** | Storage/queue operations fail gracefully |
| `APP_URL` | **NO** | Stripe redirects broken; rest of app unaffected |

**Minimum viable deployment requires:**
1. `DATABASE_URL` set in Vercel
2. `ADMIN_API_KEY` set in Vercel
3. `db:bootstrap` run successfully from MacBook before first deploy
