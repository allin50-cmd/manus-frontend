import { NextRequest, NextResponse } from 'next/server';
import { stripe, assertStripeKey } from '@/lib/stripe/client';
import { handleWebhookEvent } from '@/lib/stripe/webhook';
import { db } from '@/server/db';
import { stripeWebhookEvents } from '@/server/db/schema';

export async function POST(req: NextRequest) {
  assertStripeKey();
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: attempt to record this event ID; skip if already processed
  const inserted = await db
    .insert(stripeWebhookEvents)
    .values({ eventId: event.id, type: event.type })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id });

  if (inserted.length === 0) {
    // Duplicate delivery — Stripe retried an already-processed event
    return NextResponse.json({ received: true, deduplicated: true });
  }

  try {
    await handleWebhookEvent(event);
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Webhook handler error [${event.id}]:`, err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
