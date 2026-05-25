import { describe, it, expect, beforeEach, vi } from 'vitest';

const { writeAuditEventMock } = vi.hoisted(() => ({
  writeAuditEventMock: vi.fn(),
}));
vi.mock('../trpc/db', () => ({
  writeAuditEvent: writeAuditEventMock,
  // pushCircuitStateAsync calls getDb fire-and-forget; return null so it short-circuits
  getDb: vi.fn().mockResolvedValue(null),
}));

import { wrapGracefully } from './wrap-gracefully';
import {
  __resetCircuitBreakerForTests,
  configureDependency,
  getCircuitSnapshot,
} from './circuit-breaker';

beforeEach(() => {
  __resetCircuitBreakerForTests();
  writeAuditEventMock.mockReset();
  writeAuditEventMock.mockResolvedValue(undefined);
});

describe('wrapGracefully: success path', () => {
  it('returns ok:true with the value when fn resolves', async () => {
    const result = await wrapGracefully({ operation: 'op' }, async () => 42);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toBe(42);
      expect(result.degraded).toBe(false);
    }
  });

  it('records success against the circuit breaker', async () => {
    configureDependency('dep-a', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 30_000 });
    // open the circuit first
    await wrapGracefully({ operation: 'op', dependency: 'dep-a' }, async () => { throw new Error('boom'); });
    await wrapGracefully({ operation: 'op', dependency: 'dep-a' }, async () => { throw new Error('boom'); });
    expect(getCircuitSnapshot('dep-a').state).toBe('open');

    // Don't await actual time — just simulate cooldown elapsed by reconfiguring
    configureDependency('dep-a', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 0 });

    // half-open probe succeeds → closes circuit
    const result = await wrapGracefully(
      { operation: 'op', dependency: 'dep-a' },
      async () => 'recovered',
    );
    expect(result.ok).toBe(true);
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
  });
});

describe('wrapGracefully: failure path', () => {
  it('returns ok:false with the error message when fn rejects', async () => {
    const result = await wrapGracefully({ operation: 'op' }, async () => {
      throw new Error('boom');
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('boom');
      expect(result.errorCategory).toBe('runtime');
    }
  });

  it('infers errorCategory from the error message', async () => {
    const result = await wrapGracefully({ operation: 'op' }, async () => {
      throw new Error('ECONNREFUSED');
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorCategory).toBe('external_api');
  });

  it('records failure against the circuit breaker', async () => {
    configureDependency('dep-b', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 30_000 });
    await wrapGracefully({ operation: 'op', dependency: 'dep-b' }, async () => { throw new Error('boom'); });
    expect(getCircuitSnapshot('dep-b').failures).toBe(1);
    expect(getCircuitSnapshot('dep-b').state).toBe('closed');
    await wrapGracefully({ operation: 'op', dependency: 'dep-b' }, async () => { throw new Error('boom'); });
    expect(getCircuitSnapshot('dep-b').state).toBe('open');
  });

  it('emits system_failure_captured audit when tenantId+entityUuid provided', async () => {
    await wrapGracefully(
      {
        operation: 'op',
        tenantId: 'tenant-1',
        entityUuid: 'entity-1',
        correlationId: 'corr-1',
        sourceRef: 'PIE:24/AP/1',
      },
      async () => { throw new Error('database error: violates not-null constraint'); },
    );
    expect(writeAuditEventMock).toHaveBeenCalledTimes(1);
    const auditCall = writeAuditEventMock.mock.calls[0][0];
    expect(auditCall.action).toBe('system_failure_captured');
    expect(auditCall.entityType).toBe('system');
    expect(auditCall.correlationId).toBe('corr-1');
    const meta = JSON.parse(auditCall.metadata);
    expect(meta.operation).toBe('op');
    expect(meta.errorCategory).toBe('database');
    expect(meta.sourceRef).toBe('PIE:24/AP/1');
    expect(meta.circuitState).toBe('closed');
    expect(meta.failureCount).toBe(0);
  });

  it('does NOT throw when the audit write itself rejects', async () => {
    writeAuditEventMock.mockRejectedValue(new Error('audit DB down'));
    const result = await wrapGracefully(
      { operation: 'op', tenantId: 't', entityUuid: 'e' },
      async () => { throw new Error('boom'); },
    );
    expect(result.ok).toBe(false);
  });
});

describe('wrapGracefully: circuit_open fast-fail', () => {
  it('skips fn entirely when circuit is OPEN within cooldown', async () => {
    configureDependency('dep-c', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    // open the circuit
    await wrapGracefully({ operation: 'op', dependency: 'dep-c' }, async () => { throw new Error('boom'); });
    expect(getCircuitSnapshot('dep-c').state).toBe('open');

    const spy = vi.fn().mockResolvedValue('should-not-run');
    const result = await wrapGracefully({ operation: 'op', dependency: 'dep-c' }, spy);

    expect(spy).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe('circuit_open');
      expect(result.errorCategory).toBe('circuit_open');
      expect(result.degraded).toBe(true);
      expect(result.circuitState).toBe('open');
    }
  });

  it('emits system_failure_captured with circuit metadata on circuit_open', async () => {
    configureDependency('dep-d', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    await wrapGracefully(
      { operation: 'op', dependency: 'dep-d', tenantId: 't', entityUuid: 'e' },
      async () => { throw new Error('boom'); },
    );
    writeAuditEventMock.mockClear();

    await wrapGracefully(
      { operation: 'op', dependency: 'dep-d', tenantId: 't', entityUuid: 'e', correlationId: 'corr-2' },
      async () => 'unreachable',
    );

    expect(writeAuditEventMock).toHaveBeenCalledTimes(1);
    const meta = JSON.parse(writeAuditEventMock.mock.calls[0][0].metadata);
    expect(meta.error).toBe('circuit_open');
    expect(meta.errorCategory).toBe('circuit_open');
    expect(meta.dependency).toBe('dep-d');
    expect(meta.circuitState).toBe('open');
    expect(meta.degradedMode).toBe(true);
    expect(meta.cooldownRemainingMs).toBeGreaterThan(0);
  });
});

describe('wrapGracefully: retryable inference', () => {
  it('marks external_api errors as retryable', async () => {
    await wrapGracefully(
      { operation: 'op', tenantId: 't', entityUuid: 'e' },
      async () => { throw new Error('ETIMEDOUT'); },
    );
    const meta = JSON.parse(writeAuditEventMock.mock.calls[0][0].metadata);
    expect(meta.errorCategory).toBe('external_api');
    expect(meta.retryable).toBe(true);
  });

  it('marks validation errors as non-retryable', async () => {
    await wrapGracefully(
      { operation: 'op', tenantId: 't', entityUuid: 'e' },
      async () => { throw new Error('required field missing'); },
    );
    const meta = JSON.parse(writeAuditEventMock.mock.calls[0][0].metadata);
    expect(meta.errorCategory).toBe('validation');
    expect(meta.retryable).toBe(false);
  });

  it('honours an explicit retryable override', async () => {
    await wrapGracefully(
      { operation: 'op', tenantId: 't', entityUuid: 'e', retryable: false },
      async () => { throw new Error('ECONNREFUSED'); },
    );
    const meta = JSON.parse(writeAuditEventMock.mock.calls[0][0].metadata);
    expect(meta.retryable).toBe(false);
  });
});
