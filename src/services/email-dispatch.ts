/**
 * Direct email dispatch via Azure Communication Services REST API.
 *
 * No additional npm packages required — uses native fetch.
 *
 * Required environment variables:
 *   AZURE_COMMUNICATION_ENDPOINT  e.g. https://<resource>.communication.azure.com
 *   AZURE_COMMUNICATION_KEY       base64-encoded access key from Azure portal
 *   EMAIL_SENDER_ADDRESS          e.g. DoNotReply@<domain>.azurecomm.net
 */

import { log } from '@/lib/logger';
import crypto from 'crypto';

export interface EmailAddress {
  address: string;
  displayName?: string;
}

export interface SendEmailOptions {
  to: EmailAddress[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  cc?: EmailAddress[];
  replyTo?: EmailAddress;
}

export interface EmailSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

// ── HMAC-SHA256 request signing ───────────────────────────────────────────────

function signRequest(
  method: string,
  url: string,
  body: string,
  accessKey: string,
): Record<string, string> {
  const parsed = new URL(url);
  const contentHash = crypto
    .createHash('sha256')
    .update(body, 'utf8')
    .digest('base64');

  const utcNow = new Date().toUTCString();
  const stringToSign = [
    method.toUpperCase(),
    parsed.pathname + (parsed.search || ''),
    `${utcNow};${parsed.host};${contentHash}`,
  ].join('\n');

  const signature = crypto
    .createHmac('sha256', Buffer.from(accessKey, 'base64'))
    .update(stringToSign, 'utf8')
    .digest('base64');

  return {
    'x-ms-date': utcNow,
    'x-ms-content-sha256': contentHash,
    Authorization: `HMAC-SHA256 SignedHeaders=x-ms-date;host;x-ms-content-sha256&Signature=${signature}`,
  };
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Sends an email through Azure Communication Services.
 * Returns `{ ok: true, messageId }` on success, `{ ok: false, error }` on failure.
 *
 * Does NOT throw — callers can decide whether to surface failures.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailSendResult> {
  const endpoint = process.env.AZURE_COMMUNICATION_ENDPOINT;
  const accessKey = process.env.AZURE_COMMUNICATION_KEY;
  const sender = process.env.EMAIL_SENDER_ADDRESS;

  if (!endpoint || !accessKey || !sender) {
    log.warn('[email-dispatch] Missing Azure Communication env vars — email skipped', {
      hasEndpoint: !!endpoint,
      hasKey: !!accessKey,
      hasSender: !!sender,
    });
    return { ok: false, error: 'Azure Communication Services not configured' };
  }

  const url = `${endpoint}/emails:send?api-version=2023-03-31`;

  const body = JSON.stringify({
    senderAddress: sender,
    recipients: {
      to: options.to.map((r) => ({
        address: r.address,
        displayName: r.displayName ?? r.address,
      })),
      cc: options.cc?.map((r) => ({
        address: r.address,
        displayName: r.displayName ?? r.address,
      })),
    },
    replyTo: options.replyTo
      ? [{ address: options.replyTo.address, displayName: options.replyTo.displayName }]
      : undefined,
    content: {
      subject: options.subject,
      html: options.htmlBody,
      plainText: options.textBody,
    },
  });

  const authHeaders = signRequest('POST', url, body, accessKey);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      log.error('[email-dispatch] ACS returned error', { status: res.status, body: text });
      return { ok: false, error: `ACS HTTP ${res.status}: ${text}` };
    }

    // 202 Accepted — operation-id in header
    const messageId =
      res.headers.get('operation-location')?.split('/').pop() ?? undefined;

    log.info('[email-dispatch] Email accepted', { to: options.to.map((r) => r.address), messageId });
    return { ok: true, messageId };
  } catch (err) {
    const msg = String(err);
    log.error('[email-dispatch] Fetch failed', { err });
    return { ok: false, error: msg };
  }
}

// ── Compliance alert email builder ─────────────────────────────────────────────

export interface ComplianceAlertEmailOptions {
  recipientEmail: string;
  recipientName: string;
  companyName: string;
  companyNumber: string;
  alertType: string;
  alertLabel: string;
  dueDate: string;
  daysRemaining: number;
  urgency: 'low' | 'medium' | 'urgent';
  message: string;
  overdue: boolean;
}

const URGENCY_COLOUR: Record<string, string> = {
  low: '#2563eb',
  medium: '#d97706',
  urgent: '#dc2626',
};

export function buildComplianceAlertEmail(opts: ComplianceAlertEmailOptions): SendEmailOptions {
  const colour = URGENCY_COLOUR[opts.urgency] ?? '#2563eb';
  const badgeText = opts.overdue ? 'OVERDUE' : opts.urgency.toUpperCase();
  const htmlBody = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
    <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)">
      <tr><td style="background:${colour};padding:24px 32px">
        <h1 style="margin:0;color:#ffffff;font-size:20px">FineGuard Pro — Compliance Alert</h1>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 8px;color:#64748b;font-size:14px">Hello ${opts.recipientName},</p>
        <p style="margin:0 0 24px;color:#1e293b;font-size:16px">${opts.message}</p>
        <table width="100%" cellpadding="12" cellspacing="0" style="background:#f8fafc;border-radius:6px;border:1px solid #e2e8f0">
          <tr><td width="40%" style="color:#64748b;font-size:13px">Company</td>
              <td style="color:#1e293b;font-size:13px;font-weight:bold">${opts.companyName} (${opts.companyNumber})</td></tr>
          <tr><td style="color:#64748b;font-size:13px">Deadline type</td>
              <td style="color:#1e293b;font-size:13px">${opts.alertLabel}</td></tr>
          <tr><td style="color:#64748b;font-size:13px">Due date</td>
              <td style="color:#1e293b;font-size:13px">${opts.dueDate}</td></tr>
          <tr><td style="color:#64748b;font-size:13px">Status</td>
              <td><span style="background:${colour};color:#fff;border-radius:4px;padding:2px 8px;font-size:12px;font-weight:bold">${badgeText}</span></td></tr>
        </table>
        <p style="margin:24px 0 0;color:#64748b;font-size:12px">
          You are receiving this email because you have active compliance monitoring for this company through FineGuard Pro.
        </p>
      </td></tr>
      <tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0">
        <p style="margin:0;color:#94a3b8;font-size:11px">FineGuard Pro — UK Companies House compliance monitoring</p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

  const textBody = `FineGuard Pro — Compliance Alert\n\n${opts.message}\n\nCompany: ${opts.companyName} (${opts.companyNumber})\nDeadline type: ${opts.alertLabel}\nDue date: ${opts.dueDate}\nStatus: ${badgeText}\n`;

  return {
    to: [{ address: opts.recipientEmail, displayName: opts.recipientName }],
    subject: `[${badgeText}] ${opts.alertLabel} deadline — ${opts.companyName}`,
    htmlBody,
    textBody,
  };
}
