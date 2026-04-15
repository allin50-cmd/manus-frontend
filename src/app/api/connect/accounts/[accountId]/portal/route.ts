export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]/portal
 *
 * POST — create a Stripe Billing Portal session for a connected account.
 *
 * The portal lets the connected account manage their platform subscription:
 * update payment method, view invoices, cancel/upgrade subscription.
 *
 * With V2 accounts, use `customer_account` (acct_***) instead of
 * a `customer` (cus_***) ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { stripeClient } from '@/lib/stripe/connect-client';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const unauth = await requireSession(req);
  if (unauth) return unauth;
  const { accountId } = await params;

  const origin =
    process.env.PUBLIC_APP_URL ??
    process.env.APP_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000';

  try {
    // Create a billing portal session.
    // customer_account: the acct_*** ID works directly for V2 accounts.
    // return_url: where the user lands after closing the portal.
    const session = await stripeClient.billingPortal.sessions.create({
      customer_account: accountId,
      return_url: `${origin}/connect/${accountId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }
}
