# Blocker 04: ClerkOS Migration Path Verification

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25
**Branch:** claude/ultracore-consolidation-audit-KmP0r

---

## Scope

Verify the ClerkOS migration path:
- `drizzle.clerkos.config.ts`
- `server/drizzle/schema.ts`
- `server/drizzle/migrations/`
- `server/drizzle/migrate.ts`
- `server/drizzle/seed.ts`
- `package.json` database scripts

---

## Files Inspected

| File | Purpose |
|---|---|
| `drizzle.clerkos.config.ts` | Drizzle-kit configuration for ClerkOS schema |
| `server/drizzle/schema.ts` | TypeScript schema definition (9 tables) |
| `server/drizzle/migrations/0000_lowly_gressill.sql` | Initial schema migration |
| `server/drizzle/migrations/0001_cold_agent_zero.sql` | UUID audit columns migration |
| `server/drizzle/migrations/meta/_journal.json` | Migration journal (2 entries) |
| `server/drizzle/migrate.ts` | Migration runner script |
| `server/drizzle/seed.ts` | System tenant seed script |
| `package.json` | `db:generate:clerkos`, `db:migrate:clerkos`, `db:seed:clerkos`, `db:bootstrap` scripts |

---

## Commands Executed

### Attempt 1: `npm run db:generate:clerkos`

**Command:**
```
npm run db:generate:clerkos
```

**Output (before fix):**
```
Error: DATABASE_URL environment variable is not set
    at Object.<anonymous> (drizzle.clerkos.config.ts:7:9)
```

**Root cause:** `drizzle.clerkos.config.ts` had a hard `throw` if `DATABASE_URL` was absent. The `generate:pg` command does not need a database connection (it reads schema TypeScript files only), but the config threw before drizzle-kit could proceed.

**Fix applied:** Changed `drizzle.clerkos.config.ts` to fall back to a placeholder connection string when `DATABASE_URL` is absent. `db:migrate:clerkos` will still fail correctly if DATABASE_URL is absent (the runner script exits with code 1 in that case).

### Attempt 2: `npm run db:generate:clerkos` (after fix)

**Command:**
```
npm run db:generate:clerkos
```

**Output:**
```
drizzle-kit: v0.20.18
drizzle-orm: v0.29.5

Reading config file '/home/user/manus-frontend/drizzle.clerkos.config.ts'
9 tables
clerk_audit_events 13 columns 3 indexes 1 fks
clerk_bundles 10 columns 2 indexes 1 fks
clerk_cases 12 columns 2 indexes 1 fks
clerk_allocations 13 columns 1 indexes 1 fks
clerk_diaries 9 columns 2 indexes 1 fks
clerk_documents 15 columns 2 indexes 1 fks
clerk_hearings 11 columns 2 indexes 1 fks
tenants 7 columns 0 indexes 0 fks
clerk_users 10 columns 3 indexes 1 fks

No schema changes, nothing to migrate 😴
```

**Result:** PASS — generation succeeds. No new migration needed. Schema matches migrations exactly.

### Drift verification (independent check)

Generated migrations fresh into a temp directory from current schema. Compared with cumulative `0000 + 0001` state:

- Fresh generation produces `entity_id integer` (nullable) ✓
- Fresh generation produces `entity_uuid uuid` column ✓
- Fresh generation produces `correlation_id uuid` column ✓
- `0000_lowly_gressill.sql` originally had `entity_id integer NOT NULL` ✓
- `0001_cold_agent_zero.sql` drops NOT NULL and adds the two UUID columns ✓

**No migration drift. The two-migration history correctly reflects the current schema.**

### `npm run db:migrate:clerkos` (without DATABASE_URL)

This command correctly fails when `DATABASE_URL` is absent:

```
DATABASE_URL environment variable is not set
Process exited with code 1
```

This is correct behavior — migration requires a live database. No fix needed.

---

## Schema Verification

### Table count: 9 (matches schema.ts)

| Table | Purpose |
|---|---|
| `tenants` | Multi-tenant registry |
| `clerk_users` | Users per tenant |
| `clerk_cases` | Case management |
| `clerk_hearings` | Hearings per case |
| `clerk_documents` | Documents per case |
| `clerk_bundles` | Bundle generation tracking |
| `clerk_allocations` | Task allocation per clerk |
| `clerk_diaries` | Clerk diary / calendar entries |
| `clerk_audit_events` | Immutable audit trail |

### `clerk_audit_events` column state (post-migration)

| Column | Type | Nullable | Notes |
|---|---|---|---|
| `entity_id` | integer | YES | Integer PK for ClerkOS entities |
| `entity_uuid` | uuid | YES | UUID for brand-suite entities |
| `correlation_id` | uuid | YES | Request correlation chain |

Application-layer constraint: `writeAuditEvent()` throws if neither `entityId` nor `entityUuid` is provided. The DB allows both null; the application enforces at-least-one.

---

## Failures Found

| # | Failure | Severity | Status |
|---|---|---|---|
| 1 | `db:generate:clerkos` throws with missing `DATABASE_URL` | High | **Fixed** |

---

## Fixes Applied

### Fix 1: `drizzle.clerkos.config.ts`

**Before:**
```ts
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}
export default { dbCredentials: { connectionString: process.env.DATABASE_URL }, ... }
```

**After:**
```ts
const connectionString = process.env.DATABASE_URL ?? 'postgres://placeholder/placeholder';
export default { dbCredentials: { connectionString }, ... }
```

**Effect:** `db:generate:clerkos` now works in any environment. `db:migrate:clerkos` still fails correctly when `DATABASE_URL` is absent (the `migrate.ts` runner handles this).

---

## Migration Execution Instructions

To run migrations against a live database:

```bash
# 1. Set database URL
export DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 2. ClerkOS schema (runs 0000 + 0001 if not already applied)
npm run db:migrate:clerkos

# 3. Brand-suite schema
npm run db:migrate

# 4. System tenant seed
npm run db:seed:clerkos

# Or all in one step:
npm run db:bootstrap
```

---

## Rollback Instructions

Drizzle-kit does not generate down-migrations automatically. To roll back:

1. Create a reverse SQL file manually
2. Execute via `psql` or any PostgreSQL client
3. Remove the corresponding entry from `server/drizzle/migrations/meta/_journal.json`

For `0001_cold_agent_zero.sql` specifically, the rollback SQL would be:

```sql
ALTER TABLE "clerk_audit_events" ALTER COLUMN "entity_id" SET NOT NULL;
ALTER TABLE "clerk_audit_events" DROP COLUMN IF EXISTS "entity_uuid";
ALTER TABLE "clerk_audit_events" DROP COLUMN IF EXISTS "correlation_id";
DROP INDEX IF EXISTS "audit_entity_uuid_idx";
```

**Warning:** Rolling back `0001` will break the application layer — `writeAuditEvent()` requires `entity_uuid` for brand-suite entities. Do not roll back without also reverting the application code.

---

## Success Condition

- [x] `npm run db:generate:clerkos` completes without error: reports `No schema changes, nothing to migrate`
- [x] Schema and migrations confirmed in sync (9 tables, correct column states)
- [x] No migration drift
- [ ] `npm run db:migrate:clerkos` — requires live DATABASE_URL (not run in this environment; command verified to fail correctly without DB)
