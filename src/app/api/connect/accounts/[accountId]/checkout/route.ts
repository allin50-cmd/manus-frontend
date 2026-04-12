export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]/checkout
 *
 * POST — create a Stripe Checkout Session using a Direct Charge.
 *
 * Direct Charge means:
 *  - The charge appears on the connected account's Stripe account.
 *  - The platform takes an application_fee_amount from each transaction.
 *  - The customer's card statement shows the connected account's name.
 *
 * Body: { priceId: string, quantity?: number }
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { stripeClient, APPLICATION_FEE_AMOUNT } from '@/lib/stripe/connect-client';

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const unauth = requireSession(req);
  if (unauth) return unauth;
  const { accountId } = params;

  let body: { priceId?: string; quantity?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { priceId, quantity = 1 } = body;
  if (!priceId) {
    return NextResponse.json({ error: 'priceId is required' }, { status: 422 });
  }

  // Build the base URL for success/cancel redirects.
  // PLACEHOLDER: use your real domain in production.
  const origin =
    process.env.PUBLIC_APP_URL ??
    process.env.APP_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000';

  try {
    // Create a Checkout Session on the CONNECTED account using the
    // stripeAccount option.  This is a Direct Charge — the connected
    // account is the merchant of record for this payment.
    const session = await stripeClient.checkout.sessions.create(
      {
        line_items: [
          {
            price: priceId,
            quantity,
          },
        ],
        payment_intent_data: {
          // The platform earns APPLICATION_FEE_AMOUNT on every transaction.
          // This is deducted from the connected account's payout.
          // PLACEHOLDER: adjust APPLICATION_FEE_AMOUNT in connect-client.ts
          application_fee_amount: APPLICATION_FEE_AMOUNT,
        },
        mode: 'payment',
        // After payment, Stripe redirects here with ?session_id=...
        success_url: `${origin}/store/${accountId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/store/${accountId}`,
      },
      {
        // stripeAccount header → charges the connected account directly
        stripeAccount: accountId,
      },
    );

    // Return the hosted checkout URL for the client to redirect to.
    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }
}
