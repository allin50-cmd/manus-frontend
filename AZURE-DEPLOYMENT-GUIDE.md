# Azure Static Web Apps Deployment Guide for FineGuard

This comprehensive guide will walk you through deploying your React/Vite application to Azure Static Web Apps, step-by-step.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Pre-Deployment Checks](#pre-deployment-checks)
- [Running the Deployment Script](#running-the-deployment-script)
- [Understanding the Prompts](#understanding-the-prompts)
- [Troubleshooting](#troubleshooting)
- [Post-Deployment](#post-deployment)
- [Managing Your Deployment](#managing-your-deployment)
- [FAQ](#faq)

---

## Overview

Azure Static Web Apps is a service that automatically builds and deploys full-stack web apps to Azure from a GitHub repository. This guide uses an automated deployment script that sets up everything for you.

**What the deployment includes:**
- Azure Static Web App resource
- GitHub Actions workflow for CI/CD
- SSL certificate (automatic HTTPS)
- Global CDN distribution
- Custom domain support (Standard tier)
- Preview environments for pull requests

---

## Prerequisites

### Required Tools

You need to install and configure these tools before deployment:

#### 1. **Azure CLI**

The Azure Command-Line Interface for managing Azure resources.

**Installation:**

```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux (Ubuntu/Debian)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**Verify installation:**
```bash
az version
```

**Official docs:** https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

#### 2. **GitHub CLI**

The GitHub command-line tool for managing repositories and Actions.

**Installation:**

```bash
# macOS
brew install gh

# Windows
winget install GitHub.cli

# Linux (Ubuntu/Debian)
sudo apt install gh
```

**Verify installation:**
```bash
gh --version
```

**Official docs:** https://cli.github.com/

#### 3. **Node.js and npm**

For building your React/Vite application.

**Installation:**

```bash
# macOS
brew install node

# Windows
winget install OpenJS.NodeJS

# Linux (Ubuntu/Debian)
sudo apt install nodejs npm
```

**Verify installation:**
```bash
node --version  # Should be v16 or higher
npm --version
```

**Official docs:** https://nodejs.org/

#### 4. **Git**

For version control and GitHub integration.

**Installation:**

```bash
# macOS
brew install git

# Windows
winget install Git.Git

# Linux (Ubuntu/Debian)
sudo apt install git
```

**Verify installation:**
```bash
git --version
```

**Official docs:** https://git-scm.com/

### Required Accounts

1. **Azure Account**
   - Sign up at https://azure.microsoft.com/free/
   - Free tier includes 100GB bandwidth/month for Static Web Apps

2. **GitHub Account**
   - Sign up at https://github.com/join
   - Your code must be in a GitHub repository

### Required Permissions

- **Azure:** Contributor or Owner role on your subscription
- **GitHub:** Admin access to your repository

---

## Pre-Deployment Checks

Before running the deployment script, use the prerequisite checker:

```bash
# Make the script executable
chmod +x check-azure-prereqs.sh

# Run the checker
./check-azure-prereqs.sh
```

This script will verify:
- All required tools are installed
- You're authenticated with Azure and GitHub
- Your project is a Git repository
- Your repository is connected to GitHub
- You have necessary permissions

**If all checks pass**, you'll see:
```
✓ All prerequisite checks passed!

You're ready to run the deployment script:
  ./deploy-azure.sh
```

**If checks fail**, the script will provide specific installation and configuration instructions.

### Authentication Setup

If you're not authenticated, follow these steps:

#### Authenticate with Azure

```bash
az login
```

This opens a browser window for you to sign in. After signing in, your terminal will show your subscriptions.

**Set default subscription (if you have multiple):**
```bash
az account list --output table
az account set --subscription "Your Subscription Name"
```

#### Authenticate with GitHub

```bash
gh auth login
```

Follow the interactive prompts:
1. Choose "GitHub.com"
2. Choose "HTTPS"
3. Authenticate via web browser
4. Authorize GitHub CLI

---

## Running the Deployment Script

### Step 1: Make the Script Executable

```bash
chmod +x deploy-azure.sh
```

### Step 2: Run the Script

```bash
./deploy-azure.sh
```

The script will run through several phases:
1. Pre-flight checks
2. Configuration collection
3. Azure resource creation
4. GitHub Actions setup
5. Configuration file creation
6. Deployment completion

---

## Understanding the Prompts

The deployment script will ask you several questions. Here's what to answer:

### 1. Resource Group Name

```
Resource Group name [fineguard-rg]:
```

**What it is:** A logical container for your Azure resources.

**Recommendation:** Press Enter to use the default `fineguard-rg`, or enter a custom name.

**Example:** `fineguard-production-rg`

---

### 2. Azure Region

```
Available UK regions:
  1. uksouth (London) - Recommended
  2. ukwest (Cardiff)
Select region [1]:
```

**What it is:** The physical data center location for your app.

**Recommendation:** Press Enter for UK South (London) for best performance and data residency.

**Note:** Free tier is available in all regions.

---

### 3. Static Web App Name

```
Static Web App name [fineguard]:
```

**What it is:** The name of your Azure Static Web App resource.

**Recommendation:** Use lowercase letters, numbers, and hyphens only.

**Example:** `fineguard-prod`

**Note:** This will be part of your default URL: `https://[name]-[random].azurestaticapps.net`

---

### 4. SKU (Pricing Tier)

```
Available SKUs:
  1. Free (0 custom domains, 100GB bandwidth/month)
  2. Standard (2 custom domains, 100GB bandwidth/month + $9/100GB)
Select SKU [1]:
```

**What it is:** The pricing tier for your Static Web App.

**Recommendation for beginners:** Press Enter to select Free tier.

**When to use Standard:**
- You need a custom domain (e.g., www.yourcompany.com)
- You expect >100GB traffic/month
- You need private endpoints

---

### 5. GitHub Repository

```
Detected GitHub repository: yourusername/fineguard
Use this repository? [Y/n]:
```

**What it is:** The GitHub repository for your code.

**Recommendation:** Press Enter to use the detected repository.

**If detection fails:** Enter your repository in the format `owner/repo-name`

---

### 6. Branch to Deploy

```
Branch to deploy [main]:
```

**What it is:** The Git branch that will trigger automatic deployments.

**Recommendation:** Press Enter to use your current branch (usually `main` or `master`).

**Note:** Every push to this branch will trigger a new deployment.

---

### 7. App Location

```
App location (source code path) [/]:
```

**What it is:** The folder containing your source code.

**Recommendation:** Press Enter to use `/` (root directory).

**Custom example:** If your app is in a subfolder, enter `./frontend`

---

### 8. Output Location

```
Output location (build output folder) [dist]:
```

**What it is:** The folder where your built app files are output.

**Recommendation:** For Vite projects, press Enter to use `dist`.

**For Create React App:** Enter `build`

---

### 9. Final Confirmation

```
Configuration Summary
Resource Group:     fineguard-rg
Location:           uksouth
Static Web App:     fineguard
SKU:                Free
GitHub Repo:        yourusername/fineguard
Branch:             main
App Location:       /
Output Location:    dist

Proceed with deployment? [Y/n]:
```

**Review carefully**, then press Enter to proceed.

---

## Troubleshooting

### Common Errors and Solutions

#### 1. "Azure CLI is not installed"

**Error:**
```
✗ Azure CLI is not installed
```

**Solution:**
```bash
# macOS
brew install azure-cli

# Windows
winget install Microsoft.AzureCLI

# Linux
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

Then run `az login` to authenticate.

---

#### 2. "Not authenticated with GitHub"

**Error:**
```
✗ Not authenticated with GitHub
```

**Solution:**
```bash
gh auth login
```

Follow the interactive prompts to authenticate.

---

#### 3. "Not logged in to Azure"

**Error:**
```
✗ Not logged in to Azure
```

**Solution:**
```bash
az login
```

A browser window will open for authentication.

---

#### 4. "GitHub repository not found"

**Error:**
```
Could not detect GitHub repository
```

**Solution:**

1. **Check if you have a remote:**
   ```bash
   git remote -v
   ```

2. **Add GitHub remote if missing:**
   ```bash
   git remote add origin https://github.com/yourusername/your-repo.git
   ```

3. **Push your code:**
   ```bash
   git push -u origin main
   ```

---

#### 5. "Insufficient permissions"

**Error:**
```
ERROR: You do not have the required permissions
```

**Solution:**

Ask your Azure subscription administrator to grant you "Contributor" or "Owner" role:

```bash
# Admin runs this (replace with actual user email)
az role assignment create \
  --assignee "user@example.com" \
  --role "Contributor"
```

---

#### 6. "Static Web App name already exists"

**Error:**
```
ERROR: Static Web App 'fineguard' already exists
```

**Solution:**

Choose a different name when prompted, or delete the existing resource:

```bash
az staticwebapp delete \
  --name fineguard \
  --resource-group fineguard-rg
```

---

#### 7. "Build failed" in GitHub Actions

**Error:** GitHub Actions workflow shows red ✗

**Solutions:**

1. **Check the build script exists:**
   ```bash
   # Ensure package.json has a build script
   cat package.json | grep "build"
   ```

2. **Test the build locally:**
   ```bash
   npm install
   npm run build
   ```

3. **Check the output location:**
   - Vite outputs to `dist/`
   - Create React App outputs to `build/`
   - Update `staticwebapp.config.json` if needed

4. **View detailed logs:**
   ```bash
   gh run list
   gh run view --log
   ```

---

#### 8. "EACCES: permission denied"

**Error:**
```
EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution:**

Don't use `sudo` with npm. Either:

1. **Fix npm permissions:**
   ```bash
   mkdir ~/.npm-global
   npm config set prefix '~/.npm-global'
   echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
   source ~/.bashrc
   ```

2. **Use a Node version manager:**
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

   # Install Node
   nvm install 20
   nvm use 20
   ```

---

#### 9. "Cannot find module" errors during build

**Error:**
```
Error: Cannot find module 'react'
```

**Solution:**

1. **Clean install dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Ensure all dependencies are in package.json:**
   ```bash
   npm install react react-dom --save
   ```

---

#### 10. Network/Timeout Errors

**Error:**
```
ERROR: Operation timed out
```

**Solution:**

1. **Check internet connection**

2. **Retry the command:**
   ```bash
   ./deploy-azure.sh
   ```

3. **Increase timeout (for slow connections):**
   ```bash
   az config set core.http_retries=5
   ```

---

## Post-Deployment

### Verify Deployment Success

After the script completes, you'll see:

```
========================================
Deployment Complete!
========================================

✓ Your application is deployed!

Application URL: https://fineguard-abc123.azurestaticapps.net
```

### Next Steps

#### 1. Commit and Push Workflow Files

The script creates workflow files locally. Commit them:

```bash
git add .github/workflows/azure-static-web-apps-ci-cd.yml
git add staticwebapp.config.json
git commit -m "Add Azure Static Web Apps deployment"
git push origin main
```

#### 2. Monitor the Deployment

Watch the GitHub Actions workflow:

```bash
# Watch live
gh run watch

# Or view in browser
gh run list
gh run view --web
```

#### 3. Visit Your Site

```bash
# Open in browser (macOS)
open https://fineguard-abc123.azurestaticapps.net

# Or copy the URL and paste in your browser
```

#### 4. Test Your Application

- Check that all pages load correctly
- Test navigation and routing
- Verify API endpoints (if any)
- Test on mobile devices

---

## Managing Your Deployment

### View Deployment Status

```bash
# Get app details
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg

# Get app URL
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg \
  --query "defaultHostname" \
  --output tsv
```

### View GitHub Actions Runs

```bash
# List recent runs
gh run list

# View specific run
gh run view <run-id>

# Watch current run
gh run watch
```

### Update Environment Variables

```bash
# List app settings
az staticwebapp appsettings list \
  --name fineguard \
  --resource-group fineguard-rg

# Set environment variable
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "API_URL=https://api.example.com"
```

### Add Custom Domain (Standard Tier Only)

```bash
# Add custom domain
az staticwebapp hostname set \
  --name fineguard \
  --resource-group fineguard-rg \
  --hostname "www.yourcompany.com"
```

### View Deployment Logs

```bash
# Via GitHub Actions
gh run view --log

# Via Azure Portal
az staticwebapp show \
  --name fineguard \
  --resource-group fineguard-rg \
  --query "defaultHostname" | \
  xargs -I {} open "https://{}"
```

### Rollback to Previous Version

```bash
# List previous runs
gh run list --limit 10

# Re-run a previous successful build
gh run rerun <run-id>
```

### Delete Deployment

```bash
# Delete Static Web App (keeps Resource Group)
az staticwebapp delete \
  --name fineguard \
  --resource-group fineguard-rg

# Delete entire Resource Group
az group delete \
  --name fineguard-rg \
  --yes
```

---

## FAQ

### Q: How much does it cost?

**A:** Free tier includes:
- 100GB bandwidth per month
- SSL certificate
- Global CDN
- Staging environments

Standard tier is $9/month + $0.20/GB over 100GB.

### Q: Can I use a custom domain?

**A:** Yes, but you need the Standard tier ($9/month). Free tier uses the default `*.azurestaticapps.net` domain.

### Q: How do I update my app?

**A:** Just push to your branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

GitHub Actions will automatically rebuild and deploy.

### Q: Can I preview changes before deploying?

**A:** Yes! Create a pull request. Azure creates a staging environment automatically with a unique URL.

### Q: How do I add environment variables?

**A:** Use Azure CLI:
```bash
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_URL=https://api.example.com"
```

Then rebuild your app.

### Q: My routes return 404 errors

**A:** This is already configured in `staticwebapp.config.json`. All routes fallback to `/index.html` for client-side routing.

### Q: Can I use this with Vite environment variables?

**A:** Yes! Prefix with `VITE_`:

```bash
# Set in Azure
az staticwebapp appsettings set \
  --name fineguard \
  --resource-group fineguard-rg \
  --setting-names "VITE_API_KEY=abc123"
```

Access in code:
```javascript
const apiKey = import.meta.env.VITE_API_KEY;
```

### Q: How do I enable HTTPS?

**A:** It's automatic! All Azure Static Web Apps include free SSL certificates.

### Q: Can I deploy from a different branch?

**A:** Yes! Update `.github/workflows/azure-static-web-apps-ci-cd.yml`:

```yaml
on:
  push:
    branches:
      - develop  # Change this
```

### Q: How long does deployment take?

**A:**
- Initial setup: 5-10 minutes
- Subsequent deployments: 2-5 minutes

### Q: Can I use Azure Functions with this?

**A:** Yes! Azure Static Web Apps supports serverless API functions. Place them in an `/api` folder.

### Q: What if I need help?

**A:** Resources:
- Azure Static Web Apps docs: https://docs.microsoft.com/azure/static-web-apps/
- GitHub Actions docs: https://docs.github.com/actions
- Community support: https://stackoverflow.com/questions/tagged/azure-static-web-apps

---

## Quick Reference

### Useful Commands

```bash
# Check prerequisites
./check-azure-prereqs.sh

# Deploy to Azure
./deploy-azure.sh

# Watch GitHub Actions
gh run watch

# View app details
az staticwebapp show --name fineguard --resource-group fineguard-rg

# View logs
gh run view --log

# Set environment variable
az staticwebapp appsettings set --name fineguard --resource-group fineguard-rg --setting-names "KEY=value"

# Delete deployment
az staticwebapp delete --name fineguard --resource-group fineguard-rg
```

### File Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── azure-static-web-apps-ci-cd.yml  # GitHub Actions workflow
├── src/                                      # Your source code
├── dist/                                     # Build output (gitignored)
├── staticwebapp.config.json                  # Azure SWA configuration
├── deploy-azure.sh                           # Deployment script
├── check-azure-prereqs.sh                    # Prerequisites checker
├── package.json                              # Node.js dependencies
└── vite.config.js                           # Vite configuration
```

---

## Support

If you encounter issues not covered in this guide:

1. **Check the troubleshooting section** above
2. **Run the pre-flight check** script
3. **Review GitHub Actions logs**: `gh run view --log`
4. **Check Azure portal** for resource status
5. **Consult the official documentation**:
   - Azure Static Web Apps: https://docs.microsoft.com/azure/static-web-apps/
   - Azure CLI: https://docs.microsoft.com/cli/azure/

---

**Happy deploying!**
