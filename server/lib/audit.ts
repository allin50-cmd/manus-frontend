// ============================================================================
// Audit Log Helper
// Every meaningful action creates a clean, inspectable audit event.
// ============================================================================

import { FineGuardStore } from '../store/types.js';

export type AuditEventType =
  | 'company_checked'
  | 'monitoring_started'
  | 'monitoring_stopped'
  | 'alert_created'
  | 'alert_handled'
  | 'status_updated'
  | 'sweep_run';

export async function logAudit(
  store: FineGuardStore,
  params: {
    companyId: string;
    eventType: AuditEventType;
    eventSummary: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  await store.createAuditEntry({
    companyId: params.companyId,
    eventType: params.eventType,
    eventSummary: params.eventSummary,
    metadataJson: JSON.stringify(params.metadata ?? {}),
  });
}
