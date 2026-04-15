import { db } from '@/server/db';
import { webhookSubscriptions } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { log } from '@/lib/logger';

export interface FireResult {
  total: number;
  delivered: number;
  failed: number;
}

/**
 * POSTs `payload` to every registered outbound webhook for the given `event`.
 * Failures on individual hooks are logged but do not throw — the caller
 * receives a summary so it can decide whether to surface errors.
 *
 * Timeout per hook: 10 seconds.
 */
export async function fireWebhooks(event: string, payload: object): Promise<FireResult> {
  const hooks = await db
    .select()
    .from(webhookSubscriptions)
    .where(eq(webhookSubscriptions.event, event));

  if (hooks.length === 0) {
    return { total: 0, delivered: 0, failed: 0 };
  }

  const results = await Promise.allSettled(
    hooks.map(async (hook) => {
      const res = await fetch(hook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        log.warn('[fireWebhooks] Non-2xx response', {
          hookId: hook.id,
          event,
          status: res.status,
        });
        throw new Error(`HTTP ${res.status}`);
      }
    }),
  );

  const delivered = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    log.warn('[fireWebhooks] Some deliveries failed', { event, delivered, failed });
  }

  return { total: hooks.length, delivered, failed };
}
