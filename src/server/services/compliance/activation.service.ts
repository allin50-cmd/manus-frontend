import { eq, and, inArray, isNull, lte, or } from 'drizzle-orm';
import { db } from '../../db';
import { monitoredCompanies, complianceAlerts } from '../../db/schema';
import {
  upsertMonitoredCompany,
  transitionBillingStatus,
} from '../../repositories/monitoredCompanies.repo';
import {
  insertAlerts,
  reactivateAlertsForCompany,
} from '../../repositories/complianceAlerts.repo';
import { log } from '@/lib/logger';
import type { BillingStatus } from '@/types/stripe';

// ── activateComplianceMonitoring ──────────────────────────────────────────────

export interface ActivateComplianceMonitoringInput {
  companyNumber: string;
  companyName: string;
  tenantId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSessionId: string;
  alertTypes: string[];
}

/**
 * Primary business handoff from billing into monitoring.
 * Called on checkout.session.completed.
 *
 * Upserts the monitored company row, then inserts compliance alert rows.
 */
export async function activateComplianceMonitoring(
  input: ActivateComplianceMonitoringInput,
): Promise<void> {
  const alog = log.withContext({ companyNumber: input.companyNumber });

  alog.info('activateComplianceMonitoring: start', { alertTypes: input.alertTypes });

  await upsertMonitoredCompany({
    companyNumber: input.companyNumber,
    companyName: input.companyName,
    stripeSessionId: input.stripeSessionId,
    lastCheckoutSessionId: input.stripeSessionId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    stripeCustomerId: input.stripeCustomerId,
    billingStatus: 'active',
  });

  await insertAlerts(input.companyNumber, input.alertTypes, input.stripeSubscriptionId);

  alog.info('activateComplianceMonitoring: complete');
}

// ── markBillingPastDue ────────────────────────────────────────────────────────

/**
 * Called on invoice.payment_failed.
 * Transitions active → past_due.  No-op if already past_due, cancelled,
 * or if the event is out-of-order (older than last processed event).
 */
export async function markBillingPastDue(
  companyNumber: string,
  eventCreatedAt?: Date,
): Promise<void> {
  log.info('markBillingPastDue', { companyNumber });
  const transitioned = await transitionBillingStatus(companyNumber, 'past_due', { eventCreatedAt });
  if (!transitioned) {
    log.warn('markBillingPastDue: transition rejected (invalid state, out-of-order, or not found)', {
      companyNumber,
    });
  }
}

// ── cancelComplianceMonitoring ────────────────────────────────────────────────

/**
 * Called on customer.subscription.deleted.
 * Atomically transitions billing status and deactivates compliance alert rows
 * in a single DB transaction.  No hard deletes — audit trail preserved.
 */
export async function cancelComplianceMonitoring(
  companyNumber: string,
  eventCreatedAt?: Date,
): Promise<void> {
  log.info('cancelComplianceMonitoring', { companyNumber });

  const allowedFrom: BillingStatus[] = ['active', 'past_due', 'pending'];
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(monitoredCompanies)
      .set({
        billingStatus: 'cancelled',
        billingStatusUpdatedAt: now,
        ...(eventCreatedAt ? { lastStripeEventAt: eventCreatedAt } : {}),
      })
      .where(
        and(
          eq(monitoredCompanies.companyNumber, companyNumber),
          inArray(monitoredCompanies.billingStatus, allowedFrom),
          ...(eventCreatedAt
            ? [or(isNull(monitoredCompanies.lastStripeEventAt), lte(monitoredCompanies.lastStripeEventAt, eventCreatedAt))]
            : []),
        ),
      );

    await tx
      .update(complianceAlerts)
      .set({ status: 'cancelled', cancelledReason: 'billing_cancelled' })
      .where(
        and(
          eq(complianceAlerts.companyNumber, companyNumber),
          eq(complianceAlerts.status, 'active'),
        ),
      );
  });
}

// ── restoreBillingActive ──────────────────────────────────────────────────────

/**
 * Called on invoice.paid when billing was previously past_due or cancelled.
 * Transitions to active and reactivates billing-cancelled alerts.
 */
export async function restoreBillingActive(
  companyNumber: string,
  eventCreatedAt?: Date,
): Promise<void> {
  log.info('restoreBillingActive', { companyNumber });
  const transitioned = await transitionBillingStatus(companyNumber, 'active', { eventCreatedAt });
  if (!transitioned) {
    log.warn('restoreBillingActive: billing transition rejected (possibly already active or out-of-order)', {
      companyNumber,
    });
  }
  await reactivateAlertsForCompany(companyNumber, 'billing_cancelled');
}
