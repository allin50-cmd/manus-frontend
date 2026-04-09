#!/usr/bin/env bash
# =============================================================================
# FineGuard Pro — Deploy Config
# Edit this file, then run: bash scripts/run-deploy.sh
# =============================================================================

export LOCATION="uksouth"
export RG="fineguard-rg"
export APP_NAME="fineguard-pro"
export DB_SERVER="fineguard-db-001"        # lowercase, hyphens only, globally unique
export DB_NAME="fineguard"
export DB_ADMIN_USER="fgadmin"
export DB_ADMIN_PASS="FineGuard2026!"      # min 8 chars, upper+lower+digit+symbol

# Stripe — use sk_test_ keys for first deploy
# Get from: https://dashboard.stripe.com → Developers → API keys
export STRIPE_SECRET_KEY="sk_test_placeholder"
export STRIPE_WEBHOOK_SECRET="whsec_placeholder"
export STRIPE_PRICE_ACCOUNTS_FILING="price_placeholder"
export STRIPE_PRICE_CONFIRMATION_STATEMENT="price_placeholder"
export STRIPE_PRICE_STRIKE_OFF="price_placeholder"

# Companies House — free key from:
# https://developer.company-information.service.gov.uk/
export COMPANIES_HOUSE_API_KEY="placeholder"

# Admin dashboard login
export ADMIN_PASSWORD="Admin2026Secure!"
export ADMIN_SESSION_TOKEN="Session2026Token!"

# Run the deploy script
bash "$(dirname "$0")/deploy-azure.sh"
