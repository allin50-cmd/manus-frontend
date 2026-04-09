# FineGuard Pro — Migration Guide

## What changed

This repository was previously described as a React/Vite static frontend deploying to Azure Static Web Apps. That description was wrong. The application is a full-stack Next.js server-side system and has always required a persistent Node.js runtime and PostgreSQL.

The repository has been corrected to reflect the actual architecture.

---

## What was removed

| Removed | Reason |
|---------|--------|
| `staticwebapp.config.json` | SWA-only config — not read by App Service |
| `.github/workflows/azure-static-web-apps-ci-cd.yml` | Legacy SWA workflow |
| `.github/workflows/deploy-vaultline.yml` | Legacy Docker/ACR workflow |
| `scripts/provision-azure.sh` | Old VaultLine ACR provisioner |
| `scripts/set-azure-secrets.sh` | Configured ACR/SWA secrets — no longer applicable |
| `scripts/local-deploy.sh` | Called `vite build` and old Express server |
| `check-azure-prereqs.sh` | Checked for SWA prerequisites |
| All SWA/Manus deployment docs | Incorrect platform documentation |

---

## What is now the correct path

**Platform:** Azure App Service (Linux, Node 20)  
**Database:** Azure PostgreSQL Flexible Server  
**CI/CD:** `.github/workflows/deploy-appservice.yml`  
**CLI deploy:** `bash scripts/run-deploy.sh`

---

## If you have an existing Azure Static Web Apps resource

1. It will not receive new deployments — the workflow no longer targets it
2. Delete it to avoid unnecessary cost: `az staticwebapp delete --name <name> --resource-group <rg>`
3. Provision an App Service following [AZURE-DEPLOYMENT-GUIDE.md](./AZURE-DEPLOYMENT-GUIDE.md)

---

## If you have GitHub secrets from the old SWA workflow

The old secrets (`AZURE_STATIC_WEB_APPS_API_TOKEN`, `ACR_LOGIN_SERVER`, `ACR_USERNAME`, `ACR_PASSWORD`, `AZURE_CREDENTIALS`) are not used by the new workflow and can be deleted from GitHub → Settings → Secrets.

New required secrets are documented in [AZURE-DEPLOYMENT-GUIDE.md](./AZURE-DEPLOYMENT-GUIDE.md#github-actions-secrets--full-reference).

---

## Manus deployments

Any deployments at `*.manus.space` are not maintained by this repository. They are unrelated to the Azure deployment path described here.
