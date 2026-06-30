# Architecture Guardrails

This document lists what is approved for use in UltraTechOS and what is not.
Read `ANTI_DRIFT.md` for the full governance rules.

---

## Approved — Fixed Choices

These decisions are permanent. Do not replace, migrate away from, or add
alternatives to these without explicit written approval from the project owner.

| Layer | Approved Choice |
|---|---|
| Hosting | Vercel (serverless, zero-config Next.js) |
| Database | Supabase Postgres (single instance, shared by all modules) |
| ORM | Drizzle ORM v0.30 with postgres-js driver |
| Framework | Next.js 14 App Router |
| Auth | JWT via `jose` + session cookie (passcode login) |
| Styling | Tailwind CSS (mobile-first, 375 px viewport) |
| Payments | Stripe (FineGuard subscriptions only) |
| AI | OpenAI (UltAi module only) |
| Email | Resend (FineGuard reminders only, optional) |
| UI paradigm | Mobile-first PWA, installable on iPhone Safari |
| Compliance product | FineGuard — isolated `fg_*` tables, own Stripe subscription |
| AI product | UltAi — OpenAI voice transcription and drafting |
| Document product | VaultLine — `os_documents` table in shared schema |
| Business spine | Shared `os_*` tables (work items, tasks, alerts, contacts, messages, decisions, templates) |
| Workflows | Deterministic, sequential, idempotent — no agent loops |
| Audit tables | Append-only — `INSERT` only, never `UPDATE` or `DELETE` |
| Measurement | `ut_*` tables — fire-and-forget, never blocks primary flows |

---

## Not Approved Without Explicit Instruction

Adding any of the following requires explicit written approval from the project
owner in the session prompt:

| Category | Not Approved |
|---|---|
| ORM | Prisma, TypeORM, Kysely, raw pg |
| API layer | tRPC, GraphQL, REST abstraction (routes already use direct Drizzle) |
| Repo structure | Monorepo (Turborepo, Nx, pnpm workspaces) |
| AI frameworks | LangChain, LangGraph, CrewAI, AutoGen, any multi-agent framework |
| AI providers | Any provider other than OpenAI |
| Auth | NextAuth, Clerk, Auth0, Supabase Auth, any third-party auth |
| Database | Redis, MongoDB, Neon, PlanetScale, any second database |
| Workflow automation | n8n, Temporal, any external workflow engine |
| Styling | CSS-in-JS, Styled Components, Emotion, any non-Tailwind system |
| Dashboards | Any new `/dashboard` or command-centre route (one exists: `/today`) |
| Navigation | Any new top-level route or primary nav section not listed in ULTRATECHOS.md |
| Products | Any new named product beyond FineGuard, UltAi, VaultLine |
| Schema | `DROP COLUMN`, `ALTER COLUMN` (type change), `RENAME COLUMN` or `RENAME TABLE` |
| Migrations | Any migration that is not additive (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`) |

---

## Shared Business Spine

The following tables are shared infrastructure used by all modules.
Do not duplicate them per-module; do not extract them to a separate service.

- `os_work_items` — live work, the primary operational unit
- `os_tasks` — lightweight action items, linked to work items
- `os_calls` — call log
- `os_alerts` — OS-level business alerts
- `os_documents` — document records (VaultLine)
- `os_invoices` — invoice records
- `os_quotes` — quote records
- `os_contacts` / `os_people` — contacts and people
- `os_messages` — internal thread-based messages
- `os_decisions` — decision and escalation records
- `os_templates` — reusable message/document templates
- `os_companies` — monitored companies (FineGuard + general)
- `os_leads` — lead management

---

## FineGuard Isolation

FineGuard tables (`fg_*`) and workflow (`lib/fineguard-workflow.ts`) are isolated.
Changes to FineGuard require explicit instruction and must not affect the shared `os_*` spine.

- `fg_companies` — monitored companies, deadlines, alert state
- `fg_audit_runs` / `fg_audit_companies` / `fg_audit_alerts` — append-only audit trail
- `fg_subscriptions` — Stripe subscription state

---

## Measurement Framework

The `ut_*` tables are measurement infrastructure. Rules:

- `trackEvent()` must always be fire-and-forget (wrapped in try/catch, never awaited in a way that can block)
- Never convert tracking errors into thrown exceptions
- Aggregation routes (`/api/ut/aggregate/`) are idempotent — safe to re-run
- Daily metrics use `onConflictDoUpdate`; weekly reports use `onConflictDoUpdate`

---

## Migration Convention

- Files: `db/migrations/NNNN_short_description.sql`
- All statements: `IF NOT EXISTS` — idempotent, safe to re-run
- Applied manually via Supabase SQL Editor or `psql`
- Never: `DROP`, `RENAME`, or destructive `ALTER`
