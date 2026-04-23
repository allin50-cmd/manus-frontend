import { and, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { InsertUser } from '../drizzle/schema';
import {
  users,
  cases,
  hearings,
  documents,
  clerkAllocations,
  clerkDiaries,
  auditEvents,
} from '../drizzle/schema';
import type { InsertAuditEvent } from '../drizzle/schema';
import { ENV } from './_core/env';

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

// ─── Users ───────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error('User openId is required for upsert');
  const db = await getDb();
  if (!db) {
    console.warn('[ClerkDB] upsertUser: database not available');
    return;
  }

  const values: InsertUser = { openId: user.openId };
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

  await db
    .insert(users)
    .values(values)
    .onConflictDoUpdate({ target: users.openId, set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return rows[0];
}

// ─── Cases ───────────────────────────────────────────────────────────────────

export async function getCaseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(cases).where(eq(cases.id, id)).limit(1);
  return rows[0];
}

export async function getAllCases() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cases);
}

export async function searchCases(query: string) {
  const all = await getAllCases();
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

export async function getAllHearings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings);
}

export async function getHearingsByCase(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(hearings).where(eq(hearings.caseId, caseId));
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentsByCase(caseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.caseId, caseId));
}

// ─── Allocations ─────────────────────────────────────────────────────────────

export async function getPendingAllocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clerkAllocations).where(eq(clerkAllocations.status, 'pending'));
}

export async function getAllocationsByClerk(clerkId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clerkAllocations).where(eq(clerkAllocations.clerkId, clerkId));
}

// ─── Diary ───────────────────────────────────────────────────────────────────

export async function getClerkDiaryByDate(clerkId: number, date: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clerkDiaries)
    .where(and(eq(clerkDiaries.clerkId, clerkId), eq(clerkDiaries.date, date)));
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export async function writeAuditEvent(event: InsertAuditEvent): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditEvents).values(event);
}
