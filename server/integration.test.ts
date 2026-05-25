/**
 * Integration tests — require a live PostgreSQL database.
 * Set DATABASE_URL to run. Skip silently when absent.
 *
 * Setup (one-time per test DB):
 *   npm run db:migrate:clerkos
 *   npm run db:push
 *   npm run db:seed:clerkos
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq } from 'drizzle-orm';
import { tenants, auditEvents } from './drizzle/schema';
import { intakeForms } from './db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const runIntegration = !!DATABASE_URL;

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ─── Test fixtures ────────────────────────────────────────────────────────────

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

beforeAll(async () => {
  if (!runIntegration) return;
  client = postgres(DATABASE_URL!, { max: 1 });
  db = drizzle(client);
});

afterAll(async () => {
  if (client) await client.end();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function skipIfNoDb() {
  if (!runIntegration) {
    console.log('  [skip] DATABASE_URL not set — integration test skipped');
    return true;
  }
  return false;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ClerkOS schema', () => {
  it('tenants table exists', async () => {
    if (skipIfNoDb()) return;
    const rows = await db!.select().from(tenants).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });

  it('system tenant row exists', async () => {
    if (skipIfNoDb()) return;
    const [row] = await db!
      .select()
      .from(tenants)
      .where(eq(tenants.id, SYSTEM_TENANT_ID));
    expect(row).toBeDefined();
    expect(row.slug).toBe('system');
    expect(row.plan).toBe('enterprise');
  });

  it('clerk_audit_events table exists', async () => {
    if (skipIfNoDb()) return;
    const rows = await db!.select().from(auditEvents).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('VaultLine audit write', () => {
  it('writes an intake event to clerk_audit_events', async () => {
    if (skipIfNoDb()) return;

    const testMatterRef = `MAT-TEST-${Date.now()}`;

    // Simulate what POST /api/intake does after inserting into intake_forms.
    // Uses the same writeAuditEvent() path that server/index.ts calls.
    const { writeAuditEvent } = await import('./trpc/db');

    // Insert a test intake row so entityId has a valid reference.
    // intake_forms uses uuid PK — grab it after insert.
    const [intake] = await drizzle(postgres(DATABASE_URL!, { max: 1 }))
      .insert(intakeForms)
      .values({
        matterRef: testMatterRef,
        clientName: 'Bromley Development Ltd',
        clientEmail: 'contact@bromleydev.co.uk',
        matterType: 'planning',
        urgency: 'high',
        description: 'Residential development 24/AP/1234',
        sourceRef: 'PIE:24/AP/1234',
      })
      .returning();

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'intake',
      entityId: 0,
      action: 'captured',
      metadata: JSON.stringify({
        matterRef: testMatterRef,
        matterType: 'planning',
        urgency: 'high',
        sourceRef: 'PIE:24/AP/1234',
      }),
    });

    // Verify the audit row was written
    const rows = await db!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityType, 'intake'));

    const match = rows.find(r => {
      const meta = r.metadata ? JSON.parse(r.metadata) : {};
      return meta.matterRef === testMatterRef;
    });

    expect(match).toBeDefined();
    expect(match!.tenantId).toBe(SYSTEM_TENANT_ID);
    expect(match!.action).toBe('captured');

    // Clean up test rows
    await drizzle(postgres(DATABASE_URL!, { max: 1 }))
      .delete(intakeForms)
      .where(eq(intakeForms.matterRef, testMatterRef));
  });

  it('writes a compliance_check event to clerk_audit_events', async () => {
    if (skipIfNoDb()) return;

    const { writeAuditEvent } = await import('./trpc/db');

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'compliance_check',
      entityId: 0,
      action: 'executed',
      metadata: JSON.stringify({
        companyNumber: '00445790',
        companyName: 'TESCO PLC',
        riskLevel: 'low',
        status: 'compliant',
        overdueFilings: 0,
      }),
    });

    const rows = await db!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityType, 'compliance_check'));

    const match = rows.find(r => {
      const meta = r.metadata ? JSON.parse(r.metadata) : {};
      return meta.companyNumber === '00445790';
    });

    expect(match).toBeDefined();
    expect(match!.action).toBe('executed');
  });
});

describe('UltAi intake_forms schema', () => {
  it('intake_forms table has sourceRef column', async () => {
    if (skipIfNoDb()) return;

    const testMatterRef = `MAT-SRCREF-${Date.now()}`;
    const [row] = await drizzle(postgres(DATABASE_URL!, { max: 1 }))
      .insert(intakeForms)
      .values({
        matterRef: testMatterRef,
        clientName: 'Test Client',
        matterType: 'planning',
        urgency: 'low',
        sourceRef: 'PIE:TEST-001',
      })
      .returning();

    expect(row.sourceRef).toBe('PIE:TEST-001');

    // Clean up
    await drizzle(postgres(DATABASE_URL!, { max: 1 }))
      .delete(intakeForms)
      .where(eq(intakeForms.matterRef, testMatterRef));
  });
});
