import {
  upsertMonitoredCompany,
  updateBillingStatus,
  findByCompanyNumber as findLegacyCompanyByNumber,
} from '../../repositories/monitoredCompanies.repo';
import {
  insertAlerts,
  deactivateAlertsForCompany,
  reactivateAlertsForCompany,
} from '../../repositories/complianceAlerts.repo';
import {
  findCompanyByNumber as findTemporalCompanyByNumber,
  insertMonitoredCompany as insertTemporalCompany,
} from '../../../repositories/company.repository';
import { insertObligation } from '../../../repositories/obligation.repository';
import { startObligationWorkflow } from '../../../domain/services/workflow-start.service';
import type { ObligationType } from '../../../domain/types/obligation';

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
 * 3. Creates compliance_obligation rows for each supported type
 * 4. Starts a Temporal workflow per obligation
 */
export async function activateComplianceMonitoring(
  input: ActivateComplianceMonitoringInput,
): Promise<void> {
  const tenantId = input.tenantId ?? DEFAULT_TENANT_ID;

  console.log('[activation] activateComplianceMonitoring', {
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

  // 2. Temporal system — find or create the company row
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
    temporalCompany = await (await import('../../../repositories/company.repository'))
      .findCompanyById(id);
  }

  if (!temporalCompany) {
    console.error('[activation] Failed to resolve Temporal company record — skipping workflow start', {
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

      console.log('[activation] Temporal workflow started', {
        companyNumber: input.companyNumber,
        obligationType,
        obligationId,
      });
    } catch (err) {
      // Non-fatal: log and continue with remaining types
      console.error('[activation] Failed to start Temporal workflow', {
        companyNumber: input.companyNumber,
        obligationType,
        err,
      });
    }
  }
}

// ── markBillingPastDue ────────────────────────────────────────────────────────

/**
 * Called on invoice.payment_failed.
 * Sets billing_status=past_due. Monitoring DB records remain intact.
 */
export async function markBillingPastDue(companyNumber: string): Promise<void> {
  console.log('[activation] markBillingPastDue', { companyNumber });
  await updateBillingStatus(companyNumber, 'past_due');
  // STUB: suspend outbound delivery (SMS/email) without removing monitoring records
  // await suspendOutboundAlerts(companyNumber);
}

// ── cancelComplianceMonitoring ────────────────────────────────────────────────

/**
 * Called on customer.subscription.deleted.
 * Sets billing_status=cancelled and deactivates compliance alert rows.
 * No hard deletes — audit trail preserved.
 */
export async function cancelComplianceMonitoring(companyNumber: string): Promise<void> {
  console.log('[activation] cancelComplianceMonitoring', { companyNumber });
  await updateBillingStatus(companyNumber, 'cancelled');
  await deactivateAlertsForCompany(companyNumber);
}

// ── restoreBillingActive ──────────────────────────────────────────────────────

/**
 * Called on invoice.paid when billing was previously past_due.
 * Restores billing_status=active and reactivates previously cancelled alerts.
 */
export async function restoreBillingActive(companyNumber: string): Promise<void> {
  console.log('[activation] restoreBillingActive', { companyNumber });
  await updateBillingStatus(companyNumber, 'active');
  await reactivateAlertsForCompany(companyNumber);
}
