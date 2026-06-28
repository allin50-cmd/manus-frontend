# Phase 4 — Database Consolidation

**Date:** 2026-06-28  
**Scope:** Prisma vs Drizzle dependency audit for UltraCore codebase (main branch)  
**Method:** grep search across all app/, lib/, and config files; package.json inspection  

---

## Executive Finding

**Prisma is already functionally removed from UltraCore.**  
The only remaining Prisma artefacts are two orphaned files (`prisma/schema.prisma`, `prisma/seed.ts`) that no live code references. They are safe to delete.

---

## Drizzle Dependency Map

All database access in the codebase routes through Drizzle:

| File | Role |
|---|---|
| `lib/db.ts` | Drizzle client singleton — `getDb()` returns `DrizzleDb` |
| `db/schema.ts` | Drizzle schema — single source of truth for all tables |
| `db/migrations/` | 9 idempotent SQL migration files |
| `app/api/**` | All API routes call `getDb()` and use `db.select()`, `db.insert()`, `db.update()` |

**Drizzle package entries (package.json):**
```json
"drizzle-orm": "^0.30.*",
"drizzle-kit": "^0.20.*",
"postgres": "^3.*"
```

---

## Prisma Dependency Audit

### Searched Locations

```bash
grep -r "from '@prisma\|require.*prisma" app/ lib/
# Result: ZERO matches

grep "@prisma/client" package.json
# Result: NOT FOUND (no prisma key at all)

ls prisma/
# Result: schema.prisma  seed.ts
```

### Audit Results

| Check | Result |
|---|---|
| `@prisma/client` in package.json | ❌ NOT PRESENT |
| `prisma` devDependency in package.json | ❌ NOT PRESENT |
| `import ... from '@prisma/client'` in app/ | ❌ ZERO results |
| `import ... from '@prisma/client'` in lib/ | ❌ ZERO results |
| `require('@prisma/client')` anywhere | ❌ ZERO results |
| `prisma generate` in scripts | ❌ NOT PRESENT |
| `prisma/schema.prisma` file | ✅ EXISTS (orphaned) |
| `prisma/seed.ts` file | ✅ EXISTS (orphaned) |

---

## Orphaned Files

### `prisma/schema.prisma`

An old Prisma schema file. It defines models for the same tables now managed by Drizzle in `db/schema.ts`. Since `@prisma/client` is not installed, this file cannot generate a Prisma client — it is effectively dead code.

**Risk of deleting:** NONE — nothing imports it, nothing runs it.

### `prisma/seed.ts`

A seed script that imports `PrismaClient`. Since `@prisma/client` is not installed, running `ts-node prisma/seed.ts` would immediately fail. There is no npm script referencing it.

**Risk of deleting:** NONE — it cannot execute in the current environment.

---

## How We Got Here

The migration from Prisma to Drizzle was completed incrementally (see DECISION_LOG.md `[2024] — Migrate from Prisma to Drizzle ORM`). The `lib/db.ts` was rewritten to use `drizzle-orm/postgres-js`, all API routes were updated to call `getDb()`, and the `@prisma/client` package entry was removed from `package.json`. The `prisma/` directory was left in place but was never cleaned up.

The `chore/drizzle-full-migration` branch was an attempt to complete this migration but was abandoned — it cannot install (npm install fails) and has 212 TypeScript errors.

---

## Current State Diagram

```
Live code path:
  API route → getDb() → drizzle-orm/postgres-js → Supabase Postgres

Orphaned (dead):
  prisma/schema.prisma  ──── no importer ──→ (dead)
  prisma/seed.ts        ──── @prisma/client not installed ──→ (dead)
```

---

## Recommended Actions

### Action 1: Delete Orphaned Prisma Files (Safe Now)

```bash
git rm prisma/schema.prisma prisma/seed.ts
git commit -m "remove orphaned Prisma files — Drizzle is sole ORM"
```

**Evidence for safety:**
- Zero imports in app/ or lib/
- `@prisma/client` not in package.json
- TypeScript build passes without them
- `lib/db.ts` uses Drizzle exclusively

### Action 2: No Further Migration Needed

The database layer is already consolidated on Drizzle. No code changes are required beyond deleting the two orphaned files.

### Action 3: Do NOT Merge drizzle-full-migration Branch

That branch is broken (cannot install, 212 TypeScript errors). It was an abandoned migration attempt that does not represent a valid working state. Merging it would break the codebase.

---

## Decision Log Entry

This analysis supports the following decision for `docs/DECISION_LOG.md`:

> **[2026-06-28] — Remove orphaned Prisma files**  
> Decision: Delete `prisma/schema.prisma` and `prisma/seed.ts`.  
> Reason: Confirmed zero dependencies across all app/ and lib/ files. `@prisma/client` is not in package.json and has not been since the Drizzle migration. These files are dead code.  
> Approved By: Consolidation audit (this document).

---

## Conclusion

The Drizzle migration was already complete before this consolidation audit began. The only remaining task is a two-file cleanup of the `prisma/` directory. No code changes, no migrations, and no dependency updates are required.
