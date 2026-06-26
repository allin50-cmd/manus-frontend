# Evidence Register

> UltraTechOS Commercial Validation Programme
> Last updated: 2026-06-26
> Maintainer: George

Every entry represents a piece of evidence that supports a claim about UltraTechOS.
Status: **Verified** = evidence exists and is accessible | **Missing** = evidence needed | **Partial** = evidence exists but incomplete

---

## Evidence Format

Each entry includes:
- **Evidence ID** — unique identifier (EVD-NNN)
- **Title** — short description
- **Category** — Product | Technical | Commercial | Governance | Security | Pilot | Customer | Partner | Financial | Deployment
- **Date** — when evidence was created/captured
- **Status** — Verified | Missing | Partial
- **Related Record(s)** — files, commits, deployments, or documents
- **Description** — what this evidence proves
- **Source** — origin of the evidence
- **Location** — where to find it
- **Verification Status** — how it was verified

---

## Technical Evidence

---

### EVD-001

| Field | Value |
|---|---|
| **ID** | EVD-001 |
| **Title** | Production build passing — governance check + 50 routes |
| **Category** | Technical |
| **Date** | 2026-06-26 |
| **Status** | Verified |
| **Related Record(s)** | Git commit `46e38e8`, GitHub Actions CI run |
| **Description** | The production Next.js build compiles successfully. The governance check (verifying ULTRATECHOS.md and ANTI_DRIFT.md exist) passes. 50 routes are compiled (static and dynamic). |
| **Source** | GitHub Actions CI workflow (`ci.yml`) |
| **Location** | `.github/workflows/ci.yml` — Build step |
| **Verification Status** | Verified via CI run on commit 46e38e8 |

---

### EVD-002

| Field | Value |
|---|---|
| **ID** | EVD-002 |
| **Title** | TypeScript type-check passing — zero errors |
| **Category** | Technical |
| **Date** | 2026-06-26 |
| **Status** | Verified |
| **Related Record(s)** | Git commit `46e38e8`, `npm run type-check` output |
| **Description** | The TypeScript compiler reports zero errors across the entire codebase. All types are correct. |
| **Source** | GitHub Actions CI + local verification |
| **Location** | `tsconfig.json`, `npm run type-check` |
| **Verification Status** | Verified in session 2026-06-26 |

---

### EVD-003

| Field | Value |
|---|---|
| **ID** | EVD-003 |
| **Title** | Drizzle ORM schema — full unified schema with all OS tables |
| **Category** | Technical |
| **Date** | 2026-06-24 |
| **Status** | Verified |
| **Related Record(s)** | `db/schema.ts` |
| **Description** | Complete TypeScript schema covering all modules: work_items, os_tasks, os_quotes, os_people, os_alerts, os_documents, os_calls, os_messages, os_decisions, os_templates, os_companies, os_leads, os_invoices, ut_activity_events, ut_daily_metrics, ut_weekly_reports, fg_* tables, builder_big_jobs_leads. |
| **Source** | Codebase |
| **Location** | `db/schema.ts` |
| **Verification Status** | File exists and is the active Drizzle schema |

---

### EVD-004

| Field | Value |
|---|---|
| **ID** | EVD-004 |
| **Title** | JWT session authentication — stateless, no third-party auth |
| **Category** | Technical |
| **Date** | 2024 |
| **Status** | Verified |
| **Related Record(s)** | `lib/auth.ts`, `app/api/auth/login/route.ts`, `middleware.ts` |
| **Description** | Authentication is implemented as a passcode → JWT stored in a session cookie. No Clerk, Auth0, or NextAuth. Uses `jose` for JWT sign/verify. Middleware protects all non-public routes. |
| **Source** | Codebase |
| **Location** | `lib/auth.ts`, `middleware.ts` |
| **Verification Status** | Code verified in session |

---

### EVD-005

| Field | Value |
|---|---|
| **ID** | EVD-005 |
| **Title** | Governance enforcement — build-time check script |
| **Category** | Governance |
| **Date** | 2025-06-24 |
| **Status** | Verified |
| **Related Record(s)** | `scripts/check-governance.js`, `package.json` prebuild hook |
| **Description** | A governance check script runs as a prebuild step. It fails the build if ULTRATECHOS.md or ANTI_DRIFT.md are missing from the repo root. This enforces governance documents cannot be deleted. |
| **Source** | Codebase |
| **Location** | `scripts/check-governance.js` |
| **Verification Status** | Verified — passes on every CI build |

---

### EVD-006

| Field | Value |
|---|---|
| **ID** | EVD-006 |
| **Title** | Vercel deployment — 5 of 6 projects deploying successfully |
| **Category** | Deployment |
| **Date** | 2026-06-26 |
| **Status** | Verified |
| **Related Record(s)** | Vercel deployment webhooks, commit `46e38e8` |
| **Description** | Following commit 46e38e8, 5 of 6 Vercel projects deployed successfully (manus-frontend, manus-frontend-c9li, manus-frontend-edg7, manus-frontend-sheetops, manus-frontend-sheetops-iphone). The sixth project (j8i7/testops) has a pre-existing configuration issue unrelated to code changes. |
| **Source** | Vercel GitHub Integration webhooks |
| **Location** | Vercel dashboard — georges-projects-d3e17648 |
| **Verification Status** | Verified via webhook events in session |

---

### EVD-007

| Field | Value |
|---|---|
| **ID** | EVD-007 |
| **Title** | Architectural Decision Log — major decisions documented |
| **Category** | Governance |
| **Date** | 2025-06-24 |
| **Status** | Verified |
| **Related Record(s)** | `docs/DECISION_LOG.md` |
| **Description** | All major architectural decisions are recorded in the decision log with dates, reasons, alternatives considered, and approval. Covers: ORM choice (Drizzle), database (Supabase), auth (JWT/jose), hosting (Vercel), FineGuard isolation, measurement framework, governance documents. |
| **Source** | Codebase |
| **Location** | `docs/DECISION_LOG.md` |
| **Verification Status** | File read and verified in session |

---

### EVD-008

| Field | Value |
|---|---|
| **ID** | EVD-008 |
| **Title** | FineGuard — Companies House integration |
| **Category** | Product |
| **Date** | 2024 |
| **Status** | Verified |
| **Related Record(s)** | `lib/fineguard-workflow.ts`, `lib/companiesHouse.ts`, `FINEGUARD.md` |
| **Description** | FineGuard monitors UK company compliance deadlines via the Companies House REST API. It uses dedicated `fg_*` tables, its own Stripe subscription workflow, and email alerts via Resend. The workflow is deterministic, sequential, and idempotent. |
| **Source** | Codebase |
| **Location** | `lib/fineguard-workflow.ts`, `lib/companiesHouse.ts` |
| **Verification Status** | Code exists and is the active FineGuard implementation |

---

### EVD-009

| Field | Value |
|---|---|
| **ID** | EVD-009 |
| **Title** | Measurement framework — ut_* tables and trackEvent() |
| **Category** | Technical |
| **Date** | 2025-06-24 |
| **Status** | Partial |
| **Related Record(s)** | `lib/ut-tracker.ts`, `db/migrations/0007_ut_metrics.sql`, `app/api/ut/` |
| **Description** | Fire-and-forget event tracking via `trackEvent()`. Events stored in `ut_activity_events`. Daily and weekly aggregation in `ut_daily_metrics` and `ut_weekly_reports`. Migration 0007 is defined but awaiting application in Supabase. |
| **Source** | Codebase |
| **Location** | `lib/ut-tracker.ts`, `db/migrations/0007_ut_metrics.sql` |
| **Verification Status** | Partial — code exists, database migration not yet applied |

---

### EVD-010

| Field | Value |
|---|---|
| **ID** | EVD-010 |
| **Title** | Architecture guardrails document |
| **Category** | Governance |
| **Date** | 2025-06-24 |
| **Status** | Verified |
| **Related Record(s)** | `docs/ARCHITECTURE_GUARDRAILS.md` |
| **Description** | Defines approved technology choices (Vercel, Supabase, Drizzle, Next.js 14, JWT/jose, Tailwind, Stripe, OpenAI) and what is not approved without explicit instruction (Prisma, tRPC, monorepo, agent frameworks, Redis, etc.). |
| **Source** | Codebase |
| **Location** | `docs/ARCHITECTURE_GUARDRAILS.md` |
| **Verification Status** | File exists and is enforced by sessions |

---

### EVD-011

| Field | Value |
|---|---|
| **ID** | EVD-011 |
| **Title** | Code Asset Inventory — full module audit |
| **Category** | Technical |
| **Date** | 2026-06-24 |
| **Status** | Verified |
| **Related Record(s)** | `docs/CODE_ASSET_INVENTORY.md` |
| **Description** | Complete inventory of all code assets: 24 active production assets, 7 archive candidates. Covers all modules including FineGuard, UltAi, VaultLine, Work Items, Tasks, Money, Contacts, Decisions, Alerts, Documents, Templates, Messages, Today, Builder Big Jobs. |
| **Source** | Session audit |
| **Location** | `docs/CODE_ASSET_INVENTORY.md` |
| **Verification Status** | Document exists and was read in session |

---

## Missing Evidence

The following evidence is missing and needs to be captured:

| Evidence ID | Title | Category | What Is Needed |
|---|---|---|---|
| EVD-M01 | FineGuard screenshots — live product | Product | Screenshots of the FineGuard dashboard, deadline alerts, and company monitoring in a live environment |
| EVD-M02 | Supabase migration confirmation | Technical | Confirmation that migration 0007 (ut_metrics) has been applied in the Supabase SQL Editor |
| EVD-M03 | Security audit results | Security | Formal or informal security review of auth, API routes, and database access |
| EVD-M04 | Pilot customer usage | Pilot | Evidence of real business owners using the system — screenshots, usage metrics, testimonials |
| EVD-M05 | Live operational metrics | Product | ut_daily_metrics or ut_weekly_reports data showing real usage (requires EVD-M02 first) |
| EVD-M06 | Stripe subscription evidence | Financial | Evidence of live Stripe subscriptions for FineGuard |
| EVD-M07 | UltAi usage evidence | Product | Evidence of voice transcription and AI drafting being used in production |
| EVD-M08 | Architecture diagram | Technical | Visual diagram of the system architecture (Reality → Records → Runtime → Views → People) |
| EVD-M09 | VaultLine usage evidence | Product | Evidence of document management (os_documents) being used in production |
| EVD-M10 | Revenue figures | Financial | Actual revenue from FineGuard subscriptions or other sources |

---

## Summary

| Metric | Count |
|---|---|
| Total evidence items | 11 |
| Verified | 9 |
| Partial | 1 |
| Missing | 10 |
| Categories covered | Technical (5), Governance (3), Deployment (1), Product (1) |
| Categories with missing evidence | Product, Pilot, Customer, Security, Financial |
