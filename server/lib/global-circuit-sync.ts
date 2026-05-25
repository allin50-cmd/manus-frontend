/**
 * Global circuit state synchronisation with PostgreSQL.
 *
 * Provides eventual consistency for circuit breaker state across serverless
 * instances. No request blocks on this — all Postgres operations are
 * fire-and-forget with catch, or called opportunistically in background.
 *
 * The local circuit breaker is always the source of truth for fast-path
 * decisions. This module only supplements it with cross-instance visibility.
 */

import { getDb } from '../trpc/db';
import { globalResilienceState } from '../drizzle/schema';
import { gte } from 'drizzle-orm';
import { log } from './logger';
import { getInstanceInfo } from './resilience-stats';
import {
  getAllCircuitSnapshots,
  configureDependency,
  recordFailure,
  type CircuitStateName,
} from './circuit-breaker';

export interface GlobalCircuitRow {
  dependency: string;
  circuitState: CircuitStateName;
  failureCount: number;
  lastFailureAt: Date | null;
  cooldownUntil: Date | null;
  lastSuccessAt: Date | null;
  updatedAt: Date;
  instanceId: string;
}

/**
 * Persist local circuit snapshots to Postgres asynchronously.
 * Called after state changes; never blocks the caller.
 */
export function pushCircuitStateAsync(dependency: string): void {
  const { instanceId } = getInstanceInfo();
  const snapshots = getAllCircuitSnapshots();
  const snap = snapshots[dependency];
  if (!snap) return;

  const now = new Date();
  const cooldownUntil = snap.cooldownRemainingMs > 0
    ? new Date(Date.now() + snap.cooldownRemainingMs)
    : null;

  getDb().then(db => {
    if (!db) return;
    return db
      .insert(globalResilienceState)
      .values({
        dependency,
        circuitState: snap.state,
        failureCount: snap.failures,
        lastFailureAt: snap.lastFailureAt ? new Date(snap.lastFailureAt) : null,
        cooldownUntil,
        lastSuccessAt: null,
        updatedAt: now,
        instanceId,
      })
      .onConflictDoUpdate({
        target: globalResilienceState.dependency,
        set: {
          circuitState: snap.state,
          failureCount: snap.failures,
          lastFailureAt: snap.lastFailureAt ? new Date(snap.lastFailureAt) : null,
          cooldownUntil,
          updatedAt: now,
          instanceId,
        },
      });
  }).catch(err =>
    log({ level: 'warn', event: 'global_circuit_sync.push_failed', dependency, error: String(err) })
  );
}

/**
 * Reconcile local circuit state from global Postgres state.
 *
 * Rules:
 * - OPEN wins over CLOSED (most degraded state wins)
 * - States older than staleTtlMs are ignored (dead instance cleanup)
 * - Never overrides a locally-OPEN circuit with a globally-CLOSED one
 */
export async function syncGlobalCircuitState(
  staleTtlMs: number = 5 * 60_000,
): Promise<{ synced: number; errors: string[] }> {
  const db = await getDb();
  if (!db) return { synced: 0, errors: ['db_unavailable'] };

  const cutoff = new Date(Date.now() - staleTtlMs);
  const errors: string[] = [];
  let synced = 0;

  try {
    const rows = await db
      .select()
      .from(globalResilienceState)
      .where(gte(globalResilienceState.updatedAt, cutoff));

    const local = getAllCircuitSnapshots();

    for (const row of rows) {
      const localSnap = local[row.dependency];
      // OPEN wins: only reconcile if global is MORE degraded than local
      if (row.circuitState === 'open' && (!localSnap || localSnap.state !== 'open')) {
        const now = Date.now();
        const cooldownUntil = row.cooldownUntil ? row.cooldownUntil.getTime() : 0;
        const remainingMs = Math.max(0, cooldownUntil - now);

        if (remainingMs > 0) {
          // Replay failures to open the circuit locally
          configureDependency(row.dependency, {
            failureThreshold: 1,
            windowMs: 60_000,
            cooldownMs: remainingMs,
          });
          recordFailure(row.dependency, now);
          synced++;
        }
      }
    }
  } catch (err) {
    errors.push(String(err));
    log({ level: 'warn', event: 'global_circuit_sync.reconcile_failed', error: String(err) });
  }

  return { synced, errors };
}

/**
 * Read all global circuit state rows (for observability endpoint).
 * Returns empty object on DB error — observability must not fail the response.
 */
export async function getAllGlobalCircuitState(): Promise<Record<string, GlobalCircuitRow>> {
  const db = await getDb();
  if (!db) return {};

  try {
    const rows = await db.select().from(globalResilienceState);
    const out: Record<string, GlobalCircuitRow> = {};
    for (const row of rows) {
      out[row.dependency] = {
        dependency: row.dependency,
        circuitState: row.circuitState as CircuitStateName,
        failureCount: row.failureCount,
        lastFailureAt: row.lastFailureAt,
        cooldownUntil: row.cooldownUntil,
        lastSuccessAt: row.lastSuccessAt,
        updatedAt: row.updatedAt,
        instanceId: row.instanceId,
      };
    }
    return out;
  } catch (err) {
    log({ level: 'warn', event: 'global_circuit_sync.read_failed', error: String(err) });
    return {};
  }
}
