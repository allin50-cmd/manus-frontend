/**
 * /api/connect/accounts/[accountId]/subscription
 *
 * POST — create a hosted Checkout Session for a platform subscription
 *        charged to a connected account.
 *
 * With V2 accounts, the connected account itself acts as the customer.
 * We use `customer_account` (the acct_*** ID) instead of a customer ID.
 *
 * Body: {} — no body required; accountId comes from the URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient, platformSubscriptionPriceId } from '@/lib/stripe/connect-client';

export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const { accountId } = params;

  // PLACEHOLDER: verify that the caller is authorised to subscribe this
  // account (e.g. check session cookie matches the account owner).

  if (platformSubscriptionPriceId === 'price_PLACEHOLDER') {
    return NextResponse.json(
      {
        error:
          'STRIPE_CONNECT_SUBSCRIPTION_PRICE_ID is not configured. ' +
          'Create a recurring price in your Stripe dashboard and set the env var.',
      },
      { status: 503 },
    );
  }

  const origin =
    process.env.PUBLIC_APP_URL ??
    process.env.APP_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000';

  try {
    // Create a subscription Checkout Session at the PLATFORM level.
    // customer_account uses the connected account ID (acct_***) directly —
    // V2 accounts have a unified ID that works for both account and customer.
    const session = await stripeClient.checkout.sessions.create({
      // V2: use customer_account with the acct_*** ID (not a cus_*** ID)
      customer_account: accountId,
      mode: 'subscription',
      line_items: [
        {
          price: platformSubscriptionPriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/connect/${accountId}?subscribed=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/connect/${accountId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }
}
