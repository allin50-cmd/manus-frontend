import nodemailer from 'nodemailer';

/**
 * Email Service
 * Sends compliance alert emails via SMTP.
 * Compatible with any SMTP provider (Gmail, Mailgun, SendGrid, etc.)
 *
 * Required env vars:
 *   SMTP_HOST   – e.g. smtp.gmail.com
 *   SMTP_PORT   – e.g. 587
 *   SMTP_USER   – your SMTP username / email address
 *   SMTP_PASS   – your SMTP password / app password
 *   SMTP_FROM   – "FineGuard <alerts@yourdomain.com>"
 */

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export interface ComplianceAlert {
  alertType: string;
  description: string;
  dueDate: string;
  daysUntilDue?: number;
  daysOverdue?: number;
  penaltyRisk?: string;
}

export async function sendComplianceAlertEmail(
  toEmail: string,
  companyName: string,
  companyNumber: string,
  alerts: ComplianceAlert[]
): Promise<boolean> {
  const transport = createTransport();

  if (!transport) {
    console.warn('⚠️  SMTP not configured – skipping email send');
    return false;
  }

  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;

  const overdueAlerts = alerts.filter(a => (a.daysOverdue ?? 0) > 0);
  const upcomingAlerts = alerts.filter(a => (a.daysOverdue ?? 0) === 0);

  const urgencyLabel =
    overdueAlerts.length > 0 ? '🚨 URGENT – Overdue Filings' : '⚠️ Action Required';

  const alertRows = (items: ComplianceAlert[], isOverdue: boolean) =>
    items
      .map(
        a => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${a.description}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;white-space:nowrap;">${a.dueDate}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;color:${isOverdue ? '#dc2626' : '#d97706'};">
          ${isOverdue ? `${a.daysOverdue} days overdue` : `${a.daysUntilDue} days left`}
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;">${a.penaltyRisk ?? '–'}</td>
      </tr>`
      )
      .join('');

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f9f9f9;margin:0;padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f9f9;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:24px 32px;">
            <h1 style="color:#fff;margin:0;font-size:20px;">FineGuard Compliance Alert</h1>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:14px;">${urgencyLabel}</p>
          </td>
        </tr>

        <!-- Company -->
        <tr>
          <td style="padding:24px 32px 0;">
            <p style="margin:0;font-size:16px;font-weight:bold;color:#0f172a;">${companyName}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#64748b;">Company Number: ${companyNumber}</p>
          </td>
        </tr>

        <!-- Overdue section -->
        ${
          overdueAlerts.length > 0
            ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#dc2626;">Overdue Filings</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#fef2f2;">
                  <th style="padding:8px 12px;text-align:left;color:#7f1d1d;">Filing</th>
                  <th style="padding:8px 12px;text-align:left;color:#7f1d1d;">Due Date</th>
                  <th style="padding:8px 12px;text-align:left;color:#7f1d1d;">Status</th>
                  <th style="padding:8px 12px;text-align:left;color:#7f1d1d;">Penalty Risk</th>
                </tr>
              </thead>
              <tbody>${alertRows(overdueAlerts, true)}</tbody>
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- Upcoming section -->
        ${
          upcomingAlerts.length > 0
            ? `
        <tr>
          <td style="padding:24px 32px 0;">
            <h2 style="margin:0 0 12px;font-size:15px;color:#d97706;">Upcoming Deadlines</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px;">
              <thead>
                <tr style="background:#fffbeb;">
                  <th style="padding:8px 12px;text-align:left;color:#78350f;">Filing</th>
                  <th style="padding:8px 12px;text-align:left;color:#78350f;">Due Date</th>
                  <th style="padding:8px 12px;text-align:left;color:#78350f;">Status</th>
                  <th style="padding:8px 12px;text-align:left;color:#78350f;">Penalty Risk</th>
                </tr>
              </thead>
              <tbody>${alertRows(upcomingAlerts, false)}</tbody>
            </table>
          </td>
        </tr>`
            : ''
        }

        <!-- CTA -->
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 16px;font-size:14px;color:#475569;">
              Act now to avoid Companies House penalties. File your documents as soon as possible.
            </p>
            <a href="https://find-and-update.company-information.service.gov.uk/company/${companyNumber}/filing-history"
               style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;">
              View Filing History
            </a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f1f5f9;padding:16px 32px;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You're receiving this because you subscribed to FineGuard monitoring for ${companyName}.
              Powered by FineGuard Compliance Cloud.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  try {
    await transport.sendMail({
      from,
      to: toEmail,
      subject: `[FineGuard] ${urgencyLabel} – ${companyName}`,
      html,
    });
    console.log(`📧 Alert email sent to ${toEmail} for ${companyName}`);
    return true;
  } catch (err) {
    console.error(`Failed to send alert email to ${toEmail}:`, err);
    return false;
  }
}
