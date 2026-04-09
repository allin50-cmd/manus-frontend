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
import {
  findCompanyByNumber as findTemporalCompanyByNumber,
  insertMonitoredCompany as insertTemporalCompany,
} from '../../../repositories/company.repository';
import { insertObligation } from '../../../repositories/obligation.repository';
import { startObligationWorkflow } from '../../../domain/services/workflow-start.service';
import { log } from '@/lib/logger';
import type { ObligationType } from '../../../domain/types/obligation';
import type { BillingStatus } from '@/types/stripe';

// Default tenant for pilot — matches 0001_temporal_core.sql seed row
const DEFAULT_TENANT_ID = '00000000-0000-0000-0000-000000000001';

const TEMPORAL_OBLIGATION_TYPES: ObligationType[] = [
  'accounts_filing',
  'confirmation_statement',
];

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
 * Fan-out strategy:
 * - Branch A (legacy) and Branch B (Temporal) run in parallel — different tables.
 * - Within Branch A: upsert must precede insertAlerts (data integrity ordering).
 * - After both branches: obligations are created in parallel, then workflows started
 *   in parallel using Promise.allSettled so one failure doesn't abort the rest.
 */
export async function activateComplianceMonitoring(
  input: ActivateComplianceMonitoringInput,
): Promise<void> {
  const tenantId = input.tenantId ?? DEFAULT_TENANT_ID;

  log.info('activateComplianceMonitoring', {
    companyNumber: input.companyNumber,
    alertTypes: input.alertTypes,
    tenantId,
  });

  // Step 1: run legacy upsert chain and Temporal company resolution in parallel.
  // These touch independent tables and have no cross-dependency at this stage.
  const [, temporalCompanyId] = await Promise.all([
    // Branch A: legacy — upsert company row, then insert alert rows sequentially
    upsertMonitoredCompany({
      companyNumber: input.companyNumber,
      companyName: input.companyName,
      stripeSessionId: input.stripeSessionId,
      lastCheckoutSessionId: input.stripeSessionId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
      billingStatus: 'active',
    }).then(() =>
      insertAlerts(input.companyNumber, input.alertTypes, input.stripeSubscriptionId),
    ),

    // Branch B: Temporal — resolve company ID (find or create, upsert-safe)
    resolveTemporalCompanyId(tenantId, input),
  ]);

  if (!temporalCompanyId) {
    log.error('failed to resolve Temporal company record — skipping workflow start', {
      companyNumber: input.companyNumber,
    });
    return;
  }

  const requestedTypes = input.alertTypes.filter((t): t is ObligationType =>
    TEMPORAL_OBLIGATION_TYPES.includes(t as ObligationType),
  );

  if (requestedTypes.length === 0) return;

  // Step 2: create all obligations in parallel (idempotent inserts)
  const obligations = await Promise.all(
    requestedTypes.map((obligationType) =>
      insertObligation({
        tenantId,
        monitoredCompanyId: temporalCompanyId,
        obligationType,
        status: 'pending',
      }),
    ),
  );

  // Step 3: start all workflows in parallel; log failures without aborting siblings
  const results = await Promise.allSettled(
    obligations.map(({ id: obligationId }, i) =>
      startObligationWorkflow({
        tenantId,
        obligationId,
        monitoredCompanyId: temporalCompanyId,
        obligationType: requestedTypes[i],
        companyNumber: input.companyNumber,
      }),
    ),
  );

  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      log.error('failed to start Temporal workflow', {
        companyNumber: input.companyNumber,
        obligationType: requestedTypes[i],
        err: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });
}

/**
 * Find the Temporal-system company row, creating it if necessary.
 * Returns the row ID only — callers only ever use the ID downstream.
 * insertTemporalCompany uses onConflictDoUpdate so concurrent calls are safe.
 */
async function resolveTemporalCompanyId(
  tenantId: string,
  input: ActivateComplianceMonitoringInput,
): Promise<string | null> {
  const existing = await findTemporalCompanyByNumber(tenantId, input.companyNumber);
  if (existing) return existing.id;

  const { id } = await insertTemporalCompany({
    tenantId,
    companyNumber: input.companyNumber,
    companyName: input.companyName,
    stripeSessionId: input.stripeSessionId,
    stripeSubscriptionId: input.stripeSubscriptionId,
    stripeCustomerId: input.stripeCustomerId,
  });
  return id;
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
 *
 * Passes eventCreatedAt to the ordering guard so a stale deletion event
 * doesn't overwrite a more recent re-activation.
 */
export async function cancelComplianceMonitoring(
  companyNumber: string,
  eventCreatedAt?: Date,
): Promise<void> {
  log.info('cancelComplianceMonitoring', { companyNumber });

  // Inline the two updates with tx so they commit atomically.
  // Repo helpers use module-level `db` and can't be passed a tx object,
  // so we duplicate the SQL here rather than escape the transaction boundary.
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
