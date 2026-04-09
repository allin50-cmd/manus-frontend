// STUB - real SMS provider (Twilio/etc.) not yet integrated
import { log } from '@temporalio/activity';
import { updateAlertStatus } from '../../repositories/alert.repository';
import { db } from '../../db/client';
import { alertAttempts } from '../../db/schema';

export interface SendSmsInput {
  to: string;
  message: string;
  alertId?: string;
}

/**
 * // STUB — SMS delivery not yet integrated.
 *
 * In production this will call Twilio (or a similar SMS provider) to send
 * a text message. For now it logs the intent and records the attempt.
 *
 * If alertId is supplied, the corresponding alert row is updated to 'sent'
 * and an alert_attempt record is inserted.
 */
export async function sendSms(input: SendSmsInput): Promise<void> {
  const { to, message, alertId } = input;

  // STUB: log instead of sending
  log.warn('[sendSms] STUB: SMS not sent in production', {
    to,
    messageLength: message.length,
    alertId,
    note: 'Integrate Twilio or similar SMS provider before going live',
  });

  if (alertId) {
    await updateAlertStatus(alertId, 'sent');

    await db.insert(alertAttempts).values({
      alertId,
      attemptNumber: 1,
      status: 'sent',
      errorMessage: 'STUB: SMS provider not integrated',
      attemptedAt: new Date(),
    });
  }
}
