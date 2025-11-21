# VaultLine Brand Suite - Deployment Tracking

**Automated deployment tracking system for VaultLine Cloud, UltAi Secure Intake, and FineGuard Compliance Cloud.**

---

## Overview

This repository now includes a complete deployment tracking system that:
- ✅ Records every deployment to dev, staging, and production
- ✅ Displays deployment status in real-time admin dashboard
- ✅ Integrates seamlessly with GitHub Actions
- ✅ Stores deployment history in PostgreSQL database
- ✅ Provides REST API for deployment queries

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-org/manus-frontend.git
cd manus-frontend

# 2. Install dependencies
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your database URL and deployment token

# 4. Set up database
pnpm db:push

# 5. Start development servers
pnpm server:watch  # Terminal 1
pnpm dev           # Terminal 2

# 6. Test deployment tracking
./test-deployment-tracking.sh

# 7. View admin dashboard
open http://localhost:5173/admin
```

---

## Documentation

### Setup Guides
- **[Quick Setup Guide](./DEPLOYMENT-TRACKING-SETUP.md)** - Step-by-step installation (30 min)
- **[Full Documentation](./DEPLOYMENT-TRACKING.md)** - Complete system documentation
- **[Azure Deployment](./AZURE-DEPLOYMENT-GUIDE.md)** - Deploy to Azure App Service

### Key Files
- `.github/workflows/deploy-vaultline.yml` - GitHub Actions workflow
- `server/index.ts` - Express API server
- `server/db/schema.ts` - Database schema with Drizzle ORM
- `src/components/admin/DeploymentStatusPanel.tsx` - Admin UI component

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions                          │
│  (Triggers on push to main or manual workflow dispatch)    │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ POST /api/deployments/record
                 │ Headers: X-DEPLOY-TOKEN
                 │ Body: { environment, status, commit, workflowRun }
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express API Server                        │
│  - Validates authentication token                           │
│  - Validates request payload                                │
│  - Stores deployment in PostgreSQL                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ INSERT INTO deployment_status
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                          │
│  - deployment_status table                                  │
│  - Indexed by environment and deployed_at                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ SELECT latest deployments
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   Admin Dashboard                           │
│  - GET /api/deployments/status                             │
│  - Real-time deployment status panel                        │
│  - Auto-refresh every 60 seconds                           │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Deployment Tracking

#### `POST /api/deployments/record`
Record a new deployment (requires authentication)

**Headers:**
- `X-DEPLOY-TOKEN`: Deployment recording token

**Request Body:**
```json
{
  "environment": "dev|staging|prod",
  "status": "success|failed|in_progress",
  "commit": "abc123def456",
  "workflowRun": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

#### `GET /api/deployments/status`
Get latest deployment for each environment (public)

**Response:**
```json
{
  "deployments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "environment": "prod",
      "status": "success",
      "commit": "abc123def456",
      "workflowRun": "1234567890",
      "deployedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### `GET /api/deployments/history`
Get deployment history with optional filters

**Query Parameters:**
- `environment` (optional): Filter by environment
- `limit` (optional): Number of records to return (default: 50)

**Response:**
```json
{
  "deployments": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "environment": "prod",
      "status": "success",
      "commit": "abc123def456",
      "workflowRun": "1234567890",
      "deployedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

## Database Schema

### `deployment_status` Table

```sql
CREATE TABLE deployment_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  environment VARCHAR(20) NOT NULL,     -- dev, staging, prod
  status VARCHAR(20) NOT NULL,          -- success, failed, in_progress
  commit VARCHAR(50) NOT NULL,          -- Git commit SHA
  workflow_run VARCHAR(50) NOT NULL,    -- GitHub workflow run ID
  deployed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_deployment_environment ON deployment_status(environment);
CREATE INDEX idx_deployment_deployed_at ON deployment_status(deployed_at DESC);
```

---

## GitHub Actions Workflow

The workflow automatically:
1. ✅ Builds the application
2. ✅ Deploys to Azure App Service
3. ✅ Records deployment status
4. ✅ Generates deployment summary

### Manual Trigger

```bash
# Via GitHub UI
# 1. Go to Actions tab
# 2. Select "Deploy VaultLine Brand Suite"
# 3. Click "Run workflow"
# 4. Choose environment (dev/staging/prod)
# 5. Click "Run workflow"

# Via GitHub CLI
gh workflow run deploy-vaultline.yml \
  -f environment=dev
```

### Automatic Trigger

Pushes to `main` branch automatically deploy to `dev` environment.

---

## Admin Dashboard

Access at: `/admin`

### Features
- 📊 Real-time deployment status for all environments
- 🔄 Auto-refresh every 60 seconds
- 🎨 Color-coded environment badges
- ✅ Status indicators (success, failed, in-progress)
- 🔗 Direct links to GitHub workflow runs
- ⏱️ Relative timestamps (e.g., "2h ago")
- 📝 Commit hash display

### Screenshot

```
┌───────────────────────────────────────────────────────────┐
│  Deployment Status                          [Refresh]     │
├───────────────────────────────────────────────────────────┤
│  ✓  [PROD]     Success • 2h ago                          │
│     abc123 • Run #1234567890                    [View →] │
├───────────────────────────────────────────────────────────┤
│  ✓  [STAGING]  Success • 5h ago                          │
│     def456 • Run #1234567891                    [View →] │
├───────────────────────────────────────────────────────────┤
│  ✓  [DEV]      Success • 1h ago                          │
│     ghi789 • Run #1234567892                    [View →] │
└───────────────────────────────────────────────────────────┘
```

---

## Environment Variables

### Required

```bash
# Database connection string
DATABASE_URL="postgresql://user:password@host:port/database"

# Deployment recording authentication token
DEPLOY_RECORD_TOKEN="your-secure-token-here"
```

### Optional

```bash
# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=development

# API URL for GitHub Actions (production only)
VAULTLINE_API_URL="https://your-app.azurewebsites.net"
```

### Generate Secure Token

```bash
# macOS/Linux
openssl rand -hex 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Testing

### Run Test Suite

```bash
# Load environment variables
source .env

# Run test script
./test-deployment-tracking.sh

# Expected output:
# ✓ Health check passed
# ✓ Dev deployment recorded
# ✓ Staging deployment recorded
# ✓ Production deployment recorded
# ✓ Deployment status retrieved
# ✓ Deployment history retrieved
# ✓ Failed deployment recorded
# ✓ Authentication properly rejected invalid token
# ✓ Invalid environment properly rejected
# All tests passed! ✓
```

### Manual Testing

```bash
# Test health endpoint
curl http://localhost:3000/health

# Record test deployment
curl -X POST "http://localhost:3000/api/deployments/record" \
  -H "X-DEPLOY-TOKEN: your-token" \
  -H "Content-Type: application/json" \
  -d '{"environment":"dev","status":"success","commit":"test","workflowRun":"1"}'

# Get deployment status
curl http://localhost:3000/api/deployments/status

# View in browser
open http://localhost:5173/admin
```

---

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql "$DATABASE_URL"

# Verify .env file
cat .env | grep DATABASE_URL
```

#### 2. Authentication Error (401)
```bash
# Verify token in .env
echo $DEPLOY_RECORD_TOKEN

# Check GitHub Secret matches
# Go to: GitHub → Settings → Secrets → DEPLOY_RECORD_TOKEN

# Check Azure App Service setting
az webapp config appsettings list \
  --name vaultline-brand-suite \
  --resource-group vaultline-rg \
  --query "[?name=='DEPLOY_RECORD_TOKEN']"
```

#### 3. No Deployments Showing
```bash
# Check database
psql "$DATABASE_URL" -c "SELECT * FROM deployment_status;"

# Test API
curl http://localhost:3000/api/deployments/status

# Check logs
pnpm server:watch
```

---

## Security

### Best Practices

1. **Token Security**
   - Use strong, randomly generated tokens (32+ characters)
   - Never commit tokens to version control
   - Rotate tokens periodically
   - Use different tokens for different environments

2. **Database Security**
   - Use SSL/TLS for database connections
   - Restrict database access to application servers only
   - Use strong passwords
   - Enable connection pooling

3. **API Security**
   - Authentication required for write operations
   - Public read-only access for status endpoint
   - Rate limiting recommended for production
   - CORS configured for frontend domain

---

## Performance

### Optimization Tips

1. **Database Indexing**
   ```sql
   CREATE INDEX idx_deployment_environment
   ON deployment_status(environment);

   CREATE INDEX idx_deployment_deployed_at
   ON deployment_status(deployed_at DESC);
   ```

2. **Connection Pooling**
   - Maximum 10 connections configured
   - Idle timeout: 20 seconds
   - Connection timeout: 10 seconds

3. **Caching**
   - Admin dashboard auto-refreshes every 60 seconds
   - Consider adding Redis cache for high traffic

---

## Monitoring

### Key Metrics

- **Deployment Frequency**: Deployments per day/week
- **Success Rate**: % of successful deployments
- **Mean Time to Deploy**: Average deployment duration
- **Failed Deployments**: Track and investigate failures

### Alerts

Set up alerts for:
- Failed deployments (status = 'failed')
- No deployments in X days (stale environment)
- API endpoint failures
- Database connection issues

---

## Contributing

### Adding New Features

1. Create feature branch
2. Make changes
3. Test locally with `./test-deployment-tracking.sh`
4. Commit and push
5. Create pull request
6. GitHub Actions will test and deploy

### Code Style

- TypeScript for all code
- ESLint + Prettier for formatting
- Follow existing patterns
- Add tests for new features

---

## License

MIT License - See LICENSE file for details

---

## Support

For questions or issues:
- 📧 Email: support@vaultline.com
- 🐛 Issues: GitHub Issues
- 📚 Docs: See `/docs` folder
- 💬 Discord: VaultLine Community

---

**Version**: 1.0.0
**Last Updated**: 2024-01-15
**Maintained by**: VaultLine DevOps Team
