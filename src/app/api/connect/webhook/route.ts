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
 *   1. In your Stripe Dashboard → Developers → Webhooks → + Add destination
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

export const dynamic = 'force-dynamic';

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
 * Fired when the requirements on a connected account change — for example
 * when a regulator or card network adds new verification requirements.
 *
 * Action: notify the account owner to re-complete onboarding, or flag the
 * account as needing attention in your database.
 */
async function handleRequirementsUpdated(event: any) {
  // The account ID is available on the related_object
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  console.log('[connect/webhook] Requirements updated for account:', accountId);

  // TODO: look up the account owner in your database by accountId and
  //       send them an email/notification to re-complete onboarding.
  //
  // Example:
  //   const owner = await db.query('SELECT email FROM connected_accounts WHERE stripe_account_id = $1', [accountId]);
  //   await sendEmail(owner.email, 'Action required: update your Stripe account details');

  // Optionally fetch the current requirements to log/store them:
  // const account = await stripeClient.v2.core.accounts.retrieve(accountId, { include: ['requirements'] });
  // const status = account.requirements?.summary?.minimum_deadline?.status;
}

/**
 * v2.core.account[configuration.merchant].capability_status_updated
 *
 * Fired when a merchant capability (e.g. card_payments) changes status.
 * Statuses: pending, inactive, active, restricted.
 *
 * Action: update the account's capability status in your database, and
 * notify the owner if a capability becomes restricted.
 */
async function handleMerchantCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  const capability = event.data?.object?.capability;
  const status = event.data?.object?.status;

  console.log('[connect/webhook] Merchant capability updated:', {
    accountId,
    capability,
    status,
  });

  // TODO: update connected_accounts table with new capability status
  //       so your UI can show whether the account can process payments.
  //
  // Example:
  //   await db.query(
  //     'UPDATE connected_accounts SET card_payments_status = $1 WHERE stripe_account_id = $2',
  //     [status, accountId]
  //   );
}

/**
 * v2.core.account[configuration.customer].capability_status_updated
 *
 * Fired when a customer-facing capability changes status.
 * Same handling pattern as the merchant capability handler above.
 */
async function handleCustomerCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id ?? event.data?.object?.account;
  const capability = event.data?.object?.capability;
  const status = event.data?.object?.status;

  console.log('[connect/webhook] Customer capability updated:', {
    accountId,
    capability,
    status,
  });

  // TODO: same as merchant — update DB and notify owner if status is restricted.
}
