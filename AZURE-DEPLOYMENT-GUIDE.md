# FineGuard Pro — Azure Deployment Guide

## Architecture

```
GitHub → GitHub Actions → Azure App Service (Linux, Node 20)
                       → Azure PostgreSQL Flexible Server
```

CI/CD pipeline: `.github/workflows/deploy-appservice.yml`

Jobs: **test → build → migrate → deploy-web → deploy-worker (optional)**

---

## First-live deploy (automated)

```bash
cd ~/manus-frontend && git pull origin main
# Edit scripts/run-deploy.sh with your values
bash scripts/run-deploy.sh
```

The script provisions and deploys in 12 steps (~10 min total).

---

## First-live deploy (manual)

### 1. Resource group
```bash
az group create --name fineguard-rg --location uksouth
```

### 2. PostgreSQL Flexible Server
```bash
az postgres flexible-server create \
  --resource-group fineguard-rg \
  --name fineguard-db-001 \
  --location uksouth \
  --admin-user fgadmin \
  --admin-password "<strong-password>" \
  --sku-name Standard_B1ms --tier Burstable \
  --storage-size 32 --version 16 --yes

az postgres flexible-server firewall-rule create \
  --resource-group fineguard-rg --name fineguard-db-001 \
  --rule-name AllowAzureServices \
  --start-ip-address 0.0.0.0 --end-ip-address 0.0.0.0

az postgres flexible-server db create \
  --resource-group fineguard-rg \
  --server-name fineguard-db-001 --database-name fineguard
```

### 3. App Service
```bash
az appservice plan create \
  --name fineguard-plan --resource-group fineguard-rg --is-linux --sku S1

az webapp create \
  --resource-group fineguard-rg --plan fineguard-plan \
  --name fineguard-pro --runtime "NODE:20-lts"

az webapp config set \
  --name fineguard-pro --resource-group fineguard-rg \
  --startup-file "sh startup.sh"
```

### 4. App Service environment variables
```bash
az webapp config appsettings set \
  --name fineguard-pro --resource-group fineguard-rg \
  --settings \
    NODE_ENV=production PORT=8080 WEBSITES_PORT=8080 \
    DATABASE_URL="postgresql://fgadmin:<pw>@fineguard-db-001.postgres.database.azure.com:5432/fineguard?sslmode=require" \
    APP_URL="https://fineguard-pro.azurewebsites.net" \
    NEXT_PUBLIC_BASE_URL="https://fineguard-pro.azurewebsites.net" \
    PUBLIC_APP_URL="https://fineguard-pro.azurewebsites.net" \
    STRIPE_SECRET_KEY="sk_test_..." STRIPE_WEBHOOK_SECRET="whsec_..." \
    STRIPE_PRICE_ACCOUNTS_FILING="price_..." \
    STRIPE_PRICE_CONFIRMATION_STATEMENT="price_..." \
    STRIPE_PRICE_STRIKE_OFF="price_..." \
    COMPANIES_HOUSE_API_KEY="..." \
    COMPANIES_HOUSE_BASE_URL="https://api.company-information.service.gov.uk" \
    MONITORING_API_KEY="$(openssl rand -hex 32)" \
    ADMIN_PASSWORD="$(openssl rand -hex 32)" \
    ADMIN_SESSION_TOKEN="$(openssl rand -hex 32)" \
    TEMPORAL_ADDRESS="localhost:7233"
```

### 5. GitHub Actions secrets
GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `AZURE_WEBAPP_NAME` | `fineguard-pro` |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | XML from App Service → Overview → Get publish profile |
| `APP_URL` | `https://fineguard-pro.azurewebsites.net` |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_BASE_URL` | Same as `APP_URL` |

### 6. Trigger deploy
```bash
git push origin main
```

### 7. Smoke test
```bash
curl https://fineguard-pro.azurewebsites.net/api/health
# → {"status":"ok","database":"connected"}
```

---

## Secrets reference

### GitHub Actions — required for first web deploy

| Secret | Fails job | Notes |
|--------|-----------|-------|
| `APP_URL` | build | Baked into client bundles at build time |
| `NEXT_PUBLIC_BASE_URL` | build | Same as APP_URL for initial deploy |
| `DATABASE_URL` | migrate | PostgreSQL connection string |
| `AZURE_WEBAPP_NAME` | deploy-web | App Service resource name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | deploy-web | XML from Azure portal |

### GitHub Actions — optional / deferred

| Secret | Notes |
|--------|-------|
| `DEPLOY_RECORD_TOKEN` | Deployment tracking — skipped silently if absent |
| `AZURE_WORKER_APP_NAME` | Worker App Service — deferred |
| `AZURE_WORKER_PUBLISH_PROFILE` | Worker App Service — deferred |

---

## App Service env vars reference

### Required for app boot
| Variable | Notes |
|----------|-------|
| `DATABASE_URL` | Must include `sslmode=require` for Azure |
| `NODE_ENV` | `production` |
| `WEBSITES_PORT` | `8080` |

### Required for core user flow
| Variable | Notes |
|----------|-------|
| `COMPANIES_HOUSE_API_KEY` | Free from developer.company-information.service.gov.uk |
| `COMPANIES_HOUSE_BASE_URL` | `https://api.company-information.service.gov.uk` |

### Required for billing
| Variable | Notes |
|----------|-------|
| `STRIPE_SECRET_KEY` | `sk_test_...` for staging, `sk_live_...` for production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — configure endpoint in Stripe dashboard first |
| `STRIPE_PRICE_ACCOUNTS_FILING` | `price_...` |
| `STRIPE_PRICE_CONFIRMATION_STATEMENT` | `price_...` |
| `STRIPE_PRICE_STRIKE_OFF` | `price_...` |

### Required for Temporal worker
| Variable | Notes |
|----------|-------|
| `TEMPORAL_ADDRESS` | Must not be localhost in production |
| `TEMPORAL_NAMESPACE` | e.g. `fineguard.abc123` |
| `TEMPORAL_TASK_QUEUE` | `fineguard-compliance` |

### Optional / monitoring
| Variable | Notes |
|----------|-------|
| `MONITORING_API_KEY` | `/api/monitoring/*` routes return 503 if unset |
| `ADMIN_PASSWORD` | Admin dashboard login |
| `ADMIN_SESSION_TOKEN` | Admin session cookie value |
| `DEPLOY_RECORD_TOKEN` | Deployment record endpoint auth |
| `PUBLIC_APP_URL` | Custom domain — falls back to APP_URL |

---

## Operations

```bash
az webapp log tail   --name fineguard-pro --resource-group fineguard-rg
az webapp restart    --name fineguard-pro --resource-group fineguard-rg
az webapp browse     --name fineguard-pro --resource-group fineguard-rg
```

**Rollback:**
```bash
git revert HEAD --no-edit && git push origin main
# or: Azure portal → App Service → Deployment Center → Deployment logs → Redeploy
```

---

## Temporal worker (deferred)

Second App Service using `Dockerfile.worker`. Web app runs without it — compliance workflows do not execute until worker is live. Set `AZURE_WORKER_APP_NAME` and `AZURE_WORKER_PUBLISH_PROFILE` in GitHub secrets to enable.

---

## Deprecated

Azure Static Web Apps is **not used** and **not compatible** with this application. This app requires a persistent Node.js process, server-side routes, and PostgreSQL. All Static Web Apps files and workflows have been removed from this repository.
