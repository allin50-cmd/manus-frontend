import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getStripe } from '@/lib/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function upsertSubscription(sub: Stripe.Subscription, tenantId: string) {
  const status = sub.status;
  const isActive = status === 'active' || status === 'trialing';
  await prisma.subscription.upsert({
    where: { stripeSubscriptionId: sub.id },
    create: {
      tenantId,
      vertical: 'all',
      stripeSubscriptionId: sub.id,
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
    update: {
      status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    },
  });
  await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      plan: isActive ? 'pro' : 'free',
      enabledVerticals: isActive ? ['revenue', 'law', 'compliance'] : ['revenue'],
    },
  });
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || secret === 'placeholder') {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const sig = req.headers.get('stripe-signature');
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(raw, sig, secret);
  } catch (e) {
    return NextResponse.json(
      { error: `Invalid signature: ${e instanceof Error ? e.message : 'unknown'}` },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object as Stripe.Checkout.Session;
        const tenantId = s.metadata?.tenantId;
        const subId = typeof s.subscription === 'string' ? s.subscription : s.subscription?.id;
        if (tenantId && subId) {
          const sub = await getStripe().subscriptions.retrieve(subId);
          await upsertSubscription(sub, tenantId);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const tenantId = sub.metadata?.tenantId;
        if (tenantId) await upsertSubscription(sub, tenantId);
        break;
      }
    }
  } catch (e) {
    console.error('stripe webhook handler error', e);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
