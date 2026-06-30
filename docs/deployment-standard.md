# Deployment Standard

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

This document is the single authoritative reference for how this repository is built, tested, and deployed. All CI/CD pipelines must conform to it.

---

## Package Manager

**Standard:** npm  
**Lockfile:** `package-lock.json`  
**Install command:** `npm ci`  
**Do not use:** pnpm, yarn, bun

---

## Node Version

**Standard:** 20  
**Minimum:** >=20.0.0 (per `package.json` engines field)  
**Both CI pipelines declare:** `node-version: '20'`

---

## Build Commands

| Purpose | Command |
|---|---|
| Install (CI) | `npm ci` |
| Install (dev) | `npm install` |
| Build frontend + server | `npm run build` |
| Run tests | `npm test` |
| Type check only | `npm run type-check` |
| Lint | `npm run lint` |

---

## Development (Local)

| Purpose | Command |
|---|---|
| Both servers with hot reload | `npm run dev:full` |
| Frontend only (Vite, port 5173) | `npm run dev` |
| Backend only (Express, port 3000) | `npm run server:watch` |

**Vite proxy:** `/api/*` requests from port 5173 are proxied to `http://localhost:3000`. No CORS configuration required for local development.

---

## Database

Two schemas share one `DATABASE_URL`. Both must be initialised for the application to function.

### Brand-suite schema (intake_forms, compliance_bundles, leads, monitored_companies)

```bash
npm run db:push          # push schema directly (dev)
npm run db:generate      # generate migration SQL
npm run db:migrate       # run migrations
```

Config: `drizzle.config.ts` → `server/db/schema.ts` → output: `./drizzle/`

### ClerkOS schema (tenants, clerk_cases, clerk_audit_events, and 6 others)

```bash
npm run db:push:clerkos          # push schema directly (dev)
npm run db:generate:clerkos      # generate migration SQL
npm run db:migrate:clerkos       # run migrations
```

Config: `drizzle.clerkos.config.ts` → `server/drizzle/schema.ts` → output: `./server/drizzle/migrations/`

### System tenant (required for VaultLine audit writes from brand-suite)

This SQL must be run once per environment after ClerkOS schema is migrated:

```sql
INSERT INTO tenants (id, name, slug, plan) VALUES
('00000000-0000-0000-0000-000000000001', 'UltraCore System', 'system', 'enterprise')
ON CONFLICT (slug) DO NOTHING;
```

---

## CI/CD Pipelines

Two workflows exist. Both are correct and must remain in sync.

### `deploy-vaultline.yml`

| Field | Value |
|---|---|
| Trigger | Push to `main`, manual dispatch |
| Node | 20 |
| Install | `npm ci` |
| Build | `npm run build` |
| Deploy target | Azure App Service |
| Secret required | `AZURE_WEBAPP_NAME`, `AZURE_WEBAPP_PUBLISH_PROFILE` |

### `azure-static-web-apps-ci-cd.yml`

| Field | Value |
|---|---|
| Trigger | Push to `main`/`master`, PR open/sync/close |
| Node | 20 |
| Install | `npm ci` |
| Build | `npm run build` |
| Deploy target | Azure Static Web Apps |
| Secret required | `AZURE_STATIC_WEB_APPS_API_TOKEN` |

---

## Environment Variables

All variables must be set in the deployment environment. See `.env.example` for full list.

| Variable | Required | Used by |
|---|---|---|
| `DATABASE_URL` | **YES** | All — both schemas |
| `COMPANIES_HOUSE_API_KEY` | **YES for FineGuard** | Throws on first compliance request if absent |
| `ADMIN_API_KEY` | **YES** | `/api/admin/*` endpoints |
| `PORT` | No (default: 3000) | Express server |
| `NODE_ENV` | No (default: development) | Build/runtime |
| `STRIPE_SECRET_KEY` | No | Stripe checkout (skips gracefully) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook (fails signature check) |
| `STRIPE_PRICE_ID` | No | Stripe checkout |
| `AZURE_B2C_TENANT_NAME` | No | tRPC auth (dev fallback available) |
| `AZURE_STORAGE_CONNECTION_STRING` | No | Blob storage (graceful no-op) |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | No | Service Bus (graceful no-op) |
| `DEFAULT_TENANT_SLUG` | No | Dev auth fallback |
| `OWNER_OPEN_ID` | No | Admin bootstrap |

---

## Hosting Policy

| Layer | Platform |
|---|---|
| Application | Vercel (target) / Azure App Service (current) |
| DNS + Security | Cloudflare |
| Audit + Retention | Azure (VaultLine only) |
| Frontend CDN | Azure Static Web Apps (current) |

---

## Deployment Verification Checklist

After any deployment, confirm:

- [ ] `GET /api/health` returns 200
- [ ] `GET /` serves the React app
- [ ] `POST /api/intake` (with valid body) returns `{ ok: true, matterRef: "MAT-..." }`
- [ ] `GET /api/admin/leads` with `X-ADMIN-KEY` header returns 200
- [ ] `/api/trpc/cases.list` returns data (requires auth token or `x-user-open-id` dev header)
- [ ] ClerkOS schema migrated (9 tables present)
- [ ] System tenant seeded (row `00000000-0000-0000-0000-000000000001` in `tenants`)
