# ClerkOS — Deployment Guide

---

## Run a demo on your laptop (5 minutes)

**You need:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

Open a terminal in this folder and type:

```
npm run demo
```

Then open your browser at **http://localhost:3000**

That's it. The app starts with a pre-loaded Alpha Crown Court with real cases, hearings, and documents.

To stop it: press `Ctrl + C`, then run `npm run demo:down` to wipe the data.

---

## Deploy to Azure (production)

Tell Claude:

> "Deploy ClerkOS to Azure. Use the existing workflows in .github/workflows. Set up the required GitHub secrets and trigger the deployment."

Claude will walk you through each step. You will need:

- An Azure account (free trial works)
- A GitHub account with access to this repository

---

## What each workflow does

| Workflow | What it deploys | When it runs |
|---|---|---|
| `deploy-infra.yml` | The Azure infrastructure (database, servers, storage) | Run once to set up |
| `deploy-container.yml` | The ClerkOS app | Every time code is pushed to main |
| `azure-static-web-apps-ci-cd.yml` | The frontend website | Every time code is pushed to main |

---

## Secrets Claude will ask you to add

Go to your GitHub repository → **Settings → Secrets and variables → Actions** and add these:

| Secret name | What it is | How to get it |
|---|---|---|
| `AZURE_CREDENTIALS` | Azure login for GitHub | Ask Claude: *"Create the Azure service principal for GitHub Actions"* |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | Token for the website | Shown in Azure Portal after running `deploy-infra.yml` |

---

## Trigger a deployment manually

Go to your GitHub repository → **Actions** → pick a workflow → click **Run workflow**.
