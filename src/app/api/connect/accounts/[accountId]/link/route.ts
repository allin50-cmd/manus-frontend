export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]/link
 *
 * POST — create a Stripe Account Link for onboarding a connected account.
 *
 * The returned `url` should be used to redirect the user to Stripe's
 * hosted onboarding flow.  After completion, Stripe redirects back to
 * `return_url`.  If the session expires, Stripe redirects to `refresh_url`.
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

  // Determine the base URL for return/refresh redirects.
  // PLACEHOLDER: in production, use your real domain from env.
  const origin =
    process.env.PUBLIC_APP_URL ??
    process.env.APP_URL ??
    req.headers.get('origin') ??
    'http://localhost:3000';

  let accountLink;
  try {
    // Create a V2 Account Link for the onboarding flow.
    // configurations: ['merchant', 'customer'] — onboard both config types.
    // refresh_url   — where Stripe redirects if the link expires.
    // return_url    — where Stripe redirects after onboarding completes.
    accountLink = await (stripeClient as any).v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: 'account_onboarding',
        account_onboarding: {
          configurations: ['merchant', 'customer'],
          refresh_url: `${origin}/connect/${accountId}`,
          return_url: `${origin}/connect/${accountId}?onboarded=1`,
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  // Return the hosted onboarding URL.
  // The client should redirect the user here immediately.
  return NextResponse.json({ url: accountLink.url });
}
