import { and, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { InsertAuditEvent, InsertUser } from '../drizzle/schema.js';
import {
  auditEvents,
  cases,
  clerkAllocations,
  clerkDiaries,
  documents,
  hearings,
  tenants,
  users,
} from '../drizzle/schema.js';
import { ENV } from './_core/env.js';

// ─── Lazy DB connection ───────────────────────────────────────────────────────

type DrizzleDb = ReturnType<typeof drizzle>;

let _db: DrizzleDb | null = null;

export async function getDb(): Promise<DrizzleDb | null> {
  if (_db) return _db;
  const url = process.env.DATABASE_URL ?? ENV.databaseUrl;
  if (!url) return null;
  try {
    const client = postgres(url, { max: 10 });
    _db = drizzle(client);
    return _db;
  } catch (err) {
    console.warn('[ClerkDB] Failed to initialise connection:', err);
    return null;
  }
}

// ─── RLS session context ──────────────────────────────────────────────────────
// Must be called before any tenant-scoped query within the same connection
// context. The 'true' arg scopes the setting to the current transaction only.

export async function setTenantContext(tenantId: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
}

/**
 * Wraps a DB operation with RLS tenant context.
 * Always use this for tenant-scoped queries in production.
 */
export async function withTenant<T>(
  tenantId: string,
  fn: (db: DrizzleDb) => Promise<T>,
): Promise<T> {
  const db = await getDb();
  if (!db) throw new Error('Database not available');
  await db.execute(sql`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`);
  return fn(db);
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export async function getTenantBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return rows[0];
}

export async function getTenantById(id: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return rows[0];
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error('User openId is required for upsert');
  if (!user.tenantId) throw new Error('User tenantId is required for upsert');
  const db = await getDb();
  if (!db) {
    console.warn('[ClerkDB] upsertUser: database not available');
    return;
  }

  const values: InsertUser = { openId: user.openId, tenantId: user.tenantId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ['name', 'email', 'loginMethod'] as const;
  for (const field of textFields) {
    if (user[field] !== undefined) {
      const v = user[field] ?? null;
      values[field] = v;
      updateSet[field] = v;
    }
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }

  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (ENV.ownerOpenId && user.openId === ENV.ownerOpenId) {
    values.role = 'admin (senior clerk / manager)';
    updateSet.role = 'admin (senior clerk / manager)';
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  // Unique on (tenantId, openId) — use manual insert + update
  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: [users.tenantId, users.openId], set: updateSet });
}

export async function getUserByOpenId(openId: string, tenantId?: string) {
  const db = await getDb();
  if (!db) return undefined;
  const where =
    tenantId
      ? and(eq(users.openId, openId), eq(users.tenantId, tenantId))
      : eq(users.openId, openId);
  const rows = await db.select().from(users).where(where).limit(1);
  return rows[0];
}

// ─── Cases ───────────────────────────────────────────────────────────────────

export async function getCaseById(id: number, tenantId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.tenantId, tenantId)))
    .limit(1);
  return rows[0];
}

export async function getAllCases(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases).where(eq(cases.tenantId, tenantId));
}

export async function searchCases(query: string, tenantId: string) {
  const all = await getAllCases(tenantId);
  const q = query.toLowerCase();
  return all.filter(
    (c) =>
      c.referenceNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.plaintiff.toLowerCase().includes(q) ||
      c.defendant.toLowerCase().includes(q),
  );
}

// ─── Hearings ────────────────────────────────────────────────────────────────

export async function getAllHearings(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings).where(eq(hearings.tenantId, tenantId));
}

export async function getHearingsByCase(caseId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(hearings)
    .where(and(eq(hearings.caseId, caseId), eq(hearings.tenantId, tenantId)));
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentsByCase(caseId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.tenantId, tenantId)));
}

// ─── Allocations ─────────────────────────────────────────────────────────────

export async function getPendingAllocations(tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clerkAllocations)
    .where(and(eq(clerkAllocations.status, 'pending'), eq(clerkAllocations.tenantId, tenantId)));
}

export async function getAllocationsByClerk(clerkId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clerkAllocations)
    .where(and(eq(clerkAllocations.clerkId, clerkId), eq(clerkAllocations.tenantId, tenantId)));
}

// ─── Diary ───────────────────────────────────────────────────────────────────

export async function getClerkDiaryByDate(clerkId: number, date: string, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clerkDiaries)
    .where(
      and(
        eq(clerkDiaries.clerkId, clerkId),
        eq(clerkDiaries.date, date),
        eq(clerkDiaries.tenantId, tenantId),
      ),
    );
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export async function writeAuditEvent(event: InsertAuditEvent): Promise<void> {
  if (event.entityId == null && event.entityUuid == null) {
    throw new Error(
      `writeAuditEvent: one of entityId or entityUuid is required (entityType=${event.entityType}, action=${event.action})`
    );
  }
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(event);
}
