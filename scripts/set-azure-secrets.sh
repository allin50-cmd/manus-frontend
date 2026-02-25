#!/usr/bin/env bash
# ============================================================================
# Set GitHub Actions secrets for Azure deployment
#
# Prerequisites:
#   1. gh CLI installed and authenticated  (gh auth login)
#   2. Azure CLI installed and logged in   (az login)
#   3. An Azure Container Registry created
#   4. Azure App Service(s) created
#
# Usage:
#   ./scripts/set-azure-secrets.sh
#
# Or supply values via environment variables to skip prompts:
#   ACR_LOGIN_SERVER=myacr.azurecr.io \
#   AZURE_WEBAPP_NAME_DEV=vaultline-dev \
#   ./scripts/set-azure-secrets.sh
# ============================================================================

set -euo pipefail

REPO="allin50-cmd/manus-frontend"

# ---------- helpers ---------------------------------------------------------
red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }

prompt() {
  local var_name="$1" label="$2" default="${3:-}"
  # Use env var if already set
  if [ -n "${!var_name:-}" ]; then
    echo "  $label: ${!var_name} (from env)"
    return
  fi
  if [ -n "$default" ]; then
    read -rp "  $label [$default]: " value
    eval "$var_name=\"${value:-$default}\""
  else
    read -rp "  $label: " value
    eval "$var_name=\"$value\""
  fi
}

# ---------- preflight checks -----------------------------------------------
bold "Preflight checks"

if ! command -v gh &>/dev/null; then
  red "Error: gh CLI not found. Install it first: https://cli.github.com"
  exit 1
fi

if ! gh auth status &>/dev/null; then
  red "Error: Not authenticated with GitHub. Run: gh auth login"
  exit 1
fi
green "  gh CLI: OK"

if ! command -v az &>/dev/null; then
  red "Warning: Azure CLI not found — you'll need to supply values manually."
  AZ_AVAILABLE=false
else
  AZ_AVAILABLE=true
  green "  az CLI: OK"
fi

echo ""

# ---------- Azure Container Registry ----------------------------------------
bold "1. Azure Container Registry (ACR)"

prompt ACR_LOGIN_SERVER "ACR login server (e.g. myacr.azurecr.io)"

if [ "$AZ_AVAILABLE" = true ] && [ -z "${ACR_USERNAME:-}" ]; then
  echo "  Fetching ACR admin credentials..."
  ACR_NAME="${ACR_LOGIN_SERVER%%.*}"
  ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv 2>/dev/null || true)
  ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv 2>/dev/null || true)
fi

prompt ACR_USERNAME "ACR username"
prompt ACR_PASSWORD "ACR password"

echo ""

# ---------- Azure Service Principal ------------------------------------------
bold "2. Azure Service Principal (AZURE_CREDENTIALS)"
echo "  This is a JSON blob from: az ad sp create-for-rbac --name vaultline-deploy --role contributor --scopes /subscriptions/<SUB_ID>"

if [ "$AZ_AVAILABLE" = true ] && [ -z "${AZURE_CREDENTIALS:-}" ]; then
  read -rp "  Create a new service principal now? [y/N]: " create_sp
  if [[ "$create_sp" =~ ^[Yy]$ ]]; then
    SUB_ID=$(az account show --query "id" -o tsv)
    echo "  Creating service principal for subscription $SUB_ID ..."
    AZURE_CREDENTIALS=$(az ad sp create-for-rbac \
      --name "vaultline-github-deploy" \
      --role contributor \
      --scopes "/subscriptions/$SUB_ID" \
      --sdk-auth 2>/dev/null)
    green "  Service principal created."
  fi
fi

if [ -z "${AZURE_CREDENTIALS:-}" ]; then
  echo "  Paste the full JSON blob (end with a blank line):"
  AZURE_CREDENTIALS=""
  while IFS= read -r line; do
    [ -z "$line" ] && break
    AZURE_CREDENTIALS+="$line"
  done
fi

echo ""

# ---------- App Service names ------------------------------------------------
bold "3. Azure App Service names"

prompt AZURE_WEBAPP_NAME_DEV     "Dev App Service name"     "vaultline-dev"
prompt AZURE_WEBAPP_NAME_STAGING "Staging App Service name" "vaultline-staging"
prompt AZURE_WEBAPP_NAME_PROD    "Prod App Service name"    "vaultline-prod"

echo ""

# ---------- Static Web Apps token (PR previews) ------------------------------
bold "4. Azure Static Web Apps (PR preview)"

if [ "$AZ_AVAILABLE" = true ] && [ -z "${AZURE_STATIC_WEB_APPS_API_TOKEN:-}" ]; then
  echo "  Attempting to fetch token from existing Static Web App..."
  AZURE_STATIC_WEB_APPS_API_TOKEN=$(az staticwebapp secrets list \
    --name fineguard \
    --query "properties.apiKey" -o tsv 2>/dev/null || true)
fi

prompt AZURE_STATIC_WEB_APPS_API_TOKEN "Static Web Apps API token (or 'skip')" "skip"

echo ""

# ---------- Deployment tracking (optional) ------------------------------------
bold "5. Deployment tracking (optional)"

prompt VAULTLINE_API_URL    "VaultLine API URL (or 'skip')" "skip"
prompt DEPLOY_RECORD_TOKEN  "Deploy record token (or 'skip')" "skip"

echo ""

# ---------- Confirmation -----------------------------------------------------
bold "Configuration Summary"
echo "  ──────────────────────────────────────────"
echo "  Repository:          $REPO"
echo "  ACR Server:          $ACR_LOGIN_SERVER"
echo "  ACR Username:        $ACR_USERNAME"
echo "  ACR Password:        ***${ACR_PASSWORD: -4}"
echo "  Azure Credentials:   $(echo "$AZURE_CREDENTIALS" | head -c 40)..."
echo "  Dev App Service:     $AZURE_WEBAPP_NAME_DEV"
echo "  Staging App Service: $AZURE_WEBAPP_NAME_STAGING"
echo "  Prod App Service:    $AZURE_WEBAPP_NAME_PROD"
[ "$AZURE_STATIC_WEB_APPS_API_TOKEN" != "skip" ] && \
  echo "  SWA Token:           ***${AZURE_STATIC_WEB_APPS_API_TOKEN: -4}"
[ "$VAULTLINE_API_URL" != "skip" ] && \
  echo "  API URL:             $VAULTLINE_API_URL"
echo "  ──────────────────────────────────────────"
echo ""

read -rp "Set these secrets on $REPO? [Y/n]: " confirm
if [[ "$confirm" =~ ^[Nn]$ ]]; then
  echo "Aborted."
  exit 0
fi

echo ""

# ---------- Set secrets -------------------------------------------------------
bold "Setting GitHub secrets..."

set_secret() {
  local name="$1" value="$2"
  if [ "$value" = "skip" ] || [ -z "$value" ]; then
    echo "  Skipping $name"
    return
  fi
  echo "$value" | gh secret set "$name" --repo "$REPO"
  green "  $name set"
}

set_secret "ACR_LOGIN_SERVER"                "$ACR_LOGIN_SERVER"
set_secret "ACR_USERNAME"                    "$ACR_USERNAME"
set_secret "ACR_PASSWORD"                    "$ACR_PASSWORD"
set_secret "AZURE_CREDENTIALS"               "$AZURE_CREDENTIALS"
set_secret "AZURE_WEBAPP_NAME_DEV"           "$AZURE_WEBAPP_NAME_DEV"
set_secret "AZURE_WEBAPP_NAME_STAGING"       "$AZURE_WEBAPP_NAME_STAGING"
set_secret "AZURE_WEBAPP_NAME_PROD"          "$AZURE_WEBAPP_NAME_PROD"
set_secret "AZURE_STATIC_WEB_APPS_API_TOKEN" "$AZURE_STATIC_WEB_APPS_API_TOKEN"
set_secret "VAULTLINE_API_URL"               "$VAULTLINE_API_URL"
set_secret "DEPLOY_RECORD_TOKEN"             "$DEPLOY_RECORD_TOKEN"

echo ""
green "All secrets configured!"
echo ""
bold "Next steps:"
echo "  1. Merge your branch to main"
echo "  2. Push to trigger the CI/CD pipeline: git push origin main"
echo "  3. Watch the deployment: gh run watch"
echo ""
