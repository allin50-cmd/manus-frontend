import { log } from '../lib/logger';
import { insertAlertIfNew } from '../repositories/alert.repository';
import { findByCompanyNumber } from '../server/repositories/monitoredCompanies.repo';
import { dedupeKey as buildDedupeKey } from '../lib/ids';
import type { AlertUrgency, AlertChannel } from '../domain/types/alert';

export interface CreateAlertInput {
  obligationId: string;
  tenantId: string;
  urgency: AlertUrgency;
  channel: AlertChannel;
  dueDate: string;
  /** When present, billing_status is checked — alert is suppressed if not 'active' */
  companyNumber?: string;
}

/**
 * Create an alert DB record for the given obligation/channel/urgency combination.
 *
 * Billing gate: if companyNumber is supplied and the company's billing_status
 * is not 'active', the alert is suppressed and no record is written.
 *
 * Deduplication: if an alert with the same dedupeKey already exists, the
 * insert is silently skipped and this function returns without error.
 */
export async function createAlert(input: CreateAlertInput): Promise<void> {
  const { obligationId, tenantId, urgency, channel, dueDate, companyNumber } = input;

  // ── Billing gate ────────────────────────────────────────────────────────────
  if (companyNumber) {
    const company = await findByCompanyNumber(companyNumber);
    if (!company || company.billingStatus !== 'active') {
      log.warn('[createAlert] Alert suppressed — billing not active', {
        companyNumber,
        billingStatus: company?.billingStatus ?? 'not_found',
        obligationId,
        urgency,
        channel,
      });
      return;
    }
  }

  // ── Deduplication ────────────────────────────────────────────────────────────
  const key = buildDedupeKey([obligationId, urgency, channel, dueDate]);

  const result = await insertAlertIfNew({
    tenantId,
    obligationId,
    urgency,
    channel,
    dedupeKey: key,
    dueDate,
  });

  if (result === null) {
    log.info('[createAlert] Alert deduplicated — skipping', {
      dedupeKey: key,
      obligationId,
      channel,
    });
    return;
  }

  log.info('[createAlert] Alert record created', {
    alertId: result.id,
    obligationId,
    companyNumber,
    urgency,
    channel,
    dueDate,
  });
}
