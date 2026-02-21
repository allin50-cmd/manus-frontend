# FineGuard Microsoft 365 Integration — Deployment Guide

## Table of Contents

1. [Azure AD App Registration](#1-azure-ad-app-registration)
2. [Azure Function Deployment](#2-azure-function-deployment)
3. [Teams App Deployment](#3-teams-app-deployment)
4. [Power Automate Flow Import](#4-power-automate-flow-import)
5. [Local Testing](#5-local-testing)
6. [Application Insights & Monitoring](#6-application-insights--monitoring)

---

## 1. Azure AD App Registration

### Step 1 — Register in Azure Portal

```bash
# Using Azure CLI
az login
az ad app create \
  --display-name "FineGuard Compliance Cloud" \
  --sign-in-audience "AzureADMultipleOrgs" \
  --web-redirect-uris "https://app.fineguard.io/auth/callback" \
  --enable-id-token-issuance true
```

### Step 2 — Add API Permissions

In Azure Portal → App registrations → FineGuard → API permissions:

| API                  | Permission                      | Type        |
|----------------------|---------------------------------|-------------|
| Microsoft Graph      | `User.Read.All`                 | Application |
| Microsoft Graph      | `Mail.Send`                     | Application |
| Microsoft Graph      | `Calendars.ReadWrite`           | Application |
| Microsoft Graph      | `ChannelMessage.Send`           | Application |
| Microsoft Graph      | `Channel.ReadBasic.All`         | Application |
| Microsoft Graph      | `Sites.ReadWrite.All`           | Application |
| Microsoft Graph      | `Tasks.ReadWrite`               | Application |
| Microsoft Graph      | `TeamMember.Read.All`           | Application |

Then click **Grant admin consent**.

### Step 3 — Create Client Secret

```bash
az ad app credential reset \
  --id <APP_ID> \
  --display-name "FineGuard Production" \
  --years 2
```

Save the generated `clientSecret` — you won't see it again.

### Step 4 — Set Environment Variables

```bash
# .env or Azure Function App Settings
AZURE_TENANT_ID=<your-tenant-id>
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_REDIRECT_URI=https://app.fineguard.io/auth/callback
```

---

## 2. Azure Function Deployment

### Prerequisites

```bash
npm install -g azure-functions-core-tools@4
az login
```

### Local Development

```bash
cd integrations/m365/azure-function

# Install dependencies
npm init -y
npm install @azure/functions

# Start locally
func start
```

The function will be available at `http://localhost:7071/api/fineGuardWebhook`.

### Deploy to Azure

```bash
# Create resources
az group create --name rg-fineguard --location westeurope

az storage account create \
  --name stfineguardfunc \
  --location westeurope \
  --resource-group rg-fineguard \
  --sku Standard_LRS

az functionapp create \
  --resource-group rg-fineguard \
  --consumption-plan-location westeurope \
  --runtime node \
  --runtime-version 20 \
  --functions-version 4 \
  --name func-fineguard-webhook \
  --storage-account stfineguardfunc

# Set app settings
az functionapp config appsettings set \
  --name func-fineguard-webhook \
  --resource-group rg-fineguard \
  --settings \
    "FINEGUARD_WEBHOOK_SECRET=<your-production-secret>" \
    "POWER_AUTOMATE_TRIGGER_URL=<your-flow-trigger-url>" \
    "AZURE_TENANT_ID=<your-tenant-id>" \
    "AZURE_CLIENT_ID=<your-client-id>" \
    "AZURE_CLIENT_SECRET=<your-client-secret>"

# Deploy
func azure functionapp publish func-fineguard-webhook
```

---

## 3. Teams App Deployment

### Step 1 — Prepare the manifest

```bash
cd integrations/m365/teams

# Replace placeholders in manifest.json
sed -i 's/{{MICROSOFT_APP_ID}}/<your-app-id>/g' manifest.json
sed -i 's/{{APP_DOMAIN}}/app.fineguard.io/g' manifest.json
```

### Step 2 — Package the app

```bash
# Create icons (32x32 outline, 192x192 color)
# Place icon-outline.png and icon-color.png alongside manifest.json

zip -j fineguard-teams-app.zip manifest.json icon-outline.png icon-color.png
```

### Step 3 — Upload to Teams Admin Center

1. Go to **Teams Admin Center** → **Teams apps** → **Manage apps**
2. Click **Upload new app**
3. Select `fineguard-teams-app.zip`
4. Set availability policy for your organisation

### Step 4 — Register the Bot

```bash
# Register bot in Azure
az bot create \
  --resource-group rg-fineguard \
  --name bot-fineguard \
  --kind registration \
  --appid <MICROSOFT_APP_ID> \
  --app-type MultiTenant

# Set messaging endpoint
az bot update \
  --resource-group rg-fineguard \
  --name bot-fineguard \
  --endpoint "https://func-fineguard-webhook.azurewebsites.net/api/messages"

# Add Teams channel
az bot msteams create \
  --resource-group rg-fineguard \
  --name bot-fineguard
```

---

## 4. Power Automate Flow Import

### Step 1 — Import the Flow

1. Go to **Power Automate** → **My flows** → **Import**
2. Upload `power-automate/compliance-alert-flow.json`
3. Configure connections when prompted:
   - **SharePoint** — Sign in with a user that has access to the compliance site
   - **Teams** — Sign in with a user that can post to the compliance channel
   - **Planner** — Sign in with a user that has access to the plan
   - **Office 365 Outlook** — Sign in with the sender account

### Step 2 — Update Parameters

Edit the flow and update these parameters:

| Parameter            | Value                                               |
|----------------------|-----------------------------------------------------|
| `teamsTeamId`        | Your compliance team's ID                           |
| `teamsChannelId`     | The #compliance-alerts channel ID                   |
| `plannerPlanId`      | Your Planner plan ID                                |
| `plannerBucketId`    | The "Critical" bucket ID                            |
| `notificationEmail`  | compliance-team@yourfirm.com                        |
| `sharepointSiteUrl`  | https://yourfirm.sharepoint.com/sites/compliance    |
| `sharepointListName` | Compliance Events                                   |

### Step 3 — Copy the Trigger URL

After saving the flow, copy the HTTP POST URL from the trigger step.
Set it as `POWER_AUTOMATE_TRIGGER_URL` in the Azure Function settings.

---

## 5. Local Testing

### Test the Azure Function Locally

```bash
# Start the function
cd integrations/m365/azure-function
func start
```

#### Test 1 — Valid Critical Alert

```bash
curl -X POST http://localhost:7071/api/fineGuardWebhook \
  -H "Content-Type: application/json" \
  -H "x-fineguard-secret: fg-secret-change-me-in-production" \
  -d '{
    "eventType": "risk_alert",
    "firmId": "firm-001",
    "firmName": "Acme Consulting Ltd",
    "riskLevel": "Critical",
    "title": "PSC Register Overdue",
    "description": "The PSC register has not been updated within the statutory 14-day window.",
    "dueDate": "2026-03-01T00:00:00Z",
    "assignedTo": "compliance@acme.co.uk",
    "timestamp": "2026-02-20T10:30:00Z"
  }'
```

Expected: `200 OK` with `{ "success": true, ... }`

#### Test 2 — Missing Secret Token (401)

```bash
curl -X POST http://localhost:7071/api/fineGuardWebhook \
  -H "Content-Type: application/json" \
  -d '{"eventType": "risk_alert", "firmId": "firm-001", "timestamp": "2026-02-20T10:30:00Z"}'
```

Expected: `401 Unauthorized`

#### Test 3 — Invalid Payload (422)

```bash
curl -X POST http://localhost:7071/api/fineGuardWebhook \
  -H "Content-Type: application/json" \
  -H "x-fineguard-secret: fg-secret-change-me-in-production" \
  -d '{"wrongField": "missing eventType and firmId"}'
```

Expected: `422 Unprocessable Entity`

#### Test 4 — Malformed JSON (400)

```bash
curl -X POST http://localhost:7071/api/fineGuardWebhook \
  -H "Content-Type: application/json" \
  -H "x-fineguard-secret: fg-secret-change-me-in-production" \
  -d 'this is not json'
```

Expected: `400 Bad Request`

#### Test 5 — Wrong Method (405)

```bash
curl -X GET http://localhost:7071/api/fineGuardWebhook
```

Expected: `405 Method Not Allowed`

### Postman Collection

Import these as a Postman collection:

- **Method:** POST
- **URL:** `http://localhost:7071/api/fineGuardWebhook`
- **Headers:**
  - `Content-Type: application/json`
  - `x-fineguard-secret: fg-secret-change-me-in-production`
- **Body:** Raw JSON (use the payload from Test 1 above)

---

## 6. Application Insights & Monitoring

### Step 1 — Enable Application Insights

```bash
# Create Application Insights resource
az monitor app-insights component create \
  --app appi-fineguard \
  --location westeurope \
  --resource-group rg-fineguard \
  --application-type web

# Get the instrumentation key
az monitor app-insights component show \
  --app appi-fineguard \
  --resource-group rg-fineguard \
  --query instrumentationKey -o tsv

# Link to the Function App
az functionapp config appsettings set \
  --name func-fineguard-webhook \
  --resource-group rg-fineguard \
  --settings "APPINSIGHTS_INSTRUMENTATIONKEY=<key>"
```

### Step 2 — Set Up Alert Rules

#### Alert: Unauthorized Access Attempts (401s)

```bash
az monitor metrics alert create \
  --name "FineGuard-Unauthorized-Attempts" \
  --resource-group rg-fineguard \
  --scopes "/subscriptions/<sub-id>/resourceGroups/rg-fineguard/providers/Microsoft.Web/sites/func-fineguard-webhook" \
  --condition "total Http401 > 5" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 2 \
  --description "More than 5 unauthorized webhook attempts in 5 minutes" \
  --action-group "<action-group-id>"
```

#### Alert: Server Errors (5xx)

```bash
az monitor metrics alert create \
  --name "FineGuard-Server-Errors" \
  --resource-group rg-fineguard \
  --scopes "/subscriptions/<sub-id>/resourceGroups/rg-fineguard/providers/Microsoft.Web/sites/func-fineguard-webhook" \
  --condition "total Http5xx > 3" \
  --window-size 5m \
  --evaluation-frequency 1m \
  --severity 1 \
  --description "Server errors detected in FineGuard webhook function" \
  --action-group "<action-group-id>"
```

#### Alert: Failed Power Automate Forwards

```bash
# Custom log alert (via Application Insights)
az monitor app-insights query \
  --app appi-fineguard \
  --resource-group rg-fineguard \
  --analytics-query "
    traces
    | where message contains 'All retry attempts exhausted'
    | summarize count() by bin(timestamp, 5m)
    | where count_ > 0
  "
```

Create this as a scheduled query rule:

```bash
az monitor scheduled-query create \
  --name "FineGuard-Forward-Failures" \
  --resource-group rg-fineguard \
  --scopes "/subscriptions/<sub-id>/resourceGroups/rg-fineguard/providers/microsoft.insights/components/appi-fineguard" \
  --condition "count > 0" \
  --condition-query "traces | where message contains 'All retry attempts exhausted' | summarize count() by bin(timestamp, 5m)" \
  --window-size 5 \
  --evaluation-frequency 5 \
  --severity 1 \
  --action-groups "<action-group-id>" \
  --description "Power Automate forwarding failed after retries"
```

### Step 3 — Create an Action Group for Notifications

```bash
az monitor action-group create \
  --name "FineGuard-Compliance-Team" \
  --resource-group rg-fineguard \
  --short-name "FG-Alerts" \
  --email-receiver name="ComplianceTeam" email-address="alerts@fineguard.io"
```

### Step 4 — View Logs

```bash
# Live tail function logs
func azure functionapp logstream func-fineguard-webhook

# Query Application Insights (last hour of errors)
az monitor app-insights query \
  --app appi-fineguard \
  --resource-group rg-fineguard \
  --analytics-query "
    traces
    | where severityLevel >= 3
    | where timestamp > ago(1h)
    | project timestamp, message, severityLevel
    | order by timestamp desc
    | take 50
  "
```

---

## Architecture Overview

```
┌───────────────────┐      POST + Secret       ┌──────────────────────┐
│                   │ ─────────────────────────→│                      │
│   FineGuard App   │                           │   Azure Function     │
│   (Backend API)   │                           │   (Webhook Handler)  │
│                   │ ←─── 200/401/422/502 ─────│                      │
└───────────────────┘                           └──────────┬───────────┘
                                                           │
                                                    POST (retry x3)
                                                           │
                                                           ▼
                                                ┌──────────────────────┐
                                                │   Power Automate     │
                                                │   (Logic App Flow)   │
                                                └──────────┬───────────┘
                                                           │
                                    ┌──────────┬───────────┼───────────┐
                                    ▼          ▼           ▼           ▼
                              ┌──────────┐ ┌────────┐ ┌────────┐ ┌──────────┐
                              │  Teams   │ │Planner │ │Outlook │ │SharePoint│
                              │  Alert   │ │ Task   │ │ Email  │ │  List    │
                              └──────────┘ └────────┘ └────────┘ └──────────┘
```

---

## File Reference

| File | Purpose |
|------|---------|
| `types/index.ts` | All TypeScript interfaces |
| `schemas/webhook-payload.schema.json` | JSON Schema for webhook validation |
| `schemas/adaptive-card.schema.json` | JSON Schema for Teams Adaptive Cards |
| `graph/auth.ts` | Azure AD authentication (MSAL) |
| `graph/client.ts` | Microsoft Graph API client |
| `teams/manifest.json` | Teams app manifest |
| `teams/bot.ts` | Teams bot (Bot Framework) |
| `teams/tab.tsx` | Teams tab (React component) |
| `outlook/notifications.ts` | Outlook email & calendar service |
| `power-automate/compliance-alert-flow.json` | Power Automate flow definition |
| `azure-function/index.ts` | Azure Function webhook handler |
| `azure-function/local.settings.json` | Local dev environment config |
| `azure-function/host.json` | Azure Functions host configuration |
