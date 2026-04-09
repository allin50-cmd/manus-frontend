import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import type { AlertType } from '@/types/alerts';
import { isRateLimited, getClientIp } from '@/lib/utils/rateLimiter';

// 10 checkout attempts per minute per IP
const CHECKOUT_RATE_LIMIT = 10;
const CHECKOUT_RATE_WINDOW_MS = 60_000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`checkout:${ip}`, CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many checkout attempts — please wait before trying again' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const {
    companyNumber,
    companyName,
    selectedServices,
    tenantId,
    fgRef,
    customerEmail,
  } = await req.json();

  if (!companyNumber || !companyName || !selectedServices?.length) {
    return NextResponse.json(
      { error: 'companyNumber, companyName, and selectedServices are required' },
      { status: 400 },
    );
  }

  try {
    const session = await createCheckoutSession({
      companyNumber,
      companyName,
      selectedServices: selectedServices as AlertType[],
      tenantId,
      fgRef,
      customerEmail,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('[checkout] Stripe session creation failed:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
