import {
  upsertMonitoredCompany,
  updateBillingStatus,
} from '../../repositories/monitoredCompanies.repo';
import {
  insertAlerts,
  deactivateAlertsForCompany,
  reactivateAlertsForCompany,
} from '../../repositories/complianceAlerts.repo';

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
 * - Upserts the monitored company record with Stripe IDs and billing_status=active
 * - Inserts compliance alert rows (idempotent via onConflictDoNothing)
 *
 * STUB: Temporal workflow start is wired here once the worker is running.
 * See src/domain/services/workflow-start.service.ts for the Temporal entry point.
 */
export async function activateComplianceMonitoring(
  input: ActivateComplianceMonitoringInput,
): Promise<void> {
  console.log('[activation] activateComplianceMonitoring', {
    companyNumber: input.companyNumber,
    alertTypes: input.alertTypes,
    stripeSubscriptionId: input.stripeSubscriptionId,
  });

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

  // STUB: start Temporal compliance workflow(s) per alert type.
  // Uncomment when Temporal worker is running:
  //
  // const { startObligationWorkflow } = await import('@/domain/services/workflow-start.service');
  // for (const alertType of input.alertTypes) {
  //   await startObligationWorkflow({
  //     tenantId: input.tenantId ?? 'default',
  //     obligationId: <newly inserted obligation ID>,
  //     monitoredCompanyId: input.companyNumber,
  //     obligationType: alertType as import('@/domain/types/obligation').ObligationType,
  //   });
  // }
  console.log('[activation] STUB: Temporal workflow start not yet wired');
}

// ── markBillingPastDue ────────────────────────────────────────────────────────

/**
 * Called on invoice.payment_failed.
 * Sets billing_status=past_due. Does NOT cancel monitoring — alerts stay in DB.
 * Delivery (SMS/email) should be paused at the send layer if needed.
 */
export async function markBillingPastDue(companyNumber: string): Promise<void> {
  console.log('[activation] markBillingPastDue', { companyNumber });
  await updateBillingStatus(companyNumber, 'past_due');
  // STUB: suspend outbound delivery without removing DB records
  // await suspendOutboundAlerts(companyNumber);
}

// ── cancelComplianceMonitoring ────────────────────────────────────────────────

/**
 * Called on customer.subscription.deleted.
 * Sets billing_status=cancelled and deactivates all compliance alert rows.
 * Monitoring records are preserved for audit — no hard deletes.
 */
export async function cancelComplianceMonitoring(companyNumber: string): Promise<void> {
  console.log('[activation] cancelComplianceMonitoring', { companyNumber });
  await updateBillingStatus(companyNumber, 'cancelled');
  await deactivateAlertsForCompany(companyNumber);
}

// ── restoreBillingActive ──────────────────────────────────────────────────────

/**
 * Called on invoice.paid when billing was previously past_due.
 * Restores billing_status=active and reactivates cancelled alerts.
 */
export async function restoreBillingActive(companyNumber: string): Promise<void> {
  console.log('[activation] restoreBillingActive', { companyNumber });
  await updateBillingStatus(companyNumber, 'active');
  await reactivateAlertsForCompany(companyNumber);
}
