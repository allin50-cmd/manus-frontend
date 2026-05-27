/**
 * Lightweight scheduler lease using PostgreSQL.
 *
 * Prevents multiple Vercel instances from running the scheduler simultaneously.
 * Uses UPSERT with expiry semantics — no hard locks, tolerates crashes.
 */

import { getDb } from '../trpc/db';
import { schedulerLeases } from '../drizzle/schema';
import { eq, lt } from 'drizzle-orm';
import { log } from './logger';
import { getInstanceInfo } from './resilience-stats';

export interface LeaseResult {
  acquired: boolean;
  holderInstance: string | null;
  expiresAt: Date | null;
}

/**
 * Attempt to acquire a scheduler lease.
 *
 * Returns { acquired: true } if this instance now holds the lease.
 * Returns { acquired: false, holderInstance, expiresAt } if another instance holds it.
 *
 * @param leaseName   logical name for the lease (e.g. 'fineguard-compliance-check')
 * @param durationMs  how long the lease should be held (default: 5 minutes)
 */
export async function acquireSchedulerLease(
  leaseName: string,
  durationMs: number = 5 * 60_000,
): Promise<LeaseResult> {
  const db = await getDb();
  if (!db) {
    // DB unavailable — allow execution to avoid complete scheduler starvation
    log({ level: 'warn', event: 'scheduler_lease.db_unavailable', leaseName });
    return { acquired: true, holderInstance: null, expiresAt: null };
  }

  const { instanceId } = getInstanceInfo();
  const now = new Date();
  const expiresAt = new Date(Date.now() + durationMs);

  try {
    // Try to insert. If row exists and not expired, the WHERE on the update
    // prevents overwriting an active lease.
    // Strategy: SELECT first to check, then UPSERT if expired or absent.
    const existing = await db
      .select()
      .from(schedulerLeases)
      .where(eq(schedulerLeases.leaseName, leaseName))
      .limit(1);

    if (existing.length > 0) {
      const lease = existing[0];
      if (lease.expiresAt > now && lease.holderInstance !== instanceId) {
        // Active lease held by another instance
        log({
          level: 'info',
          event: 'scheduler_lease.skipped',
          leaseName,
          holderInstance: lease.holderInstance,
          expiresAt: lease.expiresAt.toISOString(),
        });
        return {
          acquired: false,
          holderInstance: lease.holderInstance,
          expiresAt: lease.expiresAt,
        };
      }
    }

    // No active lease — acquire it
    await db
      .insert(schedulerLeases)
      .values({
        leaseName,
        holderInstance: instanceId,
        acquiredAt: now,
        expiresAt,
      })
      .onConflictDoUpdate({
        target: schedulerLeases.leaseName,
        set: {
          holderInstance: instanceId,
          acquiredAt: now,
          expiresAt,
        },
      });

    log({
      level: 'info',
      event: 'scheduler_lease.acquired',
      leaseName,
      instanceId,
      expiresAt: expiresAt.toISOString(),
    });

    return { acquired: true, holderInstance: instanceId, expiresAt };
  } catch (err) {
    log({ level: 'warn', event: 'scheduler_lease.error', leaseName, error: String(err) });
    // On error, allow execution to prevent complete scheduler starvation
    return { acquired: true, holderInstance: instanceId, expiresAt };
  }
}

/**
 * Release a lease held by this instance.
 * Called after successful scheduler completion.
 */
export async function releaseSchedulerLease(leaseName: string): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const { instanceId } = getInstanceInfo();

  try {
    const existing = await db
      .select()
      .from(schedulerLeases)
      .where(eq(schedulerLeases.leaseName, leaseName))
      .limit(1);

    if (existing.length > 0 && existing[0].holderInstance === instanceId) {
      await db
        .delete(schedulerLeases)
        .where(eq(schedulerLeases.leaseName, leaseName));
      log({ level: 'info', event: 'scheduler_lease.released', leaseName });
    }
  } catch (err) {
    log({ level: 'warn', event: 'scheduler_lease.release_failed', leaseName, error: String(err) });
  }
}

/**
 * Read current lease state (for observability endpoint).
 */
export async function getSchedulerLeaseState(
  leaseName: string,
): Promise<{ held: boolean; holderInstance: string | null; expiresAt: Date | null }> {
  const db = await getDb();
  if (!db) return { held: false, holderInstance: null, expiresAt: null };

  try {
    const rows = await db
      .select()
      .from(schedulerLeases)
      .where(eq(schedulerLeases.leaseName, leaseName))
      .limit(1);

    if (rows.length === 0) return { held: false, holderInstance: null, expiresAt: null };
    const lease = rows[0];
    const held = lease.expiresAt > new Date();
    return {
      held,
      holderInstance: held ? lease.holderInstance : null,
      expiresAt: held ? lease.expiresAt : null,
    };
  } catch (err) {
    log({ level: 'warn', event: 'scheduler_lease.read_failed', leaseName, error: String(err) });
    return { held: false, holderInstance: null, expiresAt: null };
  }
}
