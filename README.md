# FineGuard - Azure Deployment

A React/Vite application deployed to Azure Static Web Apps.

## Quick Start

### 1. Check Prerequisites

```bash
./check-azure-prereqs.sh
```

### 2. Deploy to Azure

```bash
./deploy-azure.sh
```

### 3. Monitor Deployment

```bash
gh run watch
```

## Documentation

For complete step-by-step instructions, troubleshooting, and FAQs, see:

**[AZURE-DEPLOYMENT-GUIDE.md](./AZURE-DEPLOYMENT-GUIDE.md)**

## Prerequisites

- [Azure CLI](https://docs.microsoft.com/cli/azure/install-azure-cli)
- [GitHub CLI](https://cli.github.com/)
- [Node.js](https://nodejs.org/) (v16+)
- [Git](https://git-scm.com/)
- Azure account
- GitHub account

## What's Included

- **deploy-azure.sh** - Automated deployment script
- **check-azure-prereqs.sh** - Prerequisites verification
- **.github/workflows/azure-static-web-apps-ci-cd.yml** - GitHub Actions CI/CD
- **staticwebapp.config.json** - Azure Static Web Apps configuration
- **AZURE-DEPLOYMENT-GUIDE.md** - Comprehensive deployment guide

## Features

- Automatic deployments on push to main branch
- Preview environments for pull requests
- Free SSL certificate
- Global CDN
- Custom domain support (Standard tier)
- Staging environments

## Architecture

```
┌─────────────┐      ┌──────────────┐      ┌─────────────────┐
│   GitHub    │─────▶│ GitHub       │─────▶│ Azure Static    │
│ Repository  │      │ Actions      │      │ Web Apps        │
└─────────────┘      └──────────────┘      └─────────────────┘
                            │                        │
                            │                        ▼
                            ▼                 ┌─────────────┐
                     ┌──────────────┐         │   Global    │
                     │ npm build    │         │     CDN     │
                     └──────────────┘         └─────────────┘
```

## Support

See [AZURE-DEPLOYMENT-GUIDE.md](./AZURE-DEPLOYMENT-GUIDE.md) for:
- Detailed setup instructions
- Troubleshooting common issues
- Post-deployment tasks
- FAQ

## License

[Your License Here]
