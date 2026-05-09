import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import type { InsertAuditEvent, InsertUser } from '../drizzle/schema';
import {
  auditEvents,
  cases,
  clerkAllocations,
  clerkDiaries,
  documents,
  hearings,
  tenants,
  users,
} from '../drizzle/schema';
import { ENV } from './_core/env';

// ─── Demo mode seed data (used when DATABASE_URL is unset) ──────────────────

const DEMO_TENANT = {
  id: 'tenant-alpha-demo',
  slug: 'alpha',
  name: 'Alpha Law LLP',
  plan: 'pro',
  settings: null as import('../drizzle/schema').TenantSettings | null | undefined,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const DEMO_USER = {
  id: 1,
  openId: 'admin-user',
  tenantId: 'tenant-alpha-demo',
  name: 'Patricia Chen',
  email: 'patricia.chen@alphalaw.co.uk',
  role: 'admin (senior clerk / manager)' as const,
  loginMethod: 'dev',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

const DEMO_CASES = [
  { id: 1, tenantId: 'tenant-alpha-demo', referenceNumber: 'REF-2026-001', title: 'Mitchell v Apex Recruitment Ltd', plaintiff: 'Sarah Mitchell', defendant: 'Apex Recruitment Ltd', judge: null as string | null, status: 'in_progress' as const, caseType: 'Employment', description: 'Wrongful dismissal and discrimination claim', createdAt: new Date('2026-04-15'), updatedAt: new Date() },
  { id: 2, tenantId: 'tenant-alpha-demo', referenceNumber: 'REF-2026-002', title: 'Porter v Broadstone Housing Association', plaintiff: 'James Porter', defendant: 'Broadstone Housing Association', judge: null as string | null, status: 'open' as const, caseType: 'Housing', description: 'Section 21 eviction notice — urgent injunction required', createdAt: new Date('2026-05-02'), updatedAt: new Date() },
  { id: 3, tenantId: 'tenant-alpha-demo', referenceNumber: 'REF-2026-003', title: 'R v Clarke', plaintiff: 'Regina', defendant: 'Emma Clarke', judge: 'HHJ Thompson' as string | null, status: 'closed' as const, caseType: 'Criminal', description: 'Section 18 GBH — represented at Crown Court', createdAt: new Date('2026-02-10'), updatedAt: new Date() },
  { id: 4, tenantId: 'tenant-alpha-demo', referenceNumber: 'REF-2026-004', title: 'Wong v Nexus Digital Ltd', plaintiff: 'David Wong', defendant: 'Nexus Digital Ltd', judge: null as string | null, status: 'on_hold' as const, caseType: 'Contract', description: 'Breach of SaaS contract — £34k disputed', createdAt: new Date('2026-04-20'), updatedAt: new Date() },
  { id: 5, tenantId: 'tenant-alpha-demo', referenceNumber: 'REF-2026-005', title: 'Sharma v Sharma', plaintiff: 'Priya Sharma', defendant: 'Rajan Sharma', judge: null as string | null, status: 'in_progress' as const, caseType: 'Family', description: 'Divorce petition with child custody arrangements', createdAt: new Date('2026-05-03'), updatedAt: new Date() },
];

const DEMO_HEARINGS = [
  { id: 1, tenantId: 'tenant-alpha-demo', caseId: 1, hearingDate: '2026-05-14', hearingTime: '10:00', courtroom: 'Room 3A', judge: 'Judge Williams', status: 'scheduled' as const, notes: 'Preliminary hearing — disclosure review', createdAt: new Date(), updatedAt: new Date() },
  { id: 2, tenantId: 'tenant-alpha-demo', caseId: 2, hearingDate: '2026-05-18', hearingTime: '09:30', courtroom: 'Court 7', judge: 'District Judge Patel', status: 'scheduled' as const, notes: 'Emergency injunction application', createdAt: new Date(), updatedAt: new Date() },
  { id: 3, tenantId: 'tenant-alpha-demo', caseId: 4, hearingDate: '2026-05-22', hearingTime: '14:00', courtroom: 'TCC Room 2', judge: 'Judge Harrison', status: 'scheduled' as const, notes: 'Case management conference', createdAt: new Date(), updatedAt: new Date() },
  { id: 4, tenantId: 'tenant-alpha-demo', caseId: 5, hearingDate: '2026-05-15', hearingTime: '11:00', courtroom: 'Family Court 4', judge: 'HHJ Morrison', status: 'scheduled' as const, notes: 'Financial remedy directions', createdAt: new Date(), updatedAt: new Date() },
];

const DEMO_DOCUMENTS = [
  { id: 1, tenantId: 'tenant-alpha-demo', caseId: 1, filename: 'ET1_Mitchell_v_Apex.pdf', fileType: 'application/pdf', fileSize: 245120, blobUrl: null, uploadedById: 1, approvedForBundle: 1, bundlePosition: 1, notes: 'Employment Tribunal claim form', createdAt: new Date('2026-04-16'), updatedAt: new Date() },
  { id: 2, tenantId: 'tenant-alpha-demo', caseId: 1, filename: 'Witness_Statement_Mitchell.pdf', fileType: 'application/pdf', fileSize: 182000, blobUrl: null, uploadedById: 1, approvedForBundle: 1, bundlePosition: 2, notes: 'Claimant witness statement', createdAt: new Date('2026-04-20'), updatedAt: new Date() },
  { id: 3, tenantId: 'tenant-alpha-demo', caseId: 2, filename: 'Section21_Notice.pdf', fileType: 'application/pdf', fileSize: 98000, blobUrl: null, uploadedById: 1, approvedForBundle: 0, bundlePosition: null, notes: 'Eviction notice received from landlord', createdAt: new Date('2026-05-02'), updatedAt: new Date() },
];

const DEMO_AUDIT_EVENTS = [
  { id: 1, tenantId: 'tenant-alpha-demo', entityType: 'case' as const, entityId: 1, action: 'create', actorId: 1, actorOpenId: 'admin-user', prevState: null, nextState: '{"status":"open"}', createdAt: new Date('2026-04-15') },
  { id: 2, tenantId: 'tenant-alpha-demo', entityType: 'case' as const, entityId: 1, action: 'update', actorId: 1, actorOpenId: 'admin-user', prevState: '{"status":"open"}', nextState: '{"status":"in_progress"}', createdAt: new Date('2026-04-16') },
  { id: 3, tenantId: 'tenant-alpha-demo', entityType: 'case' as const, entityId: 2, action: 'create', actorId: 1, actorOpenId: 'admin-user', prevState: null, nextState: '{"status":"open"}', createdAt: new Date('2026-05-02') },
];

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
  if (!db) return slug === 'alpha' ? DEMO_TENANT : undefined;
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return rows[0];
}

export async function getTenantById(id: string) {
  const db = await getDb();
  if (!db) return id === DEMO_TENANT.id ? DEMO_TENANT : undefined;
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
  if (!db) return DEMO_USER;
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
  if (!db) return DEMO_CASES.find(c => c.id === id);
  const rows = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, id), eq(cases.tenantId, tenantId)))
    .limit(1);
  return rows[0];
}

export async function getAllCases(tenantId: string) {
  const db = await getDb();
  if (!db) return DEMO_CASES;
  return db.select().from(cases).where(eq(cases.tenantId, tenantId));
}

export async function searchCases(query: string, tenantId: string) {
  const db = await getDb();
  if (!db) {
    const q = query.toLowerCase();
    return DEMO_CASES.filter(c =>
      c.referenceNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.plaintiff.toLowerCase().includes(q) ||
      c.defendant.toLowerCase().includes(q),
    );
  }
  const term = `%${query}%`;
  return db
    .select()
    .from(cases)
    .where(
      and(
        eq(cases.tenantId, tenantId),
        or(
          ilike(cases.referenceNumber, term),
          ilike(cases.title, term),
          ilike(cases.plaintiff, term),
          ilike(cases.defendant, term),
        ),
      ),
    )
    .limit(50)
    .orderBy(desc(cases.createdAt));
}

// ─── Hearings ────────────────────────────────────────────────────────────────

export async function getAllHearings(tenantId: string) {
  const db = await getDb();
  if (!db) return DEMO_HEARINGS;
  return db.select().from(hearings).where(eq(hearings.tenantId, tenantId));
}

export async function getHearingsByCase(caseId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return DEMO_HEARINGS.filter(h => h.caseId === caseId);
  return db
    .select()
    .from(hearings)
    .where(and(eq(hearings.caseId, caseId), eq(hearings.tenantId, tenantId)));
}

// ─── Documents ───────────────────────────────────────────────────────────────

export async function getDocumentsByCase(caseId: number, tenantId: string, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return DEMO_DOCUMENTS.filter(d => d.caseId === caseId);
  return db
    .select()
    .from(documents)
    .where(and(eq(documents.caseId, caseId), eq(documents.tenantId, tenantId)))
    .limit(limit)
    .offset(offset);
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

export async function getAllocationsByCase(caseId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(clerkAllocations)
    .where(and(eq(clerkAllocations.caseId, caseId), eq(clerkAllocations.tenantId, tenantId)));
}

export async function getAuditEventsByCase(caseId: number, tenantId: string) {
  const db = await getDb();
  if (!db) return DEMO_AUDIT_EVENTS.filter(e => e.entityId === caseId);
  return db
    .select()
    .from(auditEvents)
    .where(
      and(
        eq(auditEvents.entityType, 'case'),
        eq(auditEvents.entityId, caseId),
        eq(auditEvents.tenantId, tenantId),
      ),
    )
    .orderBy(auditEvents.createdAt);
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
  const db = await getDb();
  if (!db) return;
  // Audit events are immutable — insert only, no update
  await db.insert(auditEvents).values(event);
}
