export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts/[accountId]/products
 *
 * GET  — list active products on the connected account's Stripe account.
 * POST — create a product + default price on the connected account.
 *
 * All requests use the `stripeAccount` header so they operate on the
 * connected account's data, not the platform account's data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/session';
import { stripeClient } from '@/lib/stripe/connect-client';

// ---------------------------------------------------------------------------
// GET /api/connect/accounts/[accountId]/products
// ---------------------------------------------------------------------------
export async function GET(
  req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const unauth = requireSession(req);
  if (unauth) return unauth;
  const { accountId } = params;

  try {
    // List up to 20 active products, expanding the default_price so the
    // storefront has price information without a second round-trip.
    const products = await stripeClient.products.list(
      {
        limit: 20,
        active: true,
        expand: ['data.default_price'],
      },
      {
        // stripeAccount header → operates on the connected account
        stripeAccount: accountId,
      },
    );

    return NextResponse.json({ products: products.data });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/connect/accounts/[accountId]/products
// Body: { name: string, description: string, amount: number, currency: string }
// amount is in the smallest unit (e.g. pence for GBP, cents for USD).
// ---------------------------------------------------------------------------
export async function POST(
  req: NextRequest,
  { params }: { params: { accountId: string } },
) {
  const unauth = requireSession(req);
  if (unauth) return unauth;
  const { accountId } = params;

  let body: { name?: string; description?: string; amount?: number; currency?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { name, description, amount, currency = 'gbp' } = body;

  if (!name || !amount) {
    return NextResponse.json(
      { error: 'name and amount are required' },
      { status: 422 },
    );
  }

  try {
    // Create the product with a default_price on the connected account.
    // Providing default_price_data here means Stripe creates both the
    // product and its price in a single API call.
    const product = await stripeClient.products.create(
      {
        name,
        description: description ?? '',
        default_price_data: {
          unit_amount: amount,   // e.g. 1000 = £10.00
          currency,
        },
      },
      {
        // stripeAccount header → creates the product on the connected account
        stripeAccount: accountId,
      },
    );

    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }
}
