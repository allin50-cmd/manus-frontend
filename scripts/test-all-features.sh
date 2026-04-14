#!/bin/bash
# ============================================================================
# FineGuard Feature Test Suite
# Run this on your Mac after starting both servers:
#   Terminal 1: pnpm server:watch
#   Terminal 2: pnpm dev
# Then:  bash scripts/test-all-features.sh
# ============================================================================

BASE="http://localhost:3000"
PASS=0
FAIL=0
TOKEN=""
USER_ID=""
COMPANY_ID=""

green() { echo -e "\033[32m✓ PASS: $1\033[0m"; PASS=$((PASS+1)); }
red()   { echo -e "\033[31m✗ FAIL: $1\033[0m"; FAIL=$((FAIL+1)); }
yellow(){ echo -e "\033[33m⚠ SKIP: $1\033[0m"; }
header(){ echo -e "\n\033[1;36m━━━ $1 ━━━\033[0m"; }

# ============================================================================
header "TEST 1: Backend Health Check"
# ============================================================================
HEALTH=$(curl -s "$BASE/api/health" 2>/dev/null)
if echo "$HEALTH" | grep -q '"database":"connected"'; then
  green "Backend healthy, database connected"
else
  red "Backend not responding or database disconnected"
  echo "  Response: $HEALTH"
  echo ""
  echo "  Make sure you've run:"
  echo "    brew services start postgresql"
  echo "    pnpm server:watch"
  echo ""
  echo "  Cannot continue without backend. Exiting."
  exit 1
fi

# ============================================================================
header "TEST 2: Frontend Serving"
# ============================================================================
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5173/" 2>/dev/null)
if [ "$FRONTEND" = "200" ]; then
  green "Frontend dev server responding on port 5173"
else
  yellow "Frontend dev server not detected on port 5173 (code: $FRONTEND)"
  echo "  Run in a second terminal: pnpm dev"
  echo "  Continuing with API-only tests..."
fi

# ============================================================================
header "TEST 3: User Registration"
# ============================================================================
TIMESTAMP=$(date +%s)
TEST_EMAIL="test${TIMESTAMP}@fineguard.com"

REGISTER=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"name\": \"Test User\",
    \"company\": \"Test Corp\",
    \"password\": \"TestPass123!\"
  }")

if echo "$REGISTER" | grep -q '"ok":true'; then
  TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  green "User registered: $TEST_EMAIL"
else
  red "Registration failed"
  echo "  Response: $REGISTER"
fi

# Test duplicate email rejection
DUP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"name\": \"Duplicate\",
    \"password\": \"TestPass123!\"
  }")

if echo "$DUP" | grep -q '"Email already registered"'; then
  green "Duplicate email correctly rejected"
else
  red "Duplicate email not rejected"
  echo "  Response: $DUP"
fi

# Test validation
INVALID=$(curl -s -X POST "$BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "", "name": "", "password": ""}')

if echo "$INVALID" | grep -q '"error"'; then
  green "Empty fields correctly rejected"
else
  red "Empty field validation failed"
fi

# ============================================================================
header "TEST 4: User Login"
# ============================================================================
LOGIN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123!\"
  }")

if echo "$LOGIN" | grep -q '"ok":true'; then
  TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
  green "Login successful, token received"
else
  red "Login failed"
  echo "  Response: $LOGIN"
fi

# Test wrong password
WRONG=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"WrongPassword\"
  }")

if echo "$WRONG" | grep -q '"Invalid email or password"'; then
  green "Wrong password correctly rejected"
else
  red "Wrong password not rejected"
fi

# ============================================================================
header "TEST 5: Auth - Get Current User"
# ============================================================================
ME=$(curl -s "$BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ME" | grep -q '"ok":true'; then
  USER_ID=$(echo "$ME" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  green "Get current user works (ID: ${USER_ID:0:8}...)"
else
  red "Get current user failed"
  echo "  Response: $ME"
fi

# Test without token
NOAUTH=$(curl -s "$BASE/api/auth/me")
if echo "$NOAUTH" | grep -q '"Not authenticated"'; then
  green "Unauthenticated request correctly rejected"
else
  red "Missing auth not rejected"
fi

# ============================================================================
header "TEST 6: Dashboard"
# ============================================================================
DASH=$(curl -s "$BASE/api/dashboard" \
  -H "Authorization: Bearer $TOKEN")

if echo "$DASH" | grep -q '"ok":true'; then
  green "Dashboard loads with stats"
else
  red "Dashboard failed"
  echo "  Response: $DASH"
fi

# ============================================================================
header "TEST 7: Add Company to Monitoring"
# ============================================================================
ADD_CO=$(curl -s -X POST "$BASE/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyNumber": "00445790", "notes": "Test company - Tesco"}')

if echo "$ADD_CO" | grep -q '"ok":true'; then
  COMPANY_ID=$(echo "$ADD_CO" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  green "Company added to monitoring (ID: ${COMPANY_ID:0:8}...)"
elif echo "$ADD_CO" | grep -q '"already in your portfolio"'; then
  green "Company already monitored (expected if re-running test)"
  # Get the company ID from the list
  COMPANIES=$(curl -s "$BASE/api/companies" -H "Authorization: Bearer $TOKEN")
  COMPANY_ID=$(echo "$COMPANIES" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
elif echo "$ADD_CO" | grep -q 'API not configured'; then
  yellow "Companies House API key not configured (company add requires it)"
  echo "  To fix: Add COMPANIES_HOUSE_API_KEY to .env"
else
  red "Add company failed"
  echo "  Response: ${ADD_CO:0:200}"
fi

# Test invalid company number
INVALID_CO=$(curl -s -X POST "$BASE/api/companies" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"companyNumber": "INVALID"}')

if echo "$INVALID_CO" | grep -q '"error"'; then
  green "Invalid company number correctly rejected"
else
  red "Invalid company number not rejected"
fi

# ============================================================================
header "TEST 8: List Monitored Companies"
# ============================================================================
COMPANIES=$(curl -s "$BASE/api/companies" \
  -H "Authorization: Bearer $TOKEN")

if echo "$COMPANIES" | grep -q '"ok":true'; then
  CO_COUNT=$(echo "$COMPANIES" | grep -o '"companyNumber"' | wc -l | tr -d ' ')
  green "Company list returned ($CO_COUNT companies)"
else
  red "Company list failed"
fi

# ============================================================================
header "TEST 9: Company Detail"
# ============================================================================
if [ -n "$COMPANY_ID" ]; then
  DETAIL=$(curl -s "$BASE/api/companies/$COMPANY_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$DETAIL" | grep -q '"ok":true'; then
    green "Company detail loaded"
  else
    red "Company detail failed"
    echo "  Response: ${DETAIL:0:200}"
  fi
else
  yellow "Skipping company detail (no company ID)"
fi

# ============================================================================
header "TEST 10: Refresh Company Compliance"
# ============================================================================
if [ -n "$COMPANY_ID" ]; then
  REFRESH=$(curl -s -X POST "$BASE/api/companies/$COMPANY_ID/refresh" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$REFRESH" | grep -q '"ok":true'; then
    green "Company compliance data refreshed"
  elif echo "$REFRESH" | grep -q 'API'; then
    yellow "Refresh skipped (Companies House API key not set)"
  else
    red "Refresh failed"
    echo "  Response: ${REFRESH:0:200}"
  fi
else
  yellow "Skipping refresh (no company ID)"
fi

# ============================================================================
header "TEST 11: Alerts"
# ============================================================================
ALERTS=$(curl -s "$BASE/api/alerts" \
  -H "Authorization: Bearer $TOKEN")

if echo "$ALERTS" | grep -q '"ok":true'; then
  ALERT_COUNT=$(echo "$ALERTS" | grep -o '"id":"' | wc -l | tr -d ' ')
  green "Alerts loaded ($ALERT_COUNT alerts)"

  # Try marking all as read
  MARK_ALL=$(curl -s -X POST "$BASE/api/alerts/read-all" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$MARK_ALL" | grep -q '"ok":true'; then
    green "Mark all alerts read works"
  else
    red "Mark all read failed"
  fi
else
  red "Alerts failed"
fi

# ============================================================================
header "TEST 12: Book Demo (Lead Capture)"
# ============================================================================
LEAD=$(curl -s -X POST "$BASE/api/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Lead",
    "email": "lead@test.com",
    "company": "Lead Corp",
    "product": "fineguard",
    "phone": "+44 7700 900000",
    "message": "Automated test lead"
  }')

if echo "$LEAD" | grep -q '"ok":true'; then
  LEAD_ID=$(echo "$LEAD" | grep -o '"leadId":"[^"]*"' | cut -d'"' -f4)
  green "Lead created: $LEAD_ID"
else
  red "Lead creation failed"
  echo "  Response: $LEAD"
fi

# ============================================================================
header "TEST 13: Contact Form"
# ============================================================================
CONTACT=$(curl -s -X POST "$BASE/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Contact",
    "email": "contact@test.com",
    "subject": "Test Subject",
    "message": "Automated test message"
  }')

if echo "$CONTACT" | grep -q '"ok":true'; then
  TICKET_ID=$(echo "$CONTACT" | grep -o '"ticketId":"[^"]*"' | cut -d'"' -f4)
  green "Contact created: $TICKET_ID"
else
  red "Contact creation failed"
  echo "  Response: $CONTACT"
fi

# ============================================================================
header "TEST 14: Intake Form"
# ============================================================================
INTAKE=$(curl -s -X POST "$BASE/api/intake" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "Test Client",
    "clientEmail": "client@test.com",
    "clientPhone": "+44 7700 900001",
    "matterType": "Corporate",
    "urgency": "high",
    "description": "Automated test intake",
    "claimValue": "£50,000"
  }')

if echo "$INTAKE" | grep -q '"ok":true'; then
  MATTER_REF=$(echo "$INTAKE" | grep -o '"matterRef":"[^"]*"' | cut -d'"' -f4)
  green "Intake form created: $MATTER_REF"
else
  red "Intake form failed"
  echo "  Response: $INTAKE"
fi

# ============================================================================
header "TEST 15: Admin - View All Data"
# ============================================================================
ADMIN_LEADS=$(curl -s "$BASE/api/admin/leads")
if echo "$ADMIN_LEADS" | grep -q '"leadId"'; then
  COUNT=$(echo "$ADMIN_LEADS" | grep -o '"leadId"' | wc -l | tr -d ' ')
  green "Admin leads: $COUNT entries"
else
  red "Admin leads failed"
fi

ADMIN_INTAKE=$(curl -s "$BASE/api/admin/intake-forms")
if echo "$ADMIN_INTAKE" | grep -q '"matterRef"'; then
  COUNT=$(echo "$ADMIN_INTAKE" | grep -o '"matterRef"' | wc -l | tr -d ' ')
  green "Admin intake forms: $COUNT entries"
else
  red "Admin intake forms failed"
fi

ADMIN_BUNDLES=$(curl -s "$BASE/api/admin/compliance-bundles")
if echo "$ADMIN_BUNDLES" | grep -q '\['; then
  green "Admin compliance bundles accessible"
else
  red "Admin compliance bundles failed"
fi

ADMIN_CONTACTS=$(curl -s "$BASE/api/admin/contacts")
if echo "$ADMIN_CONTACTS" | grep -q '"ticketId"'; then
  COUNT=$(echo "$ADMIN_CONTACTS" | grep -o '"ticketId"' | wc -l | tr -d ' ')
  green "Admin contacts: $COUNT entries"
else
  red "Admin contacts failed"
fi

# ============================================================================
header "TEST 16: Deployment Status"
# ============================================================================
DEPLOY=$(curl -s "$BASE/api/deployments/status")
if echo "$DEPLOY" | grep -q '"deployments"'; then
  green "Deployment status endpoint works"
else
  red "Deployment status failed"
fi

# ============================================================================
header "TEST 17: Bulk Data Stats"
# ============================================================================
BULK=$(curl -s "$BASE/api/bulk-data/stats")
if echo "$BULK" | grep -q '"ok":true'; then
  green "Bulk data stats endpoint works"
else
  red "Bulk data stats failed"
fi

# ============================================================================
header "TEST 18: Logout"
# ============================================================================
LOGOUT=$(curl -s -X POST "$BASE/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN")

if echo "$LOGOUT" | grep -q '"ok":true'; then
  green "Logout successful"
else
  red "Logout failed"
fi

# Verify token is now invalid
AFTER_LOGOUT=$(curl -s "$BASE/api/auth/me" \
  -H "Authorization: Bearer $TOKEN")

if echo "$AFTER_LOGOUT" | grep -q '"Not authenticated"'; then
  green "Token invalidated after logout"
else
  red "Token still valid after logout!"
fi

# ============================================================================
header "TEST 19: Delete Company (cleanup)"
# ============================================================================
# Re-login to get a fresh token for cleanup
RELOGIN=$(curl -s -X POST "$BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"TestPass123!\"
  }")
TOKEN=$(echo "$RELOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$COMPANY_ID" ] && [ -n "$TOKEN" ]; then
  DEL=$(curl -s -X DELETE "$BASE/api/companies/$COMPANY_ID" \
    -H "Authorization: Bearer $TOKEN")

  if echo "$DEL" | grep -q '"ok":true'; then
    green "Company deleted from monitoring"
  else
    red "Company deletion failed"
    echo "  Response: $DEL"
  fi
else
  yellow "Skipping delete (no company or token)"
fi

# ============================================================================
# RESULTS
# ============================================================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\033[1mRESULTS\033[0m"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "  \033[32m✓ Passed: $PASS\033[0m"
echo -e "  \033[31m✗ Failed: $FAIL\033[0m"
TOTAL=$((PASS+FAIL))
if [ $FAIL -eq 0 ]; then
  echo -e "\n  \033[1;32mALL $TOTAL TESTS PASSED!\033[0m"
else
  echo -e "\n  \033[1;31m$FAIL of $TOTAL tests failed\033[0m"
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "BROWSER TESTS (manual):"
echo "  1. http://localhost:5173         — Landing page"
echo "  2. http://localhost:5173/signup   — Create account"
echo "  3. http://localhost:5173/login    — Login"
echo "  4. http://localhost:5173/dashboard — Dashboard"
echo "  5. http://localhost:5173/admin    — Admin panel"
echo "  6. http://localhost:5173/reports  — Reports + CSV export"
echo "  7. http://localhost:5173/book-demo — Demo form"
echo "  8. http://localhost:5173/contact  — Contact form"
echo ""
