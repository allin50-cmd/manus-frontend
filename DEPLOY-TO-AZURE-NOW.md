# Deploy FineGuard to Azure Static Web Apps - Quick Start

This guide will help you deploy your FineGuard application from `/home/ubuntu/compliance-guard` to Azure Static Web Apps.

## Prerequisites Installation

### Step 1: Install Azure CLI

```bash
# On your Ubuntu server
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Verify installation
az version
```

### Step 2: Install GitHub CLI

```bash
# On your Ubuntu server
type -p curl >/dev/null || (sudo apt update && sudo apt install curl -y)
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg \
&& sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg \
&& echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
&& sudo apt update \
&& sudo apt install gh -y

# Verify installation
gh --version
```

---

## Step-by-Step Deployment

### Step 1: Integrate Azure Deployment Files

```bash
# SSH to your server
ssh ubuntu@your-server

# Navigate to your FineGuard frontend
cd /home/ubuntu/compliance-guard

# Create backup first (safety!)
sudo cp -r /home/ubuntu/compliance-guard /home/ubuntu/compliance-guard-backup-$(date +%Y%m%d)

# Add Azure deployment repository as remote
git remote add azure-deploy https://github.com/allin50-cmd/manus-frontend.git

# Fetch the Azure deployment branch
git fetch azure-deploy claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f

# Create a new branch for Azure deployment
git checkout -b azure-deployment

# Merge Azure deployment files with your existing code
git merge azure-deploy/claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f \
    --allow-unrelated-histories \
    -m "Add Azure Static Web Apps deployment automation"

# Make scripts executable
chmod +x deploy-azure.sh check-azure-prereqs.sh integrate-azure.sh
```

**What this does:**
- ✅ Backs up your existing code
- ✅ Adds Azure deployment scripts to your FineGuard code
- ✅ Keeps all your existing files intact
- ✅ Adds: deploy-azure.sh, GitHub Actions, Azure config

---

### Step 2: Verify Integration

```bash
# Check that everything is present
ls -la

# You should see:
# - Your existing files (src/, package.json, vite.config.js, etc.)
# - NEW: deploy-azure.sh
# - NEW: check-azure-prereqs.sh
# - NEW: integrate-azure.sh
# - NEW: staticwebapp.config.json
# - NEW: .github/workflows/azure-static-web-apps-ci-cd.yml
# - NEW: AZURE-DEPLOYMENT-GUIDE.md
# - NEW: MIGRATION-GUIDE.md

# Verify your package.json is still there
cat package.json
```

---

### Step 3: Authenticate with Azure

```bash
# Login to Azure (opens browser)
az login

# If browser doesn't open, use device code flow
az login --use-device-code

# Verify login
az account show
```

**You'll see:**
```json
{
  "name": "Your Subscription Name",
  "user": {
    "name": "your.email@example.com"
  }
}
```

---

### Step 4: Authenticate with GitHub

```bash
# Login to GitHub
gh auth login

# Follow the prompts:
# 1. Choose "GitHub.com"
# 2. Choose "HTTPS"
# 3. Authenticate via web browser
# 4. Complete authentication in browser

# Verify authentication
gh auth status
```

---

### Step 5: Push Your Code to GitHub

Before deploying to Azure, we need your code on GitHub:

```bash
# Make sure you're in your FineGuard directory
cd /home/ubuntu/compliance-guard

# Check git status
git status

# Add all files
git add .

# Commit
git commit -m "Prepare FineGuard for Azure Static Web Apps deployment"

# Create main branch if it doesn't exist
git branch -M main

# Ensure origin remote points to GitHub
git remote get-url origin || git remote add origin https://github.com/allin50-cmd/manus-frontend.git

# Push to GitHub
git push -u origin main

# If prompted for credentials, use your Personal Access Token as password
```

**Note:** If you need a GitHub Personal Access Token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `workflow`
4. Copy the token and use it as your password

---

### Step 6: Run Prerequisites Check

```bash
# Verify everything is ready
./check-azure-prereqs.sh
```

**Expected output:**
```
✓ Azure CLI installed
✓ GitHub CLI installed
✓ Node.js installed
✓ npm installed
✓ Git installed
✓ Logged in to Azure
✓ Authenticated with GitHub
✓ Current directory is a Git repository
✓ Git remote configured
✓ package.json found
✓ Build script found in package.json

✓ All prerequisite checks passed!

You're ready to run the deployment script:
  ./deploy-azure.sh
```

**If any checks fail:** Follow the instructions provided by the script to fix them.

---

### Step 7: Deploy to Azure! 🚀

```bash
# Run the deployment script
./deploy-azure.sh
```

**The script will ask you questions. Here are the recommended answers:**

#### Question 1: Resource Group name
```
Resource Group name [fineguard-rg]:
```
**Answer:** Press **Enter** (uses default `fineguard-rg`)

---

#### Question 2: Azure Region
```
Available UK regions:
  1. uksouth (London) - Recommended
  2. ukwest (Cardiff)
Select region [1]:
```
**Answer:** Press **Enter** (uses UK South/London)

---

#### Question 3: Static Web App name
```
Static Web App name [fineguard]:
```
**Answer:** Press **Enter** (uses default `fineguard`)

Or enter a custom name like: `fineguard-prod`

---

#### Question 4: Pricing Tier
```
Available SKUs:
  1. Free (0 custom domains, 100GB bandwidth/month)
  2. Standard (2 custom domains, 100GB bandwidth/month + $9/100GB)
Select SKU [1]:
```
**Answer:** Press **Enter** (uses Free tier)

**Note:** You can upgrade to Standard later if you need:
- Custom domain (like zhoqgoan.manus.space)
- More than 100GB bandwidth

---

#### Question 5: GitHub Repository
```
Detected GitHub repository: allin50-cmd/manus-frontend
Use this repository? [Y/n]:
```
**Answer:** Press **Enter** (Yes)

---

#### Question 6: Branch
```
Branch to deploy [main]:
```
**Answer:** Press **Enter** (uses main branch)

---

#### Question 7: App Location
```
App location (source code path) [/]:
```
**Answer:** Press **Enter** (root directory)

---

#### Question 8: Output Location
```
Output location (build output folder) [dist]:
```
**Answer:** Press **Enter** (Vite outputs to `dist/`)

---

#### Question 9: Final Confirmation
```
Configuration Summary
Resource Group:     fineguard-rg
Location:           uksouth
Static Web App:     fineguard
SKU:                Free
GitHub Repo:        allin50-cmd/manus-frontend
Branch:             main
App Location:       /
Output Location:    dist

Proceed with deployment? [Y/n]:
```
**Answer:** Press **Enter** (Yes, proceed!)

---

### Step 8: Wait for Deployment

The script will now:

1. ✅ Create Azure Resource Group
2. ✅ Create Azure Static Web App
3. ✅ Configure GitHub Actions
4. ✅ Add deployment token to GitHub secrets
5. ✅ Create Azure configuration files

**Time:** 5-10 minutes

**You'll see output like:**
```
========================================
Creating Azure Resources
========================================

ℹ Creating resource group: fineguard-rg...
✓ Resource group created

ℹ Creating Static Web App: fineguard...
ℹ This may take a few minutes...
✓ Static Web App created successfully

ℹ Retrieving deployment token...
✓ Deployment token retrieved

========================================
Setting up GitHub Actions
========================================

ℹ Creating GitHub Actions workflow...
✓ GitHub Actions workflow created

ℹ Adding deployment token to GitHub secrets...
✓ GitHub secret configured
```

---

### Step 9: Deployment Complete! 🎉

When finished, you'll see:

```
========================================
Deployment Complete!
========================================

✓ Your application is deployed!

Application URL: https://fineguard-abc123xyz.azurestaticapps.net

========================================
Next Steps
========================================

1. Commit and push the GitHub Actions workflow:
   git add .github/workflows/azure-static-web-apps-ci-cd.yml staticwebapp.config.json
   git commit -m 'Add Azure Static Web Apps deployment'
   git push origin main

2. Monitor the deployment:
   gh run watch

3. View your site:
   open https://fineguard-abc123xyz.azurestaticapps.net
```

---

### Step 10: Push Workflow and Monitor

```bash
# Push the workflow files to GitHub
git add .github/workflows/azure-static-web-apps-ci-cd.yml staticwebapp.config.json
git commit -m "Add Azure Static Web Apps CI/CD workflow"
git push origin main

# Watch the GitHub Actions deployment
gh run watch

# Or view in browser
gh run list
gh run view --web
```

**GitHub Actions will:**
1. ✅ Install dependencies (`npm ci`)
2. ✅ Build your React app (`npm run build`)
3. ✅ Deploy to Azure Static Web Apps
4. ✅ Provide the live URL

**Time:** 2-5 minutes

---

### Step 11: Test Your Deployment! 🌐

```bash
# Get your deployment URL
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg \
  --query "defaultHostname" \
  --output tsv
```

**Open in browser:**
```
https://fineguard-[random].azurestaticapps.net
```

**Test your 9 working pages:**
1. Home - https://fineguard-[random].azurestaticapps.net/
2. Dashboard - https://fineguard-[random].azurestaticapps.net/dashboard
3. Admin - https://fineguard-[random].azurestaticapps.net/admin
4. Live Data - https://fineguard-[random].azurestaticapps.net/live-data
5. Vault - https://fineguard-[random].azurestaticapps.net/vault
6. Accounting Services - https://fineguard-[random].azurestaticapps.net/accounting-services
7. CRM - https://fineguard-[random].azurestaticapps.net/crm
8. Clients - https://fineguard-[random].azurestaticapps.net/clients
9. Documents - https://fineguard-[random].azurestaticapps.net/documents

---

## What About the Backend?

Your FastAPI backend at `/home/ubuntu/fineguard-backend` needs separate deployment.

**Options:**

### Option 1: Keep Backend on Render (Recommended)
Deploy your backend to Render as originally planned:
```bash
cd /home/ubuntu/fineguard-backend
git push -u origin main
# Then deploy on Render: https://render.com/new
```

Then update Azure Static Web Apps environment variable:
```bash
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_URL=https://manus-backend.onrender.com"
```

### Option 2: Use Azure Functions
Convert your FastAPI backend to Azure Functions (more complex, but integrated).

**For now, I recommend Option 1** (Backend on Render, Frontend on Azure).

---

## Troubleshooting

### Issue: "Azure CLI not installed"
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

### Issue: "Not logged in to Azure"
```bash
az login
```

### Issue: "GitHub authentication failed"
```bash
gh auth login
```

### Issue: "Build failed" in GitHub Actions
```bash
# Check the logs
gh run view --log

# Common fix: ensure package.json has build script
cat package.json | grep "build"
```

### Issue: "Cannot push to GitHub"
Make sure you're using a Personal Access Token as your password, not your GitHub password.

Get token here: https://github.com/settings/tokens

### Issue: "Merge conflicts"
```bash
# If you get conflicts during merge, resolve them:
git status  # See conflicting files
# Edit files to resolve conflicts
git add .
git commit -m "Resolve merge conflicts"
```

---

## Post-Deployment

### View Deployment Status
```bash
# Get app details
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg

# View GitHub Actions runs
gh run list

# Watch specific run
gh run watch
```

### Update Environment Variables
```bash
# Add backend URL
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_URL=https://your-backend-url.com"
```

### View Logs
```bash
# GitHub Actions logs
gh run view --log

# Azure logs
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg \
  --query "defaultHostname"
```

---

## Summary - What You'll Have

After completing these steps:

✅ **FineGuard frontend deployed to Azure Static Web Apps**
- URL: https://fineguard-[random].azurestaticapps.net
- Automatic deployments on every git push
- Free SSL certificate
- Global CDN
- 100GB bandwidth/month (Free tier)

✅ **Automatic CI/CD via GitHub Actions**
- Every push to main branch triggers deployment
- Build and deploy in 2-5 minutes
- View deployment status: `gh run watch`

✅ **9 working pages live**
- Home, Dashboard, Admin, Live Data, Vault, Accounting, CRM, Clients, Documents

⏳ **Backend still needs deployment**
- Deploy to Render separately
- Or migrate to Azure Functions later

---

## Quick Command Reference

```bash
# Check deployment status
az staticwebapp show --name fineguard --resource-group fineguard-rg

# View GitHub Actions
gh run list
gh run watch

# Update environment variables
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "KEY=value"

# View app URL
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg \
  --query "defaultHostname" \
  --output tsv

# Redeploy
git push origin main
gh run watch
```

---

## Need Help?

**Documentation:**
- AZURE-DEPLOYMENT-GUIDE.md - Comprehensive guide
- MIGRATION-GUIDE.md - Migration from Manus to Azure

**Support:**
- Azure Static Web Apps docs: https://docs.microsoft.com/azure/static-web-apps/
- GitHub Actions docs: https://docs.github.com/actions

---

## Ready to Deploy!

Run these commands on your server:

```bash
# 1. Navigate to FineGuard
cd /home/ubuntu/compliance-guard

# 2. Integrate Azure deployment
git remote add azure-deploy https://github.com/allin50-cmd/manus-frontend.git
git fetch azure-deploy claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f
git checkout -b azure-deployment
git merge azure-deploy/claude/azure-deployment-setup-011CUS62xT9EdoNE7BnFpG3f --allow-unrelated-histories
chmod +x *.sh

# 3. Install prerequisites
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
sudo apt install gh

# 4. Authenticate
az login
gh auth login

# 5. Push to GitHub
git branch -M main
git push -u origin main

# 6. Check prerequisites
./check-azure-prereqs.sh

# 7. Deploy to Azure!
./deploy-azure.sh
```

**Follow the prompts, press Enter for all defaults, and you're done!**

🚀 Good luck with your deployment!
