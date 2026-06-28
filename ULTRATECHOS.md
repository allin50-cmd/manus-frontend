# UltraTechOS — Product Constitution

> This document is the canonical definition of what UltraTechOS is.
> All development sessions — human or AI — must read this before making
> architectural, database, framework, workflow, navigation, or product changes.

---

## What UltraTechOS Is

UltraTechOS is a **mobile-first Business Operating System** for small UK businesses.

It replaces the fragmented set of tools a small business owner uses every day —
WhatsApp, spreadsheets, email, paper notes, memory — with a single, structured,
auditable system that runs as a PWA on iPhone.

The system is built for one operator or a small team. It is not a SaaS platform
for thousands of tenants. It is an operational spine.

---

## Core Modules

| Module | Purpose | Status |
|---|---|---|
| **FineGuard** | Companies House deadline monitoring, alert scheduling, reminder dispatch | Live |
| **UltAi** | AI-assisted work capture, drafting, decision support | Live |
| **VaultLine** | Document management and records | Live |
| **Work Items** | Capture, control and track every piece of live work | Live |
| **Tasks** | Lightweight action items linked to work | Live |
| **Calls** | Call log — every call recorded, linked to work or contacts | Live |
| **Money** | Invoices and quotes | Live |
| **Contacts / People** | Business contacts with context | Live |
| **Decisions** | Escalation and decision tracking | Live |
| **Templates** | Reusable message and document templates | Live |
| **Alerts** | OS-level business alerts with severity | Live |
| **Messages** | Internal thread-based messaging | Live |
| **Today** | Command centre — consolidation rate widget, priorities, activity | Live |

---

## Technical Foundation

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Server components, file-based routing, Vercel-native |
| Database | Supabase Postgres | Managed Postgres, real-time, row-level security ready |
| ORM | Drizzle ORM v0.30 | Type-safe, lightweight, no code generation requirement |
| Driver | postgres-js | Minimal, pooler-compatible with Supabase transaction mode |
| Hosting | Vercel | Zero-config Next.js, serverless functions, edge middleware |
| Auth | JWT via `jose` + session cookie | Stateless, no third-party auth dependency |
| Payments | Stripe | Checkout + webhooks for FineGuard subscriptions |
| Email | Resend (optional) | FineGuard reminder dispatch — workflow never fails if absent |
| AI | OpenAI | UltAi voice transcription and drafting |
| Styling | Tailwind CSS | Utility-first, mobile-first |

---

## Architecture Principles

### 1. Single Source of Truth
One Supabase Postgres database. No per-module databases, no Redis, no external
state stores. All auditable tables are append-only.

### 2. Mobile-First, PWA-Ready
Every page is designed for iPhone Safari first. Target: 375 px viewport,
thumb-reachable navigation, no hover states required. The app is installable
as a PWA via "Add to Home Screen".

### 3. Shared Business Spine
Work items, activity logs, decisions, and templates are shared infrastructure
used by all modules. Modules do not duplicate this spine.

### 4. Deterministic Workflows
All compliance and operational workflows are explicit, sequential, and
idempotent. No probabilistic agent loops. No LangGraph. No multi-agent
orchestration in the critical path.

### 5. Operator-Grade Reliability
Every major operation is logged with a `run_id`. Every write has a corresponding
audit trail. Failures are explicit, not silent.

### 6. Instrumentation Without Breakage
The Validation & Measurement Framework (`ut_activity_events`, `ut_daily_metrics`,
`ut_weekly_reports`) is append-only and fire-and-forget. It never blocks primary
flows. Tracking errors are swallowed.

### 7. No Unnecessary Infrastructure
No Prisma. No tRPC. No monorepo. No extra CI runners. No feature flags. No
backwards-compatibility shims. Add the minimum required to ship the feature.

---

## Navigation Structure

```
/               Landing / marketing
/login          Authentication
/today          Command centre (post-login default)
/dashboard      Redirect → /today
/os             UltraTechOS home
/os/work-items  Work item management
/os/tasks       Task management
/os/calls       Call log
/os/alerts      Business alerts
/os/documents   Document management
/os/money       Invoices + quotes
/os/contacts    People / contacts
/os/messages    Internal messaging
/os/decisions   Decision escalations
/os/templates   Message templates
/os/companies   Monitored companies
/os/leads       Lead management
/os/activity    Activity log
```

---

## Database Migration Convention

- Migration files live in `db/migrations/`.
- File naming: `NNNN_short_description.sql`.
- All statements use `IF NOT EXISTS` — idempotent, safe to re-run.
- The Drizzle schema in `db/schema.ts` is the TypeScript source of truth.
- Migrations are applied manually via Supabase SQL Editor or `psql`.

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | Supabase Postgres (transaction pooler, port 6543) |
| `JWT_SECRET` | Yes | Session cookie signing |
| `APP_PASSCODE` | Yes | Operator login passcode |
| `COMPANIES_HOUSE_API_KEY` | FineGuard | Companies House REST API |
| `STRIPE_SECRET_KEY` | FineGuard billing | Stripe server key |
| `STRIPE_PRICE_ID` | FineGuard billing | Subscription price ID |
| `STRIPE_WEBHOOK_SECRET` | FineGuard billing | Webhook signature verification |
| `RESEND_API_KEY` | Optional | FineGuard email dispatch |
| `CRON_SECRET` | Optional | Unauthenticated cron access to workflow routes |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Client-side Supabase features |

---

## Products — Boundaries

**FineGuard** monitors UK company compliance deadlines via the Companies House API.
It is a separate branded product with its own Stripe subscription. Its workflow
tables (`fg_*`) are isolated. Do not modify FineGuard workflow logic without
explicit instruction.

**UltAi** provides AI-assisted work capture and drafting. It uses OpenAI.
Do not replace the OpenAI integration or add alternative AI providers without
explicit instruction.

**VaultLine** is the document management module. It uses `os_documents` in the
shared schema.

---

## What UltraTechOS Is Not

- Not a multi-tenant SaaS platform
- Not a general-purpose CRM
- Not a replacement for accounting software
- Not an AI agent framework
- Not a monorepo
- Not built on Prisma, tRPC, LangGraph, CrewAI, or any agent framework
- Not designed for thousands of concurrent users
