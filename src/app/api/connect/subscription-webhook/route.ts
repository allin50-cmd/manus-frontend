/**
 * /api/connect/subscription-webhook
 *
 * Handles standard Stripe V1 webhook events for platform subscriptions.
 * These are NOT thin events — the full payload is delivered directly.
 *
 * Events handled:
 *   customer.subscription.updated  — upgrade/downgrade, pause, quantity change
 *   customer.subscription.deleted  — cancellation
 *   invoice.payment_succeeded      — successful payment
 *   invoice.payment_failed         — failed payment
 *   payment_method.attached        — customer added a payment method
 *   payment_method.detached        — customer removed a payment method
 *   customer.updated               — customer billing details changed
 *   customer.tax_id.created/deleted/updated
 *   billing_portal.session.created
 *
 * Setup:
 *   1. Stripe Dashboard → Developers → Webhooks → + Add endpoint
 *   2. URL: https://yourdomain.com/api/connect/subscription-webhook
 *   3. Events from: Your account (not Connected accounts)
 *   4. Payload style: Standard (not thin)
 *   5. Copy the signing secret → set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET env var
 *
 * NOTE: For V2 accounts, subscription.customer_account contains the
 *       acct_*** ID (not a cus_*** ID).  Use this to look up the account.
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripeClient, subscriptionWebhookSecret } from '@/lib/stripe/connect-client';
import type Stripe from 'stripe';
import postgres from 'postgres';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// DB helper — one connection per request, closed in finally
// ---------------------------------------------------------------------------
function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return postgres(url, { max: 1 });
}

export async function POST(req: NextRequest) {
  if (!subscriptionWebhookSecret) {
    console.error('[subscription-webhook] STRIPE_SUBSCRIPTION_WEBHOOK_SECRET is not set.');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 503 },
    );
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature') ?? '';

  // ── Verify webhook signature ──────────────────────────────────────────────
  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(
      body,
      sig,
      subscriptionWebhookSecret,
    );
  } catch (err) {
    console.error('[subscription-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[subscription-webhook] Processing: ${event.type}`, {
    eventId: event.id,
  });

  try {
    switch (event.type) {
      // ── Subscription lifecycle ──────────────────────────────────────────
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      // ── Invoice events ──────────────────────────────────────────────────
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      // ── Payment method / customer / tax ID / portal events ──────────────
      // These don't require DB writes in the current schema — logged for ops.
      case 'payment_method.attached':
      case 'payment_method.detached':
      case 'customer.updated':
      case 'customer.tax_id.created':
      case 'customer.tax_id.deleted':
      case 'customer.tax_id.updated':
      case 'billing_portal.configuration.created':
      case 'billing_portal.configuration.updated':
      case 'billing_portal.session.created':
        console.log(`[subscription-webhook] Acknowledged: ${event.type}`);
        break;

      default:
        console.log(`[subscription-webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('[subscription-webhook] Handler error:', err);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Subscription handlers
// ---------------------------------------------------------------------------

/**
 * customer.subscription.updated
 *
 * Handles upgrades, downgrades, pauses, pending cancellation and reactivation.
 * Persists the current status, subscription ID, and price ID to the DB so the
 * dashboard can show the account's subscription state without a Stripe API call.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // V2 accounts expose customer_account (acct_***) rather than customer (cus_***).
  const accountId = (subscription as any).customer_account ?? subscription.customer;

  const currentItem = subscription.items.data[0];
  const priceId = currentItem?.price?.id ?? null;

  // Paused subscriptions: treat as 'paused' rather than Stripe's 'active'
  // so the dashboard can show the correct state.
  const effectiveStatus = subscription.pause_collection
    ? 'paused'
    : subscription.status;

  console.log('[subscription-webhook] Subscription updated:', {
    accountId,
    subscriptionId: subscription.id,
    status: effectiveStatus,
    priceId,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
  });

  const sql = getDb();
  try {
    await sql`
      UPDATE connected_accounts
      SET
        subscription_id       = ${subscription.id},
        subscription_status   = ${effectiveStatus},
        subscription_price_id = ${priceId}
      WHERE stripe_account_id = ${String(accountId)}
    `;
  } finally {
    await sql.end();
  }
}

/**
 * customer.subscription.deleted
 *
 * The subscription is now cancelled. Nulls out the price ID so that queries
 * for "accounts with an active plan" correctly exclude this account.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const accountId = (subscription as any).customer_account ?? subscription.customer;

  console.log('[subscription-webhook] Subscription cancelled:', {
    accountId,
    subscriptionId: subscription.id,
  });

  const sql = getDb();
  try {
    await sql`
      UPDATE connected_accounts
      SET
        subscription_status   = 'cancelled',
        subscription_price_id = NULL
      WHERE stripe_account_id = ${String(accountId)}
    `;
  } finally {
    await sql.end();
  }
}

/**
 * invoice.payment_succeeded
 *
 * A subscription invoice was paid. Records the timestamp so the dashboard
 * can show "last paid" and so ops can query for overdue accounts.
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account ?? invoice.customer;

  console.log('[subscription-webhook] Invoice paid:', {
    accountId,
    invoiceId: invoice.id,
    amountPaid: invoice.amount_paid,
  });

  const sql = getDb();
  try {
    await sql`
      UPDATE connected_accounts
      SET last_payment_at = NOW()
      WHERE stripe_account_id = ${String(accountId)}
    `;
  } finally {
    await sql.end();
  }
}

/**
 * invoice.payment_failed
 *
 * A subscription invoice payment failed. Marks the account past_due so
 * the dashboard can prompt the owner to update their payment method.
 * Stripe will retry automatically — if all retries fail it fires
 * customer.subscription.deleted.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account ?? invoice.customer;

  console.warn('[subscription-webhook] Invoice payment failed:', {
    accountId,
    invoiceId: invoice.id,
    nextAttempt: invoice.next_payment_attempt,
  });

  const sql = getDb();
  try {
    await sql`
      UPDATE connected_accounts
      SET subscription_status = 'past_due'
      WHERE stripe_account_id = ${String(accountId)}
    `;
  } finally {
    await sql.end();
  }
}
