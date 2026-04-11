export const dynamic = 'force-dynamic';

/**
 * /api/connect/accounts
 *
 * GET  — list all connected accounts stored in the database
 * POST — create a new Stripe Connect V2 account and persist the mapping
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient } from '@/lib/stripe/connect-client';
import postgres from 'postgres';

// ---------------------------------------------------------------------------
// Helper — raw DB connection
// We reuse the DATABASE_URL already required by the rest of the app.
// ---------------------------------------------------------------------------
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { max: 1 });
}

// ---------------------------------------------------------------------------
// GET /api/connect/accounts
// Returns all connected accounts stored in the connected_accounts table.
// ---------------------------------------------------------------------------
export async function GET() {
  const sql = getDb();
  try {
    const rows = await sql<{
      id: string;
      stripe_account_id: string;
      display_name: string;
      email: string;
      created_at: string;
    }[]>`
      SELECT id, stripe_account_id, display_name, email, created_at
      FROM connected_accounts
      ORDER BY created_at DESC
    `;
    return NextResponse.json({ accounts: rows });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Database error' },
      { status: 500 },
    );
  } finally {
    await sql.end();
  }
}

// ---------------------------------------------------------------------------
// POST /api/connect/accounts
// Body: { displayName: string, email: string }
//
// 1. Creates a V2 Stripe Connect account (no top-level `type` field).
// 2. Stores the mapping in the database.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: { displayName?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { displayName, email } = body;
  if (!displayName || !email) {
    return NextResponse.json(
      { error: 'displayName and email are required' },
      { status: 422 },
    );
  }

  // ── Step 1: Create the Stripe Connect V2 account ─────────────────────────
  //
  // IMPORTANT: Never pass `type` at the top level for V2 accounts.
  // The `dashboard`, `defaults.responsibilities`, and `configuration` fields
  // are the V2 equivalents of the old type: 'express' / 'standard' flags.
  //
  // - fees_collector: 'stripe'  → Stripe collects fees (not the platform)
  // - losses_collector: 'stripe' → Stripe absorbs losses from disputes
  // - card_payments: requested: true → enables card processing capability
  let account;
  try {
    account = await (stripeClient as any).v2.core.accounts.create({
      display_name: displayName,
      contact_email: email,
      identity: {
        country: 'us', // PLACEHOLDER: change to your users' country
      },
      dashboard: 'full',
      defaults: {
        responsibilities: {
          fees_collector: 'stripe',
          losses_collector: 'stripe',
        },
      },
      configuration: {
        customer: {}, // enables customer-facing features
        merchant: {
          capabilities: {
            card_payments: {
              requested: true, // request card payment capability
            },
          },
        },
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Stripe error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  // ── Step 2: Persist the account → user mapping ───────────────────────────
  //
  // In production, you'd also store a reference to the logged-in user
  // (e.g. user_id FK) so you can look up "my connected account" per user.
  const sql = getDb();
  try {
    await sql`
      INSERT INTO connected_accounts (stripe_account_id, display_name, email)
      VALUES (${account.id}, ${displayName}, ${email})
    `;
  } catch (err) {
    // Even if DB write fails, the Stripe account was created.
    // Log and surface the error so the operator can reconcile.
    console.error('[connect] Failed to persist account mapping:', err);
    return NextResponse.json(
      {
        error: 'Account created in Stripe but failed to save locally. ' +
               `Stripe account ID: ${account.id}. Please record this manually.`,
        stripeAccountId: account.id,
      },
      { status: 500 },
    );
  } finally {
    await sql.end();
  }

  return NextResponse.json({ account }, { status: 201 });
}
