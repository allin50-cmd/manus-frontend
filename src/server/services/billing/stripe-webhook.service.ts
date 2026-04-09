import type Stripe from 'stripe';
import { eq, and } from 'drizzle-orm';
import { db } from '../../db';
import { stripeWebhookEvents } from '../../db/schema';
import { parseFineGuardMetadata, isValidFineGuardMetadata } from '@/types/stripe';
import { findByStripeCustomerId } from '../../repositories/monitoredCompanies.repo';
import {
  activateComplianceMonitoring,
  markBillingPastDue,
  cancelComplianceMonitoring,
  restoreBillingActive,
} from '../compliance/activation.service';
import { log } from '@/lib/logger';

// ── Two-phase idempotency ─────────────────────────────────────────────────────
//
// State machine: (none) → processing → processed
//                                    ↘ failed → processing (Stripe retry)
//
// The partial unique index swe_active_event_uniq prevents two concurrent
// requests from both processing the same event: only one INSERT will win;
// the other will see 0 rows and skip.  A failed event (not in the partial
// index) can be retried — the new INSERT will succeed, re-claiming it.

/**
 * Attempt to claim the event for processing and store the raw payload.
 * Returns true if this instance now owns the event, false if already
 * processing/processed by another instance (deduplicate).
 *
 * Storing the payload enables failed events to be replayed without
 * hitting Stripe's API: SELECT * FROM stripe_webhook_events WHERE status='failed'
 */
async function claimEvent(eventId: string, eventType: string, payload: unknown): Promise<boolean> {
  const rows = await db
    .insert(stripeWebhookEvents)
    .values({ eventId, type: eventType, status: 'processing', payload })
    .onConflictDoNothing() // partial index blocks duplicates of processing|processed
    .returning({ id: stripeWebhookEvents.id });
  return rows.length > 0;
}

async function markEventProcessed(eventId: string): Promise<void> {
  await db
    .update(stripeWebhookEvents)
    .set({ status: 'processed', processedAt: new Date() })
    .where(
      and(
        eq(stripeWebhookEvents.eventId, eventId),
        eq(stripeWebhookEvents.status, 'processing'),
      ),
    );
}

async function markEventFailed(eventId: string, reason: string): Promise<void> {
  await db
    .update(stripeWebhookEvents)
    .set({ status: 'failed', failureReason: reason.slice(0, 500) })
    .where(
      and(
        eq(stripeWebhookEvents.eventId, eventId),
        eq(stripeWebhookEvents.status, 'processing'),
      ),
    );
  // Failed row is now excluded from the partial unique index — Stripe can retry.
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = parseFineGuardMetadata(session.metadata ?? {});

  if (!isValidFineGuardMetadata(meta)) {
    log.warn('checkout.session.completed: missing company_number in metadata', {
      sessionId: session.id,
      metadata: session.metadata,
    });
    return;
  }

  const alertTypes = meta.alert_types
    ? meta.alert_types.split(',').map((s) => s.trim()).filter(Boolean)
    : ['accounts_filing'];

  await activateComplianceMonitoring({
    companyNumber: meta.company_number,
    companyName: meta.company_name ?? meta.company_number,
    tenantId: meta.tenant_id,
    stripeCustomerId: session.customer as string | undefined,
    stripeSubscriptionId: session.subscription as string | undefined,
    stripeSessionId: session.id,
    alertTypes,
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('invoice.paid: no company for customer', { customerId });
    return;
  }

  if (company.billingStatus !== 'active') {
    await restoreBillingActive(company.companyNumber);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('invoice.payment_failed: no company for customer', { customerId });
    return;
  }

  await markBillingPastDue(company.companyNumber);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('customer.subscription.deleted: no company for customer', { customerId });
    return;
  }

  await cancelComplianceMonitoring(company.companyNumber);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const company = await findByStripeCustomerId(customerId);
  if (!company) return;

  switch (subscription.status) {
    case 'active':
      if (company.billingStatus !== 'active') await restoreBillingActive(company.companyNumber);
      break;
    case 'past_due':
    case 'unpaid':
      await markBillingPastDue(company.companyNumber);
      break;
    case 'canceled':
      await cancelComplianceMonitoring(company.companyNumber);
      break;
    default:
      break;
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<{
  processed: boolean;
  deduplicated: boolean;
}> {
  const claimed = await claimEvent(event.id, event.type, event);
  if (!claimed) {
    log.info('stripe webhook deduplicated', { eventId: event.id, type: event.type });
    return { processed: false, deduplicated: true };
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      default:
        break;
    }

    await markEventProcessed(event.id);
    log.info('stripe webhook processed', { eventId: event.id, type: event.type });
    return { processed: true, deduplicated: false };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    await markEventFailed(event.id, reason).catch(() => {
      // Best-effort — don't mask the original error
    });
    log.error('stripe webhook failed', { eventId: event.id, type: event.type, err: reason });
    throw err; // re-raise so the route returns 500 and Stripe retries
  }
}
