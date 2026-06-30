#!/bin/bash

# Test Deployment Tracking System
# This script tests all deployment tracking API endpoints

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
DEPLOY_TOKEN="${DEPLOY_RECORD_TOKEN}"

if [ -z "$DEPLOY_TOKEN" ]; then
    echo -e "${RED}Error: DEPLOY_RECORD_TOKEN environment variable not set${NC}"
    echo "Load it from .env: source .env"
    exit 1
fi

echo "========================================="
echo "Deployment Tracking System Test"
echo "========================================="
echo ""
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 2: Record Deployment (Dev)
echo -e "${YELLOW}Test 2: Record Development Deployment${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: $DEPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "dev",
        "status": "success",
        "commit": "abc123def456789",
        "workflowRun": "9876543210"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Dev deployment recorded${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed to record dev deployment (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 3: Record Deployment (Staging)
echo -e "${YELLOW}Test 3: Record Staging Deployment${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: $DEPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "staging",
        "status": "success",
        "commit": "def456abc789012",
        "workflowRun": "9876543211"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Staging deployment recorded${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed to record staging deployment (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 4: Record Deployment (Production)
echo -e "${YELLOW}Test 4: Record Production Deployment${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: $DEPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "prod",
        "status": "success",
        "commit": "ghi789jkl012345",
        "workflowRun": "9876543212"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Production deployment recorded${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed to record production deployment (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 5: Get Deployment Status
echo -e "${YELLOW}Test 5: Get Deployment Status${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/deployments/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Deployment status retrieved${NC}"
    echo "$BODY" | jq '.'

    # Count deployments
    COUNT=$(echo "$BODY" | jq '.deployments | length')
    echo -e "Found ${GREEN}$COUNT${NC} deployment(s)"
else
    echo -e "${RED}✗ Failed to get deployment status (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 6: Get Deployment History
echo -e "${YELLOW}Test 6: Get Deployment History${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/deployments/history?limit=5")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${GREEN}✓ Deployment history retrieved${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed to get deployment history (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 7: Record Failed Deployment
echo -e "${YELLOW}Test 7: Record Failed Deployment${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: $DEPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "dev",
        "status": "failed",
        "commit": "fail123fail456",
        "workflowRun": "9876543213"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✓ Failed deployment recorded${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Failed to record failed deployment (HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 8: Test Authentication (Invalid Token)
echo -e "${YELLOW}Test 8: Test Authentication (should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: invalid-token" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "dev",
        "status": "success",
        "commit": "test",
        "workflowRun": "test"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 401 ]; then
    echo -e "${GREEN}✓ Authentication properly rejected invalid token${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Authentication test failed (expected 401, got HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Test 9: Test Invalid Environment
echo -e "${YELLOW}Test 9: Test Invalid Environment (should fail)${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/deployments/record" \
    -H "X-DEPLOY-TOKEN: $DEPLOY_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "environment": "invalid",
        "status": "success",
        "commit": "test",
        "workflowRun": "test"
    }')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 400 ]; then
    echo -e "${GREEN}✓ Invalid environment properly rejected${NC}"
    echo "$BODY" | jq '.'
else
    echo -e "${RED}✗ Validation test failed (expected 400, got HTTP $HTTP_CODE)${NC}"
    echo "$BODY"
    exit 1
fi
echo ""

# Summary
echo "========================================="
echo -e "${GREEN}All tests passed! ✓${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Open admin dashboard: $API_URL/admin"
echo "2. View deployment status panel"
echo "3. Test GitHub Actions workflow"
echo ""
