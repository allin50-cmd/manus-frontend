# FineGuard Pro

Full-stack compliance monitoring platform. Next.js 14 App Router with PostgreSQL, Stripe billing, and optional Temporal workflow engine.

## Architecture

```
GitHub → GitHub Actions → Azure App Service (Node 20, Linux)
                       → Azure PostgreSQL Flexible Server
```

This is a server-side application. It is **not** a static frontend. It requires a persistent Node.js process and a PostgreSQL database.

## Health endpoint

```
GET /api/health
→ 200 { "status": "ok", "database": "connected" }
→ 503 { "status": "unhealthy", "database": "disconnected" }
```

## First deploy

See [AZURE-DEPLOYMENT-GUIDE.md](./AZURE-DEPLOYMENT-GUIDE.md).

## Local development

```bash
cp .env.example .env.local
# fill in DATABASE_URL and other required vars
npm install
npm run db:migrate
npm run dev
```

## Tests

```bash
npm test          # 56 unit/integration/workflow tests
npx tsc --noEmit  # TypeScript check
```

## Deploy via CLI

```bash
# Edit values in scripts/run-deploy.sh, then:
bash scripts/run-deploy.sh
```

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/deploy-azure.sh` | Full Azure provisioner + deployer (idempotent) |
| `scripts/run-deploy.sh` | Config wrapper for deploy-azure.sh |
| `scripts/stress-test.ts` | Autocannon load test against running server |
| `scripts/smoke-test.ts` | Quick endpoint probe |

## Deprecated

- **Azure Static Web Apps** — not used, not compatible with this app
- `staticwebapp.config.json` — deleted
- Legacy SPA/Vite workflows — deleted
