import { db } from '../db/index';
import { fineGuardAlerts } from '../db/schema';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'pending' | 'acknowledged' | 'resolved' | 'failed';

export interface PersistAlertInput {
  tenantId: string;
  complianceRunId: string;
  alertType: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export type PersistAlertResult =
  | { ok: true; id: string; action: 'inserted' | 'duplicate' }
  | { ok: false; failedSafe: true; correlationId: string; error: string };

/**
 * Write one alert row. Idempotent: if (complianceRunId, alertType) already
 * exists, returns action='duplicate' without touching existing data.
 *
 * Never throws — DB failures are captured and returned as failedSafe=true so
 * the caller can log them without crashing the compliance run.
 */
export async function persistComplianceAlert(
  input: PersistAlertInput,
  correlationId: string,
): Promise<PersistAlertResult> {
  try {
    const rows = await db
      .insert(fineGuardAlerts)
      .values({
        tenantId: input.tenantId,
        complianceRunId: input.complianceRunId,
        alertType: input.alertType,
        severity: input.severity,
        title: input.title,
        message: input.message,
        status: 'pending',
        metadata: input.metadata != null ? JSON.stringify(input.metadata) : null,
      })
      .onConflictDoNothing()
      .returning({ id: fineGuardAlerts.id });

    if (rows.length === 0) {
      return { ok: true, id: '', action: 'duplicate' };
    }
    return { ok: true, id: rows[0].id, action: 'inserted' };
  } catch (err) {
    return {
      ok: false,
      failedSafe: true,
      correlationId,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Gate function: only calls persistComplianceAlert when alertRequired is true.
 * Returns null when alertRequired is false so callers can distinguish
 * "no-alert run" from "insert attempted".
 */
export async function writeAlertIfRequired(
  alertRequired: boolean,
  input: PersistAlertInput,
  correlationId: string,
): Promise<PersistAlertResult | null> {
  if (!alertRequired) return null;
  return persistComplianceAlert(input, correlationId);
}

/**
 * Map Companies House riskLevel to AlertSeverity.
 * CH does not produce 'critical'; 'none' maps to 'low'.
 */
export function toAlertSeverity(riskLevel: string): AlertSeverity {
  if (riskLevel === 'medium' || riskLevel === 'high' || riskLevel === 'critical') return riskLevel;
  return 'low';
}
