# FineGuard

**Microsoft 365-native compliance automation for UK accountancy firms.**

FineGuard replaces manual spreadsheets and email reminders with automated UK statutory deadlines,
smart workflows, and full visibility — all running inside your Microsoft 365 tenant.

---

## Install & Run (local dev)

**Requirements:** Node.js ≥ 20, pnpm ≥ 8

```bash
# 1. Clone
git clone https://github.com/allin50-cmd/manus-frontend.git
cd manus-frontend

# 2. Install
pnpm install

# 3. Run (frontend only — no database needed)
pnpm dev
```

Open **http://localhost:5173**

| URL | Page |
|-----|------|
| http://localhost:5173/ | FineGuard marketing landing page |
| http://localhost:5173/app | Installer Portal – Dashboard |
| http://localhost:5173/app/deploy | Deploy FineGuard into a tenant |
| http://localhost:5173/app/history | All deployment runs |
| http://localhost:5173/app/settings/domains | Domain configuration |
| http://localhost:5173/app/settings/copilot | Copilot integration |
| http://localhost:5173/app/settings/teams | Teams notifications |
| http://localhost:5173/app/settings/power-automate | Power Automate flows |
| http://localhost:5173/app/partners | Partner overview |
| http://localhost:5173/app/help | Help & FAQ |

### Run with the API server (optional – requires PostgreSQL)

```bash
# Copy and fill in environment variables
cp .env.example .env

# Start both Vite dev server and Express API together
pnpm start
```

---

## Build for production

```bash
pnpm build          # outputs to dist/
pnpm preview        # serve the production build locally
```

---

## Deploy to Azure Static Web Apps

### Prerequisites
- Azure account
- GitHub repository connected to Azure Static Web Apps
- `AZURE_STATIC_WEB_APPS_API_TOKEN` secret added to GitHub repo settings

### Automatic deployment
Push to `master` — GitHub Actions runs `.github/workflows/azure-static-web-apps.yml`
and deploys automatically.

### Manual steps (first time)
```bash
# Create Azure Static Web App via CLI
az staticwebapp create \
  --name fineguard-portal \
  --resource-group myResourceGroup \
  --source https://github.com/allin50-cmd/manus-frontend \
  --location "West Europe" \
  --branch master \
  --app-location "/" \
  --output-location "dist" \
  --login-with-github

# Get the deployment token and add it as a GitHub secret
az staticwebapp secrets list --name fineguard-portal --query "properties.apiKey"
```

---

## Project structure

```
src/
├── pages/
│   ├── FineGuard.tsx          # Marketing landing page
│   └── fineguard/             # Installer portal pages
│       ├── Dashboard.tsx
│       ├── Deploy.tsx
│       ├── DeploymentHistory.tsx
│       ├── DeploymentDetails.tsx
│       ├── SettingsDomains.tsx
│       ├── SettingsCopilot.tsx
│       ├── SettingsTeams.tsx
│       ├── SettingsPowerAutomate.tsx
│       ├── Help.tsx
│       ├── PartnerOverview.tsx
│       └── TenantOverview.tsx
├── components/
│   ├── fineguard/             # Portal component library
│   │   ├── AppLayout.tsx      # Sidebar shell
│   │   ├── Card.tsx / CardGrid.tsx
│   │   ├── Table.tsx
│   │   ├── StatusPill.tsx
│   │   ├── LogViewer.tsx
│   │   ├── StepTimeline.tsx
│   │   ├── ToggleGroup.tsx
│   │   └── Form.tsx
│   └── ui/                    # Base UI primitives
└── schema/
    ├── frontend.json
    ├── backend.json
    └── infrastructure.json
```

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | Wouter |
| Icons | Lucide React |
| Hosting | Azure Static Web Apps |
| Backend (prod) | Azure Functions (TypeScript ESM) |
| Database (prod) | Azure Cosmos DB SQL API |
| Auth | Entra ID via SWA (`x-ms-client-principal`) |
| IaC | Bicep |
| CI/CD | GitHub Actions |

---

## Contact

**Website:** https://fineguard.co.uk  
**Email:** info@fineguard.co.uk  
**Partners:** partners@fineguard.co.uk
