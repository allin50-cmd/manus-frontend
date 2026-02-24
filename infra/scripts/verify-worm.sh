#!/usr/bin/env bash
###############################################################################
# Verify WORM Immutability on FineGuard Audit Blobs
# Attempts to delete a test blob and verifies it is rejected.
#
# Usage:
#   ./verify-worm.sh <storage-account-name>
###############################################################################
set -euo pipefail

ACCOUNT="${1:?Usage: $0 <storage-account-name>}"
CONTAINER="fineguard-audit"
TEST_BLOB="worm-test/verify-$(date +%s).json"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  FineGuard WORM Verification"
echo "══════════════════════════════════════════════════════════"
echo "  Account  : $ACCOUNT"
echo "  Container: $CONTAINER"
echo ""

# ── 1. Write a test blob ──────────────────────────────────────────────────────
echo "→ Writing test blob: $TEST_BLOB"
TEMP_FILE=$(mktemp)
echo '{"test":"worm-verification","timestamp":"'"$(date -u +%Y-%m-%dT%H:%M:%SZ)"'"}' > "$TEMP_FILE"

az storage blob upload \
  --account-name "$ACCOUNT" \
  --container-name "$CONTAINER" \
  --name "$TEST_BLOB" \
  --file "$TEMP_FILE" \
  --auth-mode login \
  --overwrite false
rm -f "$TEMP_FILE"
echo "   ✓ Blob written"

# ── 2. Show immutability policy ───────────────────────────────────────────────
echo ""
echo "→ Immutability policy:"
az storage container immutability-policy show \
  --account-name "$ACCOUNT" \
  --container-name "$CONTAINER" \
  --output table 2>/dev/null || echo "   No immutability policy found"

# ── 3. Attempt to delete the blob — expect failure if WORM is enforced ────────
echo ""
echo "→ Attempting to delete test blob (should fail if WORM locked)..."
if az storage blob delete \
  --account-name "$ACCOUNT" \
  --container-name "$CONTAINER" \
  --name "$TEST_BLOB" \
  --auth-mode login 2>&1 | grep -qi "ImmutabilityPolicyViolation\|BlobImmutableDueToPolicy\|error"; then
  echo ""
  echo "✅ WORM VERIFIED: Blob delete was rejected — immutability policy is ACTIVE."
else
  echo ""
  echo "⚠ WARNING: Blob was deleted. Immutability policy may NOT be locked."
  echo "  This is expected in development/test mode (unlocked policy)."
  echo "  Lock the policy before deploying to production."
fi

# ── 4. Show blob properties ───────────────────────────────────────────────────
echo ""
echo "→ Blob properties (existence confirmation):"
az storage blob show \
  --account-name "$ACCOUNT" \
  --container-name "$CONTAINER" \
  --name "$TEST_BLOB" \
  --auth-mode login \
  --output table 2>/dev/null || echo "   Blob no longer exists (deleted — WORM not active)"

echo ""
echo "══════════════════════════════════════════════════════════"
echo "  Verification complete."
echo "══════════════════════════════════════════════════════════"
