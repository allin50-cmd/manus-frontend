import { log } from '@temporalio/activity';
import { insertAlertIfNew } from '../../repositories/alert.repository';
import { dedupeKey as buildDedupeKey } from '../../lib/ids';
import type { AlertUrgency, AlertChannel } from '../../domain/types/alert';

export interface CreateAlertInput {
  obligationId: string;
  tenantId: string;
  urgency: AlertUrgency;
  channel: AlertChannel;
  dueDate: string;
}

/**
 * Create an alert DB record for the given obligation/channel/urgency combination.
 *
 * Deduplication: if an alert with the same dedupeKey already exists, the
 * insert is silently skipped and this activity returns without error.
 *
 * Note: This activity only creates the DB record. Actual message delivery
 * (email/SMS) is handled by sendEmail/sendSms activities called by the workflow.
 */
export async function createAlert(input: CreateAlertInput): Promise<void> {
  const { obligationId, tenantId, urgency, channel, dueDate } = input;

  // dedupeKey format: obligationId:urgency:channel:dueDate
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
    urgency,
    channel,
    dueDate,
  });
}
