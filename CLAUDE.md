# CLAUDE.md — AI Session Governance for UltraTechOS

> Before making any architectural, database, framework, workflow, navigation,
> or product changes, read `ULTRATECHOS.md` and `ANTI_DRIFT.md`.

---

## Required Reading

Every AI coding session must read these files before making any changes:

- [`ULTRATECHOS.md`](./ULTRATECHOS.md) — product constitution (what this is, what it's not)
- [`ANTI_DRIFT.md`](./ANTI_DRIFT.md) — engineering rules (what is blocked, what requires confirmation)
- [`docs/ARCHITECTURE_GUARDRAILS.md`](./docs/ARCHITECTURE_GUARDRAILS.md) — approved and not-approved technology choices
- [`docs/DECISION_LOG.md`](./docs/DECISION_LOG.md) — log of major architectural decisions

Failure to read these before making structural changes is the primary cause of
architectural drift in AI-assisted sessions.

---

## Project Summary

UltraTechOS is a **mobile-first Business Operating System** for small UK businesses.
It is built on Next.js 14 App Router, Drizzle ORM, Supabase Postgres, and Tailwind CSS.
It is deployed on Vercel. It uses JWT session auth via `jose`. It is a PWA.

**Core modules:** FineGuard (compliance), UltAi (AI), VaultLine (documents),
Work Items, Tasks, Calls, Money, Contacts, Decisions, Templates, Alerts, Messages, Today.

---

## Hard Constraints

These cannot be changed without explicit written approval:

- ORM: Drizzle only. No Prisma, no TypeORM, no raw pg.
- Auth: JWT/jose only. No NextAuth, Clerk, or Auth0.
- Database: Supabase Postgres only. No Redis, no second database.
- Hosting: Vercel only.
- Styling: Tailwind only.
- AI: OpenAI only (UltAi module). No LangChain, LangGraph, CrewAI.
- Structure: Single Next.js app. No monorepo.

---

## What Requires Confirmation

Before doing any of the following, stop and ask the user:

- Adding a new database migration
- Adding a new top-level API route group
- Adding a new npm dependency
- Adding a new page under `/os/`
- Changing any existing API route's response shape
- Modifying `lib/fineguard-workflow.ts` or any `fg_*` table
- Modifying `lib/auth.ts`, `app/api/auth/`, or middleware

---

## What Is Safe Without Asking

- Fixing a bug in a file that is explicitly named in the prompt
- Adding `trackEvent()` calls (fire-and-forget, never blocking)
- Adding `export const dynamic = 'force-dynamic'` to API routes
- Adding `.limit()` to unbounded DB queries
- Adding type/enum validation guards to existing routes
- Adding to `docs/DECISION_LOG.md`

---

## Key Files

| File | Purpose |
|---|---|
| `db/schema.ts` | Drizzle schema — single source of truth |
| `lib/db.ts` | Lazy-init Drizzle client singleton (`getDb()`) |
| `lib/auth.ts` | JWT session auth (`getSession()`, `requireAuth()`) |
| `lib/ut-tracker.ts` | Fire-and-forget event tracker (`trackEvent()`) |
| `lib/fineguard-workflow.ts` | FineGuard compliance workflow — do not modify without instruction |
| `db/migrations/` | SQL migration files (idempotent, additive only) |
| `app/api/` | API route handlers (direct Drizzle calls, no abstraction layer) |
| `app/today/` | Command centre — post-login default |
| `ULTRATECHOS.md` | Product constitution |
| `ANTI_DRIFT.md` | Engineering governance rules |

---

## Commit Message Convention

Use the imperative mood, present tense. Examples:
- `add task_completed event to work-items PATCH route`
- `fix weekly aggregation Monday calculation`
- `create ut_activity_events migration`

Do not reference issue numbers, Claude session IDs, or model names in commit
messages or code comments.

---

## Build Commands

```bash
npm run type-check   # TypeScript check (no emit)
npm run build        # Next.js production build
npm run dev          # Local dev server
```

The build runs a governance check (`scripts/check-governance.js`) that fails
if `ULTRATECHOS.md` or `ANTI_DRIFT.md` are missing from the repo root.
