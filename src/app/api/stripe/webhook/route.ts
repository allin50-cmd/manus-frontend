import { NextRequest, NextResponse } from 'next/server';
import { stripe, assertStripeKey } from '@/lib/stripe/client';
import { handleWebhookEvent } from '@/lib/stripe/webhook';
import { log } from '@/lib/logger';

export async function POST(req: NextRequest) {
  assertStripeKey();

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing stripe-signature or webhook secret' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    log.error('[webhook] Signature verification failed', {
      err: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    const result = await handleWebhookEvent(event);
    return NextResponse.json({ received: true, ...result });
  } catch (err) {
    log.error('[webhook] Handler error', {
      eventId: event.id,
      eventType: event.type,
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }
}
