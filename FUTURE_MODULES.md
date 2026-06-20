# FineGuard Pro — Future Modules

This directory documents features that have been built or partially built but are **not active in the current MVP**. They are warehoused here for future release.

The current MVP focuses on three core modules only:
1. **£1 VAT Pre-Submission Checker** — validate VAT return boxes before submission
2. **Compliance Timeline** — chronological compliance history per company
3. **Compliance Ledger & Score** — 0–100 risk score with signal tracking

All modules below are preserved in the codebase and can be re-enabled by restoring their routes in `client/src/App.tsx` and their navigation entries.

---

## Module Index

| Module | Status | Location |
|---|---|---|
| Client Compliance Reports | Built | `server/routers/clientReportsRouter.ts`, `client/src/pages/ClientReports.tsx` |
| Director Change Alert (£1 tool) | Built | `server/routers/directorAlertRouter.ts`, `client/src/pages/DirectorAlert.tsx` |
| Compliance Risk Scan (£1 tool) | Built | `server/routers/riskScanRouter.ts`, `client/src/pages/RiskScan.tsx` |
| Document Vault | Built | `client/src/pages/DocumentVault.tsx`, `server/routers/documentVaultRouter.ts` |
| CRM / Contacts | Built | `client/src/pages/Contacts.tsx`, `server/routers/contactsRouter.ts` |
| Agent Data Input (CSV/PDF/OCR) | Built | `client/src/pages/AgentDataInput.tsx`, `server/routers/uploadJobsRouter.ts` |
| Multi-firm Dashboard | Partial | `client/src/pages/Firms.tsx` |
| Analytics Dashboard | Partial | `client/src/pages/Analytics.tsx` |
| WhatsApp Notifications | Built | `server/webhooks/whatsapp.ts`, `server/services/whatsappService.ts` |
| Scheduled Reports | Partial | `server/routers/reportSchedulerRouter.ts` |
| Alert Delivery Settings | Built | `server/routers/alertDeliveryRouter.ts`, `client/src/pages/AlertDeliverySettings.tsx` |
| Subscription Management | Built | `client/src/pages/SubscriptionManagement.tsx` |
| Engager / Lead Scoring | Built | `server/routers/engagerRouter.ts`, `client/src/pages/Engager.tsx` |
| ASCP Compliance | Built | `client/src/pages/ASCP.tsx` |
| Leads Management | Built | `client/src/pages/Leads.tsx` |
| Admin Dashboard | Built | `client/src/pages/Admin.tsx` |

---

## Module Details

### Client Compliance Reports
**Purpose:** Generate FineGuard-branded or white-label PDF compliance reports per company, including compliance score, upcoming deadlines, and risk signals. Suitable for accountants to send to their clients.

**Database schema:** `client_reports` table — stores report metadata, company ID, user ID, S3 URL, and generation timestamp.

**Planned API routes:**
- `POST /api/trpc/clientReports.generate` — generate PDF report for a company
- `GET /api/trpc/clientReports.list` — list reports for the current user
- `DELETE /api/trpc/clientReports.delete` — delete a report

**Re-enable:** Add route `/client-reports` in `App.tsx`, restore tile in Agent App.

---

### Director Change Alert (£1 Tool)
**Purpose:** Pay-per-use £1 scan that detects director appointments and resignations in the last 90 days for any UK company. Returns a risk signal (LOW/MEDIUM/HIGH) based on volume of changes.

**Database schema:** `tool_transactions` table — records each paid scan with company number, user ID, Stripe session ID, and result metadata.

**Planned API routes:**
- `POST /api/trpc/directorAlert.createCheckout` — create Stripe £1 checkout
- `POST /api/trpc/directorAlert.scan` — run the director change scan

**Re-enable:** Add route `/director-alert` in `App.tsx`, restore tile in Agent App.

---

### Compliance Risk Scan (£1 Tool)
**Purpose:** Pay-per-use £1 scan that analyses a company's full filing history and returns a 0–100 risk score with labelled risk signals (overdue accounts, late filings, strike-off notices, etc.).

**Database schema:** `tool_transactions` table — same as Director Alert.

**Planned API routes:**
- `POST /api/trpc/riskScan.createCheckout` — create Stripe £1 checkout
- `POST /api/trpc/riskScan.scan` — run the risk analysis

**Re-enable:** Add route `/risk-scan` in `App.tsx`, restore tile in Agent App.

---

### Document Vault
**Purpose:** S3-backed document storage per company. Accountants can upload, tag, and retrieve client documents (accounts, tax returns, correspondence) directly from the company profile.

**Database schema:** `documents` table — stores file key, S3 URL, company ID, user ID, file name, MIME type, and upload timestamp.

**Planned API routes:**
- `POST /api/trpc/documentVault.upload` — upload a document
- `GET /api/trpc/documentVault.list` — list documents for a company
- `DELETE /api/trpc/documentVault.delete` — delete a document

**Re-enable:** Restore "Documents" tab in `CompanyDetail.tsx`.

---

### CRM / Contacts
**Purpose:** Contact management system linked to monitored companies. Stores directors, accountants, and other contacts with email, phone, and role information. Includes activity timeline.

**Database schema:** `contacts` table — stores name, email, phone, role, company ID, and encrypted fields.

**Planned API routes:**
- CRUD at `trpc.contacts.*`

**Re-enable:** Restore "Contacts" tab in `CompanyDetail.tsx` and Contacts page route.

---

### Agent Data Input (CSV/PDF/OCR)
**Purpose:** Bulk data import for accountants — upload CSV, XLSX, PDF, or OCR-scanned documents to import company lists, VAT data, or client records. Each format is priced at £1 per upload.

**Database schema:** `agent_upload_jobs` table — tracks job status, file type, Stripe payment, and processing results.

**Re-enable:** Add route `/agent-data-input` in `App.tsx`.

---

### Multi-firm Dashboard
**Purpose:** Allows accounting firms to manage multiple sub-firms or client firms under one account, with aggregated compliance views.

**Re-enable:** Add route `/firms` in `App.tsx`.

---

### Analytics Dashboard
**Purpose:** Charts and trends for compliance alerts over time, alerts by severity, companies by status, and compliance score trends.

**Re-enable:** Add route `/analytics` in `App.tsx`.

---

### WhatsApp Notifications
**Purpose:** Send compliance alerts and deadline reminders via WhatsApp Business API. Includes webhook handler for incoming messages and automated responses.

**Re-enable:** Configure WhatsApp Business API credentials in Settings → Notifications.

---

### Scheduled Reports
**Purpose:** Automatically generate and email compliance reports on a weekly or monthly schedule.

**Re-enable:** Complete `reportSchedulerRouter.ts` and add schedule management UI in Settings.

---

### Alert Delivery Settings
**Purpose:** Configure where alerts are delivered — email, Slack, Teams, or webhook endpoint.

**Re-enable:** Add route `/alert-delivery` in `App.tsx`.

---

### Subscription Management
**Purpose:** Manage Stripe subscription tiers (Free, Professional, Enterprise) with feature gating.

**Re-enable:** Add route `/subscription` in `App.tsx`.

---

### Engager / Lead Scoring
**Purpose:** AI-powered lead scoring and engagement tracking for accounting firm business development.

**Re-enable:** Add route `/engager` in `App.tsx`.
