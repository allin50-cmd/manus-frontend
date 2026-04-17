import { db } from '../db/index';
import { zapierSubscriptions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export type ZapierEvent =
  | 'new_audit_lead'
  | 'new_lead'
  | 'deal_escalated'
  | 'deal_closed';

// ── Subscribe ────────────────────────────────────────────────────────────────

export async function subscribe(hookUrl: string, event: ZapierEvent, apiKey: string) {
  const [row] = await db
    .insert(zapierSubscriptions)
    .values({ hookUrl, event, apiKey })
    .returning();
  console.log(`[zapier] subscribed: ${event} → ${hookUrl}`);
  return row;
}

// ── Unsubscribe ──────────────────────────────────────────────────────────────

export async function unsubscribe(hookUrl: string, event: ZapierEvent) {
  await db
    .delete(zapierSubscriptions)
    .where(
      and(
        eq(zapierSubscriptions.hookUrl, hookUrl),
        eq(zapierSubscriptions.event, event)
      )
    );
  console.log(`[zapier] unsubscribed: ${event} ← ${hookUrl}`);
}

// ── Fire ─────────────────────────────────────────────────────────────────────

export async function fire(event: ZapierEvent, payload: Record<string, unknown>) {
  const subs = await db
    .select()
    .from(zapierSubscriptions)
    .where(eq(zapierSubscriptions.event, event));

  if (subs.length === 0) return;

  const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });

  await Promise.allSettled(
    subs.map(async (sub) => {
      try {
        const res = await fetch(sub.hookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          signal: AbortSignal.timeout(8000),
        });
        console.log(`[zapier] fired ${event} → ${sub.hookUrl} [${res.status}]`);
      } catch (err) {
        console.error(`[zapier] failed to fire ${event} → ${sub.hookUrl}:`, err);
      }
    })
  );
}

// ── List subscriptions by event (for Zapier polling fallback) ────────────────

export async function listByEvent(event: ZapierEvent) {
  return db
    .select()
    .from(zapierSubscriptions)
    .where(eq(zapierSubscriptions.event, event));
}
