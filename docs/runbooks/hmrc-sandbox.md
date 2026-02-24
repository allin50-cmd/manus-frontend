# HMRC MTD Sandbox Registration & Configuration

## Overview

Before you can submit real VAT returns, you must register a developer application
with HMRC and obtain sandbox credentials. This runbook walks through the process.

---

## Prerequisites

- HMRC Developer Hub account: https://developer.service.hmrc.gov.uk
- The FineGuard MTD application deployed (or running locally)
- Your redirect URI (e.g. `https://your-app.azurewebsites.net/api/mcp/hmrc/callback`)

---

## Step 1: Create HMRC Developer Account

1. Visit https://developer.service.hmrc.gov.uk/developer/registration
2. Register with your organisation email address
3. Verify your email address
4. Log in to the Developer Hub

---

## Step 2: Create an Application

1. Navigate to **Applications → Add an application**
2. Select **Sandbox** environment
3. Application name: `FineGuard MTD`
4. Application type: **Standard**
5. Subscribe to the following APIs:
   - ✅ VAT (MTD) — https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
6. Add your redirect URI:
   - `https://your-app.azurewebsites.net/api/mcp/hmrc/callback`
   - `http://localhost:3000/api/mcp/hmrc/callback` (for local dev)
7. Save and copy your **Client ID** and **Client Secret**

---

## Step 3: OAuth Client Configuration

Save the following JSON as `hmrc-oauth-config.json` (do NOT commit to git):

```json
{
  "provider": "hmrc-mtd",
  "environment": "sandbox",
  "clientId": "YOUR_CLIENT_ID_HERE",
  "redirectUri": "https://your-app.azurewebsites.net/api/mcp/hmrc/callback",
  "scopes": "write:vat read:vat",
  "tokenEndpoint": "https://test-api.service.hmrc.gov.uk/oauth/token",
  "authorizeEndpoint": "https://test-api.service.hmrc.gov.uk/oauth/authorize",
  "apiBase": "https://test-api.service.hmrc.gov.uk"
}
```

Store `clientId` and `clientSecret` in Azure Key Vault:
```bash
az keyvault secret set --vault-name fineguard-dev-kv --name hmrc-client-id   --value "YOUR_CLIENT_ID"
az keyvault secret set --vault-name fineguard-dev-kv --name hmrc-client-secret --value "YOUR_CLIENT_SECRET"
```

---

## Step 4: Create HMRC Sandbox Test User

1. In Developer Hub → **Test Users → Create test user**
2. Select **Organisation** user type
3. Note the credentials:
   - `vrn` (VAT Registration Number) — use this as your `vatNumber`
   - Username and password for OAuth flow

Test VRN provided by HMRC sandbox: `999999673` (pre-provisioned with open obligations)

---

## Step 5: Set Environment Variables

```bash
# .env file (local) or Azure App Settings
HMRC_CLIENT_ID=your_sandbox_client_id
HMRC_CLIENT_SECRET=your_sandbox_client_secret
HMRC_REDIRECT_URI=http://localhost:3000/api/mcp/hmrc/callback
HMRC_ENVIRONMENT=sandbox  # Change to 'production' when ready
```

---

## Step 6: Run the OAuth Flow

1. Start the server: `npm run server`
2. Get the auth URL:
   ```bash
   curl http://localhost:3000/api/mcp/hmrc/auth-url
   ```
3. Visit the returned `authUrl` in your browser
4. Log in with the HMRC sandbox test user credentials
5. Authorise the application
6. HMRC redirects to your `redirect_uri` with a `?code=` parameter
7. Exchange the code:
   ```bash
   curl -X POST http://localhost:3000/api/mcp/hmrc/callback \
     -H "Content-Type: application/json" \
     -H "x-tenant-id: your-tenant-id" \
     -d '{"code": "CODE_FROM_REDIRECT"}'
   ```

---

## Step 7: Test a Sandbox Submission

```bash
curl -X POST http://localhost:3000/api/mcp/submit-mtd \
  -H "Content-Type: application/json" \
  -H "x-tenant-id: your-tenant-id" \
  -d '{
    "idempotencyKey": "test-submission-001",
    "vatNumber": "999999673",
    "periodKey": "24A1",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-03-31",
    "payload": {
      "vatDueSales": 200.00,
      "vatDueAcquisitions": 0.00,
      "totalVatDue": 200.00,
      "vatReclaimedCurrPeriod": 0.00,
      "netVatDue": 200.00,
      "totalValueSalesExVAT": 1000,
      "totalValuePurchasesExVAT": 0,
      "totalValueGoodsSuppliedExVAT": 0,
      "totalAcquisitionsExVAT": 0,
      "finalised": true
    }
  }'
```

A successful response returns HTTP 201 with:
```json
{
  "status": "accepted",
  "receipt": {
    "formBundleNumber": "119000000000",
    "processingDate": "2024-01-31T09:00:00.000Z",
    "correlationId": "..."
  }
}
```

---

## Step 8: Move to Production

1. Re-register your application on the **Production** HMRC Developer Hub
2. Complete the production credentials application process
3. Provide your organisation's VAT number
4. Update environment variables to `HMRC_ENVIRONMENT=production`
5. Update all redirect URIs to production URLs

**Required production headers** (FineGuard handles these automatically):
- `Gov-Client-Connection-Method`
- `Gov-Client-Public-IP`
- `Gov-Client-User-IDs`
- `Gov-Vendor-Version`

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `INVALID_CREDENTIALS` | Wrong client_id/secret | Check Key Vault secrets |
| `FORBIDDEN` | Token not authorised | Re-run OAuth flow |
| `OBLIGATION_FULFILLED` | Period already submitted | Use new period key |
| `INVALID_DATE_RANGE` | Dates outside obligation window | Match obligation period dates |
| `VRN_INVALID` | Wrong VAT number | Use test VRN `999999673` in sandbox |
