# Anti-Drift Governance

> Drift is what happens when a coding session solves the immediate problem
> but moves the codebase away from its intended architecture.
>
> This document defines the rules that prevent it.
> All development sessions — human or AI — must read this before making
> architectural, database, framework, workflow, navigation, or product changes.

---

## The Core Rule

**Do not change what is not broken. Do not add what is not asked for.**

Every line of code added without an explicit requirement is potential drift.
Every new dependency is a permanent obligation. Every new abstraction layer
is a maintenance burden. Err on the side of doing less.

---

## Prohibited Without Explicit Written Instruction

The following changes are **blocked** unless the user explicitly requests them
by name in the session prompt:

| Category | Blocked Action |
|---|---|
| ORM | Replace Drizzle with Prisma, TypeORM, or any other ORM |
| API layer | Add tRPC, GraphQL, or REST abstraction layers |
| Structure | Convert to monorepo (Turborepo, Nx, etc.) |
| AI | Add LangGraph, CrewAI, AutoGen, or any multi-agent framework |
| AI | Replace OpenAI with another provider |
| Auth | Replace JWT/jose with NextAuth, Clerk, Auth0, or similar |
| Database | Add Redis, MongoDB, or any second database |
| Hosting | Move away from Vercel |
| Styling | Replace Tailwind with CSS-in-JS or another framework |
| Navigation | Add a new primary navigation section or top-level route |
| Products | Add a new named product (e.g. new branded module) |
| Pricing | Change Stripe price IDs, product names, or billing amounts |
| Schema | Add a migration that modifies existing columns (only ADD new tables/columns) |
| Workflow | Modify `lib/fineguard-workflow.ts` or any `fg_*` table |
| Workflow | Modify Stripe webhook handlers (`app/api/stripe/`) |
| Auth | Modify `lib/auth.ts`, `app/api/auth/`, or middleware |

---

## Requires Confirmation Before Proceeding

The following changes are **not blocked** but require a clear explicit instruction
in the current session (not inferred from context):

- Adding a new database migration file
- Adding a new top-level API route group
- Adding a new npm dependency
- Changing the post-login redirect destination
- Adding a new page under `/os/`
- Modifying any existing API route's response shape

---

## Permitted Without Confirmation

The following are safe to do at any time:

- Fixing a bug in a file that is explicitly named in the prompt
- Adding `trackEvent()` calls to new routes (fire-and-forget, never blocks)
- Adding `export const dynamic = 'force-dynamic'` to API routes
- Adding `.limit()` to unbounded DB queries
- Adding validation guards (type checks, enum checks) to existing routes
- Adding to `docs/DECISION_LOG.md`
- Updating `FINEGUARD.md` documentation

---

## Known Drift Patterns — Watch For These

These patterns have appeared in previous sessions and caused architectural drift:

### 1. Framework Upgrade Creep
A session is asked to fix a bug and also "updates the ORM" or "migrates to
the latest version". Treat any version bump not requested as drift.

### 2. Dashboard Duplication
A session adds a new `/dashboard` or `/home` route when `/today` already serves
as the command centre. There must be exactly one command centre.

### 3. Agent Framework Injection
A task involving AI generates code that imports LangChain, LangGraph, CrewAI,
or similar. These are **never** acceptable in this codebase.

### 4. Silent Schema Drops
A migration drops or renames an existing column without explicit instruction.
All migrations must be additive only (`ADD COLUMN`, `CREATE TABLE`).
Never `DROP`, `ALTER COLUMN` (type change), or `RENAME`.

### 5. Abstraction Layering
A session adds a `services/` or `repositories/` layer that wraps Drizzle
for "better testability". This codebase uses direct Drizzle calls in API routes.
Do not add abstraction layers.

### 6. README Rewrite
A session rewrites `README.md` to reflect its mental model of the project.
Only add to README — never remove existing content without instruction.

### 7. Navigation Expansion
A session adds new items to the main OS navigation or creates new `/os/*`
pages that were not requested. Each new page is a permanent product commitment.

### 8. Tracking Breakage
The `trackEvent()` fire-and-forget pattern must never be converted to
throw-on-error. The measurement framework must never block primary flows.

---

## Red Flags in a Session Prompt

If a prompt contains any of the following without explicit approval context,
ask for clarification before proceeding:

- "migrate to"
- "refactor to use"
- "replace X with Y"
- "add a new dashboard"
- "upgrade the ORM"
- "convert to monorepo"
- "add LangChain" / "add agents" / "add crew"
- "redesign the navigation"
- "drop the table" / "drop the column"

---

## Scope Discipline

A session's scope is exactly what was asked. Examples:

| Prompt | In scope | Out of scope |
|---|---|---|
| "Fix the bug in the weekly aggregation" | Fix the date arithmetic bug | Refactoring the aggregation logic, adding caching, changing the schema |
| "Add a quote_created event" | Add one trackEvent call | Adding a quotes dashboard, redesigning the Money module |
| "Update the README" | Add the required section | Rewriting other sections, removing Prisma references from existing content |

---

## Governance Check

This repository has a build-time governance check (`scripts/check-governance.js`).
It fails the build if `ULTRATECHOS.md` or `ANTI_DRIFT.md` are missing from the
repository root. Do not delete these files.

---

## Approvals

Changes that are explicitly approved for this project:

- Vercel hosting — fixed
- Supabase Postgres — fixed
- Drizzle ORM — fixed
- Next.js 14 App Router — fixed
- JWT session auth — fixed
- Stripe for FineGuard billing — fixed
- Mobile-first Tailwind UI — fixed
- FineGuard compliance workflow — fixed
- UltAi OpenAI integration — fixed
- VaultLine document module — fixed
- Shared `ut_*` measurement framework — fixed
- Append-only audit tables — fixed
