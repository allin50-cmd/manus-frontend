#!/usr/bin/env bash
# Deploy FineGuard to Azure Container Instances (bypasses App Service Plan quota)
set -euo pipefail

RG="fineguard-rg"
CONTAINER_NAME="fineguard-app"
ACR="fineguardacr001"
IMAGE="${ACR}.azurecr.io/fineguard:latest"
DNS_LABEL="fineguard-pilot"
DB_PASS="${DB_ADMIN_PASS:-FineGuard2026!}"
DB_URL="postgresql://fgadmin:${DB_PASS}@fineguard-db-001.postgres.database.azure.com:5432/fineguard?sslmode=require"
APP_URL="http://${DNS_LABEL}.uksouth.azurecontainer.io:8080"

echo "Getting ACR credentials..."
ACR_PASS=$(az acr credential show --name "$ACR" --query "passwords[0].value" -o tsv)

echo "Deploying container to ACI..."
az container create \
  --resource-group "$RG" \
  --name "$CONTAINER_NAME" \
  --image "$IMAGE" \
  --registry-login-server "${ACR}.azurecr.io" \
  --registry-username "$ACR" \
  --registry-password "$ACR_PASS" \
  --os-type Linux \
  --cpu 1 \
  --memory 1.5 \
  --ports 8080 \
  --ip-address Public \
  --dns-name-label "$DNS_LABEL" \
  --location uksouth \
  --environment-variables \
    NODE_ENV=production \
    PORT=8080 \
    APP_URL="$APP_URL" \
    NEXT_PUBLIC_BASE_URL="$APP_URL" \
    COMPANIES_HOUSE_BASE_URL=https://api.company-information.service.gov.uk \
    COMPANIES_HOUSE_API_KEY=placeholder \
    STRIPE_PRICE_ACCOUNTS_FILING=price_placeholder \
    STRIPE_PRICE_CONFIRMATION_STATEMENT=price_placeholder \
    STRIPE_PRICE_STRIKE_OFF=price_placeholder \
    TEMPORAL_ADDRESS=localhost:7233 \
  --secure-environment-variables \
    DATABASE_URL="$DB_URL" \
    STRIPE_SECRET_KEY=sk_test_placeholder \
    STRIPE_WEBHOOK_SECRET=whsec_placeholder

echo ""
echo "App URL: $APP_URL"
echo "Health:  ${APP_URL}/api/health"
echo ""
echo "Health check (wait 30s for cold start)..."
sleep 30
curl -fsS "${APP_URL}/api/health" && echo "" || echo "App may still be starting — retry in 30s"
