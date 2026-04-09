import { eq, and, inArray } from 'drizzle-orm';
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
  findCompanyById,
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
 * 1. Upserts the legacy monitored_companies row (billing fields + alerts)
 * 2. Ensures a Temporal-system monitored_companies row exists
 * 3. Creates compliance_obligation rows for each supported type (idempotent)
 * 4. Starts a Temporal workflow per obligation (dedup via REJECT_DUPLICATE)
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

  // 1. Legacy system — upsert monitored_companies + compliance_alerts
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

  // 2. Temporal system — find or create the company row (upsert; safe on retry)
  let temporalCompany = await findTemporalCompanyByNumber(tenantId, input.companyNumber);
  if (!temporalCompany) {
    const { id } = await insertTemporalCompany({
      tenantId,
      companyNumber: input.companyNumber,
      companyName: input.companyName,
      stripeSessionId: input.stripeSessionId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
    });
    temporalCompany = await findCompanyById(id);
  }

  if (!temporalCompany) {
    log.error('failed to resolve Temporal company record — skipping workflow start', {
      companyNumber: input.companyNumber,
    });
    return;
  }

  // 3 & 4. Create obligations + start workflows for each supported type
  const requestedTypes = input.alertTypes.filter((t): t is ObligationType =>
    TEMPORAL_OBLIGATION_TYPES.includes(t as ObligationType),
  );

  for (const obligationType of requestedTypes) {
    try {
      const { id: obligationId } = await insertObligation({
        tenantId,
        monitoredCompanyId: temporalCompany.id,
        obligationType,
        status: 'pending',
      });

      await startObligationWorkflow({
        tenantId,
        obligationId,
        monitoredCompanyId: temporalCompany.id,
        obligationType,
      });
    } catch (err) {
      // Non-fatal: log and continue with remaining types
      log.error('failed to start Temporal workflow', {
        companyNumber: input.companyNumber,
        obligationType,
        err: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

// ── markBillingPastDue ────────────────────────────────────────────────────────

/**
 * Called on invoice.payment_failed.
 * Transitions active → past_due.  No-op if already past_due or cancelled.
 */
export async function markBillingPastDue(companyNumber: string): Promise<void> {
  log.info('markBillingPastDue', { companyNumber });
  const transitioned = await transitionBillingStatus(companyNumber, 'past_due');
  if (!transitioned) {
    log.warn('markBillingPastDue: transition rejected (invalid state or company not found)', {
      companyNumber,
    });
  }
}

// ── cancelComplianceMonitoring ────────────────────────────────────────────────

/**
 * Called on customer.subscription.deleted.
 * Atomically transitions billing status and deactivates compliance alert rows
 * in a single DB transaction (H4 fix).
 * No hard deletes — audit trail preserved.
 */
export async function cancelComplianceMonitoring(companyNumber: string): Promise<void> {
  log.info('cancelComplianceMonitoring', { companyNumber });

  // Inline the two updates with tx so they commit atomically.
  // Repo helpers use module-level `db` and can't be passed a tx object,
  // so we duplicate the SQL here rather than escape the transaction boundary.
  const allowedFrom: BillingStatus[] = ['active', 'past_due', 'pending'];

  await db.transaction(async (tx) => {
    await tx
      .update(monitoredCompanies)
      .set({ billingStatus: 'cancelled', billingStatusUpdatedAt: new Date() })
      .where(
        and(
          eq(monitoredCompanies.companyNumber, companyNumber),
          inArray(monitoredCompanies.billingStatus, allowedFrom),
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
export async function restoreBillingActive(companyNumber: string): Promise<void> {
  log.info('restoreBillingActive', { companyNumber });
  const transitioned = await transitionBillingStatus(companyNumber, 'active');
  if (!transitioned) {
    log.warn('restoreBillingActive: billing transition rejected (possibly already active)', {
      companyNumber,
    });
  }
  await reactivateAlertsForCompany(companyNumber, 'billing_cancelled');
}
