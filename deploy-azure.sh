#!/bin/bash

##############################################################################
# Azure Static Web Apps Deployment Script for FineGuard
#
# This script automates the deployment of a React/Vite application to Azure
# Static Web Apps with GitHub Actions integration.
#
# Prerequisites:
#   - Azure CLI installed and configured
#   - GitHub CLI (gh) installed and authenticated
#   - Node.js and npm installed
#   - Git repository initialized with remote
#
# Usage: ./deploy-azure.sh
##############################################################################

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="FineGuard"
DEFAULT_RESOURCE_GROUP="fineguard-rg"
DEFAULT_LOCATION="uksouth"  # UK South (London)
DEFAULT_SKU="Free"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

##############################################################################
# Pre-flight Checks
##############################################################################

check_prerequisites() {
    print_header "Running Pre-flight Checks"

    local all_checks_passed=true

    # Check Azure CLI
    if command -v az &> /dev/null; then
        print_success "Azure CLI is installed ($(az version --query '"azure-cli"' -o tsv))"
    else
        print_error "Azure CLI is not installed"
        echo "  Install from: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        all_checks_passed=false
    fi

    # Check GitHub CLI
    if command -v gh &> /dev/null; then
        print_success "GitHub CLI is installed ($(gh --version | head -n 1))"
    else
        print_error "GitHub CLI is not installed"
        echo "  Install from: https://cli.github.com/"
        all_checks_passed=false
    fi

    # Check Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js is installed ($(node --version))"
    else
        print_error "Node.js is not installed"
        echo "  Install from: https://nodejs.org/"
        all_checks_passed=false
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        print_success "npm is installed ($(npm --version))"
    else
        print_error "npm is not installed"
        all_checks_passed=false
    fi

    # Check Git
    if command -v git &> /dev/null; then
        print_success "Git is installed ($(git --version))"
    else
        print_error "Git is not installed"
        all_checks_passed=false
    fi

    # Check if in a git repository
    if git rev-parse --git-dir > /dev/null 2>&1; then
        print_success "Current directory is a Git repository"
    else
        print_error "Current directory is not a Git repository"
        all_checks_passed=false
    fi

    # Check Azure login status
    if az account show &> /dev/null; then
        AZURE_ACCOUNT=$(az account show --query name -o tsv)
        print_success "Logged in to Azure account: $AZURE_ACCOUNT"
    else
        print_error "Not logged in to Azure"
        echo "  Run: az login"
        all_checks_passed=false
    fi

    # Check GitHub authentication
    if gh auth status &> /dev/null; then
        print_success "Authenticated with GitHub"
    else
        print_error "Not authenticated with GitHub"
        echo "  Run: gh auth login"
        all_checks_passed=false
    fi

    if [ "$all_checks_passed" = false ]; then
        print_error "\nSome prerequisites are missing. Please install them and try again."
        exit 1
    fi

    print_success "\nAll prerequisites satisfied!"
}

##############################################################################
# Configuration Collection
##############################################################################

collect_configuration() {
    print_header "Deployment Configuration"

    # Get resource group name
    read -p "Resource Group name [${DEFAULT_RESOURCE_GROUP}]: " RESOURCE_GROUP
    RESOURCE_GROUP=${RESOURCE_GROUP:-$DEFAULT_RESOURCE_GROUP}
    print_info "Resource Group: ${RESOURCE_GROUP}"

    # Get location
    echo -e "\nAvailable UK regions:"
    echo "  1. uksouth (London) - Recommended"
    echo "  2. ukwest (Cardiff)"
    read -p "Select region [1]: " REGION_CHOICE
    REGION_CHOICE=${REGION_CHOICE:-1}

    case $REGION_CHOICE in
        1) LOCATION="uksouth" ;;
        2) LOCATION="ukwest" ;;
        *) LOCATION="uksouth" ;;
    esac
    print_info "Location: ${LOCATION}"

    # Get Static Web App name
    read -p "Static Web App name [${APP_NAME,,}]: " SWA_NAME
    SWA_NAME=${SWA_NAME:-${APP_NAME,,}}
    print_info "Static Web App: ${SWA_NAME}"

    # Get SKU
    echo -e "\nAvailable SKUs:"
    echo "  1. Free (0 custom domains, 100GB bandwidth/month)"
    echo "  2. Standard (2 custom domains, 100GB bandwidth/month + $9/100GB)"
    read -p "Select SKU [1]: " SKU_CHOICE
    SKU_CHOICE=${SKU_CHOICE:-1}

    case $SKU_CHOICE in
        1) SKU="Free" ;;
        2) SKU="Standard" ;;
        *) SKU="Free" ;;
    esac
    print_info "SKU: ${SKU}"

    # Get GitHub repository info
    GH_REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || echo "")
    if [ -z "$GH_REPO" ]; then
        print_warning "Could not detect GitHub repository"
        read -p "GitHub repository (owner/repo): " GH_REPO
    else
        print_info "Detected GitHub repository: ${GH_REPO}"
        read -p "Use this repository? [Y/n]: " CONFIRM_REPO
        if [[ $CONFIRM_REPO =~ ^[Nn]$ ]]; then
            read -p "GitHub repository (owner/repo): " GH_REPO
        fi
    fi

    # Get branch
    DEFAULT_BRANCH=$(git branch --show-current 2>/dev/null || echo "main")
    read -p "Branch to deploy [${DEFAULT_BRANCH}]: " BRANCH
    BRANCH=${BRANCH:-$DEFAULT_BRANCH}
    print_info "Branch: ${BRANCH}"

    # Build configuration
    read -p "App location (source code path) [/]: " APP_LOCATION
    APP_LOCATION=${APP_LOCATION:-/}

    read -p "Output location (build output folder) [dist]: " OUTPUT_LOCATION
    OUTPUT_LOCATION=${OUTPUT_LOCATION:-dist}

    # Confirm configuration
    print_header "Configuration Summary"
    echo "Resource Group:     ${RESOURCE_GROUP}"
    echo "Location:           ${LOCATION}"
    echo "Static Web App:     ${SWA_NAME}"
    echo "SKU:                ${SKU}"
    echo "GitHub Repo:        ${GH_REPO}"
    echo "Branch:             ${BRANCH}"
    echo "App Location:       ${APP_LOCATION}"
    echo "Output Location:    ${OUTPUT_LOCATION}"
    echo ""

    read -p "Proceed with deployment? [Y/n]: " CONFIRM
    if [[ $CONFIRM =~ ^[Nn]$ ]]; then
        print_error "Deployment cancelled by user"
        exit 0
    fi
}

##############################################################################
# Azure Resource Creation
##############################################################################

create_azure_resources() {
    print_header "Creating Azure Resources"

    # Create resource group
    print_info "Creating resource group: ${RESOURCE_GROUP}..."
    if az group create \
        --name "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --output none; then
        print_success "Resource group created"
    else
        print_warning "Resource group may already exist"
    fi

    # Create Static Web App
    print_info "Creating Static Web App: ${SWA_NAME}..."
    print_info "This may take a few minutes..."

    az staticwebapp create \
        --name "${SWA_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --location "${LOCATION}" \
        --source "https://github.com/${GH_REPO}" \
        --branch "${BRANCH}" \
        --app-location "${APP_LOCATION}" \
        --output-location "${OUTPUT_LOCATION}" \
        --login-with-github \
        --sku "${SKU}" \
        --output none

    print_success "Static Web App created successfully"

    # Get deployment token
    print_info "Retrieving deployment token..."
    DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
        --name "${SWA_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query "properties.apiKey" \
        --output tsv)

    if [ -z "$DEPLOYMENT_TOKEN" ]; then
        print_error "Failed to retrieve deployment token"
        exit 1
    fi

    print_success "Deployment token retrieved"
}

##############################################################################
# GitHub Actions Setup
##############################################################################

setup_github_actions() {
    print_header "Setting up GitHub Actions"

    # Create workflow directory
    mkdir -p .github/workflows

    # Create workflow file
    print_info "Creating GitHub Actions workflow..."
    cat > .github/workflows/azure-static-web-apps.yml <<EOF
name: Azure Static Web Apps CI/CD

on:
  push:
    branches:
      - ${BRANCH}
  pull_request:
    types: [opened, synchronize, reopened, closed]
    branches:
      - ${BRANCH}

jobs:
  build_and_deploy_job:
    if: github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')
    runs-on: ubuntu-latest
    name: Build and Deploy Job
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true
          lfs: false

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build
        env:
          CI: true

      - name: Deploy to Azure Static Web Apps
        id: builddeploy
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: \${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          repo_token: \${{ secrets.GITHUB_TOKEN }}
          action: "upload"
          app_location: "${APP_LOCATION}"
          output_location: "${OUTPUT_LOCATION}"

  close_pull_request_job:
    if: github.event_name == 'pull_request' && github.event.action == 'closed'
    runs-on: ubuntu-latest
    name: Close Pull Request Job
    steps:
      - name: Close Pull Request
        id: closepullrequest
        uses: Azure/static-web-apps-deploy@v1
        with:
          azure_static_web_apps_api_token: \${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}
          action: "close"
EOF

    print_success "GitHub Actions workflow created"

    # Add secret to GitHub
    print_info "Adding deployment token to GitHub secrets..."
    echo "${DEPLOYMENT_TOKEN}" | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN

    print_success "GitHub secret configured"
}

##############################################################################
# Azure Configuration
##############################################################################

create_azure_config() {
    print_header "Creating Azure Configuration"

    # Create staticwebapp.config.json
    print_info "Creating staticwebapp.config.json..."
    cat > staticwebapp.config.json <<EOF
{
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/assets/*", "*.{css,scss,js,png,gif,ico,jpg,svg,woff,woff2,ttf,eot}"]
  },
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["authenticated"]
    }
  ],
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "content-security-policy": "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".js": "text/javascript",
    ".css": "text/css"
  }
}
EOF

    print_success "Azure configuration file created"
}

##############################################################################
# Deployment Completion
##############################################################################

complete_deployment() {
    print_header "Deployment Complete!"

    # Get the app URL
    APP_URL=$(az staticwebapp show \
        --name "${SWA_NAME}" \
        --resource-group "${RESOURCE_GROUP}" \
        --query "defaultHostname" \
        --output tsv)

    print_success "Your application is deployed!"
    echo ""
    echo -e "${GREEN}Application URL:${NC} https://${APP_URL}"
    echo ""

    print_header "Next Steps"
    echo "1. Commit and push the GitHub Actions workflow:"
    echo "   ${YELLOW}git add .github/workflows/azure-static-web-apps.yml staticwebapp.config.json${NC}"
    echo "   ${YELLOW}git commit -m 'Add Azure Static Web Apps deployment'${NC}"
    echo "   ${YELLOW}git push origin ${BRANCH}${NC}"
    echo ""
    echo "2. Monitor the deployment:"
    echo "   ${YELLOW}gh run watch${NC}"
    echo ""
    echo "3. View your site:"
    echo "   ${YELLOW}open https://${APP_URL}${NC}"
    echo ""
    echo "4. Manage your deployment:"
    echo "   ${YELLOW}az staticwebapp show --name ${SWA_NAME} --resource-group ${RESOURCE_GROUP}${NC}"
    echo ""

    print_info "GitHub Actions will now automatically deploy on every push to ${BRANCH}"

    # Save configuration
    cat > .azure-deployment-config <<EOF
RESOURCE_GROUP=${RESOURCE_GROUP}
SWA_NAME=${SWA_NAME}
LOCATION=${LOCATION}
APP_URL=https://${APP_URL}
BRANCH=${BRANCH}
EOF

    print_success "Configuration saved to .azure-deployment-config"
}

##############################################################################
# Main Execution
##############################################################################

main() {
    print_header "Azure Static Web Apps Deployment - ${APP_NAME}"

    check_prerequisites
    collect_configuration
    create_azure_resources
    setup_github_actions
    create_azure_config
    complete_deployment
}

# Run main function
main
