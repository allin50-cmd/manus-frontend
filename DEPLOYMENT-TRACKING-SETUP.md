# Deployment Tracking System - Quick Setup Guide

Complete automated deployment tracking for VaultLine Brand Suite across dev, staging, and production environments.

---

## Prerequisites

- PostgreSQL database (local or cloud-hosted)
- GitHub repository
- Azure App Service (or compatible hosting)
- Node.js 20+ and pnpm 8+

---

## Step 1: Database Setup

### Option A: Local PostgreSQL

```bash
# Install PostgreSQL (if not already installed)
# macOS
brew install postgresql@15
brew services start postgresql@15

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
psql postgres
CREATE DATABASE vaultline_db;
CREATE USER vaultline_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE vaultline_db TO vaultline_user;
\q
```

### Option B: Azure Database for PostgreSQL

```bash
# Create Azure PostgreSQL Flexible Server
az postgres flexible-server create \
  --name vaultline-db \
  --resource-group vaultline-rg \
  --location eastus \
  --admin-user vaultlineadmin \
  --admin-password 'YourSecurePassword123!' \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32

# Get connection string
az postgres flexible-server show-connection-string \
  --server-name vaultline-db \
  --database-name postgres \
  --admin-user vaultlineadmin \
  --admin-password 'YourSecurePassword123!'
```

---

## Step 2: Environment Configuration

### Create `.env` file

```bash
# Copy example file
cp .env.example .env

# Generate secure token
export DEPLOY_TOKEN=$(openssl rand -hex 32)
echo "Generated token: $DEPLOY_TOKEN"

# Edit .env file
cat > .env << EOF
# Database Configuration
DATABASE_URL="postgresql://vaultline_user:your-password@localhost:5432/vaultline_db"

# Deployment Recording Token
DEPLOY_RECORD_TOKEN="$DEPLOY_TOKEN"

# Server Configuration
PORT=3000
NODE_ENV=development
EOF
```

---

## Step 3: Install Dependencies

```bash
# Install pnpm globally (if not installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

---

## Step 4: Database Migration

```bash
# Push database schema
pnpm db:push

# Or generate and run migrations
pnpm db:generate
pnpm db:migrate

# Seed with sample data (optional)
pnpm db:seed
```

### Verify Database Tables

```bash
# Connect to database
psql "$DATABASE_URL"

# List tables
\dt

# Expected tables:
# - deployment_status
# - leads
# - intake_forms
# - compliance_bundles
# - contacts

# View schema
\d deployment_status

# Check data
SELECT * FROM deployment_status;
\q
```

---

## Step 5: GitHub Configuration

### 1. Add Repository Secrets

Go to: **GitHub → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value |
|------------|-------|
| `DEPLOY_RECORD_TOKEN` | From `.env` file |
| `VAULTLINE_API_URL` | `https://your-app.azurewebsites.net` |
| `AZURE_WEBAPP_NAME` | Your Azure App Service name |
| `AZURE_WEBAPP_PUBLISH_PROFILE` | Download from Azure Portal |

### 2. Get Azure Publish Profile

```bash
# Download publish profile
az webapp deployment list-publishing-profiles \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --xml

# Copy the XML output and add as GitHub secret
```

---

## Step 6: Test Locally

### Start Development Server

```bash
# Terminal 1: Start Express backend
pnpm server:watch

# Terminal 2: Start Vite frontend
pnpm dev

# Open browser
open http://localhost:5173
```

### Test Deployment Tracking API

```bash
# Test health check
curl http://localhost:3000/health

# Record a test deployment
curl -X POST "http://localhost:3000/api/deployments/record" \
  -H "X-DEPLOY-TOKEN: $DEPLOY_RECORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "status": "success",
    "commit": "test123",
    "workflowRun": "12345"
  }'

# Check deployment status
curl http://localhost:3000/api/deployments/status

# View in admin dashboard
open http://localhost:5173/admin
```

---

## Step 7: Deploy to Azure

### Configure Azure App Service

```bash
# Create App Service
az webapp create \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --plan vaultline-plan \
  --runtime "NODE:20-lts"

# Configure environment variables
az webapp config appsettings set \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    DEPLOY_RECORD_TOKEN="$DEPLOY_TOKEN" \
    NODE_ENV="production"

# Enable logging
az webapp log config \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --application-logging filesystem \
  --detailed-error-messages true \
  --failed-request-tracing true \
  --web-server-logging filesystem
```

### Manual Deployment (First Time)

```bash
# Build application
pnpm build

# Deploy to Azure
az webapp deploy \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --src-path dist.zip \
  --type zip
```

---

## Step 8: Configure GitHub Actions

The workflow file `.github/workflows/deploy-vaultline.yml` is already configured.

### Trigger First Deployment

```bash
# Push to main branch
git add .
git commit -m "feat: add deployment tracking system"
git push origin main

# Or manually trigger workflow
# Go to: GitHub → Actions → Deploy VaultLine Brand Suite → Run workflow
# Select environment: dev/staging/prod
# Click "Run workflow"
```

### Monitor Deployment

1. **GitHub Actions**: Check workflow progress
   - Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/actions`

2. **Admin Dashboard**: View deployment status
   - Go to: `https://vaultline-brand-suite.azurewebsites.net/admin`

3. **Azure Logs**: Check application logs
   ```bash
   az webapp log tail \
     --name vaultline-brand-suite \
     --resource-group vaultline-rg
   ```

---

## Verification Checklist

- [ ] Database tables created successfully
- [ ] Local server starts without errors
- [ ] `/health` endpoint returns 200 OK
- [ ] POST `/api/deployments/record` accepts deployments
- [ ] GET `/api/deployments/status` returns deployments
- [ ] Admin dashboard at `/admin` displays deployment status
- [ ] GitHub Actions workflow triggers on push
- [ ] Deployment recording works in GitHub Actions
- [ ] Azure App Service is running
- [ ] Environment variables configured in Azure

---

## Common Issues

### Database Connection Error

**Problem**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Check PostgreSQL is running
pg_isready

# Test connection string
psql "$DATABASE_URL"

# Verify DATABASE_URL is correct in .env
echo $DATABASE_URL
```

### Deployment Recording 401 Unauthorized

**Problem**: GitHub Actions gets 401 error

**Solution**:
```bash
# Verify token matches in both places:
# 1. .env file (local)
cat .env | grep DEPLOY_RECORD_TOKEN

# 2. GitHub Secrets
# Go to: GitHub → Settings → Secrets → DEPLOY_RECORD_TOKEN

# 3. Azure App Service
az webapp config appsettings list \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --query "[?name=='DEPLOY_RECORD_TOKEN'].value" -o tsv
```

### Admin Dashboard Shows No Deployments

**Problem**: Panel shows "No deployments recorded yet"

**Solution**:
```bash
# Check database directly
psql "$DATABASE_URL" -c "SELECT * FROM deployment_status;"

# Test API endpoint
curl https://vaultline-brand-suite.azurewebsites.net/api/deployments/status

# Verify API is accessible
curl https://vaultline-brand-suite.azurewebsites.net/health
```

### GitHub Actions Deployment Fails

**Problem**: Workflow fails at deployment step

**Solution**:
```bash
# Verify Azure credentials
az webapp deployment list-publishing-profiles \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg

# Check Azure App Service status
az webapp show \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --query state
```

---

## Maintenance

### View Deployment History

```bash
# Get all deployments
curl https://vaultline-brand-suite.azurewebsites.net/api/deployments/history

# Filter by environment
curl "https://vaultline-brand-suite.azurewebsites.net/api/deployments/history?environment=prod&limit=10"

# Query database directly
psql "$DATABASE_URL" << EOF
SELECT
  environment,
  status,
  commit,
  deployed_at
FROM deployment_status
ORDER BY deployed_at DESC
LIMIT 20;
EOF
```

### Backup Database

```bash
# Backup deployment data
pg_dump "$DATABASE_URL" \
  --table=deployment_status \
  --data-only \
  > deployment_backup_$(date +%Y%m%d).sql

# Backup all data
pg_dump "$DATABASE_URL" > full_backup_$(date +%Y%m%d).sql
```

### Rotate Deployment Token

```bash
# Generate new token
NEW_TOKEN=$(openssl rand -hex 32)

# Update .env
sed -i '' "s/DEPLOY_RECORD_TOKEN=.*/DEPLOY_RECORD_TOKEN=\"$NEW_TOKEN\"/" .env

# Update GitHub Secret
# Go to: GitHub → Settings → Secrets → DEPLOY_RECORD_TOKEN → Update

# Update Azure
az webapp config appsettings set \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --settings DEPLOY_RECORD_TOKEN="$NEW_TOKEN"
```

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review [DEPLOYMENT-TRACKING.md](./DEPLOYMENT-TRACKING.md) for detailed documentation
- Check Azure App Service logs
- Review GitHub Actions workflow logs

---

**Setup Time**: ~30 minutes
**Last Updated**: 2024-01-15
**Version**: 1.0.0
