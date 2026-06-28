#!/bin/bash

##############################################################################
# Azure Deployment Prerequisites Checker
#
# This script checks if all required tools and configurations are in place
# before running the Azure deployment script.
#
# Usage: ./check-azure-prereqs.sh
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_install_instructions() {
    local tool=$1
    echo ""
    case $tool in
        "azure-cli")
            echo "Install Azure CLI:"
            echo "  macOS:   brew install azure-cli"
            echo "  Windows: winget install Microsoft.AzureCLI"
            echo "  Linux:   curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash"
            echo "  Docs:    https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
            ;;
        "gh")
            echo "Install GitHub CLI:"
            echo "  macOS:   brew install gh"
            echo "  Windows: winget install GitHub.cli"
            echo "  Linux:   sudo apt install gh"
            echo "  Docs:    https://cli.github.com/"
            ;;
        "node")
            echo "Install Node.js:"
            echo "  macOS:   brew install node"
            echo "  Windows: winget install OpenJS.NodeJS"
            echo "  Linux:   sudo apt install nodejs npm"
            echo "  Docs:    https://nodejs.org/"
            ;;
        "git")
            echo "Install Git:"
            echo "  macOS:   brew install git"
            echo "  Windows: winget install Git.Git"
            echo "  Linux:   sudo apt install git"
            echo "  Docs:    https://git-scm.com/"
            ;;
    esac
    echo ""
}

# Track overall status
all_checks_passed=true

print_header "Azure Deployment Prerequisites Check"

##############################################################################
# System Tools
##############################################################################

print_info "Checking system tools..."
echo ""

# Check Azure CLI
if command -v az &> /dev/null; then
    AZ_VERSION=$(az version --query '"azure-cli"' -o tsv)
    print_success "Azure CLI installed (version: $AZ_VERSION)"
else
    print_error "Azure CLI not installed"
    print_install_instructions "azure-cli"
    all_checks_passed=false
fi

# Check GitHub CLI
if command -v gh &> /dev/null; then
    GH_VERSION=$(gh --version | head -n 1 | awk '{print $3}')
    print_success "GitHub CLI installed (version: $GH_VERSION)"
else
    print_error "GitHub CLI not installed"
    print_install_instructions "gh"
    all_checks_passed=false
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed ($NODE_VERSION)"

    # Check if version is recent enough (v16+)
    NODE_MAJOR=$(node --version | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version should be 16 or higher (current: $NODE_VERSION)"
    fi
else
    print_error "Node.js not installed"
    print_install_instructions "node"
    all_checks_passed=false
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed (version: $NPM_VERSION)"
else
    print_error "npm not installed"
    all_checks_passed=false
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | awk '{print $3}')
    print_success "Git installed (version: $GIT_VERSION)"
else
    print_error "Git not installed"
    print_install_instructions "git"
    all_checks_passed=false
fi

##############################################################################
# Authentication Status
##############################################################################

print_header "Authentication Status"

# Check Azure login
if az account show &> /dev/null; then
    AZURE_ACCOUNT=$(az account show --query name -o tsv)
    AZURE_USER=$(az account show --query user.name -o tsv)
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)
    print_success "Logged in to Azure"
    echo "  Account:      $AZURE_ACCOUNT"
    echo "  User:         $AZURE_USER"
    echo "  Subscription: $SUBSCRIPTION_ID"
else
    print_error "Not logged in to Azure"
    echo ""
    echo "To log in, run:"
    echo "  ${YELLOW}az login${NC}"
    echo ""
    all_checks_passed=false
fi

# Check GitHub authentication
if gh auth status &> /dev/null 2>&1; then
    GH_USER=$(gh api user -q .login 2>/dev/null || echo "unknown")
    print_success "Authenticated with GitHub (user: $GH_USER)"
else
    print_error "Not authenticated with GitHub"
    echo ""
    echo "To authenticate, run:"
    echo "  ${YELLOW}gh auth login${NC}"
    echo ""
    all_checks_passed=false
fi

##############################################################################
# Repository Status
##############################################################################

print_header "Repository Status"

# Check if in a git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_success "Current directory is a Git repository"

    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo "  Current branch: $CURRENT_BRANCH"

    # Check for remote
    if git remote -v | grep -q .; then
        print_success "Git remote configured"
        REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "No origin remote")
        echo "  Origin: $REMOTE_URL"

        # Check if remote is GitHub
        if [[ $REMOTE_URL == *"github.com"* ]]; then
            print_success "Remote is a GitHub repository"
        else
            print_warning "Remote is not a GitHub repository"
            echo "  Azure Static Web Apps requires a GitHub repository"
        fi
    else
        print_warning "No git remote configured"
        echo "  You'll need to push your code to GitHub before deployment"
        echo ""
        echo "To add a remote, run:"
        echo "  ${YELLOW}git remote add origin https://github.com/USERNAME/REPO.git${NC}"
        echo ""
    fi

    # Check for uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        print_success "No uncommitted changes"
    else
        print_warning "You have uncommitted changes"
        echo "  Consider committing before deployment"
    fi

else
    print_error "Current directory is not a Git repository"
    echo ""
    echo "To initialize a repository, run:"
    echo "  ${YELLOW}git init${NC}"
    echo "  ${YELLOW}git add .${NC}"
    echo "  ${YELLOW}git commit -m 'Initial commit'${NC}"
    echo ""
    all_checks_passed=false
fi

##############################################################################
# Project Files
##############################################################################

print_header "Project Files Check"

# Check for package.json
if [ -f "package.json" ]; then
    print_success "package.json found"

    # Check for required scripts
    if grep -q '"build"' package.json; then
        print_success "Build script found in package.json"
    else
        print_warning "No build script found in package.json"
        echo "  Add a build script to package.json"
    fi
else
    print_warning "package.json not found"
    echo "  Make sure you're in the root of your React project"
fi

# Check for common build output directories
if [ -d "dist" ] || [ -d "build" ]; then
    print_info "Build output directory detected"
else
    print_info "No build directory found (will be created on first build)"
fi

##############################################################################
# Azure Permissions
##############################################################################

print_header "Azure Permissions Check"

if az account show &> /dev/null; then
    # Check if user can create resource groups
    print_info "Checking Azure permissions..."

    # Get subscription ID
    SUBSCRIPTION_ID=$(az account show --query id -o tsv)

    # Check role assignments
    ROLE=$(az role assignment list --assignee "$(az account show --query user.name -o tsv)" \
        --query "[?scope=='/subscriptions/$SUBSCRIPTION_ID'].roleDefinitionName" -o tsv 2>/dev/null | head -n 1)

    if [ -n "$ROLE" ]; then
        print_success "Azure role: $ROLE"

        if [[ "$ROLE" == *"Owner"* ]] || [[ "$ROLE" == *"Contributor"* ]]; then
            print_success "Sufficient permissions for deployment"
        else
            print_warning "You may not have sufficient permissions"
            echo "  Required: Owner or Contributor role"
        fi
    else
        print_info "Could not determine Azure role"
    fi
fi

##############################################################################
# Summary
##############################################################################

print_header "Summary"

if [ "$all_checks_passed" = true ]; then
    print_success "All prerequisite checks passed!"
    echo ""
    echo "You're ready to run the deployment script:"
    echo "  ${GREEN}./deploy-azure.sh${NC}"
    echo ""
    exit 0
else
    print_error "Some prerequisite checks failed"
    echo ""
    echo "Please address the issues above before running the deployment script."
    echo ""
    echo "Quick start guide:"
    echo "  1. Install missing tools (see instructions above)"
    echo "  2. Authenticate with Azure: ${YELLOW}az login${NC}"
    echo "  3. Authenticate with GitHub: ${YELLOW}gh auth login${NC}"
    echo "  4. Set up your Git repository and push to GitHub"
    echo "  5. Run this script again to verify"
    echo ""
    exit 1
fi
