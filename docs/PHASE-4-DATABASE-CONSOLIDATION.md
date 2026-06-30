# Phase 4 — Database Consolidation

**Date:** 2026-06-28 (updated after canonical branch correction)  
**Scope:** Prisma vs Drizzle audit across canonical branch `chore/drizzle-full-migration`  
**Method:** `git show` inspection of lib/db.ts, package.json, db/schema.ts on canonical branch  

---

## Critical Correction from Earlier Audit

The original Phase 4 document (based on `main` branch) stated:
> "Prisma is already functionally removed from UltraCore."

**This was based on the wrong branch.** That finding was accurate for `main` and `claude/jolly-hawking-xqufwo`, but the canonical branch is now `chore/drizzle-full-migration`, and the picture there is different.

---

## Actual State on chore/drizzle-full-migration

### lib/db.ts (canonical branch)

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

**Prisma IS the active ORM on the canonical branch.**  
`lib/db.ts` exports a `PrismaClient` instance. Routes call `db.model.findMany()` etc.

### package.json (canonical branch)

```json
"scripts": {
  "db:push": "prisma db push",
  "prisma:generate": "prisma generate",
  "postinstall": "prisma generate"
},
"prisma": "^5.14.0"
```

`@prisma/client` is an installed, active dependency. `prisma generate` runs on `postinstall`.

### db/schema.ts (canonical branch)

A Drizzle schema file also exists. It defines tables using `pgTable()` / `drizzle-orm`.

**This is a dual-ORM state:** Prisma is the live ORM; Drizzle schema exists as part of an in-progress migration.

---

## Dual-ORM Inventory

| File | ORM | Status |
|---|---|---|
| `lib/db.ts` | Prisma | ACTIVE — all live routes use `db.*` |
| `prisma/schema.prisma` | Prisma | ACTIVE — generates `@prisma/client` |
| `package.json` (prisma dep) | Prisma | ACTIVE — installed, postinstall runs generate |
| `db/schema.ts` | Drizzle | PRESENT — migration in progress |
| `db/migrations/` | Drizzle | PRESENT — SQL files for Drizzle tables |

---

## What "chore/drizzle-full-migration" Means

The branch name describes its intent: migrating all code from Prisma to Drizzle. That migration is **in progress**, not complete. The branch currently:

- Uses Prisma as the operational ORM (all existing routes)
- Has a Drizzle schema defined (beginning of the migration)
- Passes TypeScript, build, and 130 tests — meaning the dual state is stable

---

## What Must NOT Happen

**DO NOT delete Prisma files or remove `@prisma/client` from `package.json`.**

Doing so would:
1. Break `postinstall` (prisma generate runs on every `npm install`)
2. Break every API route that calls `db.model.*`
3. Break the TypeScript build (Prisma types are referenced throughout)
4. Break all 130 tests

**Prisma removal must happen AFTER a verified, complete Drizzle migration, not before.**

---

## Prisma Dependency Audit (chore/drizzle-full-migration)

| Check | Result |
|---|---|
| `@prisma/client` in package.json | ✅ PRESENT (active dependency) |
| `prisma` in package.json scripts | ✅ PRESENT (`db:push`, `prisma:generate`, `postinstall`) |
| `lib/db.ts` imports PrismaClient | ✅ YES — primary database client |
| `prisma/schema.prisma` | ✅ PRESENT (active schema) |
| `db/schema.ts` (Drizzle) | ✅ PRESENT (migration in progress) |

---

## Drizzle Migration Status

The migration from Prisma to Drizzle is **in progress** on `chore/drizzle-full-migration`. The Drizzle schema exists, but the route-level migration (changing `db.model.findMany()` to `db.select().from(table)`) has not been completed across all routes.

**Current situation:** Drizzle schema is defined but not yet the live data access path.

---

## Recommended Actions

### Action 1: Do NOT Delete Prisma (Yet)

Prisma is actively used. Deleting it now would break the codebase. Defer until:
- All API routes are rewritten to use Drizzle's `getDb()` pattern
- All tests pass with Drizzle only
- `lib/db.ts` is updated to export `DrizzleDb` instead of `PrismaClient`

### Action 2: Complete the Drizzle Migration (Future Work)

The migration path is:
1. Identify all routes using `db.model.*` Prisma syntax
2. Rewrite each to use `const db = await getDb(); db.select().from(...)` Drizzle syntax
3. Update `lib/db.ts` to remove PrismaClient
4. Remove `@prisma/client` from package.json
5. Delete `prisma/schema.prisma` (it becomes redundant when Drizzle schema is canonical)
6. Verify all tests pass with Drizzle only

**This is deferred — it is not a consolidation task, it is a future engineering sprint.**

### Action 3: Promote chore/drizzle-full-migration to main as-is

The dual-ORM state is stable (build passes, tests pass). Promote to main without completing the Drizzle migration. The migration can be completed in a future sprint from main.

---

## Conclusion

The canonical branch `chore/drizzle-full-migration` is in a dual-ORM transition state:
- **Prisma**: active, must not be removed
- **Drizzle**: schema defined, migration in progress

Do not delete any Prisma files. Do not remove `@prisma/client`. Complete the Drizzle migration as a separate, future engineering effort after the consolidation is complete.
