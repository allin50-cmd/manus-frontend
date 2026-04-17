# Unified Intelligence OS

Multi-tenant revenue, legal ops, and compliance intelligence platform. Lives alongside the existing Vite marketing site at the repo root — this app is self-contained in `os/`.

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + PostgreSQL (Azure Flexible Server)
- Upstash Redis (event bus) + QStash (queue)
- OpenAI (narrative / extraction)
- Stripe Connect (billing, wired in a later module)
- Deploys to Azure Container Apps or App Service (`output: 'standalone'`)

## Layout

```
os/
  app/
    api/
      gateway/route.ts           # unified entry point
      revenue/submit/route.ts
      revenue/narrative/route.ts
      law/...                    # module 2
      compliance/...             # module 3
  lib/
    auth.ts                      # x-api-key + tenant resolution
    prisma.ts
    redis.ts
    events.ts                    # event bus (DB + Redis pub/sub)
    http.ts
    verticals/
      revenue/{scoring,submit,narrative,actions}.ts
      law/actions.ts             # stub
      compliance/actions.ts      # stub
  prisma/
    schema.prisma
    seed.ts
```

## Local setup

```bash
cd os
npm install
cp .env.example .env
# fill in DATABASE_URL at minimum
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed        # prints an API key — save it
npm run dev                # http://localhost:3001
```

## Calling the API

All endpoints require `x-api-key` (from the seed output). Two call styles:

### 1. Unified gateway

```bash
curl -X POST http://localhost:3001/api/gateway \
  -H "x-api-key: uios_..." \
  -H "content-type: application/json" \
  -d '{
    "vertical": "revenue",
    "action": "submit",
    "payload": {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "system": "MLC",
      "sizeTier": "10-30",
      "painPoints": ["unbilled_work", "manual_admin"]
    }
  }'
```

### 2. Direct vertical route

```bash
curl -X POST http://localhost:3001/api/revenue/submit \
  -H "x-api-key: uios_..." \
  -H "content-type: application/json" \
  -d '{ "name": "...", "email": "...", "sizeTier": "10-30", "painPoints": [] }'
```

## UI

Three working pages under `app/`, backed by the same API routes:

| Route | Module |
|---|---|
| `/audit` | Revenue Engine form + result + narrative generator |
| `/law` | Document processor (URL/PDF/DOCX) + free-form billing generator |
| `/compliance` | Company lookup + alert webhook registration |

API keys are entered in the top-bar input and persisted in `localStorage` under `uios.apiKey`.

## Deploy to Azure

### Prerequisites

- Azure subscription, resource group `rg-unified-os`, Azure Container Registry, Postgres Flexible Server (created by the Bicep on first run)
- GitHub repo secrets: `AZURE_CREDENTIALS` (service principal JSON), `ACR_NAME`, `ACR_LOGIN_SERVER`, `DB_PASSWORD`, `DATABASE_URL`, `OPENAI_API_KEY`, `COMPANIES_HOUSE_API_KEY`, `WEBHOOK_SIGNING_SECRET`, `CRM_WEBHOOK_URL`, `RESEND_KEY`, `STRIPE_SECRET_KEY`

### Pipeline

`.github/workflows/deploy-os.yml` triggers on any push to `main` that touches `os/**` or the Bicep, or via manual dispatch. The job:

1. Installs deps, type-checks, runs vitest
2. Builds the Docker image from `os/Dockerfile` (Next.js `output: 'standalone'`), tags with short SHA + `latest`, pushes to ACR
3. Runs `az deployment group create` against `infra/main.bicep` with the new image tag
4. Runs `prisma migrate deploy` against the production database
5. Prints the public FQDN

### Manual deploy

```bash
# From repo root
az group create -n rg-unified-os -l uksouth
az acr create -n <acrName> -g rg-unified-os --sku Basic --admin-enabled true
az acr build --registry <acrName> --image unified-intelligence-os:latest os/
az deployment group create \
  --resource-group rg-unified-os \
  --template-file infra/main.bicep \
  --parameters environmentName=aios acrLoginServer=<acrName>.azurecr.io \
               dbPassword=<...> openaiKey=<...> resendKey=<...> stripeSecretKey=<...> \
               companiesHouseApiKey=<...> webhookSigningSecret=<...> crmWebhookUrl=<...>
```

## Module status

- [x] **Foundation** — Prisma schema, API-key auth, tenant isolation, `/api/gateway`, event bus
- [x] **Revenue Engine** — deterministic scoring, idempotent lead capture, CRM webhook, AI narrative
- [x] **Law Clerks AI** — PDF/DOCX/text ingestion, AI task + party + deadline extraction, compliance flags (GDPR / court / privilege), billing narrative generation, deterministic fallback when OpenAI is absent
- [x] **FineGuard Pro** — live Companies House profile + filing history, spec-exact scoring (overdue / <7d / late-history / event-type increments × penalty multiplier 50), persists a compliance `Lead` per company, `Event`-backed webhook subscriptions

## Law endpoints

```bash
curl -X POST http://localhost:3001/api/law/process-document \
  -H "x-api-key: uios_..." -H "content-type: application/json" \
  -d '{
    "documentUrl": "https://storage.example.com/brief.pdf",
    "documentType": "brief",
    "ratePerHour": 300
  }'

curl -X POST http://localhost:3001/api/law/generate-billing \
  -H "x-api-key: uios_..." -H "content-type: application/json" \
  -d '{
    "text": "Reviewed disclosure bundle. Drafted witness statement. 2h call with client.",
    "ratePerHour": 300
  }'
```

Supported document MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document` (DOCX), `text/*`, `text/html`, `message/rfc822`. Max 10 MB.

## Compliance endpoints (FineGuard Pro)

Requires `COMPANIES_HOUSE_API_KEY` in env.

```bash
curl -X POST http://localhost:3001/api/compliance/check-company \
  -H "x-api-key: uios_..." -H "content-type: application/json" \
  -d '{ "companyNumber": "12345678" }'

curl -X POST http://localhost:3001/api/compliance/register-webhook \
  -H "x-api-key: uios_..." -H "content-type: application/json" \
  -d '{
    "companyNumber": "12345678",
    "webhookUrl": "https://tenant.example.com/hooks/companies-house"
  }'
```

Scoring (from spec): `overdue +50`, `days-to-deadline <7 +20`, `late filing history +30`, accounts event `+25`, confirmation statement event `+15`, capped at 100. Predicted penalty = `riskScore × 50` (GBP).
