# Decisions Log

Decisions that have been made and should NOT be re-litigated.

## D01 — Canonical branch is chore/drizzle-full-migration

**Decision:** `chore/drizzle-full-migration` is the only branch to develop on.

**Why:** It passes type-check, build, and 130/130 tests. It has Phase 4 Sprint 1 forms. Other branches are source-only for selective extraction.

**Date:** June 2026

---

## D02 — Do not remove Prisma yet

**Decision:** Prisma remains as the active runtime ORM. Drizzle is the migration target but is not yet used in production routes.

**Why:** Removing Prisma requires converting every route. That's a large, risky migration. The dual-ORM pattern in `lib/db.ts` allows both to coexist safely.

---

## D03 — lib/types.ts is the enum source of truth (not @prisma/client)

**Decision:** Routes import enum types from `@/lib/types`, not from `@prisma/client`.

**Why:** In CI/Vercel environments, `prisma generate` may fail (binary download) or may not have run yet. `@prisma/client` enums require successful generation. `lib/types.ts` is independent of Prisma codegen and always available.

---

## D04 — Lazy Prisma initialisation

**Decision:** `lib/db.ts` uses a Proxy pattern to defer `new PrismaClient()` until first use.

**Why:** Module-level `new PrismaClient()` crashes if the Prisma binary hasn't been generated. Lazy init prevents module-load crashes.

---

## D05 — Never merge sheetops wholesale

**Decision:** `claude/ultracore-sheetops-mvp-wAwwp` must never be merged wholesale into canonical.

**Why:** It deletes `lib/types.ts`, `db/schema.ts`, `lib/db.drizzle-wip.ts`, 7 OS form pages, and removes Drizzle from `package.json`. These are all wrong for the canonical architecture.

**Correct process:** Cherry-pick individual features after reviewing each file.

---

## D06 — vercel.json must NOT use db push --accept-data-loss

**Decision:** The build command stays as `npx prisma generate && npm run build`.

**Why:** `db push --accept-data-loss` silently drops columns in production. Only `prisma migrate deploy` is safe for production schema migrations.

---

## D07 — No Vercel project deletions until canonical branch is stable on main

**Decision:** Do not delete any Vercel project until:
1. `chore/drizzle-full-migration` is promoted to `main`
2. Deployment is verified on the production project
3. A rollback path exists

**Projects to keep:** manus-frontend, agent-x, ult-ai-lite
**Projects to review later:** manus-frontend-c9li, manus-frontend-edg7, manus-frontend-sheetops, manus-frontend-sheetops-iphone

---

## D08 — ActionStatus and other enums must come from @/lib/types in new routes

**Decision:** New routes that use Prisma enum types must import from `@/lib/types`, not `@prisma/client`.

**Why:** Same as D03. This is the established pattern on the canonical branch.

---

## D09 — Work-item status rules live in server/workflow, never in the UI

**Decision:** All `WorkItem` status transitions are validated server-side against `WORK_ITEM_TRANSITIONS` in `server/workflow/workflowTransitions.ts`. Every transition runs in one transaction that updates the row, stamps `lastTouchedAt`, and writes a `StatusChanged` activity record. Active statuses may move freely between each other; leaving `Completed`, `NotFit`, or `Archived` requires the explicit reopen/restore transitions in the map.

**Why:** The rules existed implicitly across UI components and routes. One map means future modules (tasks, quotes, bookings) reuse the same engine instead of re-implementing checks, and the UI can never create states the server would not.

**Not yet on the engine:** the escalate route, decision-resolution status flip, and `Action` status changes still write status directly (documented technical debt).
