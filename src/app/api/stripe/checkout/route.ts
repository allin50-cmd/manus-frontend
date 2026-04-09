import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { isRateLimited, getClientIp } from '@/lib/utils/rateLimiter';
import { log } from '@/lib/logger';

// 10 checkout attempts per minute per IP
const CHECKOUT_RATE_LIMIT = 10;
const CHECKOUT_RATE_WINDOW_MS = 60_000;

const ALERT_TYPES = ['accounts_filing', 'confirmation_statement', 'strike_off'] as const;

const checkoutSchema = z.object({
  companyNumber: z.string().min(1).max(50),
  companyName: z.string().min(1).max(255),
  selectedServices: z.array(z.enum(ALERT_TYPES)).min(1, 'At least one service required'),
  tenantId: z.string().uuid().optional(),
  fgRef: z.string().max(100).optional(),
  customerEmail: z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(`checkout:${ip}`, CHECKOUT_RATE_LIMIT, CHECKOUT_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many checkout attempts — please wait before trying again' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { companyNumber, companyName, selectedServices, tenantId, fgRef, customerEmail } =
    parsed.data;

  try {
    const session = await createCheckoutSession({
      companyNumber,
      companyName,
      selectedServices,
      tenantId,
      fgRef,
      customerEmail,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    log.error('[checkout] Stripe session creation failed', { err });
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
