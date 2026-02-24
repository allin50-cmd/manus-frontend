#!/usr/bin/env bash
###############################################################################
# Configure Azure Blob Storage WORM Immutability Policy
# Run this after Terraform provision OR manually to enable WORM on audit container.
#
# Usage:
#   ./configure-immutability.sh <storage-account-name> [retention-days]
###############################################################################
set -euo pipefail

ACCOUNT="${1:?Usage: $0 <storage-account-name> [retention-days]}"
RETENTION="${2:-2557}"   # Default: 7 years (2557 days)
CONTAINER="fineguard-audit"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  FineGuard WORM Immutability Configuration"
echo "══════════════════════════════════════════════════════════"
echo "  Storage Account : $ACCOUNT"
echo "  Container       : $CONTAINER"
echo "  Retention       : $RETENTION days"
echo ""

# ── 1. Create container if it doesn't exist ───────────────────────────────────
echo "→ Creating blob container (if not exists)..."
az storage container create \
  --name "$CONTAINER" \
  --account-name "$ACCOUNT" \
  --auth-mode login \
  --public-access off 2>/dev/null || true

# ── 2. Enable blob versioning on storage account ──────────────────────────────
echo "→ Enabling blob versioning..."
RG=$(az storage account show --name "$ACCOUNT" --query resourceGroup -o tsv)
az storage account blob-service-properties update \
  --account-name "$ACCOUNT" \
  --resource-group "$RG" \
  --enable-versioning true \
  --enable-change-feed true

# ── 3. Create time-based retention policy (locked) ───────────────────────────
echo "→ Setting time-based immutability policy (${RETENTION} days)..."
az storage container immutability-policy create \
  --account-name "$ACCOUNT" \
  --container-name "$CONTAINER" \
  --period "$RETENTION" \
  --allow-protected-append-writes true

# ── 4. Lock the policy (IRREVERSIBLE in production!) ─────────────────────────
# WARNING: Once locked, no one — not even subscription owners — can delete data
# before the retention period expires. Only do this for production environments.
read -rp "⚠ Lock the policy? This is IRREVERSIBLE for production. Type 'lock' to confirm: " CONFIRM
if [[ "$CONFIRM" == "lock" ]]; then
  ETAG=$(az storage container immutability-policy show \
    --account-name "$ACCOUNT" \
    --container-name "$CONTAINER" \
    --query etag -o tsv)

  az storage container immutability-policy lock \
    --account-name "$ACCOUNT" \
    --container-name "$CONTAINER" \
    --if-match "$ETAG"

  echo "✅ Policy LOCKED. Data is now WORM-protected for $RETENTION days."
else
  echo "⚡ Policy created but NOT locked (unlocked = dev/test mode)."
fi

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Done. Run verify-worm.sh to confirm protection."
echo "══════════════════════════════════════════════════════════"
