import { describe, it, expect, beforeEach } from 'vitest';
import {
  __RESILIENCE_RING_CAPACITY,
  __resetResilienceStatsForTests,
  getAllDependencyStats,
  getDependencyStats,
  getInstanceInfo,
  getRecentTraces,
  recordOperationFailure,
  recordOperationSuccess,
} from './resilience-stats';

beforeEach(() => {
  __resetResilienceStatsForTests();
});

describe('resilience-stats: per-dependency counters', () => {
  it('reports zero for an unobserved dependency', () => {
    const stats = getDependencyStats('unseen');
    expect(stats).toEqual({
      totalSuccesses: 0,
      totalFailures: 0,
      lastSuccessAt: 0,
      lastFailureAt: 0,
      successRate: 0,
      failureRate: 1,
    });
  });

  it('records successes and exposes successRate=1.0', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op' }, 1_000);
    recordOperationSuccess('dep-a', { correlationId: 'c2', operation: 'op' }, 2_000);
    const stats = getDependencyStats('dep-a');
    expect(stats.totalSuccesses).toBe(2);
    expect(stats.totalFailures).toBe(0);
    expect(stats.lastSuccessAt).toBe(2_000);
    expect(stats.successRate).toBe(1);
    expect(stats.failureRate).toBe(0);
  });

  it('records failures and computes successRate from totals', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op' }, 1_000);
    recordOperationSuccess('dep-a', { correlationId: 'c2', operation: 'op' }, 2_000);
    recordOperationSuccess('dep-a', { correlationId: 'c3', operation: 'op' }, 3_000);
    recordOperationFailure('dep-a', { correlationId: 'c4', operation: 'op' }, 4_000);
    const stats = getDependencyStats('dep-a');
    expect(stats.totalSuccesses).toBe(3);
    expect(stats.totalFailures).toBe(1);
    expect(stats.lastFailureAt).toBe(4_000);
    expect(stats.successRate).toBeCloseTo(0.75);
    expect(stats.failureRate).toBeCloseTo(0.25);
  });

  it('isolates counters per dependency', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op' });
    recordOperationFailure('dep-b', { correlationId: 'c2', operation: 'op' });
    const all = getAllDependencyStats();
    expect(all['dep-a'].totalSuccesses).toBe(1);
    expect(all['dep-b'].totalFailures).toBe(1);
    expect(all['dep-a'].totalFailures).toBe(0);
    expect(all['dep-b'].totalSuccesses).toBe(0);
  });

  it('does not create a stats entry when dependency is null', () => {
    recordOperationSuccess(null, { correlationId: 'c1', operation: 'op' });
    expect(getAllDependencyStats()).toEqual({});
  });
});

describe('resilience-stats: ring buffer', () => {
  it('returns empty when nothing has been recorded', () => {
    expect(getRecentTraces()).toEqual([]);
  });

  it('preserves recording order (oldest first)', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op-1' }, 1);
    recordOperationFailure('dep-a', { correlationId: 'c2', operation: 'op-2' }, 2);
    recordOperationSuccess('dep-b', { correlationId: 'c3', operation: 'op-3' }, 3);
    const traces = getRecentTraces();
    expect(traces.map(t => t.correlationId)).toEqual(['c1', 'c2', 'c3']);
    expect(traces[0].status).toBe('success');
    expect(traces[1].status).toBe('failure');
  });

  it('captures circuit_open outcome when supplied', () => {
    recordOperationFailure(
      'dep-a',
      { correlationId: 'c1', operation: 'op', outcome: 'circuit_open' },
      1,
    );
    expect(getRecentTraces()[0].outcome).toBe('circuit_open');
  });

  it(`rotates after ${__RESILIENCE_RING_CAPACITY} entries`, () => {
    const N = __RESILIENCE_RING_CAPACITY + 5;
    for (let i = 0; i < N; i++) {
      recordOperationSuccess('dep-a', { correlationId: `c${i}`, operation: 'op' }, i);
    }
    const traces = getRecentTraces();
    expect(traces).toHaveLength(__RESILIENCE_RING_CAPACITY);
    // Oldest 5 should have been dropped; first remaining entry is c5.
    expect(traces[0].correlationId).toBe(`c5`);
    expect(traces[traces.length - 1].correlationId).toBe(`c${N - 1}`);
  });

  it('falls back to "unknown" correlationId when none supplied', () => {
    recordOperationSuccess('dep-a', { operation: 'op' });
    expect(getRecentTraces()[0].correlationId).toBe('unknown');
  });

  it('does not leak PII — only fixed-shape fields exposed', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op' });
    const trace = getRecentTraces()[0];
    expect(Object.keys(trace).sort()).toEqual(
      ['at', 'correlationId', 'dependency', 'operation', 'status'].sort(),
    );
  });
});

describe('resilience-stats: instance info', () => {
  it('returns a stable instanceId across calls (per process)', () => {
    const a = getInstanceInfo();
    const b = getInstanceInfo();
    expect(a.instanceId).toBe(b.instanceId);
    expect(a.instanceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  it('reports a monotonically non-decreasing uptimeMs', () => {
    const a = getInstanceInfo(5_000);
    const b = getInstanceInfo(6_000);
    expect(b.uptimeMs).toBeGreaterThanOrEqual(a.uptimeMs);
  });
});

describe('resilience-stats: read-only contract', () => {
  it('returned trace arrays are copies (mutations do not affect internal state)', () => {
    recordOperationSuccess('dep-a', { correlationId: 'c1', operation: 'op' });
    const traces = getRecentTraces();
    traces.push({ at: 0, correlationId: 'injected', operation: 'evil', dependency: null, status: 'success' });
    expect(getRecentTraces()).toHaveLength(1);
  });
});
