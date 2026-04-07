import { NextRequest, NextResponse } from 'next/server';
import { stripe, assertStripeKey } from '@/lib/stripe/client';
import { buildLineItems } from '@/lib/stripe/checkout';
import type { AlertType } from '@/types/alerts';

export async function POST(req: NextRequest) {
  const { companyNumber, companyName, selectedServices } = await req.json();

  assertStripeKey();

  if (!companyNumber || !companyName || !selectedServices?.length) {
    return NextResponse.json({ error: 'companyNumber, companyName, and selectedServices are required' }, { status: 400 });
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: buildLineItems(selectedServices as AlertType[]),
      metadata: {
        companyNumber,
        companyName,
        alertTypes: (selectedServices as AlertType[]).join(','),
      },
      success_url: `${appUrl}/check?activated=1&company=${encodeURIComponent(companyNumber)}`,
      cancel_url: `${appUrl}/check?q=${encodeURIComponent(companyNumber)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
