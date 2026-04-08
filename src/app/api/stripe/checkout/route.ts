import { NextRequest, NextResponse } from 'next/server';
import { stripe, assertStripeKey } from '@/lib/stripe/client';
import { buildLineItems } from '@/lib/stripe/checkout';
import type { AlertType } from '@/types/alerts';
import { isRateLimited, getClientIp } from '@/lib/utils/rateLimiter';
import { config } from '@/config';

// 10 checkout attempts per minute per IP
const CHECKOUT_RATE_LIMIT = 10;
const CHECKOUT_RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  assertStripeKey();

  const ip = getClientIp(req);
  if (isRateLimited(`checkout:${ip}`, CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many checkout attempts — please wait before trying again' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const { companyNumber, companyName, selectedServices } = await req.json();

  if (!companyNumber || !companyName || !selectedServices?.length) {
    return NextResponse.json(
      { error: 'companyNumber, companyName, and selectedServices are required' },
      { status: 400 },
    );
  }

  const appUrl = config.publicAppUrl;

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
