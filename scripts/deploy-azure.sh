#!/usr/bin/env bash
# =============================================================================
# FineGuard Pro — Azure CLI Deployment Script
#
# Provisions all required Azure infrastructure and deploys the Next.js app.
# Idempotent: safe to re-run; existing resources are reused not recreated.
#
# Prerequisites (install once):
#   az CLI      https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
#   node 20+    https://nodejs.org
#   npm         (comes with node)
#
# Usage:
#   # Interactive (prompts for any missing config):
#   ./scripts/deploy-azure.sh
#
#   # Non-interactive (supply all values as env vars):
#   APP_NAME=fineguard-pro \
#   DB_SERVER=fineguard-db \
#   DB_ADMIN_USER=fgadmin \
#   DB_ADMIN_PASS=<strong-password> \
#   STRIPE_SECRET_KEY=sk_test_... \
#   STRIPE_WEBHOOK_SECRET=whsec_... \
#   STRIPE_PRICE_ACCOUNTS_FILING=price_... \
#   STRIPE_PRICE_CONFIRMATION_STATEMENT=price_... \
#   STRIPE_PRICE_STRIKE_OFF=price_... \
#   COMPANIES_HOUSE_API_KEY=... \
#   ADMIN_PASSWORD=... \
#   ADMIN_SESSION_TOKEN=... \
#   ./scripts/deploy-azure.sh
#
# What this script does:
#   1.  Preflight checks (az, node, npm)
#   2.  Choose / create resource group
#   3.  Provision PostgreSQL Flexible Server  (B1ms, no public access outside Azure)
#   4.  Provision App Service Plan            (Linux, B1)
#   5.  Provision App Service                 (Node 20)
#   6.  Generate runtime secrets              (MONITORING_API_KEY, DEPLOY_RECORD_TOKEN)
#   7.  Configure all App Service env vars
#   8.  npm ci + next build (standalone)
#   9.  Run database migrations
#  10.  Zip and deploy .next/standalone
#  11.  Health smoke test with retry
#  12.  Print summary
# =============================================================================

set -euo pipefail

# ── Colours ──────────────────────────────────────────────────────────────────
red()    { printf '\033[0;31m%s\033[0m\n' "$*"; }
green()  { printf '\033[0;32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[0;33m%s\033[0m\n' "$*"; }
bold()   { printf '\033[1m%s\033[0m\n' "$*"; }
info()   { printf '  \033[0;36mℹ\033[0m  %s\n' "$*"; }
ok()     { printf '  \033[0;32m✓\033[0m  %s\n' "$*"; }
warn()   { printf '  \033[0;33m⚠\033[0m  %s\n' "$*"; }
fail()   { printf '  \033[0;31m✗\033[0m  %s\n' "$*"; exit 1; }
step()   { echo ""; bold "── Step $1 ──────────────────────────────────────────────────────────────────"; }

# ── Helpers ───────────────────────────────────────────────────────────────────
ask() {
  # ask <var_name> <prompt> [default]
  local var="$1" prompt="$2" default="${3:-}"
  if [[ -n "${!var:-}" ]]; then
    info "$prompt: ${!var} (from env)"
    return
  fi
  if [[ -n "$default" ]]; then
    read -rp "  $prompt [$default]: " val
    eval "$var='${val:-$default}'"
  else
    read -rp "  $prompt: " val
    while [[ -z "$val" ]]; do
      read -rp "  (required) $prompt: " val
    done
    eval "$var='$val'"
  fi
}

ask_secret() {
  # ask_secret <var_name> <prompt>  — hides input
  local var="$1" prompt="$2"
  if [[ -n "${!var:-}" ]]; then
    info "$prompt: ******* (from env)"
    return
  fi
  read -rsp "  $prompt: " val
  echo ""
  while [[ -z "$val" ]]; do
    read -rsp "  (required) $prompt: " val
    echo ""
  done
  eval "$var='$val'"
}

gen_secret() {
  # Generate a 32-byte hex secret
  openssl rand -hex 32
}

require_cmd() {
  command -v "$1" &>/dev/null || fail "$1 is not installed — see script header for install link"
}

# ── Script root ───────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# =============================================================================
# STEP 0 — Preflight
# =============================================================================
step "0/12" && bold "Preflight checks"

require_cmd az
require_cmd node
require_cmd npm
require_cmd zip
require_cmd curl
ok "All required tools present"

NODE_VER=$(node -e "process.stdout.write(process.versions.node.split('.')[0])")
if [[ "$NODE_VER" -lt 20 ]]; then
  fail "Node.js 20+ required (found $NODE_VER)"
fi
ok "Node.js $NODE_VER"

# Check az login
if ! az account show &>/dev/null 2>&1; then
  echo ""
  bold "You are not logged in to Azure CLI."
  echo "Run:  az login"
  echo "Then re-run this script."
  exit 1
fi

SUB_ID=$(az account show --query "id" -o tsv)
SUB_NAME=$(az account show --query "name" -o tsv)
ok "Azure: $SUB_NAME ($SUB_ID)"
echo ""

# =============================================================================
# STEP 1 — Configuration
# =============================================================================
step "1/12" && bold "Configuration"
echo ""
echo "  Press Enter to accept the [default] or type a new value."
echo ""

# Azure location
ask LOCATION "Azure region" "uksouth"

# Resource group
ask RG "Resource group name" "fineguard-rg"

# App Service
ask APP_NAME "App Service name (becomes <name>.azurewebsites.net)" "fineguard-pro"

# PostgreSQL
ask DB_SERVER    "PostgreSQL server name (globally unique)"       "${APP_NAME}-db"
ask DB_NAME      "Database name"                                  "fineguard"
ask DB_ADMIN_USER "PostgreSQL admin username"                     "fgadmin"
ask_secret DB_ADMIN_PASS "PostgreSQL admin password (min 8 chars, upper+lower+digit+symbol)"

# Runtime secrets — generate if not supplied
MONITORING_API_KEY="${MONITORING_API_KEY:-$(gen_secret)}"
DEPLOY_RECORD_TOKEN="${DEPLOY_RECORD_TOKEN:-$(gen_secret)}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-}"
ADMIN_SESSION_TOKEN="${ADMIN_SESSION_TOKEN:-}"

if [[ -z "$ADMIN_PASSWORD" ]]; then
  warn "ADMIN_PASSWORD not set — generating a random one"
  ADMIN_PASSWORD=$(gen_secret)
fi
if [[ -z "$ADMIN_SESSION_TOKEN" ]]; then
  ADMIN_SESSION_TOKEN=$(gen_secret)
fi

# Stripe
echo ""
bold "  Stripe (use sk_test_ keys for first deploy)"
ask_secret STRIPE_SECRET_KEY             "STRIPE_SECRET_KEY (sk_test_... or sk_live_...)"
ask_secret STRIPE_WEBHOOK_SECRET         "STRIPE_WEBHOOK_SECRET (whsec_...)"
ask        STRIPE_PRICE_ACCOUNTS_FILING          "STRIPE_PRICE_ACCOUNTS_FILING (price_...)"    "price_placeholder"
ask        STRIPE_PRICE_CONFIRMATION_STATEMENT   "STRIPE_PRICE_CONFIRMATION_STATEMENT (price_...)" "price_placeholder"
ask        STRIPE_PRICE_STRIKE_OFF               "STRIPE_PRICE_STRIKE_OFF (price_...)"         "price_placeholder"

# Companies House
echo ""
bold "  Companies House"
ask COMPANIES_HOUSE_API_KEY "COMPANIES_HOUSE_API_KEY (free from developer.company-information.service.gov.uk)" "placeholder"

# Derived values
APP_URL="https://${APP_NAME}.azurewebsites.net"
DB_CONNECTION="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASS}@${DB_SERVER}.postgres.database.azure.com:5432/${DB_NAME}?sslmode=require"

echo ""
bold "  ── Summary ────────────────────────────────────────────"
echo "  Resource Group: $RG  ($LOCATION)"
echo "  App Service:    $APP_NAME  →  $APP_URL"
echo "  Database:       $DB_SERVER.postgres.database.azure.com"
bold "  ───────────────────────────────────────────────────────"
echo ""
read -rp "  Proceed with deployment? [Y/n]: " confirm
[[ "${confirm:-Y}" =~ ^[Nn]$ ]] && { echo "Aborted."; exit 0; }

# =============================================================================
# STEP 2 — Resource Group
# =============================================================================
step "2/12" && bold "Resource Group"

if az group show --name "$RG" &>/dev/null 2>&1; then
  ok "Resource group '$RG' already exists"
else
  info "Creating resource group '$RG' in $LOCATION ..."
  az group create --name "$RG" --location "$LOCATION" --output none
  ok "Resource group created"
fi

# =============================================================================
# STEP 3 — PostgreSQL Flexible Server
# =============================================================================
step "3/12" && bold "PostgreSQL Flexible Server"

if az postgres flexible-server show --name "$DB_SERVER" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "PostgreSQL server '$DB_SERVER' already exists — skipping creation"
else
  info "Creating PostgreSQL Flexible Server (this takes ~3 minutes) ..."
  az postgres flexible-server create \
    --resource-group       "$RG" \
    --name                 "$DB_SERVER" \
    --location             "$LOCATION" \
    --admin-user           "$DB_ADMIN_USER" \
    --admin-password       "$DB_ADMIN_PASS" \
    --sku-name             "Standard_B1ms" \
    --tier                 "Burstable" \
    --storage-size         32 \
    --version              16 \
    --yes \
    --output none
  ok "PostgreSQL server created"
fi

# Allow Azure services to connect (needed for App Service → DB)
info "Allowing Azure services to connect to DB ..."
az postgres flexible-server firewall-rule create \
  --resource-group "$RG" \
  --name           "$DB_SERVER" \
  --rule-name      "AllowAzureServices" \
  --start-ip-address 0.0.0.0 \
  --end-ip-address   0.0.0.0 \
  --output none 2>/dev/null || ok "Firewall rule already exists"
ok "Azure services allowed"

# Create database if it doesn't exist
info "Ensuring database '$DB_NAME' exists ..."
az postgres flexible-server db create \
  --resource-group "$RG" \
  --server-name    "$DB_SERVER" \
  --database-name  "$DB_NAME" \
  --output none 2>/dev/null || ok "Database already exists"
ok "Database '$DB_NAME' ready"

# =============================================================================
# STEP 4 — App Service Plan
# =============================================================================
step "4/12" && bold "App Service Plan"

APP_PLAN="${APP_NAME}-plan"

if az appservice plan show --name "$APP_PLAN" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "App Service Plan '$APP_PLAN' already exists"
else
  info "Creating App Service Plan '$APP_PLAN' (Linux, B1) ..."
  az appservice plan create \
    --name           "$APP_PLAN" \
    --resource-group "$RG" \
    --is-linux \
    --sku            B1 \
    --output none
  ok "App Service Plan created"
fi

# =============================================================================
# STEP 5 — App Service (Web)
# =============================================================================
step "5/12" && bold "App Service"

if az webapp show --name "$APP_NAME" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "App Service '$APP_NAME' already exists"
else
  info "Creating App Service '$APP_NAME' (Node 20, Linux) ..."
  az webapp create \
    --resource-group "$RG" \
    --plan           "$APP_PLAN" \
    --name           "$APP_NAME" \
    --runtime        "NODE:20-lts" \
    --output none
  ok "App Service created"
fi

# Set startup command
info "Setting startup command: node server.js"
az webapp config set \
  --name           "$APP_NAME" \
  --resource-group "$RG" \
  --startup-file   "node server.js" \
  --output none
ok "Startup command set"

# =============================================================================
# STEP 6 — App Service Environment Variables
# =============================================================================
step "6/12" && bold "App Service Environment Variables"

info "Writing all environment variables ..."
az webapp config appsettings set \
  --name           "$APP_NAME" \
  --resource-group "$RG" \
  --output none \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    WEBSITES_PORT="8080" \
    DATABASE_URL="$DB_CONNECTION" \
    APP_URL="$APP_URL" \
    NEXT_PUBLIC_BASE_URL="$APP_URL" \
    PUBLIC_APP_URL="$APP_URL" \
    STRIPE_SECRET_KEY="$STRIPE_SECRET_KEY" \
    STRIPE_WEBHOOK_SECRET="$STRIPE_WEBHOOK_SECRET" \
    STRIPE_PRICE_ACCOUNTS_FILING="$STRIPE_PRICE_ACCOUNTS_FILING" \
    STRIPE_PRICE_CONFIRMATION_STATEMENT="$STRIPE_PRICE_CONFIRMATION_STATEMENT" \
    STRIPE_PRICE_STRIKE_OFF="$STRIPE_PRICE_STRIKE_OFF" \
    COMPANIES_HOUSE_API_KEY="$COMPANIES_HOUSE_API_KEY" \
    COMPANIES_HOUSE_BASE_URL="https://api.company-information.service.gov.uk" \
    MONITORING_API_KEY="$MONITORING_API_KEY" \
    ADMIN_PASSWORD="$ADMIN_PASSWORD" \
    ADMIN_SESSION_TOKEN="$ADMIN_SESSION_TOKEN" \
    DEPLOY_RECORD_TOKEN="$DEPLOY_RECORD_TOKEN" \
    TEMPORAL_ADDRESS="localhost:7233" \
    TEMPORAL_NAMESPACE="default" \
    TEMPORAL_TASK_QUEUE="fineguard-compliance"
ok "Environment variables set"

echo ""
warn "TEMPORAL_ADDRESS is set to localhost:7233 (placeholder)."
warn "Update it once your Temporal Cloud / self-hosted cluster is ready:"
warn "  az webapp config appsettings set -g $RG -n $APP_NAME --settings TEMPORAL_ADDRESS=<your-endpoint>"

# =============================================================================
# STEP 7 — Build (Next.js standalone)
# =============================================================================
step "7/12" && bold "Build Next.js (standalone output)"

info "Installing dependencies ..."
npm ci --prefer-offline

info "Running next build ..."
NODE_ENV=production \
NEXT_PHASE=phase-production-build \
NEXT_PUBLIC_BASE_URL="$APP_URL" \
npm run build

# Assemble standalone package
info "Assembling deployment package ..."
cp -r .next/static .next/standalone/.next/static
cp -r public       .next/standalone/public
ok "Standalone package assembled at .next/standalone/"

# =============================================================================
# STEP 8 — Database Migrations
# =============================================================================
step "8/12" && bold "Database Migrations"

info "Running migrations against $DB_SERVER ..."
DATABASE_URL="$DB_CONNECTION" npm run db:migrate
ok "Migrations complete"

# =============================================================================
# STEP 9 — Package and Deploy
# =============================================================================
step "9/12" && bold "Package and Deploy"

DEPLOY_ZIP="/tmp/fineguard-standalone-$(date +%s).zip"

info "Zipping .next/standalone → $DEPLOY_ZIP ..."
(cd .next/standalone && zip -r "$DEPLOY_ZIP" . -x "*.map" > /dev/null)
ZIP_SIZE=$(du -sh "$DEPLOY_ZIP" | cut -f1)
ok "Package size: $ZIP_SIZE"

info "Uploading to App Service (zip deploy) ..."
az webapp deploy \
  --resource-group "$RG" \
  --name           "$APP_NAME" \
  --src-path       "$DEPLOY_ZIP" \
  --type           zip \
  --async          false \
  --output none

rm -f "$DEPLOY_ZIP"
ok "Deployment upload complete"

# =============================================================================
# STEP 10 — Restart App Service
# =============================================================================
step "10/12" && bold "Restart App Service"

info "Restarting to pick up new deployment ..."
az webapp restart \
  --name           "$APP_NAME" \
  --resource-group "$RG" \
  --output none
ok "App Service restarted"

# =============================================================================
# STEP 11 — Health Smoke Test
# =============================================================================
step "11/12" && bold "Health Smoke Test"

HEALTH_URL="${APP_URL}/api/health"
info "Waiting for cold start (30s) ..."
sleep 30

HEALTH_STATUS=""
for attempt in 1 2 3 4 5 6; do
  HTTP_CODE=$(curl -s -o /tmp/fg-health.json -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
  echo "  Attempt $attempt/6 → HTTP $HTTP_CODE"
  if [[ "$HTTP_CODE" == "200" ]]; then
    HEALTH_STATUS="ok"
    HEALTH_BODY=$(cat /tmp/fg-health.json 2>/dev/null || echo "")
    ok "Health check passed: $HEALTH_BODY"
    break
  fi
  if [[ "$HTTP_CODE" == "503" ]]; then
    HEALTH_STATUS="db_down"
    warn "App is up but database is not connected (503)."
    warn "Check DATABASE_URL and PostgreSQL firewall rules."
    break
  fi
  sleep 15
done

if [[ -z "$HEALTH_STATUS" ]]; then
  warn "Health check did not return 200 or 503 after 6 attempts."
  warn "The app may still be starting. Check logs:"
  warn "  az webapp log tail --name $APP_NAME --resource-group $RG"
fi

# =============================================================================
# STEP 12 — Summary
# =============================================================================
step "12/12" && bold "Summary"

echo ""
green "════════════════════════════════════════════════════════════"
green "  FineGuard Pro deployed to Azure App Service"
green "════════════════════════════════════════════════════════════"
echo ""
echo "  App URL:       $APP_URL"
echo "  Health:        ${APP_URL}/api/health"
echo "  Check page:    ${APP_URL}/check"
echo "  Admin login:   ${APP_URL}/login"
echo ""
echo "  Azure resources:"
echo "    Resource Group:  $RG  ($LOCATION)"
echo "    App Service:     $APP_NAME"
echo "    Database:        ${DB_SERVER}.postgres.database.azure.com / $DB_NAME"
echo ""
echo "  Generated secrets (save these):"
echo "    MONITORING_API_KEY:   $MONITORING_API_KEY"
echo "    DEPLOY_RECORD_TOKEN:  $DEPLOY_RECORD_TOKEN"
echo "    ADMIN_PASSWORD:       $ADMIN_PASSWORD"
echo "    ADMIN_SESSION_TOKEN:  $ADMIN_SESSION_TOKEN"
echo ""
echo "  Useful commands:"
echo "    az webapp log tail -n $APP_NAME -g $RG         # live logs"
echo "    az webapp restart  -n $APP_NAME -g $RG         # restart"
echo "    az webapp browse   -n $APP_NAME -g $RG         # open in browser"
echo "    DATABASE_URL='$DB_CONNECTION' npm run db:migrate   # re-run migrations"
echo ""
bold "  Next steps:"
echo "    1. Set a real STRIPE_WEBHOOK_SECRET (configure endpoint in Stripe dashboard)"
echo "    2. Set TEMPORAL_ADDRESS once Temporal cluster is provisioned"
echo "    3. Point your custom domain to ${APP_NAME}.azurewebsites.net"
echo ""
