import { describe, it, expect, beforeEach } from 'vitest';
import {
  __resetCircuitBreakerForTests,
  configureDependency,
  getCircuitSnapshot,
  recordFailure,
  recordSuccess,
  shouldAllowExecution,
} from './circuit-breaker';

beforeEach(() => {
  __resetCircuitBreakerForTests();
});

describe('circuit-breaker: lifecycle', () => {
  it('starts CLOSED and allows execution', () => {
    expect(shouldAllowExecution('dep-a')).toBe(true);
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
  });

  it('stays CLOSED for failures below threshold', () => {
    configureDependency('dep-a', { failureThreshold: 5, windowMs: 60_000, cooldownMs: 30_000 });
    for (let i = 0; i < 4; i++) recordFailure('dep-a', 1_000 + i);
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
    expect(shouldAllowExecution('dep-a', 5_000)).toBe(true);
  });

  it('transitions CLOSED → OPEN at the failure threshold', () => {
    configureDependency('dep-a', { failureThreshold: 3, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    recordFailure('dep-a', 2_000);
    recordFailure('dep-a', 3_000);
    expect(getCircuitSnapshot('dep-a').state).toBe('open');
    expect(shouldAllowExecution('dep-a', 4_000)).toBe(false);
  });

  it('exposes cooldownRemainingMs while OPEN', () => {
    configureDependency('dep-a', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    const snap = getCircuitSnapshot('dep-a', 11_000);
    expect(snap.state).toBe('open');
    expect(snap.cooldownRemainingMs).toBe(20_000);
  });

  it('transitions OPEN → HALF-OPEN after cooldown and allows one probe', () => {
    configureDependency('dep-a', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    expect(shouldAllowExecution('dep-a', 10_000)).toBe(false); // still in cooldown
    expect(shouldAllowExecution('dep-a', 31_001)).toBe(true);  // cooldown elapsed
    expect(getCircuitSnapshot('dep-a').state).toBe('half-open');
  });

  it('transitions HALF-OPEN → CLOSED on success', () => {
    configureDependency('dep-a', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    shouldAllowExecution('dep-a', 31_001); // probe allowed → half-open
    recordSuccess('dep-a');
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
    expect(getCircuitSnapshot('dep-a').failures).toBe(0);
  });

  it('transitions HALF-OPEN → OPEN on probe failure', () => {
    configureDependency('dep-a', { failureThreshold: 1, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    shouldAllowExecution('dep-a', 31_001); // half-open
    recordFailure('dep-a', 31_500);
    expect(getCircuitSnapshot('dep-a').state).toBe('open');
    expect(shouldAllowExecution('dep-a', 32_000)).toBe(false); // back in cooldown
  });

  it('any success in CLOSED also resets the failure counter', () => {
    configureDependency('dep-a', { failureThreshold: 5, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 1_000);
    recordFailure('dep-a', 2_000);
    recordSuccess('dep-a');
    expect(getCircuitSnapshot('dep-a').failures).toBe(0);
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
  });
});

describe('circuit-breaker: sliding window', () => {
  it('failures outside the window do not count toward the threshold', () => {
    configureDependency('dep-a', { failureThreshold: 3, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 0);
    recordFailure('dep-a', 30_000);
    // 90_000 is > 60_000 after the last recorded failure (30_000) — counter resets
    recordFailure('dep-a', 95_000);
    expect(getCircuitSnapshot('dep-a').state).toBe('closed');
    expect(getCircuitSnapshot('dep-a').failures).toBe(1);
  });

  it('failures within the window accumulate', () => {
    configureDependency('dep-a', { failureThreshold: 3, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('dep-a', 0);
    recordFailure('dep-a', 20_000);
    recordFailure('dep-a', 40_000);
    expect(getCircuitSnapshot('dep-a').state).toBe('open');
  });
});

describe('circuit-breaker: per-dependency isolation', () => {
  it('opening one dependency does not affect another', () => {
    configureDependency('a', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 30_000 });
    configureDependency('b', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('a', 1_000);
    recordFailure('a', 2_000);
    expect(getCircuitSnapshot('a').state).toBe('open');
    expect(getCircuitSnapshot('b').state).toBe('closed');
    expect(shouldAllowExecution('b')).toBe(true);
  });
});

describe('circuit-breaker: cold start semantics', () => {
  it('a fresh module-level reset behaves like a process restart', () => {
    configureDependency('a', { failureThreshold: 2, windowMs: 60_000, cooldownMs: 30_000 });
    recordFailure('a', 1_000);
    recordFailure('a', 2_000);
    expect(getCircuitSnapshot('a').state).toBe('open');

    __resetCircuitBreakerForTests();

    // Configs and state are reset — back to defaults / closed.
    expect(getCircuitSnapshot('a').state).toBe('closed');
    expect(getCircuitSnapshot('a').failures).toBe(0);
  });
});
