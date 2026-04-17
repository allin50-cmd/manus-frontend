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

## Module status

- [x] **Foundation** — Prisma schema, API-key auth, tenant isolation, `/api/gateway`, event bus
- [x] **Revenue Engine** — deterministic scoring, idempotent lead capture, CRM webhook, AI narrative
- [ ] **Law Clerks AI** — document processing, task extraction, billing entries
- [ ] **FineGuard Pro** — Companies House monitoring, penalty prediction (reuses `server/services/companiesHouse.ts`)
