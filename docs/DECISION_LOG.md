# Architectural Decision Log

This log records major architectural decisions for UltraTechOS.
All significant decisions must be recorded here before or immediately after implementation.

---

## Format

```
## [YYYY-MM-DD] — Decision title

**Decision:** What was decided.
**Reason:** Why this decision was made.
**Alternatives Considered:** What else was evaluated.
**Approved By:** Who approved (user / session / both).
```

---

## Decisions

---

## [2024] — Migrate from Prisma to Drizzle ORM

**Decision:** Replace Prisma ORM with Drizzle ORM v0.30 using the postgres-js driver.

**Reason:** Drizzle is lighter, requires no code generation step, has better
compatibility with Vercel edge functions and Supabase transaction-mode pooling,
and produces smaller bundles. It also avoids the cold-start overhead of
Prisma's query engine binary.

**Alternatives Considered:** Prisma (existing), Kysely, raw SQL via postgres-js.

**Approved By:** User.

---

## [2024] — Supabase Postgres as sole database

**Decision:** Use a single Supabase Postgres instance for all modules.
No Redis, no secondary database, no per-module storage.

**Reason:** Simplicity, single source of truth, shared connection pool,
no synchronisation complexity. All FineGuard, OS, measurement, and ClerkOS
tables share one database.

**Alternatives Considered:** Neon, PlanetScale, Redis for caching.

**Approved By:** User.

---

## [2024] — JWT session auth via `jose`

**Decision:** Implement authentication as a passcode → JWT stored in a session
cookie. No third-party auth provider.

**Reason:** Single-operator use case does not require OAuth or multi-user
account management. Eliminates dependency on Clerk, Auth0, or NextAuth.

**Alternatives Considered:** NextAuth, Clerk, Supabase Auth.

**Approved By:** User.

---

## [2024] — Vercel as sole hosting provider

**Decision:** Deploy exclusively on Vercel. No Docker, no Azure, no self-hosting.

**Reason:** Zero-config Next.js deployment, serverless functions match the
App Router model, automatic preview deployments, Supabase add-on available.

**Alternatives Considered:** Azure (investigated, deprecated), Railway, Fly.io.

**Approved By:** User.

---

## [2024] — FineGuard as isolated compliance product

**Decision:** FineGuard uses dedicated `fg_*` tables, its own workflow in
`lib/fineguard-workflow.ts`, and its own Stripe subscription. It is a
separately branded product, not an OS module.

**Reason:** FineGuard has its own billing lifecycle, its own Companies House
API dependency, and its own customer-facing email delivery. Isolation prevents
core OS changes from breaking compliance workflows.

**Alternatives Considered:** Treating FineGuard as an OS module (rejected —
different billing, different user journey).

**Approved By:** User.

---

## [2025-06-24] — Add Validation & Measurement Framework

**Decision:** Create `ut_activity_events`, `ut_daily_metrics`, and
`ut_weekly_reports` tables plus `lib/ut-tracker.ts` for fire-and-forget
event tracking. Instrument all major OS actions. Add Operational Consolidation
Rate widget to the Today page.

**Reason:** Objective measurement of whether UltraTechOS is becoming the
primary operating layer. Tracks DAU, task throughput, and work that still
happens outside the system (workflow_leak events).

**Alternatives Considered:** Third-party analytics (Mixpanel, Posthog) —
rejected as unnecessary external dependency for a single-operator tool.

**Approved By:** User.

---

## [2025-06-24] — Formalise governance documents

**Decision:** Create `ULTRATECHOS.md` (product constitution), `ANTI_DRIFT.md`
(engineering rules), `docs/DECISION_LOG.md`, `docs/ARCHITECTURE_GUARDRAILS.md`,
`CLAUDE.md`, and a build-time governance check script.

**Reason:** Multiple AI coding sessions (Claude Code, Codex, Cursor, Manus)
risk drifting the codebase. Governance documents provide a machine-readable
constitution that sessions must read before making changes.

**Alternatives Considered:** Code comments only (insufficient for cross-session
governance), CI linting rules (too brittle), PR templates only (too easy to skip).

**Approved By:** User.

---

## [2026-06-26] — Keep defensive JSON-body handling in app/api/auth/login/route.ts

**Decision:** Retain the `req.json().catch(() => null)` guard and null-body 400
response added to `app/api/auth/login/route.ts`. Do not revert.

**Reason:** The change is reliability and security hardening only. It prevents
a malformed JSON request body from propagating as an unhandled exception and
returning a 500, replacing it with a controlled 400. It does not alter auth
logic, session semantics, cookie behaviour, permissions, or any product
behaviour.

**Governance note:** The change was made during an AI session before approval,
in violation of the `app/api/auth/` confirmation requirement in `ANTI_DRIFT.md`.
The breach was immediately disclosed and approved retrospectively by George.
The `CLAUDE.md` protected-file rule has been reinforced to require immediate
reporting of any emergency defensive fix to a protected file.

**Alternatives Considered:** Revert the change — rejected because it would
restore avoidable 500 errors on the login endpoint with no safety benefit.

**Approved By:** George.

---

<!-- Add new decisions above this line -->
