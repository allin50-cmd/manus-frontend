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
 *   customer.updated                — customer billing details changed
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

export const dynamic = 'force-dynamic';

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

      // ── Payment method events ───────────────────────────────────────────
      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      // ── Customer events ─────────────────────────────────────────────────
      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'customer.tax_id.created':
      case 'customer.tax_id.deleted':
      case 'customer.tax_id.updated':
        handleTaxIdEvent(event);
        break;

      // ── Billing portal events ───────────────────────────────────────────
      case 'billing_portal.configuration.created':
      case 'billing_portal.configuration.updated':
      case 'billing_portal.session.created':
        console.log(`[subscription-webhook] Billing portal event: ${event.type}`);
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
 * Handles:
 *   - Upgrades/downgrades (new price in items[0].price)
 *   - Quantity changes (new quantity in items[0].quantity)
 *   - Pause/resume (pause_collection field)
 *   - Pending cancellation (cancel_at_period_end = true)
 *   - Reactivation (cancel_at_period_end = false)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // V2 accounts: use customer_account (acct_***) to identify the subscriber.
  // For V1 customers this would be subscription.customer (cus_***).
  const accountId = (subscription as any).customer_account ?? subscription.customer;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  // Current price and quantity
  const currentItem = subscription.items.data[0];
  const priceId = currentItem?.price?.id;
  const quantity = currentItem?.quantity;

  console.log('[subscription-webhook] Subscription updated:', {
    accountId,
    subscriptionId,
    status,
    priceId,
    quantity,
  });

  // Pause/resume detection
  if (subscription.pause_collection) {
    const resumesAt = subscription.pause_collection.resumes_at;
    console.log('[subscription-webhook] Subscription paused. Resumes at:', resumesAt);
    // TODO: update DB to mark subscription as paused
    //   await db.query('UPDATE connected_accounts SET subscription_status = $1 WHERE stripe_account_id = $2', ['paused', accountId]);
  }

  // Pending cancellation
  if (subscription.cancel_at_period_end) {
    console.log('[subscription-webhook] Subscription will cancel at period end');
    // TODO: update DB to show cancellation pending
  }

  // TODO: update connected_accounts table with new subscription status/price
  //   await db.query(
  //     'UPDATE connected_accounts SET subscription_status = $1, price_id = $2 WHERE stripe_account_id = $3',
  //     [status, priceId, accountId]
  //   );
}

/**
 * customer.subscription.deleted
 *
 * The subscription has been cancelled and is now inactive.
 * Revoke access to any paid features for this account.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const accountId = (subscription as any).customer_account ?? subscription.customer;

  console.log('[subscription-webhook] Subscription cancelled:', {
    accountId,
    subscriptionId: subscription.id,
  });

  // TODO: revoke access to premium features for this connected account
  //   await db.query(
  //     'UPDATE connected_accounts SET subscription_status = $1, price_id = NULL WHERE stripe_account_id = $2',
  //     ['cancelled', accountId]
  //   );
}

/**
 * invoice.payment_succeeded
 *
 * A subscription invoice was paid successfully.
 * Use this to confirm that the account's subscription remains active.
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account ?? invoice.customer;

  console.log('[subscription-webhook] Invoice paid:', {
    accountId,
    invoiceId: invoice.id,
    amount: invoice.amount_paid,
  });

  // TODO: update last_payment_at in your DB, send receipt email, etc.
  //   await db.query(
  //     'UPDATE connected_accounts SET last_payment_at = NOW() WHERE stripe_account_id = $1',
  //     [accountId]
  //   );
}

/**
 * invoice.payment_failed
 *
 * A subscription invoice payment failed.
 * Notify the account owner to update their payment method.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account ?? invoice.customer;

  console.warn('[subscription-webhook] Invoice payment failed:', {
    accountId,
    invoiceId: invoice.id,
    nextAttempt: invoice.next_payment_attempt,
  });

  // TODO: notify the account owner and update subscription_status to 'past_due'
  //   await db.query(
  //     'UPDATE connected_accounts SET subscription_status = $1 WHERE stripe_account_id = $2',
  //     ['past_due', accountId]
  //   );
}

/**
 * payment_method.attached
 * A payment method was added to a customer.
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  console.log('[subscription-webhook] Payment method attached:', {
    paymentMethodId: paymentMethod.id,
    customer: paymentMethod.customer,
    type: paymentMethod.type,
  });
  // TODO: update DB if you track payment methods locally
}

/**
 * payment_method.detached
 * A payment method was removed from a customer.
 */
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log('[subscription-webhook] Payment method detached:', {
    paymentMethodId: paymentMethod.id,
    type: paymentMethod.type,
  });
  // TODO: update DB if you track payment methods locally
}

/**
 * customer.updated
 *
 * Customer billing details changed — e.g. new default payment method.
 * IMPORTANT: Do not use customer.email as a login credential.
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  const defaultPaymentMethod =
    (customer.invoice_settings as any)?.default_payment_method;

  console.log('[subscription-webhook] Customer updated:', {
    customerId: customer.id,
    defaultPaymentMethod,
  });

  // TODO: update billing info in DB (not login credentials)
}

/**
 * customer.tax_id.* events
 * Tax ID management — log and validate as needed.
 */
function handleTaxIdEvent(event: Stripe.Event) {
  const taxId = event.data.object as any;
  console.log(`[subscription-webhook] Tax ID event (${event.type}):`, {
    taxIdId: taxId.id,
    type: taxId.type,
    value: taxId.value,
    verificationStatus: taxId.verification?.status,
  });
  // TODO: update tax ID validation status in your DB if needed
}
