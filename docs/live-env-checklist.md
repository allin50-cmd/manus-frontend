# Live Environment Variables Checklist

**Authority:** apps/registry.json + direct source inspection  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r  
**Date:** 2026-05-26  
**Scope:** Every environment variable referenced by server code. Classified by when it is required and what breaks without it.

---

## Tier 1 — Blocks the PIE → VaultLine minimal workflow

These must be set before a single `POST /api/pie/opportunity` can persist data.

| Variable | Runtime location | What breaks without it |
|---|---|---|
| `DATABASE_URL` | `server/db/index.ts:27`, `server/trpc/db.ts:28` | All DB writes fail. PIE endpoint returns 500. `writeAuditEvent()` silently no-ops. `/api/health` returns 503. |

**Format (Neon pooler):**
```
DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require
```

---

## Tier 2 — Required for migrations only (not Vercel runtime)

Set locally before running `npm run db:bootstrap`. Do **not** add to Vercel runtime env vars unless also running migrations from Vercel (not required — bootstrap runs once locally).

| Variable | Used by | What breaks without it |
|---|---|---|
| `DIRECT_URL` | `drizzle.config.ts:8`, `server/db/migrate.ts:16`, `server/drizzle/migrate.ts:12` | `npm run db:bootstrap` exits with error on first step. Migrations do not run. |

**Format (Neon direct, no pooler):**
```
DIRECT_URL=postgresql://user:pass@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
```

**Note:** Both migrate scripts fall back to `DATABASE_URL` if `DIRECT_URL` is absent. This is safe for local dev without a pooler but WILL FAIL against Neon because Neon's pooler (PgBouncer) drops the transaction state DDL migrations require. Always set `DIRECT_URL` separately when targeting Neon.

---

## Tier 3 — Required for internal/admin endpoints

Not required for the PIE workflow path. Required to call `/api/admin/*` and `/api/internal/*` routes.

| Variable | Runtime location | What breaks without it | Graceful? |
|---|---|---|---|
| `ADMIN_API_KEY` | `server/app.ts:52`, guards at lines 205, 946, 1010, 1215 | All `/api/admin/*` and `/api/internal/*` routes return 401/403. PIE endpoint is unaffected. | YES — routes return error, app starts fine |

**Suggested value (local dev):** any non-empty string, e.g. `openssl rand -hex 32`  
**Production:** generate with `openssl rand -hex 32` and store as Vercel secret.

---

## Tier 4 — Required for specific optional features

Each absence causes one feature area to degrade; the rest of the app continues.

| Variable | Source | Feature blocked | HTTP response when absent | Graceful? |
|---|---|---|---|---|
| `COMPANIES_HOUSE_API_KEY` | `server/services/companiesHouse.ts:12` | `POST /api/compliance-bundle`, scheduler compliance checks | 503 with `"COMPANIES_HOUSE_API_KEY missing"` | YES — returns 503 |
| `STRIPE_SECRET_KEY` | `server/app.ts:55` | Stripe checkout, webhook handler | Webhook returns 500; checkout fails | YES — Stripe initializes to null |
| `STRIPE_WEBHOOK_SECRET` | `server/app.ts:81` | Stripe webhook signature validation | Webhook returns 500 `"Stripe webhook secret not configured"` | YES |
| `STRIPE_PRICE_ID` | `server/app.ts` | FineGuard Stripe checkout creation | Runtime error during checkout | YES — only at checkout time |
| `APP_URL` | `server/app.ts:258` | Stripe checkout success/cancel redirect URL | Falls back to `http://localhost:PORT` | YES — functional but incorrect URL |
| `DEPLOY_RECORD_TOKEN` | `server/app.ts:51`, line 304 | `POST /api/deployments/record` | Returns 401 | YES |
| `VITE_GITHUB_REPO` | `src/` (frontend only) | GitHub repo link in UI | Falls back to `'owner/repo'` literal | YES |

---

## Tier 5 — Azure integrations (P2, not required for Neon/Vercel path)

All absent gracefully — the code initializes clients to `null` or `undefined` and guards callers.

| Variable | Feature |
|---|---|
| `AZURE_STORAGE_CONNECTION_STRING` | Blob storage for document bundles |
| `AZURE_STORAGE_ACCOUNT` | Blob storage account name |
| `AZURE_STORAGE_KEY` | Blob storage key |
| `AZURE_STORAGE_CONTAINER` | Container name (default: `clerkos-documents`) |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | Service Bus message queue |
| `AZURE_SERVICE_BUS_NAMESPACE` | Service Bus namespace |

---

## Tier 6 — Auth (Azure B2C / tRPC)

Required for tRPC procedures that validate Azure AD B2C JWTs. The PIE endpoint (`POST /api/pie/opportunity`) does NOT use tRPC or JWT auth — it is a plain Express route. Not required for the minimal workflow proof.

| Variable | Source | Absence effect |
|---|---|---|
| `AZURE_B2C_TENANT_NAME` | `server/trpc/_core/auth.ts:7` | B2C JWT validation skipped; dev fallback activates |
| `AZURE_B2C_TENANT_ID` | `server/trpc/_core/auth.ts:16` | Same |
| `AZURE_B2C_CLIENT_ID` | `server/trpc/_core/auth.ts:9` | Same |
| `AZURE_B2C_POLICY` | `server/trpc/_core/auth.ts:8` | Defaults to `B2C_1_signupsignin` |
| `DEFAULT_TENANT_SLUG` | `server/trpc/_core/auth.ts:114` | Dev fallback tenant slug for unauthenticated tRPC calls |
| `OWNER_OPEN_ID` | `server/trpc/_core/env.ts:2` | Defaults to empty string |

---

## Build-Time Note

`npm run build` (`tsc && vite build`) requires **no environment variables**. Confirmed: build passes with zero env vars set (verified in this session — 190/190 tests, build ✓). The CI workflows pass `COMPANIES_HOUSE_API_KEY: placeholder-ci-build-only` as a historical artifact — it is not actually consumed during the build.

`DIRECT_URL` and `DATABASE_URL` are only read at runtime by migration scripts and the server process. They are never read by tsc or vite.

---

## Minimal Set for Live PIE Workflow Proof

To prove one Bromley opportunity flows through PIE→UltAi→FineGuard→VaultLine:

```bash
# .env (local) — minimum required
DATABASE_URL="postgresql://..."     # Neon pooler URL
DIRECT_URL="postgresql://..."       # Neon direct URL (migrations only)
ADMIN_API_KEY="any-non-empty-value" # optional for PIE path; required for /api/internal/*
```

Vercel production (runtime only — DIRECT_URL not needed in Vercel):
```
DATABASE_URL  → set in Vercel dashboard
ADMIN_API_KEY → set in Vercel dashboard
```

---

## Summary Table

| Variable | Vercel required? | Local bootstrap required? | PIE workflow critical? |
|---|---|---|---|
| `DATABASE_URL` | YES | YES | YES |
| `DIRECT_URL` | NO (migrations only) | YES | NO (runtime) |
| `ADMIN_API_KEY` | YES | NO | NO |
| `COMPANIES_HOUSE_API_KEY` | Optional (503 if absent) | NO | NO |
| `STRIPE_SECRET_KEY` | Optional | NO | NO |
| `STRIPE_WEBHOOK_SECRET` | Optional | NO | NO |
| `STRIPE_PRICE_ID` | Optional | NO | NO |
| `APP_URL` | Optional | NO | NO |
| `DEPLOY_RECORD_TOKEN` | Optional | NO | NO |
| `VITE_GITHUB_REPO` | Optional | NO | NO |
| `AZURE_B2C_*` | Optional | NO | NO |
| `AZURE_*` (storage/bus) | Optional | NO | NO |
