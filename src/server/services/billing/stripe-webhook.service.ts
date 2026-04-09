import type Stripe from 'stripe';
import { ZodError } from 'zod';
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

async function claimEvent(eventId: string, eventType: string, payload: unknown): Promise<boolean> {
  const rows = await db
    .insert(stripeWebhookEvents)
    .values({ eventId, type: eventType, status: 'processing', payload })
    .onConflictDoNothing()
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
  await db
    .update(stripeWebhookEvents)
    .set({
      status: 'failed',
      failureReason: reason.slice(0, 500),
      errorType,
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
    return session.client_reference_id;
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
    // Already processing or processed (covers manual replay too)
    log.info('stripe webhook deduplicated', { eventId: event.id, type: event.type });
    return { processed: false, deduplicated: true };
  }

  // Stripe event.created is Unix seconds
  const eventCreatedAt = new Date(event.created * 1000);

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
    log.info('stripe webhook processed', { eventId: event.id, type: event.type });
    return { processed: true, deduplicated: false };
  } catch (err) {
    const errorType = classifyError(err);
    const reason = err instanceof Error ? err.message : String(err);

    await markEventFailed(event.id, reason, errorType).catch(() => {});

    log.error('stripe webhook failed', {
      eventId: event.id,
      type: event.type,
      errorType,
      err: reason,
    });

    if (errorType === 'permanent') {
      // Mark as processed so Stripe stops retrying — this error won't self-heal
      await markEventProcessed(event.id).catch(() => {});
      log.warn('permanent error: marking as processed, Stripe will not retry', {
        eventId: event.id,
        type: event.type,
      });
      return { processed: true, deduplicated: false };
    }

    throw err; // retryable: re-raise so route returns 500 and Stripe retries
  }
}
