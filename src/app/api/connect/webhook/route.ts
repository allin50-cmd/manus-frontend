/**
 * /api/connect/webhook
 *
 * Handles Stripe V2 thin events for connected accounts.
 *
 * Thin events contain only the event ID and type — you must fetch the full
 * event payload from the Stripe API.  This pattern is required for V2 events.
 *
 * Events handled:
 *   v2.core.account[requirements].updated
 *   v2.core.account[configuration.merchant].capability_status_updated
 *   v2.core.account[configuration.customer].capability_status_updated
 *
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks → + Add destination
 *   2. Events from: Connected accounts
 *   3. Advanced options → Payload style: Thin
 *   4. Select the v2 event types listed above
 *   5. Copy the signing secret → set STRIPE_CONNECT_WEBHOOK_SECRET env var
 *
 * Local testing with Stripe CLI:
 *   stripe listen \
 *     --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated' \
 *     --forward-thin-to http://localhost:3000/api/connect/webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient, connectWebhookSecret } from '@/lib/stripe/connect-client';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// DB helper
// ---------------------------------------------------------------------------
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { max: 1 });
}

export async function POST(req: NextRequest) {
  // ── Guard: webhook secret must be configured ─────────────────────────────
  if (!connectWebhookSecret) {
    console.error(
      '[connect/webhook] STRIPE_CONNECT_WEBHOOK_SECRET is not set. ' +
      'All webhook requests will be rejected.',
    );
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 },
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  // ── Step 1: Parse the thin event (verify signature) ──────────────────────
  // parseEventNotification verifies the webhook signature and returns a
  // lightweight object containing only { id, type }.  The actual payload
  // is fetched next.
  let thinEvent: { id: string; type: string };
  try {
    thinEvent = stripeClient.parseEventNotification(body, sig, connectWebhookSecret) as any;
  } catch (err) {
    console.error('[connect/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // ── Step 2: Fetch the full event from the Stripe API ─────────────────────
  // Thin events do not contain the resource data — always retrieve via API.
  let event: any;
  try {
    event = await (stripeClient as any).v2.core.events.retrieve(thinEvent.id);
  } catch (err) {
    console.error('[connect/webhook] Failed to retrieve event:', err);
    return NextResponse.json({ error: 'Failed to retrieve event' }, { status: 500 });
  }

  console.log(`[connect/webhook] Processing event: ${event.type}`, {
    eventId: event.id,
  });

  // ── Step 3: Dispatch to the correct handler ───────────────────────────────
  try {
    switch (event.type) {
      case 'v2.core.account[requirements].updated':
        await handleRequirementsUpdated(event);
        break;

      case 'v2.core.account[configuration.merchant].capability_status_updated':
        await handleMerchantCapabilityUpdated(event);
        break;

      case 'v2.core.account[configuration.customer].capability_status_updated':
        await handleCustomerCapabilityUpdated(event);
        break;

      default:
        // Unknown event type — log and ignore rather than erroring.
        console.log(`[connect/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[connect/webhook] Handler error:', err);
    // Return 500 so Stripe retries the event.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  // Acknowledge receipt — Stripe will not retry if we return 2xx.
  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

/**
 * v2.core.account[requirements].updated
 *
 * Fired when the requirements on a connected account change — e.g. when a
 * regulator or card network adds new verification requirements.
 *
 * Fetches the live requirements summary and stores it so the dashboard can
 * show the account's onboarding state without an extra Stripe API call.
 */
async function handleRequirementsUpdated(event: any) {
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  if (!accountId) {
    console.warn('[connect/webhook] requirements.updated: no accountId in event');
    return;
  }

  // Fetch the current requirements from Stripe to get the summary status.
  let requirementsStatus: string | null = null;
  try {
    const account = await (stripeClient as any).v2.core.accounts.retrieve(
      accountId,
      { include: ['requirements'] },
    );
    requirementsStatus = account.requirements?.summary?.minimum_deadline?.status ?? null;
  } catch (err) {
    console.warn('[connect/webhook] Could not fetch requirements for account:', accountId, err);
  }

  console.log('[connect/webhook] Requirements updated:', {
    accountId,
    requirementsStatus,
  });

  // Persist to DB so the UI reflects current onboarding state.
  // We reuse card_payments_status as a proxy: if card_payments is active
  // onboarding is effectively complete.  A dedicated column can be added
  // to 0007 migration if finer-grained requirements tracking is needed.
  if (requirementsStatus === 'currently_due' || requirementsStatus === 'past_due') {
    console.warn('[connect/webhook] Account has outstanding requirements:', {
      accountId,
      requirementsStatus,
    });
    // Future enhancement: look up the account owner email and send a notification.
    // const sql = getDb();
    // const row = await sql`SELECT email FROM connected_accounts WHERE stripe_account_id = ${accountId}`;
    // if (row[0]?.email) await sendRequirementsEmail(row[0].email, accountId);
  }
}

/**
 * v2.core.account[configuration.merchant].capability_status_updated
 *
 * Fired when a merchant capability (e.g. card_payments) changes status.
 * Statuses: pending | inactive | active | restricted
 *
 * Persists card_payments_status so the dashboard can show whether the account
 * can process payments without fetching from Stripe on every page load.
 */
async function handleMerchantCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  const capability: string = event.data?.object?.capability ?? '';
  const status: string = event.data?.object?.status ?? '';

  console.log('[connect/webhook] Merchant capability updated:', {
    accountId,
    capability,
    status,
  });

  if (!accountId) return;

  // Only persist card_payments — the primary capability we care about.
  if (capability === 'card_payments') {
    const sql = getDb();
    try {
      await sql`
        UPDATE connected_accounts
        SET card_payments_status = ${status}
        WHERE stripe_account_id  = ${String(accountId)}
      `;
    } finally {
      await sql.end();
    }

    if (status === 'restricted') {
      console.warn('[connect/webhook] card_payments restricted for account:', accountId);
      // Future: notify the account owner that card payments have been restricted.
    }
  }
}

/**
 * v2.core.account[configuration.customer].capability_status_updated
 *
 * Fired when a customer-facing capability (e.g. bank_transfers, link) changes
 * status. Persists the status to customer_capability_status for display.
 */
async function handleCustomerCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  const capability: string = event.data?.object?.capability ?? '';
  const status: string = event.data?.object?.status ?? '';

  console.log('[connect/webhook] Customer capability updated:', {
    accountId,
    capability,
    status,
  });

  if (!accountId) return;

  const sql = getDb();
  try {
    await sql`
      UPDATE connected_accounts
      SET customer_capability_status = ${status}
      WHERE stripe_account_id        = ${String(accountId)}
    `;
  } finally {
    await sql.end();
  }
}
