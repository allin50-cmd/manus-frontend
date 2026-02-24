#!/usr/bin/env bash
# ============================================================
# FineGuard — M365 Integration Local Testing Script
# ============================================================
#
# Tests the real API endpoints locally:
#   1. Compliance risk-summary endpoint
#   2. Compliance filings endpoint
#   3. Alert trigger endpoint
#   4. M365 status endpoint
#   5. Webhook forwarding endpoint
#   6. Azure Function (if running locally on port 7071)
#
# Usage:
#   ./scripts/test-m365-integration.sh [BASE_URL] [AUTH_TOKEN]
#
# Examples:
#   ./scripts/test-m365-integration.sh http://localhost:3000
#   ./scripts/test-m365-integration.sh http://localhost:3000 "your-jwt-token"
# ============================================================

set -euo pipefail

BASE_URL="${1:-http://localhost:3000}"
AUTH_TOKEN="${2:-}"
AZURE_FUNC_URL="${AZURE_FUNCTION_URL:-http://localhost:7071}"
WEBHOOK_SECRET="${FINEGUARD_WEBHOOK_SECRET:-fg-secret-change-me-in-production}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
SKIP=0

# ── Helpers ──────────────────────────────────────────────────

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_endpoint() {
  local name="$1"
  local method="$2"
  local url="$3"
  local expected_status="$4"
  local data="${5:-}"
  local extra_headers="${6:-}"

  local auth_header=""
  if [ -n "$AUTH_TOKEN" ]; then
    auth_header="-H \"Authorization: Bearer $AUTH_TOKEN\""
  fi

  local cmd="curl -s -o /tmp/fg_test_response.json -w '%{http_code}' -X $method '$url' -H 'Content-Type: application/json'"

  if [ -n "$AUTH_TOKEN" ]; then
    cmd="$cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
  fi

  if [ -n "$extra_headers" ]; then
    cmd="$cmd $extra_headers"
  fi

  if [ -n "$data" ]; then
    cmd="$cmd -d '$data'"
  fi

  local status_code
  status_code=$(eval "$cmd" 2>/dev/null || echo "000")

  local response
  response=$(cat /tmp/fg_test_response.json 2>/dev/null || echo "{}")

  if [ "$status_code" = "$expected_status" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} $name (HTTP $status_code)"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗ FAIL${NC} $name (expected $expected_status, got $status_code)"
    echo -e "    Response: $(echo "$response" | head -c 200)"
    FAIL=$((FAIL + 1))
  fi
}

test_skip() {
  echo -e "  ${YELLOW}⊘ SKIP${NC} $1 ($2)"
  SKIP=$((SKIP + 1))
}

# ── Server Health Check ──────────────────────────────────────

print_header "FineGuard M365 Integration Tests"
echo -e "  Server:  ${BASE_URL}"
echo -e "  Auth:    ${AUTH_TOKEN:+Provided}${AUTH_TOKEN:-Not provided (some tests will be skipped)}"

# Check if the server is running
if ! curl -s --connect-timeout 3 "$BASE_URL" > /dev/null 2>&1; then
  echo -e "\n  ${RED}ERROR: Server at $BASE_URL is not reachable.${NC}"
  echo -e "  Start the server with: npm run dev"
  exit 1
fi

echo -e "\n  ${GREEN}Server is running.${NC}"

# ── Test 1: M365 Status (requires auth) ─────────────────────

print_header "1. M365 Integration Status"

if [ -n "$AUTH_TOKEN" ]; then
  test_endpoint "GET /api/m365/status" GET "$BASE_URL/api/m365/status" "200"
else
  test_endpoint "GET /api/m365/status (no auth)" GET "$BASE_URL/api/m365/status" "401"
  test_skip "GET /api/m365/status (with auth)" "no AUTH_TOKEN provided"
fi

# ── Test 2: Compliance Risk Summary ──────────────────────────

print_header "2. Compliance Risk Summary"

if [ -n "$AUTH_TOKEN" ]; then
  test_endpoint "GET /api/compliance/risk-summary" GET "$BASE_URL/api/compliance/risk-summary" "200"
else
  test_endpoint "GET /api/compliance/risk-summary (no auth)" GET "$BASE_URL/api/compliance/risk-summary" "401"
  test_skip "GET /api/compliance/risk-summary (with auth)" "no AUTH_TOKEN provided"
fi

# ── Test 3: Compliance Filings ───────────────────────────────

print_header "3. Compliance Filings"

if [ -n "$AUTH_TOKEN" ]; then
  test_endpoint "GET /api/compliance/filings" GET "$BASE_URL/api/compliance/filings" "200"
  test_endpoint "GET /api/compliance/filings?status=upcoming" GET "$BASE_URL/api/compliance/filings?status=upcoming" "200"
  test_endpoint "GET /api/compliance/filings?status=overdue" GET "$BASE_URL/api/compliance/filings?status=overdue" "200"
else
  test_endpoint "GET /api/compliance/filings (no auth)" GET "$BASE_URL/api/compliance/filings" "401"
  test_skip "GET /api/compliance/filings (with auth)" "no AUTH_TOKEN provided"
fi

# ── Test 4: Alerts Endpoint ──────────────────────────────────

print_header "4. Alerts Endpoints"

if [ -n "$AUTH_TOKEN" ]; then
  test_endpoint "GET /api/alerts" GET "$BASE_URL/api/alerts" "200"
else
  test_endpoint "GET /api/alerts (no auth)" GET "$BASE_URL/api/alerts" "401"
  test_skip "GET /api/alerts (with auth)" "no AUTH_TOKEN provided"
fi

# ── Test 5: M365 Config Guide ───────────────────────────────

print_header "5. M365 Config Guide"

if [ -n "$AUTH_TOKEN" ]; then
  test_endpoint "GET /api/m365/config-guide" GET "$BASE_URL/api/m365/config-guide" "200"
else
  test_skip "GET /api/m365/config-guide" "no AUTH_TOKEN provided"
fi

# ── Test 6: Webhook Forwarding ───────────────────────────────

print_header "6. Webhook Forwarding"

if [ -n "$AUTH_TOKEN" ]; then
  # Webhook forwarding returns 503 if AZURE_FUNCTION_URL is not configured (expected in local dev)
  # Returns 400 if configured but payload is invalid
  # Returns 200 if configured and payload is valid
  if [ -n "${AZURE_FUNCTION_URL+x}" ] && [ "${AZURE_FUNCTION_URL}" != "" ]; then
    test_endpoint "POST /api/m365/forward-event (missing fields)" POST \
      "$BASE_URL/api/m365/forward-event" "400" \
      '{"wrong": "data"}'

    test_endpoint "POST /api/m365/forward-event (valid payload)" POST \
      "$BASE_URL/api/m365/forward-event" "200" \
      '{"eventType":"risk_alert","firmId":"firm-001","firmName":"Test Ltd","riskLevel":"High","title":"Test Alert","description":"Integration test","timestamp":"2026-02-24T12:00:00Z"}'
  else
    # Not configured — expect 503
    test_endpoint "POST /api/m365/forward-event (not configured → 503)" POST \
      "$BASE_URL/api/m365/forward-event" "503" \
      '{"eventType":"risk_alert","firmId":"firm-001"}'
  fi
else
  test_skip "POST /api/m365/forward-event" "no AUTH_TOKEN provided"
fi

# ── Test 7: Azure Function (if running locally) ─────────────

print_header "7. Azure Function Webhook Handler"

if curl -s --connect-timeout 2 "$AZURE_FUNC_URL" > /dev/null 2>&1; then
  echo -e "  Azure Function running at $AZURE_FUNC_URL"

  # Test: Missing secret (401)
  test_endpoint "POST webhook (no secret → 401)" POST \
    "$AZURE_FUNC_URL/api/fineGuardWebhook" "401" \
    '{"eventType":"risk_alert","firmId":"firm-001","timestamp":"2026-02-24T12:00:00Z"}'

  # Test: Invalid payload (422)
  test_endpoint "POST webhook (bad payload → 422)" POST \
    "$AZURE_FUNC_URL/api/fineGuardWebhook" "422" \
    '{"wrong":"data"}' \
    "-H \"x-fineguard-secret: $WEBHOOK_SECRET\""

  # Test: Valid payload (200)
  test_endpoint "POST webhook (valid → 200)" POST \
    "$AZURE_FUNC_URL/api/fineGuardWebhook" "200" \
    '{"eventType":"risk_alert","firmId":"firm-001","firmName":"Test Ltd","riskLevel":"Critical","title":"PSC Register Overdue","description":"Test","dueDate":"2026-03-01T00:00:00Z","assignedTo":"test@test.com","timestamp":"2026-02-24T12:00:00Z"}' \
    "-H \"x-fineguard-secret: $WEBHOOK_SECRET\""

  # Test: Wrong method (405)
  test_endpoint "GET webhook (wrong method → 405)" GET \
    "$AZURE_FUNC_URL/api/fineGuardWebhook" "405"
else
  echo -e "  Azure Function not running at $AZURE_FUNC_URL"
  test_skip "Azure Function tests" "start with: cd integrations/m365/azure-function && func start"
fi

# ── Test 8: Bot Messaging Endpoint ───────────────────────────

print_header "8. Bot Messaging Endpoint"

# The bot endpoint expects Bot Framework activity format.
# With a minimal activity payload, the adapter processes it and returns 200.
# This verifies the endpoint is mounted and reachable (not 404).
test_endpoint "POST /api/messages (endpoint exists)" POST \
  "$BASE_URL/api/messages" "200" \
  '{"type":"message","text":"test"}'

# ── Summary ──────────────────────────────────────────────────

print_header "Test Summary"
echo -e "  ${GREEN}Passed:  $PASS${NC}"
echo -e "  ${RED}Failed:  $FAIL${NC}"
echo -e "  ${YELLOW}Skipped: $SKIP${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "  ${RED}Some tests failed.${NC}"
  exit 1
else
  echo -e "  ${GREEN}All executed tests passed.${NC}"
fi

# Cleanup
rm -f /tmp/fg_test_response.json
