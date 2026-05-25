# Consolidation Plan

**Authority:** apps/registry.json
**Repository:** allin50-cmd/manus-frontend
**Audit Date:** 2026-05-25
**Basis:** docs/verification-report.md, docs/deployment-inventory.md, docs/repository-map.md

---

## Canonical Determinations

### Which repositories are canonical?

| System | Canonical Repo | Basis |
|---|---|---|
| Accuracy PIE | UNKNOWN | No source found anywhere |
| UltAi | `allin50-cmd/manus-frontend` | Only known source location |
| FineGuard | `allin50-cmd/manus-frontend` | Only known source location |
| VaultLine | `allin50-cmd/manus-frontend` | Only known source location |
| UltraCore Monorepo | `allin50-cmd/manus-frontend` | Target state; does not yet exist as a monorepo |

### Which deployments are canonical?

| System | Canonical Deployment | Status |
|---|---|---|
| UltAi | https://zhoqgoan.manus.space/ | UNVERIFIED — declared in docs only |
| FineGuard | https://compliance-t2rtvc.manus.space/ | UNVERIFIED — declared in docs only |
| VaultLine | `VAULTLINE_API_URL` (secret) | UNKNOWN |
| Accuracy PIE | UNKNOWN | — |

### Which databases are canonical?

| Purpose | Canonical DB | Technology | Managed |
|---|---|---|---|
| Brand-suite operations | PostgreSQL @ `DATABASE_URL` | PostgreSQL | Yes — drizzle-kit via `server/db/schema.ts` |
| ClerkOS tenant data | PostgreSQL @ `DATABASE_URL` (same) | PostgreSQL | No — `server/drizzle/schema.ts` has no migration path |
| Azure SQL (Bicep) | `clerkos-{env}-db` | Azure SQL Server | Yes — Bicep | Mismatched with application driver |

**The database situation is a blocker.** Two schemas share one connection string. The ClerkOS schema (9 tables, including the VaultLine audit trail) has no migration tooling pointed at it. The Bicep IaC provisions Azure SQL Server, not PostgreSQL — this is incompatible with the `postgres` npm driver.

### Which environments are canonical?

| Environment | Status |
|---|---|
| Local development | Functional with `.env` file |
| Dev (Azure) | UNKNOWN — Bicep may or may not have been run |
| Staging (Azure) | UNKNOWN |
| Production (Azure) | UNKNOWN |

---

## Blockers (Ordered by Severity)

### Blocker 1 — Build is broken (affects: UltAi, FineGuard, VaultLine)

**What:** `npm run build` fails with `error TS2688: Cannot find type definition file for 'vite/client'`.

**Why it matters:** No code can be deployed. Both CI/CD pipelines will fail on the build step.

**Fix scope:** `tsconfig.json` configuration only. No logic changes required.

**Candidate fix:** Add `"@types/vite"` to devDependencies or add `"ignoreDeprecations": "6.0"` to `tsconfig.json` compilerOptions. Investigate whether `vite/client` types path has changed in the installed version.

**Do not implement** until this plan is reviewed. Record here for the implementation sprint.

---

### Blocker 2 — Test runner not installed (affects: all)

**What:** `vitest` is listed in `devDependencies` in `package.json` but is not present in `node_modules`. `npm test` fails immediately.

**Why it matters:** No tests can run. The CI pipeline uses `npm test --if-present` with `continue-on-error: true`, meaning failures are currently silent.

**Fix scope:** Run `npm install` or ensure `package-lock.json` is consistent with `package.json`.

**Do not implement** until Blocker 1 is resolved.

---

### Blocker 3 — Two competing CI/CD pipelines (affects: all)

**What:** Two workflows both trigger on push to `main`. One uses `npm`, one uses `pnpm`. The `pnpm-lock.yaml` required by `deploy-vaultline.yml` does not exist. They target different Azure services.

**Why it matters:** Every push to `main` will trigger two conflicting builds. The pnpm pipeline will fail immediately on `pnpm install --frozen-lockfile` because no lockfile exists. The npm pipeline will fail on the build step (Blocker 1).

**Decision required:** Which deployment target is canonical — Azure Static Web Apps or Azure App Service? This cannot be resolved without the owner confirming which Azure resource is actually receiving traffic.

**Do not implement** until the canonical deployment target is confirmed.

---

### Blocker 4 — ClerkOS schema has no migration path (affects: UltAi, VaultLine)

**What:** `drizzle.config.ts` points to `server/db/schema.ts`. The ClerkOS schema in `server/drizzle/schema.ts` (9 tables including `clerk_audit_events`) is not referenced by `drizzle-kit`. No migrations exist for these tables.

**Why it matters:** The ClerkOS tables can only be created by running the schema manually (e.g., via `db.push` or raw SQL). Any schema change to ClerkOS tables has no safe migration path.

**Fix scope:** Add a second `drizzle.config.ts` for the ClerkOS schema, or consolidate both schemas. Either way requires a decision on the database strategy before touching production.

**Do not implement** until database canonical decision is made.

---

### Blocker 5 — Azure SQL vs PostgreSQL mismatch (affects: VaultLine)

**What:** `deploy/main.bicep` provisions `Microsoft.Sql/servers` (Azure SQL Server / MSSQL). The application uses the `postgres` npm driver, which speaks the PostgreSQL wire protocol. These are not compatible.

**Why it matters:** Either (a) the Bicep template was never deployed and a separate PostgreSQL instance (e.g., Azure Database for PostgreSQL, Neon, Supabase, Railway) was provisioned manually and is not documented, or (b) the Bicep template was deployed but the application cannot connect to it.

**Decision required:** What database is actually running in production? Confirm the `DATABASE_URL` value in the deployed environment.

**Do not implement** any changes until the production DB technology is confirmed.

---

### Blocker 6 — FineGuard has no alert scheduler (affects: FineGuard)

**What:** No scheduled job, Azure Function timer, cron, or background worker exists to periodically check Companies House filing deadlines for companies in the `monitored_companies` table and deliver alerts.

**Why it matters:** FineGuard's core promise — "alerts delivered" — has zero technical implementation. Customers who pay via Stripe are activated in the DB but receive no monitoring or alerts.

**Fix scope:** Requires a new scheduled function (e.g., Azure Function with timer trigger, or a Vercel Cron Job) and an email delivery integration. This is a feature gap, not a configuration issue.

**Do not implement** until deployment target is confirmed and email provider is selected.

---

### Blocker 7 — No email delivery (affects: FineGuard)

**What:** No email provider (SendGrid, Mailgun, Resend, SES, SMTP) is imported or configured anywhere in the server code.

**Why it matters:** FineGuard cannot deliver alerts. Intake forms cannot send confirmation emails. Demo bookings cannot be acknowledged automatically.

**Fix scope:** Requires selecting and integrating one email provider, adding relevant env vars, and wiring to the alert scheduler (Blocker 6).

**Do not implement** without first confirming which email provider is permitted by the portfolio.

---

### Blocker 8 — Admin endpoints are unprotected (affects: all)

**What:** All `/api/admin/*` endpoints (`/api/admin/leads`, `/api/admin/intake-forms`, `/api/admin/compliance-bundles`, `/api/admin/contacts`) require no authentication.

**Why it matters:** Anyone with the server URL can access all customer data.

**Fix scope:** Add authentication middleware to all admin routes. Azure AD B2C or a simple API key gate.

**Do not implement** until auth strategy is confirmed.

---

### Blocker 9 — Marketing pages not routed (affects: FineGuard, VaultLine)

**What:** `FineGuard.tsx`, `VaultLine.tsx`, `UltAi.tsx`, `ComplianceBundle.tsx`, `IntakeSheet.tsx`, `BookDemo.tsx`, `Pricing.tsx`, `About.tsx`, `Team.tsx` exist in `src/pages/` but are not included in `src/App.tsx` routes.

**Why it matters:** The deployed frontend only serves the ClerkOS dashboard. FineGuard and VaultLine marketing/conversion pages are not reachable via the React app.

**Fix scope:** Add routes to `src/App.tsx` or move marketing pages to a separate deployment.

---

## What Must Be Consolidated Next

In order of urgency. Do not start any item before confirming the prerequisite.

### Step 1 — Locate Accuracy PIE (no code changes)

**What:** Contact stakeholders or search accessible repositories for Accuracy PIE source.

**Why first:** Nothing about the portfolio is complete without P1's primary revenue system. All workflow integration plans are blocked until this is found.

**Success condition:** `apps/registry.json` `accuracy-pie.sourceRepo` is updated with a real repository path and `accuracy-pie.deployment` is updated with a real URL.

---

### Step 2 — Fix the build (single tsconfig.json change)

**What:** Resolve `error TS2688: Cannot find type definition file for 'vite/client'` so `npm run build` passes.

**Why second:** Every subsequent step requires a working build. CI cannot function without it.

**Prerequisite:** None.

**Success condition:** `npm run build` exits 0.

---

### Step 3 — Confirm canonical deployment target

**What:** Determine which of the two Azure deployment targets (Static Web Apps or App Service) is receiving live traffic. Disable the non-canonical pipeline.

**Why third:** CI/CD must be singular before any code can be reliably deployed.

**Prerequisite:** Step 2 (build must pass before confirming which pipeline works).

**Success condition:** One CI/CD workflow remains. Every push to `main` produces exactly one deployment.

---

### Step 4 — Confirm production database technology

**What:** Retrieve the `DATABASE_URL` value from the production environment and confirm whether it is PostgreSQL or Azure SQL Server.

**Why fourth:** Schema migration tooling, connection drivers, and the Bicep IaC decision all depend on this.

**Prerequisite:** None (can run in parallel with Steps 2–3).

**Success condition:** `docs/deployment-inventory.md` updated with confirmed DB technology and connection string format.

---

### Step 5 — Add drizzle-kit management for ClerkOS schema

**What:** Update `drizzle.config.ts` (or add a second config) so `server/drizzle/schema.ts` is managed by drizzle-kit. Generate initial migration.

**Why fifth:** Without this, ClerkOS tables (including VaultLine audit trail) have no safe schema evolution path.

**Prerequisite:** Step 4 (must know DB technology and have a working connection).

**Success condition:** `npm run db:generate` produces migrations for all 9 ClerkOS tables. `npm run db:migrate` applies them to a dev database cleanly.

---

### Step 6 — Confirm Stripe and CH API keys in production

**What:** Verify `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`, and `COMPANIES_HOUSE_API_KEY` are set in the production environment.

**Why sixth:** FineGuard cannot be verified as operational without these.

**Prerequisite:** Step 3 (must know which deployment is canonical before checking its env vars).

**Success condition:** A test request to `/api/compliance-bundle` with a real company number returns CH data. A Stripe test-mode checkout session can be created.

---

### Step 7 — Implement FineGuard alert scheduler

**What:** Add a scheduled function that reads `monitored_companies`, checks each company's compliance status via `CompaniesHouseService`, and queues alerts for companies in `overdue` or `warning` status.

**Why seventh:** This is the core FineGuard capability that is completely missing.

**Prerequisite:** Steps 3, 4, 6. Email provider must be selected.

**Success condition:** At least one monitored company receives an alert email when a filing becomes overdue.

---

### Step 8 — Protect admin endpoints

**What:** Add authentication middleware to all `/api/admin/*` routes.

**Why eighth:** Customer data is exposed. This is a security issue, not a feature.

**Prerequisite:** Step 3 (must know which deployment to test against).

**Success condition:** Unauthenticated request to `/api/admin/leads` returns 401.

---

## What to Leave Untouched

| Item | Reason |
|---|---|
| `server/services/companiesHouse.ts` | Working correctly. Do not modify. |
| `server/services/blobStorage.ts` | Graceful no-op when unconfigured. Logic correct. |
| `server/services/serviceBus.ts` | Graceful no-op when unconfigured. Logic correct. |
| `server/engine/clerkOS.engine.ts` | Working state machine. Extend, do not replace. |
| `azure-functions/src/index.ts` | Do not modify until Azure resources confirmed. |
| `staticwebapp.config.json` | Correct routing and security headers. |
| `deploy/main.bicep` | Do not modify until DB technology confirmed (Step 4). |
| All P3 pages | Park. Do not delete. Do not expand. |

---

## What to Archive

| Item | When | Reason |
|---|---|---|
| `AZURE-DEPLOYMENT-GUIDE.md` (root) | After Step 3 completes | Operational content; move to `docs/archive/` |
| `COMPANIES-HOUSE-INTEGRATION-COMPLETE.md` (root) | After Step 6 verified | Historical log; move to `docs/archive/` |
| `DEPLOYMENT-TRACKING-SETUP.md` (root) | After Step 3 completes | Operational log; move to `docs/archive/` |
| `FRONTEND-INTEGRATION-COMPLETE.md` (root) | Immediate | Historical note; move to `docs/archive/` |
| `IMPROVEMENTS-LOG.md` (root) | Immediate | Historical log; move to `docs/archive/` |
| `MIGRATION-GUIDE.md` (root) | After Step 5 completes | Superseded by drizzle-kit |
| Non-canonical CI/CD workflow | After Step 3 completes | Remove the losing pipeline |

Do not delete root markdown files — move them. Git history preservation required.

---

## What to Monitor

| Item | Metric | Alert Condition |
|---|---|---|
| `clerk_audit_events` write rate | Rows per hour | Zero rows in a business day |
| `monitored_companies` count | Row count | Count decreases unexpectedly |
| Azure Service Bus DLQ | Dead-letter count | DLQ > 0 |
| Build status | CI exit code | Any push to `main` that fails build |
| Stripe webhook | Webhook delivery | Any `checkout.session.completed` not recorded in `monitored_companies` |

---

## Success Condition for This Audit Cycle

At the end of this audit cycle the following must be true:

- [x] `apps/registry.json` exists and is authoritative
- [x] `docs/verification-report.md` documents all P1 systems with evidence
- [x] `docs/deployment-inventory.md` maps all deployments and env vars
- [x] `docs/repository-map.md` maps all files to systems
- [x] `docs/consolidation-plan.md` identifies what to do next in order
- [ ] Accuracy PIE source location confirmed (requires stakeholder input)
- [ ] Build passes (`npm run build` exits 0) — Step 2
- [ ] Canonical deployment confirmed — Step 3
- [ ] Production database technology confirmed — Step 4
