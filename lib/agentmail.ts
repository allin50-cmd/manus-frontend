// Server-only AgentMail integration for FineGuard / UltraTech OS.
// Missing configuration is always a normal, non-throwing state.
// External delivery is fail-closed and requires BOTH:
//   1) AGENTMAIL_SEND_ENABLED=true
//   2) an explicit approved:true call
// Recipients must also be present in AGENTMAIL_RECIPIENT_ALLOWLIST.

const AGENTMAIL_API_BASE = 'https://api.agentmail.to/v0'
export const AGENTMAIL_INBOX_ID = 'customcaruk-3241@agentmail.to'

export function isAgentMailConfigured(): boolean {
  return typeof process.env.AGENTMAIL_API_KEY === 'string' && process.env.AGENTMAIL_API_KEY.trim().length > 0
}

export function isAgentMailSendEnabled(): boolean {
  return process.env.AGENTMAIL_SEND_ENABLED === 'true'
}

function allowedRecipients(): Set<string> {
  return new Set(
    (process.env.AGENTMAIL_RECIPIENT_ALLOWLIST ?? '')
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isAgentMailRecipientAllowed(recipient: string): boolean {
  return allowedRecipients().has(recipient.trim().toLowerCase())
}

function redactEmail(email: string): string {
  const [local, domain] = email.trim().split('@')
  if (!local || !domain) return '[redacted]'
  return `${local.slice(0, 1)}***@${domain}`
}

export type AgentMailFailureReason =
  | 'not_configured'
  | 'send_disabled'
  | 'approval_required'
  | 'recipient_not_allowed'
  | 'invalid_request'
  | 'unavailable'

export type AgentMailResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: AgentMailFailureReason; error: string }

export type AgentMailReceipt = {
  provider: 'agentmail'
  sender: typeof AGENTMAIL_INBOX_ID
  recipient: string
  messageId: string
  threadId: string
  sentAt: string
}

export async function sendApprovedEmail(input: {
  to: string
  subject: string
  text: string
  html?: string
  approved: boolean
}): Promise<AgentMailResult<AgentMailReceipt>> {
  const apiKey = process.env.AGENTMAIL_API_KEY?.trim()

  if (!apiKey) {
    return { ok: false, reason: 'not_configured', error: 'AGENTMAIL_API_KEY is not set' }
  }
  if (!isAgentMailSendEnabled()) {
    return { ok: false, reason: 'send_disabled', error: 'External AgentMail delivery is disabled' }
  }
  if (input.approved !== true) {
    return { ok: false, reason: 'approval_required', error: 'Explicit approval is required before sending' }
  }

  const to = input.to.trim().toLowerCase()
  if (!to || !input.subject.trim() || !input.text.trim()) {
    return { ok: false, reason: 'invalid_request', error: 'Recipient, subject, and text are required' }
  }
  if (!isAgentMailRecipientAllowed(to)) {
    return { ok: false, reason: 'recipient_not_allowed', error: 'Recipient is not on the owner-managed allowlist' }
  }

  try {
    const response = await fetch(
      `${AGENTMAIL_API_BASE}/inboxes/${encodeURIComponent(AGENTMAIL_INBOX_ID)}/messages/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: [to],
          subject: input.subject,
          text: input.text,
          ...(input.html ? { html: input.html } : {}),
        }),
      },
    )

    if (!response.ok) {
      return {
        ok: false,
        reason: 'unavailable',
        error: `AgentMail request failed with status ${response.status}`,
      }
    }

    const body = (await response.json()) as { message_id?: string; thread_id?: string }
    if (!body.message_id || !body.thread_id) {
      return { ok: false, reason: 'unavailable', error: 'AgentMail returned an incomplete response' }
    }

    return {
      ok: true,
      data: {
        provider: 'agentmail',
        sender: AGENTMAIL_INBOX_ID,
        recipient: redactEmail(to),
        messageId: body.message_id,
        threadId: body.thread_id,
        sentAt: new Date().toISOString(),
      },
    }
  } catch {
    return { ok: false, reason: 'unavailable', error: 'AgentMail is currently unavailable' }
  }
}

// Keep the existing abstraction contract for callers that only need to know
// whether AgentMail is available. Draft generation is intentionally separate
// from external delivery and does not send email.
export async function draftEmail(_input: {
  person: string
  contact: string
  context: string
}): Promise<AgentMailResult<{ draft: string }>> {
  if (!isAgentMailConfigured()) {
    return { ok: false, reason: 'not_configured', error: 'AGENTMAIL_API_KEY is not set' }
  }
  return { ok: false, reason: 'unavailable', error: 'AgentMail draft generation is not implemented' }
}
