import type Stripe from 'stripe';
import { ZodError } from 'zod';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../../db';
import { stripeWebhookEvents } from '../../db/schema';
import { parseFineGuardMetadata, isValidFineGuardMetadata } from '@/types/stripe';
import {
  findByStripeCustomerId,
  updateSubscriptionId,
} from '../../repositories/monitoredCompanies.repo';
import {
  activateComplianceMonitoring,
  markBillingPastDue,
  cancelComplianceMonitoring,
  restoreBillingActive,
} from '../compliance/activation.service';
import { log } from '@/lib/logger';

// ── Error classification ──────────────────────────────────────────────────────
//
// retryable — transient failures (DB connection, network, timeout).
//             Stripe should retry; we re-raise to return 500.
//
// permanent — logic/data errors (bad metadata, unknown company).
//             Stripe retrying won't help; we mark processed and return 200.

type ErrorType = 'retryable' | 'permanent';

function classifyError(err: unknown): ErrorType {
  if (err instanceof ZodError) return 'permanent';
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    if (
      msg.includes('invalid stripe metadata') ||
      msg.includes('not found') ||
      msg.includes('company_number')
    ) {
      return 'permanent';
    }
  }
  return 'retryable';
}

// ── Two-phase idempotency ─────────────────────────────────────────────────────
//
// State machine: (none) → processing → processed
//                                    ↘ failed → (none, Stripe retries)
//
// The partial unique index swe_active_event_uniq covers processing|processed.
// Only one concurrent INSERT wins; failed rows fall outside the index so
// Stripe's next retry re-claims them.

async function claimEvent(
  eventId: string,
  eventType: string,
  payload: unknown,
  eventCreatedAt: Date,
): Promise<boolean> {
  const rows = await db
    .insert(stripeWebhookEvents)
    .values({ eventId, type: eventType, status: 'processing', payload, eventCreatedAt })
    .onConflictDoNothing() // partial index blocks processing|processed|dead_letter duplicates
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

async function markEventFailed(
  eventId: string,
  reason: string,
  errorType: ErrorType,
): Promise<void> {
  // Increment attempt_count; recovery service will dead-letter when limit reached
  await db
    .update(stripeWebhookEvents)
    .set({
      status: 'failed',
      failureReason: reason.slice(0, 500),
      errorType,
      attemptCount: sql`attempt_count + 1`,
    })
    .where(
      and(
        eq(stripeWebhookEvents.eventId, eventId),
        eq(stripeWebhookEvents.status, 'processing'),
      ),
    );
  // Failed row exits the partial unique index — Stripe can retry.
}

// ── Event handlers ────────────────────────────────────────────────────────────

/**
 * Resolve company_number from a checkout session.
 *
 * Trust hierarchy (most → least trustworthy):
 * 1. client_reference_id  — set programmatically at session creation, not
 *    editable by the customer after the fact
 * 2. metadata.company_number — validated with Zod, but lives in metadata
 *    which could theoretically be modified in the Stripe dashboard
 */
function resolveCompanyNumber(session: Stripe.Checkout.Session): string | null {
  if (session.client_reference_id?.match(/^[A-Z0-9]{2,8}$/i)) {
    return session.client_reference_id.toUpperCase(); // normalise to Companies House canonical form
  }
  const meta = parseFineGuardMetadata(session.metadata ?? {});
  return isValidFineGuardMetadata(meta) ? meta.company_number : null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const companyNumber = resolveCompanyNumber(session);
  if (!companyNumber) {
    log.warn('checkout.session.completed: cannot resolve company_number', {
      sessionId: session.id,
      clientReferenceId: session.client_reference_id,
      metadata: session.metadata,
    });
    return;
  }

  // Parse metadata for supplementary fields (name, alertTypes, tenantId)
  const meta = parseFineGuardMetadata(session.metadata ?? {});
  const alertTypes = meta?.alert_types
    ? meta.alert_types.split(',').map((s) => s.trim()).filter(Boolean)
    : ['accounts_filing'];

  await activateComplianceMonitoring({
    companyNumber,
    companyName: meta?.company_name ?? companyNumber,
    tenantId: meta?.tenant_id,
    stripeCustomerId: session.customer as string | undefined,
    stripeSubscriptionId: session.subscription as string | undefined,
    stripeSessionId: session.id,
    alertTypes,
  });
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  eventCreatedAt: Date,
): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('invoice.paid: no company for customer', { customerId });
    return;
  }

  if (company.billingStatus !== 'active') {
    await restoreBillingActive(company.companyNumber, eventCreatedAt);
  }
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  eventCreatedAt: Date,
): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('invoice.payment_failed: no company for customer', { customerId });
    return;
  }

  await markBillingPastDue(company.companyNumber, eventCreatedAt);
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    log.warn('customer.subscription.deleted: no company for customer', { customerId });
    return;
  }

  await cancelComplianceMonitoring(company.companyNumber, eventCreatedAt);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  eventCreatedAt: Date,
): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const company = await findByStripeCustomerId(customerId);
  if (!company) return;

  // Sync subscription ID — plan upgrades can replace the subscription object
  if (
    subscription.id &&
    company.stripeSubscriptionId !== subscription.id
  ) {
    log.info('subscription.updated: syncing subscription ID', {
      companyNumber: company.companyNumber,
      oldSubscriptionId: company.stripeSubscriptionId,
      newSubscriptionId: subscription.id,
    });
    await updateSubscriptionId(company.companyNumber, subscription.id);
  }

  // Log plan items to aid billing debugging
  const planItems = subscription.items?.data?.map((item) => ({
    priceId: item.price?.id,
    productId: typeof item.price?.product === 'string' ? item.price.product : item.price?.product?.id,
    quantity: item.quantity,
    interval: item.price?.recurring?.interval,
  })) ?? [];

  log.info('subscription.updated: status transition', {
    companyNumber: company.companyNumber,
    subscriptionId: subscription.id,
    subscriptionStatus: subscription.status,
    currentBillingStatus: company.billingStatus,
    planItems,
    eventCreatedAt: eventCreatedAt.toISOString(),
  });

  switch (subscription.status) {
    case 'active':
      if (company.billingStatus !== 'active') {
        await restoreBillingActive(company.companyNumber, eventCreatedAt);
      }
      break;
    case 'past_due':
    case 'unpaid':
      await markBillingPastDue(company.companyNumber, eventCreatedAt);
      break;
    case 'canceled':
      await cancelComplianceMonitoring(company.companyNumber, eventCreatedAt);
      break;
    default:
      log.warn('subscription.updated: unhandled subscription status', {
        companyNumber: company.companyNumber,
        subscriptionStatus: subscription.status,
      });
      break;
  }
}

// ── Dispatcher ────────────────────────────────────────────────────────────────

export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<{
  processed: boolean;
  deduplicated: boolean;
}> {
  // Stripe event.created is Unix seconds
  const eventCreatedAt = new Date(event.created * 1000);

  // Bind correlation fields to every log line in this event's execution scope
  const elog = log.withContext({ stripeEventId: event.id, eventType: event.type });

  const claimed = await claimEvent(event.id, event.type, event, eventCreatedAt);
  if (!claimed) {
    elog.info('stripe webhook deduplicated');
    return { processed: false, deduplicated: true };
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, eventCreatedAt);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, eventCreatedAt);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, eventCreatedAt);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, eventCreatedAt);
        break;
      default:
        break;
    }

    await markEventProcessed(event.id);
    elog.info('stripe webhook processed');
    return { processed: true, deduplicated: false };
  } catch (err) {
    const errorType = classifyError(err);
    const reason = err instanceof Error ? err.message : String(err);

    await markEventFailed(event.id, reason, errorType).catch((e) =>
      elog.error('failed to mark event as failed — DB may be down', {
        err: e instanceof Error ? e.message : String(e),
      }),
    );

    elog.error('stripe webhook failed', { errorType, err: reason });

    if (errorType === 'permanent') {
      await markEventProcessed(event.id).catch((e) =>
        elog.error('failed to mark permanent error as processed', {
          err: e instanceof Error ? e.message : String(e),
        }),
      );
      elog.warn('permanent error: marking as processed, Stripe will not retry');
      return { processed: true, deduplicated: false };
    }

    throw err; // retryable: re-raise so route returns 500 and Stripe retries
  }
}
