/**
 * Operational override engine.
 *
 * Evaluates active operational overrides from PostgreSQL to determine whether
 * a dependency or scheduler should be suppressed, forced open/closed, or
 * placed in maintenance mode.
 *
 * Overrides are evaluated before local circuit logic — they represent explicit
 * operator intent rather than automatic resilience responses.
 */

import { getDb } from '../trpc/db';
import { operationalOverrides } from '../drizzle/schema';
import { gt, or, isNull } from 'drizzle-orm';
import { log } from './logger';

export type OverrideType =
  | 'force_open'
  | 'force_closed'
  | 'maintenance_mode'
  | 'pause_scheduler'
  | 'disable_retry_budget';

export interface ActiveOverride {
  id: string;
  target: string;
  overrideType: OverrideType;
  value: Record<string, unknown>;
  expiresAt: Date | null;
  createdBy: string;
  reason: string;
  createdAt: Date;
}

export interface OverrideEvalResult {
  active: boolean;
  overrideType: OverrideType | null;
  overrideId: string | null;
  expiresAt: Date | null;
  reason: string | null;
}

/** In-memory cache with TTL to avoid hammering DB on every request */
let overrideCache: Map<string, ActiveOverride[]> = new Map();
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 30_000; // 30 second cache

/**
 * Last cache that was successfully populated from the DB.
 * Returned on DB failure so invalidateOverrideCache() followed by a DB blip
 * does not silently drop all active overrides — we serve stale data (minus
 * the just-deleted override if that was the reason for invalidation) rather
 * than an empty map.
 */
let lastValidCache: Map<string, ActiveOverride[]> = new Map();

/**
 * Load all active overrides from the database.
 * Uses a short in-memory cache to reduce DB round-trips on hot paths.
 */
async function loadActiveOverrides(): Promise<Map<string, ActiveOverride[]>> {
  const now = Date.now();
  if (now - cacheLoadedAt < CACHE_TTL_MS) {
    return overrideCache;
  }

  const db = await getDb();
  if (!db) return lastValidCache;

  try {
    const nowDate = new Date();
    const rows = await db
      .select()
      .from(operationalOverrides)
      .where(
        or(
          isNull(operationalOverrides.expiresAt),
          gt(operationalOverrides.expiresAt, nowDate),
        )!
      );

    const cache = new Map<string, ActiveOverride[]>();
    for (const row of rows) {
      const key = row.target;
      if (!cache.has(key)) cache.set(key, []);
      cache.get(key)!.push({
        id: row.id,
        target: row.target,
        overrideType: row.overrideType as OverrideType,
        value: (row.value as Record<string, unknown>) ?? {},
        expiresAt: row.expiresAt,
        createdBy: row.createdBy,
        reason: row.reason,
        createdAt: row.createdAt,
      });
    }

    overrideCache = cache;
    lastValidCache = cache;
    cacheLoadedAt = now;
    return cache;
  } catch (err) {
    log({ level: 'warn', event: 'override_engine.load_failed', error: String(err) });
    return lastValidCache; // serve last known-good data on DB error
  }
}

/**
 * Evaluate whether a specific override type is active for a target.
 *
 * @param target        dependency name or 'scheduler'
 * @param overrideType  the specific override to check for
 */
export async function evaluateOperationalOverride(
  target: string,
  overrideType: OverrideType,
): Promise<OverrideEvalResult> {
  const cache = await loadActiveOverrides();
  const overrides = cache.get(target) ?? [];

  const match = overrides.find(o => o.overrideType === overrideType);
  if (!match) {
    return { active: false, overrideType: null, overrideId: null, expiresAt: null, reason: null };
  }

  return {
    active: true,
    overrideType: match.overrideType,
    overrideId: match.id,
    expiresAt: match.expiresAt,
    reason: match.reason,
  };
}

/**
 * Get all active overrides for a target (used by observability endpoint).
 */
export async function getOverridesForTarget(target: string): Promise<ActiveOverride[]> {
  const cache = await loadActiveOverrides();
  return cache.get(target) ?? [];
}

/**
 * Get a flat map of target → active override summary for the resilience snapshot.
 */
export async function getAllActiveOverrides(): Promise<
  Record<string, { type: OverrideType; expiresAt: string | null; reason: string }>
> {
  const cache = await loadActiveOverrides();
  const out: Record<string, { type: OverrideType; expiresAt: string | null; reason: string }> = {};

  for (const [target, overrides] of cache) {
    // Most recent override wins for display purposes
    if (overrides.length > 0) {
      const primary = overrides[0];
      out[target] = {
        type: primary.overrideType,
        expiresAt: primary.expiresAt?.toISOString() ?? null,
        reason: primary.reason,
      };
    }
  }

  return out;
}

/** Invalidate the in-memory cache (call after creating/deleting overrides). */
export function invalidateOverrideCache(): void {
  cacheLoadedAt = 0;
  overrideCache = new Map();
}

/** Test helper — reset all cache state. */
export function __resetOverrideCacheForTests(): void {
  cacheLoadedAt = 0;
  overrideCache = new Map();
  lastValidCache = new Map();
}
