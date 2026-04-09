import { and, lt, eq } from 'drizzle-orm';
import { db } from '../../db';
import { stripeWebhookEvents } from '../../db/schema';
import { log } from '@/lib/logger';

/** Events stuck in `processing` for longer than this are considered crashed */
const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Resets events stuck in `processing` to `failed`, removing them from the
 * partial unique index so Stripe's next delivery retry can re-claim them.
 *
 * Why events get stuck:
 *   Two-phase idempotency inserts the event as `processing` then updates to
 *   `processed`/`failed` after the handler completes.  If the process crashes
 *   between INSERT and UPDATE, the row stays `processing` forever — Stripe
 *   retries are blocked by the partial unique index and the event is lost.
 *
 * Call this from a cron job every few minutes, or from a startup health check.
 *
 * @returns Array of reset event IDs (for logging/alerting)
 */
export async function resetStaleProcessingEvents(): Promise<string[]> {
  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  const rows = await db
    .update(stripeWebhookEvents)
    .set({
      status: 'failed',
      failureReason: 'reset by recovery job: stuck in processing state',
      errorType: 'retryable',
    })
    .where(
      and(
        eq(stripeWebhookEvents.status, 'processing'),
        lt(stripeWebhookEvents.createdAt, cutoff),
      ),
    )
    .returning({
      eventId: stripeWebhookEvents.eventId,
      type: stripeWebhookEvents.type,
    });

  if (rows.length > 0) {
    log.warn('webhook recovery: reset stale processing events', {
      count: rows.length,
      events: rows.map((r) => ({ eventId: r.eventId, type: r.type })),
    });
  }

  return rows.map((r) => r.eventId);
}

/**
 * Returns all failed events with their stored payload, ordered by most recent.
 * Use this to identify events that need manual investigation or replay.
 */
export async function listFailedEvents(limit = 50) {
  return db
    .select({
      id: stripeWebhookEvents.id,
      eventId: stripeWebhookEvents.eventId,
      type: stripeWebhookEvents.type,
      errorType: stripeWebhookEvents.errorType,
      failureReason: stripeWebhookEvents.failureReason,
      createdAt: stripeWebhookEvents.createdAt,
      payload: stripeWebhookEvents.payload,
    })
    .from(stripeWebhookEvents)
    .where(eq(stripeWebhookEvents.status, 'failed'))
    .orderBy(stripeWebhookEvents.createdAt)
    .limit(limit);
}
