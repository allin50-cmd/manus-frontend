#!/usr/bin/env bash
# ============================================================================
# VaultLine – One-shot Azure provisioning & GitHub secrets setup
#
# Creates all Azure resources, sets GitHub secrets, and triggers first deploy.
#
# Prerequisites:
#   - az CLI installed + authenticated (az login)
#   - gh CLI installed + authenticated (gh auth login)
#
# Usage:
#   ./scripts/provision-azure.sh              # interactive prompts
#   RG=my-rg APP_DEV=my-app ./scripts/provision-azure.sh  # override defaults
# ============================================================================

set -euo pipefail

# ---------- defaults (override via env vars) --------------------------------
RG="${RG:-vaultline-rg}"
LOCATION="${LOCATION:-uksouth}"
ACR_NAME="${ACR_NAME:-vaultlineacr}"
APP_PLAN="${APP_PLAN:-vaultline-plan}"
APP_DEV="${APP_DEV:-vaultline-dev}"
APP_SKU="${APP_SKU:-B1}"
REPO="${REPO:-allin50-cmd/manus-frontend}"

# ---------- colours ---------------------------------------------------------
red()   { printf '\033[0;31m%s\033[0m\n' "$*"; }
green() { printf '\033[0;32m%s\033[0m\n' "$*"; }
bold()  { printf '\033[1m%s\033[0m\n' "$*"; }
info()  { printf '  ℹ %s\n' "$*"; }
ok()    { green "  ✓ $*"; }
fail()  { red   "  ✗ $*"; }

# ---------- preflight -------------------------------------------------------
bold "Preflight checks"

for cmd in az gh git node npm; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd installed"
  else
    fail "$cmd not found — install it first"
    exit 1
  fi
done

if ! az account show &>/dev/null; then
  fail "Not logged in to Azure. Run: az login"
  exit 1
fi
ok "Azure authenticated"

if ! gh auth status &>/dev/null 2>&1; then
  fail "Not authenticated with GitHub. Run: gh auth login"
  exit 1
fi
ok "GitHub authenticated"

SUB_ID=$(az account show --query "id" -o tsv)
SUB_NAME=$(az account show --query "name" -o tsv)
info "Azure subscription: $SUB_NAME ($SUB_ID)"
echo ""

# ---------- confirmation ----------------------------------------------------
bold "Configuration"
echo "  ──────────────────────────────────────"
echo "  Resource Group:   $RG"
echo "  Location:         $LOCATION"
echo "  Container Reg:    $ACR_NAME"
echo "  App Plan:         $APP_PLAN (SKU: $APP_SKU)"
echo "  App Service:      $APP_DEV"
echo "  GitHub Repo:      $REPO"
echo "  ──────────────────────────────────────"
echo ""
read -rp "Proceed? [Y/n]: " confirm
if [[ "${confirm:-Y}" =~ ^[Nn]$ ]]; then
  echo "Aborted."
  exit 0
fi
echo ""

# ---------- 1. Resource Group ------------------------------------------------
bold "Step 1/6 — Resource Group"
if az group show --name "$RG" &>/dev/null; then
  ok "Resource group '$RG' already exists"
else
  info "Creating resource group '$RG' in $LOCATION..."
  az group create --name "$RG" --location "$LOCATION" --output none
  ok "Resource group created"
fi
echo ""

# ---------- 2. Azure Container Registry -------------------------------------
bold "Step 2/6 — Azure Container Registry"
if az acr show --name "$ACR_NAME" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "ACR '$ACR_NAME' already exists"
else
  info "Creating ACR '$ACR_NAME' (Basic SKU, admin enabled)..."
  az acr create \
    --resource-group "$RG" \
    --name "$ACR_NAME" \
    --sku Basic \
    --admin-enabled true \
    --output none
  ok "ACR created"
fi

ACR_SERVER=$(az acr show --name "$ACR_NAME" --resource-group "$RG" --query "loginServer" -o tsv)
ACR_USER=$(az acr credential show --name "$ACR_NAME" --resource-group "$RG" --query "username" -o tsv)
ACR_PASS=$(az acr credential show --name "$ACR_NAME" --resource-group "$RG" --query "passwords[0].value" -o tsv)
ok "ACR credentials retrieved: $ACR_SERVER"
echo ""

# ---------- 3. App Service Plan ---------------------------------------------
bold "Step 3/6 — App Service Plan"
if az appservice plan show --name "$APP_PLAN" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "App Service Plan '$APP_PLAN' already exists"
else
  info "Creating App Service Plan '$APP_PLAN' ($APP_SKU, Linux)..."
  az appservice plan create \
    --name "$APP_PLAN" \
    --resource-group "$RG" \
    --is-linux \
    --sku "$APP_SKU" \
    --output none
  ok "App Service Plan created"
fi
echo ""

# ---------- 4. App Service (Dev) --------------------------------------------
bold "Step 4/6 — App Service (Dev)"
if az webapp show --name "$APP_DEV" --resource-group "$RG" &>/dev/null 2>&1; then
  ok "App Service '$APP_DEV' already exists"
else
  info "Creating App Service '$APP_DEV'..."
  az webapp create \
    --resource-group "$RG" \
    --plan "$APP_PLAN" \
    --name "$APP_DEV" \
    --deployment-container-image-name "$ACR_SERVER/vaultline-brand-suite:latest" \
    --output none
  ok "App Service created"
fi

info "Configuring container registry access..."
az webapp config container set \
  --name "$APP_DEV" \
  --resource-group "$RG" \
  --container-image-name "$ACR_SERVER/vaultline-brand-suite:latest" \
  --container-registry-url "https://$ACR_SERVER" \
  --container-registry-user "$ACR_USER" \
  --container-registry-password "$ACR_PASS" \
  --output none

info "Setting app settings..."
az webapp config appsettings set \
  --name "$APP_DEV" \
  --resource-group "$RG" \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    WEBSITES_PORT=8080 \
  --output none
ok "App Service configured"

APP_URL="https://${APP_DEV}.azurewebsites.net"
echo ""

# ---------- 5. Service Principal --------------------------------------------
bold "Step 5/6 — Service Principal & GitHub Secrets"

info "Creating service principal for GitHub Actions..."
SP_JSON=$(az ad sp create-for-rbac \
  --name "vaultline-github-deploy" \
  --role contributor \
  --scopes "/subscriptions/$SUB_ID/resourceGroups/$RG" \
  --sdk-auth 2>/dev/null)
ok "Service principal created"

info "Setting GitHub secrets on $REPO..."

set_secret() {
  echo "$2" | gh secret set "$1" --repo "$REPO"
  ok "$1"
}

set_secret "ACR_LOGIN_SERVER"        "$ACR_SERVER"
set_secret "ACR_USERNAME"            "$ACR_USER"
set_secret "ACR_PASSWORD"            "$ACR_PASS"
set_secret "AZURE_CREDENTIALS"       "$SP_JSON"
set_secret "AZURE_WEBAPP_NAME_DEV"   "$APP_DEV"

echo ""

# ---------- 6. Trigger deployment -------------------------------------------
bold "Step 6/6 — Trigger Deployment"

read -rp "Merge current branch to main and trigger deploy? [Y/n]: " do_merge
if [[ "${do_merge:-Y}" =~ ^[Nn]$ ]]; then
  info "Skipping merge. To deploy later:"
  echo "    git checkout main && git merge claude/add-landing-signup-flow-jcPsm && git push origin main"
else
  CURRENT_BRANCH=$(git branch --show-current)
  info "Merging $CURRENT_BRANCH → main..."
  git checkout main
  git merge "$CURRENT_BRANCH" -m "Merge $CURRENT_BRANCH — Azure deployment"
  git push origin main
  ok "Pushed to main — GitHub Actions will now build and deploy"
  echo ""
  info "Watching deployment..."
  gh run watch || true
fi

echo ""

# ---------- done ------------------------------------------------------------
bold "════════════════════════════════════════"
green "  Deployment complete!"
bold "════════════════════════════════════════"
echo ""
echo "  Azure Resources:"
echo "    Resource Group:  $RG"
echo "    ACR:             $ACR_SERVER"
echo "    App Service:     $APP_DEV"
echo ""
echo "  URLs:"
echo "    App:       $APP_URL"
echo "    Health:    $APP_URL/api/health"
echo "    Actions:   https://github.com/$REPO/actions"
echo ""
echo "  Useful commands:"
echo "    gh run list                          # view CI/CD runs"
echo "    az webapp log tail -n $APP_DEV -g $RG   # stream logs"
echo "    az webapp restart -n $APP_DEV -g $RG     # restart app"
echo ""
