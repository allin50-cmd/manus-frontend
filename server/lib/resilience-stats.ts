/**
 * In-memory resilience statistics for the observability endpoint.
 *
 * Tracks per-dependency success/failure counters and a small ring buffer
 * of recent traced operations. Strictly per-process, per-cold-start —
 * matches the circuit breaker's lifetime semantics so the resilience
 * snapshot is internally consistent.
 */

import { randomUUID } from 'crypto';

export interface DependencyStats {
  totalSuccesses: number;
  totalFailures: number;
  lastSuccessAt: number; // epoch ms; 0 if never
  lastFailureAt: number; // epoch ms; 0 if never
}

export interface DependencyStatsView extends DependencyStats {
  /** successes / (successes + failures); 0 when no calls observed. */
  successRate: number;
  failureRate: number;
}

export interface OperationTrace {
  at: number;
  correlationId: string;
  /** Operation name (logical "what was happening"), used in place of HTTP route. */
  operation: string;
  dependency: string | null;
  status: 'success' | 'failure';
  /** Set to 'circuit_open' when the call was skipped by the breaker. */
  outcome?: 'circuit_open';
}

const RING_CAPACITY = 20;

const stats = new Map<string, DependencyStats>();
const ring: OperationTrace[] = [];

const processStartedAt = Date.now();
const instanceId = randomUUID();

function freshStats(): DependencyStats {
  return { totalSuccesses: 0, totalFailures: 0, lastSuccessAt: 0, lastFailureAt: 0 };
}

function getOrCreate(dependency: string): DependencyStats {
  let s = stats.get(dependency);
  if (!s) {
    s = freshStats();
    stats.set(dependency, s);
  }
  return s;
}

/**
 * Record a successful operation against a dependency.
 *
 * Pure bookkeeping — no I/O, no logging, no exceptions.
 */
export function recordOperationSuccess(
  dependency: string | null | undefined,
  trace: { correlationId?: string; operation: string },
  now: number = Date.now(),
): void {
  if (dependency) {
    const s = getOrCreate(dependency);
    s.totalSuccesses += 1;
    s.lastSuccessAt = now;
  }
  pushTrace({
    at: now,
    correlationId: trace.correlationId ?? 'unknown',
    operation: trace.operation,
    dependency: dependency ?? null,
    status: 'success',
  });
}

export function recordOperationFailure(
  dependency: string | null | undefined,
  trace: { correlationId?: string; operation: string; outcome?: 'circuit_open' },
  now: number = Date.now(),
): void {
  if (dependency) {
    const s = getOrCreate(dependency);
    s.totalFailures += 1;
    s.lastFailureAt = now;
  }
  pushTrace({
    at: now,
    correlationId: trace.correlationId ?? 'unknown',
    operation: trace.operation,
    dependency: dependency ?? null,
    status: 'failure',
    outcome: trace.outcome,
  });
}

function pushTrace(entry: OperationTrace): void {
  ring.push(entry);
  if (ring.length > RING_CAPACITY) {
    ring.splice(0, ring.length - RING_CAPACITY);
  }
}

/** Read-only view of one dependency's stats (with derived rates). */
export function getDependencyStats(dependency: string): DependencyStatsView {
  const s = stats.get(dependency) ?? freshStats();
  return toView(s);
}

/** Snapshot of all dependencies that have recorded at least one call. */
export function getAllDependencyStats(): Record<string, DependencyStatsView> {
  const out: Record<string, DependencyStatsView> = {};
  for (const [dep, s] of stats) {
    out[dep] = toView(s);
  }
  return out;
}

function toView(s: DependencyStats): DependencyStatsView {
  const total = s.totalSuccesses + s.totalFailures;
  const successRate = total === 0 ? 0 : s.totalSuccesses / total;
  return {
    ...s,
    successRate,
    failureRate: 1 - successRate,
  };
}

/** Returns the ring buffer in oldest-first order. Caller gets a copy. */
export function getRecentTraces(): OperationTrace[] {
  return ring.slice();
}

export function getInstanceInfo(now: number = Date.now()): { instanceId: string; uptimeMs: number } {
  return { instanceId, uptimeMs: now - processStartedAt };
}

/** Test-only reset. Production uses cold-start reset. */
export function __resetResilienceStatsForTests(): void {
  stats.clear();
  ring.splice(0, ring.length);
}

export const __RESILIENCE_RING_CAPACITY = RING_CAPACITY;
