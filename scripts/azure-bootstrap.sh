#!/usr/bin/env bash
# Azure bootstrap: creates all Azure resources + prints GitHub secret values.
#
# Prerequisites:
#   - Azure CLI (az) logged in:  az login
#   - Subscription selected:     az account set --subscription <id>
#   - GitHub CLI (gh) logged in (optional, for auto-setting secrets): gh auth login
#
# Run from repo root:
#   bash scripts/azure-bootstrap.sh
#
# The script is idempotent: re-running will reuse existing resources.
#
# Outputs at the end:
#   1. A block of key=value pairs ready to paste into GitHub Actions secrets
#   2. If gh CLI is available, offers to set them automatically

set -euo pipefail

# ----------------------------------------------------------------------------
# Config — edit these if you want different names/regions
# ----------------------------------------------------------------------------
LOCATION="${LOCATION:-uksouth}"
RESOURCE_GROUP="${RESOURCE_GROUP:-rg-unified-os}"
ENVIRONMENT_NAME="${ENVIRONMENT_NAME:-aios}"
ACR_NAME="${ACR_NAME:-acraios$(openssl rand -hex 3)}"  # must be globally unique
SP_NAME="${SP_NAME:-sp-deploy-${ENVIRONMENT_NAME}}"
SWA_NAME="${SWA_NAME:-swa-marketing-${ENVIRONMENT_NAME}}"
WEBAPP_NAME="${WEBAPP_NAME:-app-vaultline-${ENVIRONMENT_NAME}}"
WEBAPP_PLAN="${WEBAPP_PLAN:-plan-vaultline-${ENVIRONMENT_NAME}}"
GH_REPO="${GH_REPO:-allin50-cmd/manus-frontend}"

# Secrets the app needs (generated or prompted)
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 24 | tr -d '/+=' | cut -c1-20)Aa1!}"
WEBHOOK_SIGNING_SECRET="${WEBHOOK_SIGNING_SECRET:-$(openssl rand -hex 32)}"

# App-owned secrets — user must supply these
OPENAI_API_KEY="${OPENAI_API_KEY:-}"
RESEND_KEY="${RESEND_KEY:-}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
COMPANIES_HOUSE_API_KEY="${COMPANIES_HOUSE_API_KEY:-}"
CRM_WEBHOOK_URL="${CRM_WEBHOOK_URL:-}"

# ----------------------------------------------------------------------------
# Pretty output helpers
# ----------------------------------------------------------------------------
c_cyan='\033[0;36m'; c_green='\033[0;32m'; c_yellow='\033[0;33m'; c_red='\033[0;31m'; c_off='\033[0m'
log()  { printf "${c_cyan}==> %s${c_off}\n" "$*"; }
ok()   { printf "${c_green}✓ %s${c_off}\n" "$*"; }
warn() { printf "${c_yellow}! %s${c_off}\n" "$*"; }
err()  { printf "${c_red}✗ %s${c_off}\n" "$*" >&2; }

# ----------------------------------------------------------------------------
# Preflight
# ----------------------------------------------------------------------------
command -v az >/dev/null 2>&1 || { err "az CLI not found. Install: https://aka.ms/install-az-cli"; exit 1; }
az account show >/dev/null 2>&1 || { err "Not logged in. Run: az login"; exit 1; }

SUB_ID="$(az account show --query id -o tsv)"
SUB_NAME="$(az account show --query name -o tsv)"
log "Using subscription: $SUB_NAME ($SUB_ID)"

# ----------------------------------------------------------------------------
# 1. Resource group
# ----------------------------------------------------------------------------
log "Creating resource group: $RESOURCE_GROUP ($LOCATION)"
az group create -n "$RESOURCE_GROUP" -l "$LOCATION" -o none
ok "Resource group ready"

# ----------------------------------------------------------------------------
# 2. Azure Container Registry
# ----------------------------------------------------------------------------
log "Creating ACR: $ACR_NAME"
if ! az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az acr create -n "$ACR_NAME" -g "$RESOURCE_GROUP" --sku Basic --admin-enabled true -o none
fi
ACR_LOGIN_SERVER="$(az acr show -n "$ACR_NAME" -g "$RESOURCE_GROUP" --query loginServer -o tsv)"
ACR_USERNAME="$(az acr credential show -n "$ACR_NAME" --query username -o tsv)"
ACR_PASSWORD="$(az acr credential show -n "$ACR_NAME" --query "passwords[0].value" -o tsv)"
ok "ACR ready: $ACR_LOGIN_SERVER"

# ----------------------------------------------------------------------------
# 3. Service principal for GitHub Actions (AZURE_CREDENTIALS)
# ----------------------------------------------------------------------------
log "Creating service principal: $SP_NAME"
SCOPE="/subscriptions/$SUB_ID/resourceGroups/$RESOURCE_GROUP"
AZURE_CREDENTIALS="$(az ad sp create-for-rbac \
  --name "$SP_NAME" \
  --role contributor \
  --scopes "$SCOPE" \
  --sdk-auth 2>/dev/null || true)"
if [ -z "$AZURE_CREDENTIALS" ]; then
  warn "SP may already exist; resetting credentials"
  SP_APPID="$(az ad sp list --display-name "$SP_NAME" --query "[0].appId" -o tsv)"
  AZURE_CREDENTIALS="$(az ad sp credential reset --id "$SP_APPID" --years 2 \
    --query "{clientId:appId,clientSecret:password,tenantId:tenant,subscriptionId:\`$SUB_ID\`}" \
    -o json)"
fi
ok "Service principal ready"

# ----------------------------------------------------------------------------
# 4. Azure Static Web App (marketing site)
# ----------------------------------------------------------------------------
log "Creating Static Web App: $SWA_NAME"
if ! az staticwebapp show -n "$SWA_NAME" -g "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az staticwebapp create -n "$SWA_NAME" -g "$RESOURCE_GROUP" \
    -l westeurope --sku Free -o none || warn "SWA create failed — may need manual setup"
fi
AZURE_STATIC_WEB_APPS_API_TOKEN="$(az staticwebapp secrets list -n "$SWA_NAME" -g "$RESOURCE_GROUP" \
  --query "properties.apiKey" -o tsv 2>/dev/null || echo "")"
[ -n "$AZURE_STATIC_WEB_APPS_API_TOKEN" ] && ok "SWA ready" || warn "SWA token empty"

# ----------------------------------------------------------------------------
# 5. App Service (VaultLine) — non-fatal, skip if quota unavailable
# ----------------------------------------------------------------------------
log "Creating App Service plan: $WEBAPP_PLAN"
WEBAPP_OK=true
if ! az appservice plan show -n "$WEBAPP_PLAN" -g "$RESOURCE_GROUP" >/dev/null 2>&1; then
  az appservice plan create -n "$WEBAPP_PLAN" -g "$RESOURCE_GROUP" \
    --sku F1 --is-linux -o none 2>&1 || {
    warn "App Service plan creation failed (quota issue) — skipping VaultLine deploy"
    WEBAPP_OK=false
  }
fi

AZURE_WEBAPP_PUBLISH_PROFILE=""
if [ "$WEBAPP_OK" = "true" ]; then
  log "Creating Web App: $WEBAPP_NAME"
  if ! az webapp show -n "$WEBAPP_NAME" -g "$RESOURCE_GROUP" >/dev/null 2>&1; then
    az webapp create -n "$WEBAPP_NAME" -g "$RESOURCE_GROUP" \
      --plan "$WEBAPP_PLAN" --runtime "NODE:20-lts" -o none 2>&1 || WEBAPP_OK=false
  fi
  if [ "$WEBAPP_OK" = "true" ]; then
    AZURE_WEBAPP_PUBLISH_PROFILE="$(az webapp deployment list-publishing-profiles \
      -n "$WEBAPP_NAME" -g "$RESOURCE_GROUP" --xml 2>/dev/null || echo "")"
    ok "Web App ready: $WEBAPP_NAME"
  fi
else
  warn "Skipping Web App — App Service plan unavailable"
fi

# ----------------------------------------------------------------------------
# 6. Deploy Bicep (Postgres + Container App + env)
# ----------------------------------------------------------------------------
log "Deploying Bicep (Postgres + Container App)..."
az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file infra/main.bicep \
  --parameters \
    environmentName="$ENVIRONMENT_NAME" \
    location="$LOCATION" \
    acrLoginServer="$ACR_LOGIN_SERVER" \
    dbPassword="$DB_PASSWORD" \
    openaiKey="${OPENAI_API_KEY:-placeholder}" \
    resendKey="${RESEND_KEY:-placeholder}" \
    stripeSecretKey="${STRIPE_SECRET_KEY:-placeholder}" \
    companiesHouseApiKey="${COMPANIES_HOUSE_API_KEY:-placeholder}" \
    webhookSigningSecret="$WEBHOOK_SIGNING_SECRET" \
    crmWebhookUrl="${CRM_WEBHOOK_URL:-https://example.invalid}" \
  -o none || warn "Bicep deploy had issues; check 'az deployment group list -g $RESOURCE_GROUP'"

DATABASE_URL="postgresql://aiosadmin:${DB_PASSWORD}@psql-${ENVIRONMENT_NAME}.postgres.database.azure.com:5432/postgres?sslmode=require"

# ----------------------------------------------------------------------------
# Output secrets
# ----------------------------------------------------------------------------
OUT_FILE=".azure-secrets.env"
{
  echo "# Generated $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "# Paste these into: https://github.com/$GH_REPO/settings/secrets/actions"
  echo ""
  echo "ACR_NAME=$ACR_NAME"
  echo "ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
  echo "ACR_USERNAME=$ACR_USERNAME"
  echo "ACR_PASSWORD=$ACR_PASSWORD"
  echo "AZURE_SUBSCRIPTION_ID=$SUB_ID"
  echo "DB_PASSWORD=$DB_PASSWORD"
  echo "DATABASE_URL=$DATABASE_URL"
  echo "WEBHOOK_SIGNING_SECRET=$WEBHOOK_SIGNING_SECRET"
  echo "AZURE_STATIC_WEB_APPS_API_TOKEN=$AZURE_STATIC_WEB_APPS_API_TOKEN"
  echo "AZURE_WEBAPP_NAME=$WEBAPP_NAME"
  echo ""
  echo "# --- Multi-line secrets (set separately in GitHub UI) ---"
  echo "# AZURE_CREDENTIALS (paste as-is):"
  echo "$AZURE_CREDENTIALS"
  echo ""
  echo "# AZURE_WEBAPP_PUBLISH_PROFILE (paste XML as-is):"
  echo "$AZURE_WEBAPP_PUBLISH_PROFILE"
  echo ""
  echo "# --- You must supply these from your own accounts ---"
  echo "OPENAI_API_KEY=${OPENAI_API_KEY:-<set from platform.openai.com>}"
  echo "RESEND_KEY=${RESEND_KEY:-<set from resend.com>}"
  echo "STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-<set from dashboard.stripe.com>}"
  echo "COMPANIES_HOUSE_API_KEY=${COMPANIES_HOUSE_API_KEY:-<set from developer.company-information.service.gov.uk>}"
  echo "CRM_WEBHOOK_URL=${CRM_WEBHOOK_URL:-<your CRM webhook>}"
} > "$OUT_FILE"
chmod 600 "$OUT_FILE"

ok "Secrets written to: $OUT_FILE (chmod 600)"

# ----------------------------------------------------------------------------
# Auto-set via gh CLI if available
# ----------------------------------------------------------------------------
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo ""
  read -r -p "Push secrets to GitHub repo $GH_REPO now? [y/N] " ans
  if [[ "$ans" =~ ^[Yy] ]]; then
    gh secret set ACR_NAME                         -R "$GH_REPO" -b "$ACR_NAME"
    gh secret set ACR_LOGIN_SERVER                 -R "$GH_REPO" -b "$ACR_LOGIN_SERVER"
    gh secret set ACR_USERNAME                     -R "$GH_REPO" -b "$ACR_USERNAME"
    gh secret set ACR_PASSWORD                     -R "$GH_REPO" -b "$ACR_PASSWORD"
    gh secret set AZURE_SUBSCRIPTION_ID            -R "$GH_REPO" -b "$SUB_ID"
    gh secret set AZURE_CREDENTIALS                -R "$GH_REPO" -b "$AZURE_CREDENTIALS"
    gh secret set DB_PASSWORD                      -R "$GH_REPO" -b "$DB_PASSWORD"
    gh secret set DATABASE_URL                     -R "$GH_REPO" -b "$DATABASE_URL"
    gh secret set WEBHOOK_SIGNING_SECRET           -R "$GH_REPO" -b "$WEBHOOK_SIGNING_SECRET"
    gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN  -R "$GH_REPO" -b "$AZURE_STATIC_WEB_APPS_API_TOKEN"
    gh secret set AZURE_WEBAPP_NAME                -R "$GH_REPO" -b "$WEBAPP_NAME"
    gh secret set AZURE_WEBAPP_PUBLISH_PROFILE     -R "$GH_REPO" -b "$AZURE_WEBAPP_PUBLISH_PROFILE"
    [ -n "$OPENAI_API_KEY" ]          && gh secret set OPENAI_API_KEY          -R "$GH_REPO" -b "$OPENAI_API_KEY"
    [ -n "$RESEND_KEY" ]              && gh secret set RESEND_KEY              -R "$GH_REPO" -b "$RESEND_KEY"
    [ -n "$STRIPE_SECRET_KEY" ]       && gh secret set STRIPE_SECRET_KEY       -R "$GH_REPO" -b "$STRIPE_SECRET_KEY"
    [ -n "$COMPANIES_HOUSE_API_KEY" ] && gh secret set COMPANIES_HOUSE_API_KEY -R "$GH_REPO" -b "$COMPANIES_HOUSE_API_KEY"
    [ -n "$CRM_WEBHOOK_URL" ]         && gh secret set CRM_WEBHOOK_URL         -R "$GH_REPO" -b "$CRM_WEBHOOK_URL"
    ok "Secrets pushed to GitHub."
  fi
fi

echo ""
log "Next steps:"
echo "  1. If you didn't auto-push, open $OUT_FILE and paste values into:"
echo "     https://github.com/$GH_REPO/settings/secrets/actions"
echo "  2. Supply OPENAI_API_KEY, RESEND_KEY, STRIPE_SECRET_KEY, COMPANIES_HOUSE_API_KEY"
echo "  3. Trigger deploy:  git commit --allow-empty -m 'trigger deploy' && git push"
echo "  4. Watch:  https://github.com/$GH_REPO/actions"
echo ""
ok "Bootstrap complete."
