export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]
 *
 * GET — fetch the live Stripe V2 account object + derived onboarding status.
 *
 * We always fetch from the Stripe API directly (never from a local cache)
 * so the onboarding status is always up-to-date.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe/connect-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const { accountId } = params;

  let account;
  try {
    // Retrieve the V2 account, expanding the merchant configuration and
    // requirements so we can determine onboarding completion client-side.
    account = await (stripeClient as any).v2.core.accounts.retrieve(accountId, {
      include: ['configuration.merchant', 'requirements'],
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  // ── Derive onboarding status ──────────────────────────────────────────────
  //
  // readyToProcessPayments: true when card_payments capability is active.
  // onboardingComplete: true when there are no currently_due / past_due items.
  const readyToProcessPayments =
    account?.configuration?.merchant?.capabilities?.card_payments?.status ===
    'active';

  const requirementsStatus =
    account.requirements?.summary?.minimum_deadline?.status;

  const onboardingComplete =
    requirementsStatus !== 'currently_due' &&
    requirementsStatus !== 'past_due';

  return NextResponse.json({
    account,
    status: {
      readyToProcessPayments,
      onboardingComplete,
      requirementsStatus: requirementsStatus ?? 'none',
    },
  });
}
