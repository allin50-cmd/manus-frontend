import { and, lt, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db';
import { stripeWebhookEvents } from '../../db/schema';
import { log } from '@/lib/logger';

/** Events stuck in `processing` longer than this are considered crashed */
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Maximum delivery attempts before an event is moved to dead_letter.
 * Includes both Stripe retries and recovery resets.  At attempt 5 the
 * event is permanently locked out — the stored payload is available
 * for manual investigation/replay via GET /api/stripe/webhook/recovery.
 */
export const MAX_ATTEMPTS = 5;

/**
 * Per-event recovery: for each stale processing event, atomically claim it
 * (UPDATE WHERE status='processing') and either reset to failed (retriable)
 * or move to dead_letter (exhausted).
 *
 * Why per-event instead of bulk UPDATE:
 *   A bulk UPDATE can claim rows that another recovery worker has already
 *   started resetting, leading to duplicate dead-lettering.  Using per-event
 *   UPDATE-with-WHERE provides the same optimistic exclusion as the original
 *   claim INSERT.
 *
 * @returns Summary of actions taken
 */
export async function resetStaleProcessingEvents(): Promise<{
  reset: string[];
  deadLettered: string[];
}> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Find candidates — read-only first pass; actual mutation below is atomic
  const candidates = await db
    .select({
      id: stripeWebhookEvents.id,
      eventId: stripeWebhookEvents.eventId,
      type: stripeWebhookEvents.type,
      attemptCount: stripeWebhookEvents.attemptCount,
    })
    .from(stripeWebhookEvents)
    .where(
      and(
        eq(stripeWebhookEvents.status, 'processing'),
        lt(stripeWebhookEvents.createdAt, cutoff),
      ),
    )
    .limit(100); // cap to avoid thundering-herd on a large backlog

  const reset: string[] = [];
  const deadLettered: string[] = [];

  for (const candidate of candidates) {
    const isExhausted = candidate.attemptCount >= MAX_ATTEMPTS - 1;
    const nextStatus = isExhausted ? 'dead_letter' : 'failed';

    // Atomic per-event claim: only one recovery worker wins per row
    const updated = await db
      .update(stripeWebhookEvents)
      .set({
        status: nextStatus,
        attemptCount: sql`attempt_count + 1`,
        failureReason: isExhausted
          ? `dead-lettered after ${MAX_ATTEMPTS} attempts`
          : 'reset by recovery job: stuck in processing state',
        errorType: isExhausted ? 'permanent' : 'retryable',
      })
      .where(
        and(
          eq(stripeWebhookEvents.id, candidate.id),
          eq(stripeWebhookEvents.status, 'processing'), // lost-race guard
        ),
      )
      .returning({ eventId: stripeWebhookEvents.eventId });

    if (updated.length === 0) continue; // another worker claimed it

    if (isExhausted) {
      deadLettered.push(candidate.eventId);
      log.error('webhook dead-lettered: exhausted max attempts', {
        eventId: candidate.eventId,
        type: candidate.type,
        attempts: candidate.attemptCount + 1,
      });
    } else {
      reset.push(candidate.eventId);
    }
  }

  if (reset.length > 0 || deadLettered.length > 0) {
    log.warn('webhook recovery complete', {
      reset: reset.length,
      deadLettered: deadLettered.length,
    });
  }

  return { reset, deadLettered };
}

/**
 * Returns failed and dead-lettered events with their stored payloads.
 * Payloads enable manual replay without hitting Stripe's API.
 */
export async function listFailedEvents(limit = 50) {
  return db
    .select({
      id: stripeWebhookEvents.id,
      eventId: stripeWebhookEvents.eventId,
      type: stripeWebhookEvents.type,
      status: stripeWebhookEvents.status,
      errorType: stripeWebhookEvents.errorType,
      attemptCount: stripeWebhookEvents.attemptCount,
      failureReason: stripeWebhookEvents.failureReason,
      eventCreatedAt: stripeWebhookEvents.eventCreatedAt,
      createdAt: stripeWebhookEvents.createdAt,
      payload: stripeWebhookEvents.payload,
    })
    .from(stripeWebhookEvents)
    .where(inArray(stripeWebhookEvents.status, ['failed', 'dead_letter']))
    .orderBy(stripeWebhookEvents.createdAt)
    .limit(limit);
}
