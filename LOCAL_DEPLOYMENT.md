# Local Azure Deployment Testing Guide

This guide explains how to test the FineGuard Compliance Cloud application locally using Docker Compose, simulating the Azure App Service + PostgreSQL stack.

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ for development (if running outside containers)
- 2GB+ available RAM

## Quick Start

### 1. Build and Start Services

```bash
docker-compose up --build
```

This will:
- Start PostgreSQL 16 on port 5432
- Build the app from the Dockerfile
- Start the app on port 8080
- Set up networking between services

### 2. Initialize Database

In a new terminal, run migrations:

```bash
docker-compose exec app npm run db:push
```

Or if you prefer seed data:

```bash
docker-compose exec app npm run db:seed
```

### 3. Verify Health

Check the app is running:

```bash
curl http://localhost:8080/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-02-21T12:00:00.000Z",
  "database": "connected"
}
```

### 4. Access the Application

- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api/*
- **PostgreSQL**: localhost:5432 (credentials in docker-compose.yml)

## Testing Alert Features

### Manual Alerts

1. Log in to the dashboard
2. Navigate to a monitored company detail page
3. Click the "Send Compliance Alert" button
4. Fill in alert details and select delivery channels
5. Send alert

**Note**: Outlook/Teams delivery requires M365 configuration (see below)

### Digest Alerts

The digest scheduler runs every 5 minutes to check for pending digests. Users with:
- `digestFrequency` = 'daily' or 'weekly'
- Alerts since last digest
- Alert preferences configured

will receive digest emails.

To test:
1. Set up alert preferences via `/api/alerts/preferences` (PUT)
2. Create some manual alerts
3. Wait for the scheduler to run or check logs: `docker-compose logs app`

## Configuring Optional Services

### M365 Integration (Outlook/Teams)

To enable M365 alerts, add credentials to docker-compose.yml:

```yaml
environment:
  AZURE_TENANT_ID: "your-tenant-id"
  AZURE_CLIENT_ID: "your-client-id"
  AZURE_CLIENT_SECRET: "your-client-secret"
```

Then restart:

```bash
docker-compose down
docker-compose up --build
```

Check M365 status:

```bash
curl http://localhost:8080/api/m365/status
```

### Stripe Integration

For payment testing, add to docker-compose.yml:

```yaml
environment:
  STRIPE_SECRET_KEY: "sk_test_..."
  STRIPE_WEBHOOK_SECRET: "whsec_..."
```

### Companies House API

For real Companies House lookups:

```yaml
environment:
  COMPANIES_HOUSE_API_KEY: "your-api-key"
```

## Logs and Debugging

### View App Logs

```bash
docker-compose logs app -f
```

### View Database Logs

```bash
docker-compose logs postgres -f
```

### Access Database Directly

```bash
docker-compose exec postgres psql -U vaultline -d vaultline_db
```

Then in psql:

```sql
-- View recent alerts
SELECT * FROM alert_logs ORDER BY sent_at DESC LIMIT 10;

-- View user preferences
SELECT * FROM alert_preferences;

-- Check digest scheduler status
SELECT * FROM alert_logs WHERE trigger_type = 'digest' ORDER BY sent_at DESC;
```

## Performance Monitoring

Watch memory and CPU usage:

```bash
docker stats
```

## Cleanup

### Stop Services

```bash
docker-compose down
```

### Stop and Remove Volumes (Reset Database)

```bash
docker-compose down -v
```

### Remove Images

```bash
docker-compose down -v --rmi all
```

## Troubleshooting

### Database Connection Failed

Check PostgreSQL is healthy:

```bash
docker-compose exec postgres pg_isready -U vaultline
```

Expected output: `accepting connections`

### Port Already in Use

If ports 5432 or 8080 are in use, update docker-compose.yml:

```yaml
ports:
  - "5433:5432"  # PostgreSQL on 5433
  - "8081:8080"  # App on 8081
```

Then update DATABASE_URL:

```yaml
environment:
  DATABASE_URL: "postgresql://vaultline:vaultline_dev@postgres:5433/vaultline_db"
```

### App Won't Start

Check logs:

```bash
docker-compose logs app
```

Common issues:
- Database migrations failed: Run `npm run db:push`
- Missing environment variables: Check docker-compose.yml
- Port in use: See "Port Already in Use" above

## Production Readiness

For Azure App Service deployment:

1. **Verify build succeeds**: `npm run build` (no TS errors)
2. **Test all APIs locally** using Postman or curl
3. **Configure all required env vars** in Azure App Settings
4. **Enable health checks** in App Service (endpoint: /api/health)
5. **Set up database** in Azure Database for PostgreSQL
6. **Configure Managed Identity** for M365 if needed
7. **Set up Key Vault** for secrets (Stripe, M365, Companies House)

## Related Files

- `Dockerfile` - Multi-stage build configuration
- `server/index.ts` - Express server with all routes
- `server/services/alerts.ts` - Alert generation and formatting
- `server/services/digestScheduler.ts` - Digest scheduling logic
- `.env.example` - Environment variable reference
