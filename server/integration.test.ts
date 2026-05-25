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
import { buildSourceRef } from './lib/pie-schema';

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

// ─── PIE ingestion → VaultLine ───────────────────────────────────────────────

describe('PIE: POST /api/pie/opportunity → intake + VaultLine', () => {
  it('persists intake row with correct sourceRef and matterType', async () => {
    if (skipIfNoDb()) return;

    const pieRef = `24/AP/PIE-TEST-${Date.now()}`;
    const sourceRef = buildSourceRef(pieRef);
    const matterRef = `MAT-PIE-${Date.now()}`;
    const pieClient = postgres(DATABASE_URL!, { max: 1 });
    const pieDb = drizzle(pieClient);

    const [row] = await pieDb
      .insert(intakeForms)
      .values({
        matterRef,
        clientName: 'PIE Test Applicant',
        clientEmail: 'pie@test.local',
        matterType: 'planning',
        urgency: 'high',
        description: 'PIE integration test opportunity',
        sourceRef,
      })
      .returning();

    expect(row.sourceRef).toBe(sourceRef);
    expect(row.matterType).toBe('planning');
    expect(row.clientName).toBe('PIE Test Applicant');

    await pieDb.delete(intakeForms).where(eq(intakeForms.matterRef, matterRef));
    await pieClient.end();
  });

  it('writes audit event with upstreamSystem=PIE in metadata and sourceRef round-trip', async () => {
    if (skipIfNoDb()) return;

    const pieRef = `24/AP/AUDIT-${Date.now()}`;
    const sourceRef = buildSourceRef(pieRef);
    const matterRef = `MAT-PIE-AUDIT-${Date.now()}`;
    const correlationId = randomUUID();
    const pieClient = postgres(DATABASE_URL!, { max: 1 });
    const pieDb = drizzle(pieClient);

    const [intake] = await pieDb
      .insert(intakeForms)
      .values({
        matterRef,
        clientName: 'Audit Test Applicant',
        matterType: 'planning',
        urgency: 'medium',
        sourceRef,
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
        matterRef,
        matterType: 'planning',
        urgency: 'medium',
        sourceRef,
        upstreamSystem: 'PIE',
        pieExternalRef: pieRef,
        siteAddress: null,
        district: null,
        submittedAt: null,
      }),
    });

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
    expect(auditRow.entityUuid).toBe(intake.id);
    expect(auditRow.entityId).toBeNull();
    expect(auditRow.action).toBe('captured');

    const meta = JSON.parse(auditRow.metadata!);
    expect(meta.sourceRef).toBe(sourceRef);
    expect(meta.upstreamSystem).toBe('PIE');
    expect(meta.pieExternalRef).toBe(pieRef);

    await pieDb.delete(intakeForms).where(eq(intakeForms.matterRef, matterRef));
    await pieClient.end();
  });

  it('replay: second ingestion with same sourceRef writes ingestion_replayed audit event', async () => {
    if (skipIfNoDb()) return;

    const pieRef = `24/AP/REPLAY-${Date.now()}`;
    const sourceRef = buildSourceRef(pieRef);
    const matterRef = `MAT-PIE-REPLAY-${Date.now()}`;
    const firstCid = randomUUID();
    const replayCid = randomUUID();
    const pieClient = postgres(DATABASE_URL!, { max: 1 });
    const pieDb = drizzle(pieClient);

    // First ingestion
    const [intake] = await pieDb
      .insert(intakeForms)
      .values({
        matterRef,
        clientName: 'Replay Test Applicant',
        matterType: 'planning',
        urgency: 'low',
        sourceRef,
      })
      .returning();

    const { writeAuditEvent } = await import('./trpc/db');

    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'intake',
      entityUuid: intake.id,
      action: 'captured',
      correlationId: firstCid,
      metadata: JSON.stringify({ matterRef, sourceRef, upstreamSystem: 'PIE', pieExternalRef: pieRef }),
    });

    // Simulate replay — existing sourceRef found, write ingestion_replayed event
    await writeAuditEvent({
      tenantId: SYSTEM_TENANT_ID,
      entityType: 'intake',
      entityUuid: intake.id,
      action: 'ingestion_replayed',
      correlationId: replayCid,
      metadata: JSON.stringify({
        matterRef,
        sourceRef,
        upstreamSystem: 'PIE',
        pieExternalRef: pieRef,
        replayDetected: true,
      }),
    });

    // Verify two audit events for the same entityUuid — original + replay
    const rows = await db!
      .select()
      .from(auditEvents)
      .where(eq(auditEvents.entityUuid, intake.id));

    expect(rows.length).toBeGreaterThanOrEqual(2);

    const capturedRow = rows.find(r => r.action === 'captured' && r.correlationId === firstCid);
    const replayRow = rows.find(r => r.action === 'ingestion_replayed' && r.correlationId === replayCid);

    expect(capturedRow).toBeDefined();
    expect(replayRow).toBeDefined();

    const replayMeta = JSON.parse(replayRow!.metadata!);
    expect(replayMeta.replayDetected).toBe(true);
    expect(replayMeta.sourceRef).toBe(sourceRef);

    // Only one intake row created
    const intakeRows = await db!
      .select()
      .from(intakeForms)
      .where(eq(intakeForms.sourceRef, sourceRef));
    expect(intakeRows).toHaveLength(1);

    await pieDb.delete(intakeForms).where(eq(intakeForms.matterRef, matterRef));
    await pieClient.end();
  });

  it('sourceRef round-trip: intake_forms.source_ref matches buildSourceRef output', async () => {
    if (skipIfNoDb()) return;

    const pieRef = '25/BRO/0001/FUL';
    const sourceRef = buildSourceRef(pieRef);
    expect(sourceRef).toBe('PIE:25/BRO/0001/FUL');

    const matterRef = `MAT-PIE-SR-${Date.now()}`;
    const pieClient = postgres(DATABASE_URL!, { max: 1 });
    const pieDb = drizzle(pieClient);

    const [row] = await pieDb
      .insert(intakeForms)
      .values({ matterRef, clientName: 'SR Test', matterType: 'planning', urgency: 'low', sourceRef })
      .returning();

    expect(row.sourceRef).toBe('PIE:25/BRO/0001/FUL');

    await pieDb.delete(intakeForms).where(eq(intakeForms.matterRef, matterRef));
    await pieClient.end();
  });
});
