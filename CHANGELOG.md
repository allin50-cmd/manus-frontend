# Changelog

All notable changes to FineGuard MTD are documented in this file.

## [1.0.0] — 2026-02-24

### Added — FineGuard MTD System

**Backend**
- `server/db/schema-mtd.ts` — Complete Drizzle ORM schema for tenants, connectors, imports, invoice records, MTD submissions, HMRC tokens, and audit events
- `server/services/xeroConnector.ts` — Full Xero OAuth2 implementation (PKCE + server flow, token refresh, paginated invoice fetch, VAT report fetch, webhook signature verification)
- `server/services/quickbooksConnector.ts` — QuickBooks OAuth2 scaffold
- `server/services/sageConnector.ts` — Sage Business Cloud OAuth2 scaffold
- `server/services/dynamics365.ts` — Dynamics 365/Dataverse scaffold (client_credentials auth, invoice fetch, webhook subscription)
- `server/services/hmrcMtd.ts` — HMRC MTD VAT submission service with full idempotency, OAuth2 token management, retry logic
- `server/services/ruleEngine.ts` — Deterministic FineGuard MTD validation rules (MTD-001 through MTD-008, REC-001 through REC-004) with KB article references
- `server/services/auditWriter.ts` — VaultLine audit writer with Azure Blob WORM storage, local ring-buffer retry, AES-256-GCM payload encryption
- `server/services/csvParser.ts` — Streaming CSV parser with per-tenant mapping templates, validation, confidence scoring
- `server/services/formRecognizer.ts` — Azure Form Recognizer integration with mock fallback and batch processing
- `server/services/secretsManager.ts` — Azure Key Vault integration with managed identity, AES-256-GCM token encryption/decryption, key rotation helper
- `server/routes/import.ts` — CSV/PDF import routes with multer, streaming, Form Recognizer, approval endpoint
- `server/routes/mcp.ts` — Connector management, MTD submission, HMRC OAuth callback, status endpoint, audit trail

**Frontend**
- `src/services/mtdApi.ts` — Typed API client for all MTD endpoints
- `src/components/fineguard/ImportTable.tsx` — Import list with status badges and actions
- `src/components/fineguard/ConnectorCard.tsx` — Connector status card with token expiry and refresh
- `src/components/fineguard/SubmissionPanel.tsx` — MTD submission form with idempotency, validation errors, receipt display
- `src/pages/FineGuardAdmin.tsx` — Full admin UI: imports, connectors, submission, audit log tabs

**Infrastructure**
- `docker-compose.yml` — Local dev with Postgres, Azurite (Azure Storage emulator), Redis, API server
- `Dockerfile` — Multi-stage build (dev, builder, production)
- `infra/terraform/main.tf` — Azure Terraform: App Service, PostgreSQL Flexible Server, Storage (WORM), Key Vault, Form Recognizer, Application Insights, Service Bus
- `infra/terraform/outputs.tf` — Terraform outputs with deployment instructions
- `infra/scripts/configure-immutability.sh` — Script to set Azure Blob WORM immutability policy
- `infra/scripts/verify-worm.sh` — Script to verify WORM protection is active

**CI/CD**
- `.github/workflows/fineguard-ci.yml` — lint, typecheck, unit tests, integration tests, build, Docker build
- `.github/workflows/fineguard-deploy.yml` — staging (auto) and production (manual gate) deploy

**Tests**
- `tests/unit/ruleEngine.test.ts` — Full rule engine test suite (10+ scenarios)
- `tests/unit/csvParser.test.ts` — CSV parser tests including edge cases and default templates
- `tests/unit/secretsManager.test.ts` — Token encryption/decryption tests
- `tests/e2e/mtd-submission.test.ts` — E2E acceptance test: upload → approve → submit → verify audit
- `tests/fixtures/sample-invoices.csv` — Sample test data

**Documentation**
- `docs/openapi.yaml` — Full OpenAPI 3.0 specification
- `docs/runbooks/hmrc-sandbox.md` — HMRC sandbox registration and OAuth configuration guide
- `SECURITY.md` — Secret storage, key rotation, and incident response procedures
- `CHANGELOG.md` — This file

### Maintained
- All existing VaultLine brand pages and Companies House integration
- Deployment tracking API
- Lead capture and intake form APIs
