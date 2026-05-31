const RESEND_KEY = process.env.RESEND_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'audit@vaultline.co.uk';
const RESEND_API = 'https://api.resend.com/emails';

async function send(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_KEY) {
    console.warn('[emailService] RESEND_KEY not set — skipping email to', to);
    return;
  }

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error('[emailService] Resend error:', res.status, body);
  } else {
    console.log(`[emailService] Sent "${subject}" to ${to}`);
  }
}

// ============================================================================
// Audit funnel email sequence
// ============================================================================

export async function sendAuditReady(
  to: string,
  name: string,
  tenantId: string,
  appUrl: string
): Promise<void> {
  const auditUrl = `${appUrl}/audit?t=${tenantId}`;
  const displayName = name || 'there';

  await send(
    to,
    'Your chambers revenue audit is ready',
    `<p>Hi ${displayName},</p>
<p>We've analysed your chambers' billing patterns and identified your potential revenue leakage.</p>
<p><a href="${auditUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">View Your Audit →</a></p>
<p>Estimated monthly leakage: <strong>£4,200–£12,000</strong></p>
<p>This takes about 2 minutes to review.</p>
<br/>
<p style="color:#666;font-size:12px;">VaultLine · AI Revenue Recovery for Legal Chambers</p>`
  );
}

export async function sendAuditFollowUp(
  to: string,
  name: string,
  tenantId: string,
  appUrl: string
): Promise<void> {
  const auditUrl = `${appUrl}/audit?t=${tenantId}`;
  const displayName = name || 'there';

  await send(
    to,
    'Your revenue leakage breakdown (2 min read)',
    `<p>Hi ${displayName},</p>
<p>You haven't viewed your audit yet — your chambers is likely leaving thousands on the table each month.</p>
<p>We identified specific areas where your billing system misses work already done:</p>
<ul>
  <li>Unbilled follow-up emails and calls</li>
  <li>Preparation time not captured on matters</li>
  <li>Disbursements not passed to clients</li>
</ul>
<p><a href="${auditUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">View Your Full Breakdown →</a></p>
<br/>
<p style="color:#666;font-size:12px;">VaultLine · AI Revenue Recovery for Legal Chambers</p>`
  );
}

export async function sendCallInvite(
  to: string,
  name: string,
  calendarLink: string
): Promise<void> {
  const displayName = name || 'there';

  await send(
    to,
    '15-min walkthrough of your recovery plan',
    `<p>Hi ${displayName},</p>
<p>We can recover <strong>20–40%</strong> of your identified leakage within 30 days — with no change to how your barristers work.</p>
<p>Book a quick call and we'll walk you through exactly how:</p>
<p><a href="${calendarLink}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;font-weight:600;">Book 15-Minute Call →</a></p>
<br/>
<p style="color:#666;font-size:12px;">VaultLine · AI Revenue Recovery for Legal Chambers</p>`
  );
}

export async function sendAgentMessage(
  to: string,
  subject: string,
  message: string
): Promise<void> {
  await send(
    to,
    subject,
    `<p>${message.replace(/\n/g, '<br/>')}</p>
<br/>
<p style="color:#666;font-size:12px;">VaultLine · AI Revenue Recovery for Legal Chambers</p>`
  );
}
