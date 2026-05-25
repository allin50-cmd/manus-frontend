import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock is hoisted above top-level statements; use vi.hoisted to lift the
// mock instances so they're initialised before the mock factories run.
const { upsertReturningMock, insertMock, writeAuditEventMock } = vi.hoisted(() => {
  const upsertReturningMock = vi.fn();
  const insertMock = vi.fn((_table: unknown) => ({
    values: (_v: unknown) => ({
      onConflictDoUpdate: (_cfg: unknown) => ({
        returning: upsertReturningMock,
      }),
    }),
  }));
  const writeAuditEventMock = vi.fn();
  return { upsertReturningMock, insertMock, writeAuditEventMock };
});

vi.mock('./db/index', () => ({
  db: { insert: insertMock },
}));
vi.mock('./trpc/db', () => ({
  writeAuditEvent: writeAuditEventMock,
  getDb: vi.fn().mockResolvedValue(null),
}));

import { activateFineGuardForPie } from './lib/pie-fineguard';
import {
  __resetCircuitBreakerForTests,
  configureDependency,
  getCircuitSnapshot,
} from './lib/circuit-breaker';
import { __resetRetryBudgetsForTests } from './lib/retry-budget';
import type { IntakeForm } from './db/schema';

function makeIntake(overrides: Partial<IntakeForm> = {}): IntakeForm {
  return {
    id: 'intake-uuid-1',
    matterRef: 'MAT-1',
    clientName: 'Acme Ltd',
    clientEmail: null,
    clientPhone: null,
    matterType: 'planning',
    urgency: 'high',
    description: null,
    claimValue: null,
    sourceRef: 'PIE:24/AP/1234',
    createdAt: new Date(),
    ...overrides,
  };
}

const baseInput = {
  applicantName: 'Acme Ltd',
  sourceRef: 'PIE:24/AP/1234',
  pieExternalRef: '24/AP/1234',
  correlationId: 'corr-1',
  tenantId: '00000000-0000-0000-0000-000000000001',
  trigger: 'first_ingestion' as const,
};

beforeEach(() => {
  upsertReturningMock.mockReset();
  insertMock.mockClear();
  writeAuditEventMock.mockReset();
  writeAuditEventMock.mockResolvedValue(undefined);
  __resetCircuitBreakerForTests();
  __resetRetryBudgetsForTests();
});

describe('activateFineGuardForPie: contract — never throws', () => {
  it('returns activated=true and a monitoredCompanyId when rules pass and upsert succeeds', async () => {
    upsertReturningMock.mockResolvedValue([{ id: 'monitor-uuid-1' }]);

    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(result.activated).toBe(true);
    expect(result.monitoredCompanyId).toBe('monitor-uuid-1');
    expect(result.error).toBeNull();
    expect(insertMock).toHaveBeenCalledTimes(1);
  });

  it('does NOT throw when the monitored_companies upsert rejects — returns error in result', async () => {
    const dbErr = new Error('simulated DB failure: value too long for varchar(50)');
    upsertReturningMock.mockRejectedValue(dbErr);

    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(result.activated).toBe(false);
    expect(result.monitoredCompanyId).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('value too long for varchar(50)');
  });

  it('writes a fineguard_activation_failed audit event when the upsert fails', async () => {
    upsertReturningMock.mockRejectedValue(new Error('value too long for type character varying(50)'));

    await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    const failedAuditCall = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_failed',
    );
    expect(failedAuditCall).toBeDefined();
    const failedAudit = failedAuditCall![0];
    expect(failedAudit.entityType).toBe('intake');
    expect(failedAudit.correlationId).toBe('corr-1');
    const metadata = JSON.parse(failedAudit.metadata);
    expect(metadata.sourceRef).toBe('PIE:24/AP/1234');
    expect(metadata.errorCategory).toBe('database');
    expect(metadata.trigger).toBe('first_ingestion');
  });

  it('does NOT throw when the activation audit write itself rejects', async () => {
    upsertReturningMock.mockResolvedValue([{ id: 'monitor-uuid-2' }]);
    // Audit writes always reject — every single one.
    writeAuditEventMock.mockRejectedValue(new Error('audit DB unavailable'));

    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    // Activation itself still succeeded; audit failure is logged not thrown.
    expect(result.activated).toBe(true);
    expect(result.error).toBeNull();
  });

  it('does NOT throw when both upsert AND its terminal audit reject', async () => {
    upsertReturningMock.mockRejectedValue(new Error('connection timeout'));
    writeAuditEventMock.mockRejectedValue(new Error('audit DB unavailable'));

    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(result.activated).toBe(false);
    expect(result.error).not.toBeNull();
  });

  it('writes no upsert and no triggered audit when evaluation says activate=false', async () => {
    const intake = makeIntake({ urgency: 'low', claimValue: null });

    const result = await activateFineGuardForPie({ ...baseInput, intake });

    expect(result.activated).toBe(false);
    expect(result.error).toBeNull();
    expect(insertMock).not.toHaveBeenCalled();

    const evalAudit = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_evaluated',
    );
    expect(evalAudit).toBeDefined();
    const triggeredAudit = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_triggered',
    );
    expect(triggeredAudit).toBeUndefined();
  });

  it('records trigger="replay_retry" in audit metadata when called from replay path', async () => {
    upsertReturningMock.mockResolvedValue([{ id: 'monitor-uuid-3' }]);

    await activateFineGuardForPie({
      ...baseInput,
      intake: makeIntake(),
      trigger: 'replay_retry',
    });

    const triggeredCall = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_triggered',
    );
    expect(triggeredCall).toBeDefined();
    const metadata = JSON.parse(triggeredCall![0].metadata);
    expect(metadata.trigger).toBe('replay_retry');
  });

  it('handles the edge case where RETURNING yields zero rows (defensive null guard)', async () => {
    upsertReturningMock.mockResolvedValue([]); // empty array — no row returned

    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(result.activated).toBe(false);
    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('monitored_companies upsert returned no row');

    // Failure audit event should still fire so the trail is symmetric.
    const failedAudit = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_failed',
    );
    expect(failedAudit).toBeDefined();
  });
});

describe('activateFineGuardForPie: circuit-breaker integration', () => {
  it('repeated upsert failures open the fineguard_activation circuit', async () => {
    configureDependency('fineguard_activation', {
      failureThreshold: 3,
      windowMs: 60_000,
      cooldownMs: 30_000,
    });
    upsertReturningMock.mockRejectedValue(new Error('value too long for type character varying(50)'));

    for (let i = 0; i < 3; i++) {
      await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });
    }
    expect(getCircuitSnapshot('fineguard_activation').state).toBe('open');
  });

  it('skips the upsert when the circuit is OPEN — intake response unaffected', async () => {
    configureDependency('fineguard_activation', {
      failureThreshold: 1,
      windowMs: 60_000,
      cooldownMs: 30_000,
    });
    // First call opens the circuit
    upsertReturningMock.mockRejectedValueOnce(new Error('boom'));
    await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });
    expect(getCircuitSnapshot('fineguard_activation').state).toBe('open');

    insertMock.mockClear();
    // Subsequent call must skip the upsert entirely
    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(insertMock).not.toHaveBeenCalled();
    expect(result.activated).toBe(false);
    expect(result.error?.message).toBe('circuit_open');

    // A fineguard_activation_failed audit is still written (symmetric audit trail).
    const failedAudit = writeAuditEventMock.mock.calls.find(
      ([event]) => event.action === 'fineguard_activation_failed',
    );
    expect(failedAudit).toBeDefined();
    const meta = JSON.parse(failedAudit![0].metadata);
    expect(meta.circuitState).toBe('open');
    expect(meta.degradedMode).toBe(true);
  });

  it('a successful upsert closes a HALF-OPEN circuit', async () => {
    configureDependency('fineguard_activation', {
      failureThreshold: 1,
      windowMs: 60_000,
      cooldownMs: 0, // immediate cooldown for test
    });
    upsertReturningMock.mockRejectedValueOnce(new Error('boom'));
    await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });
    expect(getCircuitSnapshot('fineguard_activation').state).toBe('open');

    // Cooldown is 0 — next call allowed as half-open probe; resolve it cleanly.
    upsertReturningMock.mockResolvedValueOnce([{ id: 'recovered-id' }]);
    const result = await activateFineGuardForPie({ ...baseInput, intake: makeIntake() });

    expect(result.activated).toBe(true);
    expect(getCircuitSnapshot('fineguard_activation').state).toBe('closed');
  });
});
