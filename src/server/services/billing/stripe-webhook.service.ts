import type Stripe from 'stripe';
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

// ── Idempotency gate ──────────────────────────────────────────────────────────

/**
 * Inserts the event ID into stripeWebhookEvents.
 * Returns false if already present (duplicate delivery), true if newly recorded.
 */
async function recordEvent(eventId: string, eventType: string): Promise<boolean> {
  const rows = await db
    .insert(stripeWebhookEvents)
    .values({ eventId, type: eventType })
    .onConflictDoNothing()
    .returning({ id: stripeWebhookEvents.id });
  return rows.length > 0;
}

// ── Event handlers ────────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const meta = parseFineGuardMetadata(session.metadata ?? {});

  if (!isValidFineGuardMetadata(meta)) {
    console.warn('[webhook] checkout.session.completed: missing company_number in metadata', {
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
    console.warn('[webhook] invoice.paid: no company for customer', { customerId });
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
    console.warn('[webhook] invoice.payment_failed: no company for customer', { customerId });
    return;
  }

  await markBillingPastDue(company.companyNumber);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const customerId =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

  const company = await findByStripeCustomerId(customerId);
  if (!company) {
    console.warn('[webhook] subscription.deleted: no company for customer', { customerId });
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
  const recorded = await recordEvent(event.id, event.type);
  if (!recorded) {
    return { processed: false, deduplicated: true };
  }

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

  return { processed: true, deduplicated: false };
}
