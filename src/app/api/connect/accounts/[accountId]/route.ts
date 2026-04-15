export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]
 *
 * GET — fetch live Stripe V2 account status + DB-persisted subscription state.
 *
 * Onboarding status is always fetched live from Stripe so it reflects the
 * latest verification state.  Subscription status is read from the DB (written
 * by the subscription-webhook handler) to avoid an extra Stripe API call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { stripeClient } from '@/lib/stripe/connect-client';
import postgres from 'postgres';

function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { max: 1 });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ accountId: string }> },
) {
  const unauth = await requireSession(req);
  if (unauth) return unauth;
  const { accountId } = await params;

  // ── Fetch live Stripe account status ───────────────────────────────────────
  let account;
  try {
    account = await (stripeClient as any).v2.core.accounts.retrieve(accountId, {
      include: ['configuration.merchant', 'requirements'],
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  // ── Fetch DB-persisted subscription/capability state ───────────────────────
  let dbRow: {
    subscription_status: string | null;
    subscription_price_id: string | null;
    last_payment_at: string | null;
    card_payments_status: string | null;
  } | null = null;

  const sql = getDb();
  try {
    const rows = await sql<{
      subscription_status: string | null;
      subscription_price_id: string | null;
      last_payment_at: string | null;
      card_payments_status: string | null;
    }[]>`
      SELECT subscription_status, subscription_price_id,
             last_payment_at, card_payments_status
      FROM connected_accounts
      WHERE stripe_account_id = ${accountId}
      LIMIT 1
    `;
    dbRow = rows[0] ?? null;
  } catch {
    // Non-fatal — DB fields are bonus info; Stripe fields are the source of truth
  } finally {
    await sql.end();
  }

  // ── Derive onboarding status from live Stripe data ─────────────────────────
  const readyToProcessPayments =
    account?.configuration?.merchant?.capabilities?.card_payments?.status === 'active';

  const requirementsStatus =
    account.requirements?.summary?.minimum_deadline?.status;

  const onboardingComplete =
    requirementsStatus !== 'currently_due' &&
    requirementsStatus !== 'past_due';

  return NextResponse.json({
    account,
    status: {
      // Live from Stripe
      readyToProcessPayments,
      onboardingComplete,
      requirementsStatus: requirementsStatus ?? 'none',
      // Persisted by webhook handlers
      subscriptionStatus: dbRow?.subscription_status ?? null,
      subscriptionPriceId: dbRow?.subscription_price_id ?? null,
      lastPaymentAt: dbRow?.last_payment_at ?? null,
      cardPaymentsStatus: dbRow?.card_payments_status ?? null,
    },
  });
}
