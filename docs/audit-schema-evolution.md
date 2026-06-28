# Audit Schema Evolution

**Repository:** allin50-cmd/manus-frontend
**Branch:** claude/ultracore-consolidation-audit-KmP0r
**Date:** 2026-05-25

---

## Problem Statement

`clerk_audit_events.entity_id` was defined as `integer NOT NULL`. Brand-suite entities (intake forms, compliance bundles) use UUID primary keys. Calling `writeAuditEvent({ entityId: intake.id })` silently passed TypeScript compilation (server code excluded from `tsconfig.json`) but failed at runtime with:

```
invalid input syntax for type integer: "550e8400-e29b-41d4-a716-446655440000"
```

The interim workaround (`entityId: 0`) recorded no useful entity reference — every audit event pointed to a ghost entity.

---

## Schema Changes (Migration `0001_cold_agent_zero.sql`)

```sql
-- Make entity_id optional (ClerkOS serial IDs — still valid when present)
ALTER TABLE "clerk_audit_events" ALTER COLUMN "entity_id" DROP NOT NULL;

-- Add UUID column for brand-suite entities
ALTER TABLE "clerk_audit_events" ADD COLUMN "entity_uuid" uuid;

-- Add correlation ID for request tracing across systems
ALTER TABLE "clerk_audit_events" ADD COLUMN "correlation_id" uuid;

-- Index for efficient tenant+type+uuid lookups
CREATE INDEX IF NOT EXISTS "audit_entity_uuid_idx"
  ON "clerk_audit_events" ("tenant_id","entity_type","entity_uuid");
```

Applied to: `server/drizzle/migrations/0001_cold_agent_zero.sql`

---

## Drizzle Schema (`server/drizzle/schema.ts`)

```typescript
// clerk_audit_events columns after migration
entityId:      integer('entity_id'),         // nullable — ClerkOS serial IDs
entityUuid:    uuid('entity_uuid'),           // nullable — brand-suite UUID entities
correlationId: uuid('correlation_id'),        // nullable — request tracing

// Indexes
entityIdx:     index('audit_entity_idx').on(t.tenantId, t.entityType, t.entityId),
entityUuidIdx: index('audit_entity_uuid_idx').on(t.tenantId, t.entityType, t.entityUuid),
```

`InsertAuditEvent` is inferred from the schema — both `entityId` and `entityUuid` are optional at the TypeScript level.

---

## Application Validation (`server/trpc/db.ts`)

`writeAuditEvent()` enforces that at least one entity reference is provided:

```typescript
export async function writeAuditEvent(event: InsertAuditEvent): Promise<void> {
  if (event.entityId == null && event.entityUuid == null) {
    throw new Error(
      'writeAuditEvent: one of entityId or entityUuid is required — ' +
      `entity_type=${event.entityType}, action=${event.action}`
    );
  }
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(event);
}
```

---

## Call Site Changes

| Call site | Before | After |
|---|---|---|
| `POST /api/intake` | `entityId: 0` (workaround) | `entityUuid: intake.id` |
| `POST /api/compliance-bundle` | `entityId: 0` (workaround) | `entityUuid: bundle.id` |
| Stripe webhook | `entityId: 0` (workaround) | `entityUuid` not applicable — no DB entity yet |
| ClerkOS cases/allocations | `entityId: caseId` (integer) | unchanged — correct |

The Stripe webhook activation event has no single DB entity (it creates a `monitored_companies` row asynchronously). It uses a `correlationId` to trace the event through logs.

---

## TypeScript Safety Fix

Root cause of the silent UUID→integer mismatch:

```json
// tsconfig.json (frontend) — BEFORE
{
  "include": ["src"],      ← server/ excluded entirely
  "strict": false           ← type checking off
}
```

Fix: `server/tsconfig.json` created with:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "../src", "../dist"]
}
```

New npm script: `"type-check:server": "tsc -p server/tsconfig.json --noEmit"`

---

## Migration Tracking Fix

**Problem:** Both migration sets (ClerkOS and brand-suite) used the same `drizzle.__drizzle_migrations` tracking table. The drizzle-orm migrator selects `ORDER BY created_at DESC LIMIT 1` and only applies migrations with a newer `folderMillis`. The brand-suite migration timestamp (`1779697236504`) was older than the ClerkOS 0001 migration (`1779697713196`), so brand-suite migrations were silently skipped.

**Fix:** `server/db/migrate.ts` now passes `migrationsTable: 'brand_suite_migrations'`:

```typescript
await migrate(db, { migrationsFolder, migrationsTable: 'brand_suite_migrations' });
```

This creates a separate `drizzle.brand_suite_migrations` table so the two migration sets do not interfere with each other.

---

## Correlation ID Threading

All audit writes now carry a `correlationId` UUID generated per request:

```typescript
// server/lib/logger.ts
export function generateCorrelationId(): string {
  return randomUUID();
}

// server/index.ts — POST /api/intake
const correlationId = generateCorrelationId();
// ...
await writeAuditEvent({ ..., correlationId });
log({ level: 'info', event: 'intake.captured', correlationId, ... });
```

Correlation IDs enable tracing a single request across the audit log, structured logs, and retry events.

---

## Integration Test Coverage

`server/integration.test.ts` — 8 tests proving the schema evolution:

| Suite | Test | Verifies |
|---|---|---|
| bootstrap: ClerkOS schema | tenants table exists | Migration applied |
| bootstrap: ClerkOS schema | system tenant row | Correct seed data |
| bootstrap: ClerkOS schema | entity_uuid + correlation_id columns | New columns present |
| UltAi: intake → VaultLine | sourceRef column exists | Brand-suite schema |
| UltAi: intake → VaultLine | entityUuid + metadata round-trip | UUID stored correctly |
| FineGuard: compliance_check → VaultLine | entityUuid + correlationId preserved | UUID + trace |
| writeAuditEvent: validation | rejects missing both IDs | Guard works |
| writeAuditEvent: validation | accepts integer entityId | Backward compat |

```
npm test
→ 38 tests passed (8 integration + 30 unit)
```
