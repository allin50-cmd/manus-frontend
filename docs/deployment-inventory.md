# Deployment Inventory

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25

All deployment information is derived from files in this repository. Live status is declared, not verified.

---

## Declared Deployments

### Deployment 1 — Manus Space (Primary)

| Field | Value |
|---|---|
| URL | https://zhoqgoan.manus.space/ |
| URL (compliance) | https://compliance-t2rtvc.manus.space/ |
| Source | `AZURE-DEPLOYMENT-GUIDE.md` |
| Provider | Manus (platform unknown) |
| Status | UNVERIFIED — URL declared in documentation only |
| CI/CD | UNKNOWN — no Manus-specific pipeline found |
| Systems served | UltAi (primary), FineGuard (compliance subdomain) |

### Deployment 2 — Azure Static Web Apps

| Field | Value |
|---|---|
| URL | UNKNOWN — determined by Azure at provision time |
| CI/CD workflow | `.github/workflows/azure-static-web-apps-ci-cd.yml` |
| Trigger | Push to `main` or `master`; PR open/sync/close |
| Package manager | npm (`npm ci`) |
| Build command | `npm run build` |
| Output directory | `dist/` |
| Auth token | GitHub secret `AZURE_STATIC_WEB_APPS_API_TOKEN` |
| Skip on missing secrets | Yes (`skip_deploy_on_missing_secrets: true`) |
| Node version | 20 |
| API location | Empty (no serverless API deployed) |
| Systems served | Frontend only (React SPA) |
| Build status | **BROKEN** — `npm run build` fails (TS2688) |

### Deployment 3 — Azure App Service

| Field | Value |
|---|---|
| URL | Resolved from GitHub secret `VAULTLINE_API_URL` — UNKNOWN |
| App name | GitHub secret `AZURE_WEBAPP_NAME` — UNKNOWN |
| CI/CD workflow | `.github/workflows/deploy-vaultline.yml` |
| Trigger | Push to `main`; manual dispatch with env choice (dev/staging/prod) |
| Package manager | pnpm (`pnpm install --frozen-lockfile`) |
| Build command | `pnpm build` |
| Output directory | `dist/` |
| Auth mechanism | `AZURE_WEBAPP_PUBLISH_PROFILE` |
| Post-deploy | Records deployment to `VAULTLINE_API_URL/api/deployments/record` with `DEPLOY_RECORD_TOKEN` |
| Node version | 22 |
| Systems served | Full-stack (Express + React SPA) |
| Build status | **BROKEN** — same TS failure; also uses pnpm but repo has `package-lock.json` (npm) |

### Deployment 4 — Azure IaC (Bicep)

| Field | Value |
|---|---|
| Template | `deploy/main.bicep` |
| Parameters (dev) | `deploy/parameters.dev.json` |
| Parameters (prod) | `deploy/parameters.prod.json` |
| Region | `uksouth` (both environments) |
| App name prefix | `clerkos` |
| Provisioning status | UNKNOWN — no deployment log or confirmation available |
| CI/CD | Manual (`az deployment group create`) — no automated pipeline found for Bicep |

---

## Azure Resources Declared in IaC

All resource names follow the pattern `clerkos-{env}-{type}`. Status of each is UNKNOWN.

| Resource | Dev Name | Prod Name | Purpose |
|---|---|---|---|
| Log Analytics Workspace | `clerkos-dev-log` | `clerkos-prod-log` | Monitoring |
| Application Insights | `clerkos-dev-ai` | `clerkos-prod-ai` | Telemetry |
| Key Vault | `clerkos-dev-kv` | `clerkos-prod-kv` | Secret storage |
| **Azure SQL Server** | `clerkos-dev-sql` | `clerkos-prod-sql` | **DB — MISMATCH: app uses PostgreSQL** |
| Azure SQL Database | `clerkos-dev-db` | `clerkos-prod-db` | **DB — MISMATCH: app uses PostgreSQL** |
| Storage Account | `clerkosdevdocs` | `clerkosprod​docs` | Blob storage for documents |
| Blob Container | `clerkos-documents` | `clerkos-documents` | Document storage (VaultLine) |
| Service Bus Namespace | `clerkos-dev-sb` | `clerkos-prod-sb` | Async queue |
| Service Bus Queue | `clerkos-bundles` | `clerkos-bundles` | Bundle orchestration trigger |
| Service Bus Queue | `clerkos-tasks` | `clerkos-tasks` | Task queue |
| Container Registry | `clerkosdevcr` | `clerkosprodcr` | Docker image registry |
| Container App Env | `clerkos-dev-cae` | `clerkos-prod-cae` | Container hosting |
| Container App | `clerkos-dev-api` | `clerkos-prod-api` | API backend |
| Static Web App | `clerkos-dev-web` | `clerkos-prod-web` | Frontend hosting |

---

## GitHub Actions Secrets Required

| Secret | Used By | Purpose |
|---|---|---|
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | `azure-static-web-apps-ci-cd.yml` | Static Web App deploy auth |
| `AZURE_WEBAPP_NAME` | `deploy-vaultline.yml` | App Service name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | `deploy-vaultline.yml` | App Service deploy credential |
| `DEPLOY_RECORD_TOKEN` | `deploy-vaultline.yml` | Deployment recording auth |
| `VAULTLINE_API_URL` | `deploy-vaultline.yml` | Base URL for deployment recording |
| `GITHUB_TOKEN` | `azure-static-web-apps-ci-cd.yml` | PR comment auth (auto-provided) |

---

## Environment Variables Required at Runtime

### Required (will throw or fail without):

| Variable | System | Notes |
|---|---|---|
| `DATABASE_URL` | All | PostgreSQL connection string. Both schemas connect here. |
| `COMPANIES_HOUSE_API_KEY` | FineGuard | `CompaniesHouseService` constructor throws if missing |

### Required for full functionality:

| Variable | System | Notes |
|---|---|---|
| `STRIPE_SECRET_KEY` | FineGuard | Stripe checkout disabled if absent |
| `STRIPE_WEBHOOK_SECRET` | FineGuard | Webhook signature verification |
| `STRIPE_PRICE_ID` | FineGuard | Required to create Stripe Checkout session |
| `AZURE_STORAGE_CONNECTION_STRING` | VaultLine | Blob storage disabled if absent (graceful no-op) |
| `AZURE_STORAGE_ACCOUNT` | VaultLine | Alternative to connection string |
| `AZURE_STORAGE_KEY` | VaultLine | Alternative to connection string |
| `AZURE_STORAGE_CONTAINER` | VaultLine | Defaults to `clerkos-documents` |
| `AZURE_SERVICE_BUS_CONNECTION_STRING` | VaultLine/UltAi | Queue disabled if absent (graceful no-op) |
| `AZURE_B2C_TENANT_NAME` | UltAi | Auth disabled without B2C; falls back to dev headers |
| `AZURE_B2C_POLICY` | UltAi | Defaults to `B2C_1_signupsignin` |
| `AZURE_B2C_CLIENT_ID` | UltAi | Required for JWT audience validation |
| `AZURE_B2C_TENANT_ID` | UltAi | Required for JWT issuer validation |
| `DEFAULT_TENANT_SLUG` | UltAi | Dev fallback for tenant resolution |
| `OWNER_OPEN_ID` | UltAi | Bootstrap admin user |
| `DEPLOY_RECORD_TOKEN` | All | Deployment recording endpoint auth |
| `APP_URL` | FineGuard | Stripe redirect URLs; defaults to `http://localhost:PORT` |
| `PORT` | All | Server port; defaults to 3000 |

### Not documented in .env.example but referenced in code:

| Variable | System | Notes |
|---|---|---|
| `AZURE_SERVICE_BUS_NAMESPACE` | VaultLine | Alternative namespace config |
| `NODE_ENV` | All | Controls dev auth fallback (`!== 'production'`) |

---

## Hosting Policy Gap

| Policy Requirement | Current State | Gap |
|---|---|---|
| Application hosting: Vercel | All CI targets Azure | No Vercel configuration found |
| DNS/CDN/Edge: Cloudflare | No Cloudflare config | No `wrangler.toml` or `wrangler.json` found |
| Audit/Retention: Azure (VaultLine only) | Azure used for everything | Other systems should move to Vercel |

---

## CI/CD Conflict

Two workflows both trigger on push to `main` with incompatible configurations:

| Property | azure-static-web-apps-ci-cd.yml | deploy-vaultline.yml |
|---|---|---|
| Package manager | npm (`npm ci`) | pnpm (`pnpm install --frozen-lockfile`) |
| Node version | 20 | 22 |
| Deployment target | Azure Static Web Apps | Azure App Service |
| Lock file used | `package-lock.json` | `pnpm-lock.yaml` (does not exist) |
| Auth | `AZURE_STATIC_WEB_APPS_API_TOKEN` | `AZURE_WEBAPP_PUBLISH_PROFILE` |
| Build expected to succeed | No (TS2688 error) | No (pnpm + same TS error) |

The `pnpm-lock.yaml` file required by `deploy-vaultline.yml` does not exist. Only `package-lock.json` (npm) is present.
