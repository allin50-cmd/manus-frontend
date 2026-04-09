// STUB - real email provider (Resend/SES) not yet integrated
import { log } from '@temporalio/activity';
import { updateAlertStatus } from '../../repositories/alert.repository';
import { db } from '../../db/client';
import { alertAttempts } from '../../db/schema';

export interface SendEmailInput {
  to: string;
  subject: string;
  body: string;
  alertId?: string;
}

/**
 * // STUB — email delivery not yet integrated.
 *
 * In production this will call Resend (or AWS SES) to send a transactional
 * email. For now it logs the intent and records the attempt.
 *
 * If alertId is supplied, the corresponding alert row is updated to 'sent'
 * and an alert_attempt record is inserted.
 */
export async function sendEmail(input: SendEmailInput): Promise<void> {
  const { to, subject, alertId } = input;

  // STUB: log instead of sending
  log.warn('[sendEmail] STUB: email not sent in production', {
    to,
    subject,
    alertId,
    note: 'Integrate Resend or AWS SES before going live',
  });

  if (alertId) {
    await updateAlertStatus(alertId, 'sent');

    await db.insert(alertAttempts).values({
      alertId,
      attemptNumber: 1,
      status: 'sent',
      errorMessage: 'STUB: email provider not integrated',
      attemptedAt: new Date(),
    });
  }
}
