#!/bin/bash

# FineGuard Azure Deployment Integration Script
# This script helps you integrate Azure deployment with your existing code

echo "🚀 FineGuard Azure Integration Helper"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will integrate Azure Static Web Apps deployment${NC}"
echo -e "${BLUE}with your existing FineGuard frontend code.${NC}"
echo ""

# Check if we're on the server with the code
if [ -d "/home/ubuntu/compliance-guard" ]; then
    FRONTEND_PATH="/home/ubuntu/compliance-guard"
    echo -e "${GREEN}✓ Found FineGuard frontend at: $FRONTEND_PATH${NC}"
else
    echo -e "${YELLOW}⚠ Running outside the server${NC}"
    echo "Please run this script on your server where FineGuard is located."
    echo ""
    read -p "Enter path to your FineGuard frontend: " FRONTEND_PATH

    if [ ! -d "$FRONTEND_PATH" ]; then
        echo -e "${RED}✗ Directory not found: $FRONTEND_PATH${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}Step 1: Backing up current code${NC}"
echo "-----------------------------------"
BACKUP_PATH="${FRONTEND_PATH}_backup_$(date +%Y%m%d_%H%M%S)"
cp -r "$FRONTEND_PATH" "$BACKUP_PATH"
echo -e "${GREEN}✓ Backup created at: $BACKUP_PATH${NC}"

echo ""
echo -e "${BLUE}Step 2: Navigating to frontend directory${NC}"
echo "-----------------------------------"
cd "$FRONTEND_PATH"
echo -e "${GREEN}✓ Current directory: $(pwd)${NC}"

echo ""
echo -e "${BLUE}Step 3: Adding Azure deployment remote${NC}"
echo "-----------------------------------"
if git remote get-url azure-deploy > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ azure-deploy remote already exists${NC}"
    git remote remove azure-deploy
fi

git remote add azure-deploy https://github.com/allin50-cmd/manus-frontend.git
echo -e "${GREEN}✓ Added azure-deploy remote${NC}"

echo ""
echo -e "${BLUE}Step 4: Fetching Azure deployment branch${NC}"
echo "-----------------------------------"
git fetch azure-deploy claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f
echo -e "${GREEN}✓ Fetched Azure deployment branch${NC}"

echo ""
echo -e "${BLUE}Step 5: Creating integration branch${NC}"
echo "-----------------------------------"
git checkout -b azure-integration
echo -e "${GREEN}✓ Created azure-integration branch${NC}"

echo ""
echo -e "${BLUE}Step 6: Merging Azure deployment files${NC}"
echo "-----------------------------------"
echo "This will add the following files to your project:"
echo "  - deploy-azure.sh (Azure deployment script)"
echo "  - check-azure-prereqs.sh (Prerequisites checker)"
echo "  - .github/workflows/azure-static-web-apps-ci-cd.yml (GitHub Actions)"
echo "  - staticwebapp.config.json (Azure configuration)"
echo "  - AZURE-DEPLOYMENT-GUIDE.md (Documentation)"
echo "  - MIGRATION-GUIDE.md (Migration guide)"
echo ""
read -p "Continue with merge? [Y/n]: " CONFIRM
if [[ $CONFIRM =~ ^[Nn]$ ]]; then
    echo -e "${RED}Merge cancelled${NC}"
    exit 0
fi

git merge azure-deploy/claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f \
    --allow-unrelated-histories \
    -m "Integrate Azure Static Web Apps deployment automation"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Azure deployment files merged successfully!${NC}"
else
    echo -e "${RED}✗ Merge conflicts detected${NC}"
    echo "Please resolve conflicts manually and run: git commit"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 7: Verifying integration${NC}"
echo "-----------------------------------"
echo "Checking for Azure deployment files..."

FILES_TO_CHECK=(
    "deploy-azure.sh"
    "check-azure-prereqs.sh"
    ".github/workflows/azure-static-web-apps-ci-cd.yml"
    "staticwebapp.config.json"
    "package.json"
)

ALL_PRESENT=true
for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓ $file${NC}"
    else
        echo -e "${RED}✗ $file (missing)${NC}"
        ALL_PRESENT=false
    fi
done

if [ "$ALL_PRESENT" = true ]; then
    echo ""
    echo -e "${GREEN}🎉 Integration successful!${NC}"
else
    echo ""
    echo -e "${YELLOW}⚠ Some files are missing, but you can continue${NC}"
fi

echo ""
echo -e "${BLUE}Step 8: Making scripts executable${NC}"
echo "-----------------------------------"
chmod +x deploy-azure.sh check-azure-prereqs.sh
echo -e "${GREEN}✓ Scripts are now executable${NC}"

echo ""
echo -e "${GREEN}======================================"
echo "✅ Integration Complete!"
echo "======================================${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Review the integrated files:"
echo -e "   ${YELLOW}ls -la${NC}"
echo ""
echo "2. Check prerequisites:"
echo -e "   ${YELLOW}./check-azure-prereqs.sh${NC}"
echo ""
echo "3. Deploy to Azure:"
echo -e "   ${YELLOW}./deploy-azure.sh${NC}"
echo ""
echo "4. Or push to GitHub first:"
echo -e "   ${YELLOW}git checkout -b main${NC}"
echo -e "   ${YELLOW}git push -u origin main${NC}"
echo ""
echo "Your original code is backed up at:"
echo -e "   ${BLUE}$BACKUP_PATH${NC}"
echo ""
echo "See AZURE-DEPLOYMENT-GUIDE.md for detailed instructions."
