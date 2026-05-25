/**
 * Integration tests — require a live PostgreSQL database.
 *
 * Bootstrap (one-time per test DB):
 *   npm run db:bootstrap
 *
 * Run:
 *   DATABASE_URL=postgresql://... npm test
 *
 * Tests skip cleanly when DATABASE_URL is absent (unit CI).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and } from 'drizzle-orm';
import { tenants, auditEvents } from './drizzle/schema';
import { intakeForms } from './db/schema';

const DATABASE_URL = process.env.DATABASE_URL;
const runIntegration = !!DATABASE_URL;

const SYSTEM_TENANT_ID = '00000000-0000-0000-0000-000000000001';

// ─── Shared DB handle ────────────────────────────────────────────────────────

let client: ReturnType<typeof postgres> | null = null;
let db: ReturnType<typeof drizzle> | null = null;

beforeAll(async () => {
  if (!runIntegration) return;
  client = postgres(DATABASE_URL!, { max: 2 });
  db = drizzle(client);
});

afterAll(async () => {
  if (client) await client.end();
});

function skipIfNoDb(): boolean {
  if (!runIntegration) {
    console.log('  [skip] DATABASE_URL not set — integration test skipped');
    return true;
  }
  return false;
}

// ─── Bootstrap verification ──────────────────────────────────────────────────

describe('bootstrap: ClerkOS schema', () => {
  it('tenants table exists', async () => {
    if (skipIfNoDb()) return;
    const rows = await db!.select().from(tenants).limit(1);
    expect(Array.isArray(rows)).toBe(true);
  });

  it('system tenant row exists with correct fields', async () => {
    if (skipIfNoDb()) return;
    const [row] = await db!
      .select()
      .from(tenants)
      .where(eq(tenants.id, SYSTEM_TENANT_ID));
    expect(row).toBeDefined();
    expect(row.slug).toBe('system');
    expect(row.plan).toBe('enterprise');
    expect(row.name).toBe('UltraCore System');
  });

  it('clerk_audit_events has entity_uuid and correlation_id columns', async () => {
    if (skipIfNoDb()) return;
    // Write and read back a row that exercises both new columns
    const { writeAuditEvent } = await import('./trpc/db');
    const cid = randomUUID();
    const entityUuid = randomUUID();

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'schema_test',
      entityUuid,
      action: 'verified',
      correlationId: cid,
      metadata: JSON.stringify({ test: 'entity_uuid_column' }),
    });

    const rows = await db!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.entityType, 'schema_test'),
          eq(auditEvents.correlationId, cid),
        )
      );

    expect(rows).toHaveLength(1);
    expect(rows[0].entityUuid).toBe(entityUuid);
    expect(rows[0].correlationId).toBe(cid);
    expect(rows[0].entityId).toBeNull();
  });
});

// ─── UltAi intake → VaultLine ────────────────────────────────────────────────

describe('UltAi: POST /api/intake → VaultLine', () => {
  it('intake_forms table has sourceRef column', async () => {
    if (skipIfNoDb()) return;
    const testMatterRef = `MAT-SRCREF-${Date.now()}`;
    const intakeClient = postgres(DATABASE_URL!, { max: 1 });
    const intakeDb = drizzle(intakeClient);

    const [row] = await intakeDb
      .insert(intakeForms)
      .values({
        matterRef: testMatterRef,
        clientName: 'Test Client',
        matterType: 'planning',
        urgency: 'low',
        sourceRef: 'PIE:24/AP/1234',
      })
      .returning();

    expect(row.sourceRef).toBe('PIE:24/AP/1234');

    await intakeDb.delete(intakeForms).where(eq(intakeForms.matterRef, testMatterRef));
    await intakeClient.end();
  });

  it('writes intake audit event with entityUuid and correct metadata', async () => {
    if (skipIfNoDb()) return;

    const testMatterRef = `MAT-TEST-${Date.now()}`;
    const correlationId = randomUUID();
    const intakeClient = postgres(DATABASE_URL!, { max: 1 });
    const intakeDb = drizzle(intakeClient);

    // Insert intake row
    const [intake] = await intakeDb
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

    const { writeAuditEvent } = await import('./trpc/db');

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'intake',
      entityUuid: intake.id,
      action: 'captured',
      correlationId,
      metadata: JSON.stringify({
        matterRef: testMatterRef,
        matterType: 'planning',
        urgency: 'high',
        sourceRef: 'PIE:24/AP/1234',
      }),
    });

    // Verify audit row
    const [auditRow] = await db!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.entityType, 'intake'),
          eq(auditEvents.correlationId, correlationId),
        )
      );

    expect(auditRow).toBeDefined();
    expect(auditRow.tenantId).toBe(SYSTEM_TENANT_ID);
    expect(auditRow.action).toBe('captured');
    expect(auditRow.entityUuid).toBe(intake.id);
    expect(auditRow.entityId).toBeNull();
    expect(auditRow.correlationId).toBe(correlationId);

    // Verify metadata round-trip
    const meta = JSON.parse(auditRow.metadata!);
    expect(meta.matterRef).toBe(testMatterRef);
    expect(meta.sourceRef).toBe('PIE:24/AP/1234');
    expect(meta.urgency).toBe('high');

    // Clean up
    await intakeDb.delete(intakeForms).where(eq(intakeForms.matterRef, testMatterRef));
    await intakeClient.end();
  });
});

// ─── FineGuard compliance → VaultLine ────────────────────────────────────────

describe('FineGuard: compliance_check → VaultLine', () => {
  it('writes compliance_check audit event with entityUuid', async () => {
    if (skipIfNoDb()) return;

    const { writeAuditEvent } = await import('./trpc/db');
    const correlationId = randomUUID();
    const entityUuid = randomUUID();

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'compliance_check',
      entityUuid,
      action: 'executed',
      correlationId,
      metadata: JSON.stringify({
        companyNumber: '00445790',
        companyName: 'TESCO PLC',
        riskLevel: 'low',
        status: 'compliant',
        overdueFilings: 0,
      }),
    });

    const [row] = await db!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.entityType, 'compliance_check'),
          eq(auditEvents.correlationId, correlationId),
        )
      );

    expect(row).toBeDefined();
    expect(row.entityUuid).toBe(entityUuid);
    expect(row.entityId).toBeNull();
    expect(row.action).toBe('executed');

    const meta = JSON.parse(row.metadata!);
    expect(meta.companyNumber).toBe('00445790');
    expect(meta.riskLevel).toBe('low');
  });
});

// ─── writeAuditEvent validation ──────────────────────────────────────────────

describe('writeAuditEvent: application-layer validation', () => {
  it('rejects when neither entityId nor entityUuid is provided', async () => {
    if (skipIfNoDb()) return;

    const { writeAuditEvent } = await import('./trpc/db');

    await expect(
      writeAuditEvent({
        tenantId: SYSTEM_TENANT_ID,
        entityType: 'test',
        action: 'test',
        metadata: null,
      })
    ).rejects.toThrow('one of entityId or entityUuid is required');
  });

  it('accepts entityId-only (ClerkOS integer entity)', async () => {
    if (skipIfNoDb()) return;

    const { writeAuditEvent } = await import('./trpc/db');
    const correlationId = randomUUID();

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'case',
      entityId: 9999,
      action: 'test_integer_entity',
      correlationId,
    });

    const [row] = await db!
      .select()
      .from(auditEvents)
      .where(
        and(
          eq(auditEvents.action, 'test_integer_entity'),
          eq(auditEvents.correlationId, correlationId),
        )
      );

    expect(row).toBeDefined();
    expect(row.entityId).toBe(9999);
    expect(row.entityUuid).toBeNull();
  });
});
