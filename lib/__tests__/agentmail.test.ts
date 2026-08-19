import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  AGENTMAIL_INBOX_ID,
  isAgentMailConfigured,
  isAgentMailRecipientAllowed,
  isAgentMailSendEnabled,
  draftEmail,
  sendApprovedEmail,
} from '../agentmail'

describe('agentmail service', () => {
  const originalKey = process.env.AGENTMAIL_API_KEY
  const originalSendEnabled = process.env.AGENTMAIL_SEND_ENABLED
  const originalAllowlist = process.env.AGENTMAIL_RECIPIENT_ALLOWLIST

  beforeEach(() => {
    delete process.env.AGENTMAIL_API_KEY
    delete process.env.AGENTMAIL_SEND_ENABLED
    delete process.env.AGENTMAIL_RECIPIENT_ALLOWLIST
    vi.restoreAllMocks()
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.AGENTMAIL_API_KEY
    else process.env.AGENTMAIL_API_KEY = originalKey

    if (originalSendEnabled === undefined) delete process.env.AGENTMAIL_SEND_ENABLED
    else process.env.AGENTMAIL_SEND_ENABLED = originalSendEnabled

    if (originalAllowlist === undefined) delete process.env.AGENTMAIL_RECIPIENT_ALLOWLIST
    else process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = originalAllowlist
  })

  it('reports not configured when the API key is missing', () => {
    expect(isAgentMailConfigured()).toBe(false)
  })

  it('reports configured once the API key is set', () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    expect(isAgentMailConfigured()).toBe(true)
  })

  it('keeps sending disabled unless explicitly enabled', () => {
    expect(isAgentMailSendEnabled()).toBe(false)
    process.env.AGENTMAIL_SEND_ENABLED = 'true'
    expect(isAgentMailSendEnabled()).toBe(true)
  })

  it('enforces the owner-managed recipient allowlist', () => {
    process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = 'owner@example.com, TEST@example.com'
    expect(isAgentMailRecipientAllowed('test@example.com')).toBe(true)
    expect(isAgentMailRecipientAllowed('other@example.com')).toBe(false)
  })

  it('fails gracefully instead of throwing when unconfigured', async () => {
    const result = await draftEmail({ person: 'Dagon', contact: 'jane@example.com', context: 'follow up' })
    expect(result).toEqual({ ok: false, reason: 'not_configured', error: 'AGENTMAIL_API_KEY is not set' })
  })

  it('refuses delivery while the global send gate is disabled', async () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = 'owner@example.com'

    const result = await sendApprovedEmail({
      to: 'owner@example.com',
      subject: 'Test',
      text: 'Hello',
      approved: true,
    })

    expect(result).toEqual({
      ok: false,
      reason: 'send_disabled',
      error: 'External AgentMail delivery is disabled',
    })
  })

  it('refuses delivery without explicit approval', async () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    process.env.AGENTMAIL_SEND_ENABLED = 'true'
    process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = 'owner@example.com'

    const result = await sendApprovedEmail({
      to: 'owner@example.com',
      subject: 'Test',
      text: 'Hello',
      approved: false,
    })

    expect(result.reason).toBe('approval_required')
  })

  it('refuses recipients outside the allowlist', async () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    process.env.AGENTMAIL_SEND_ENABLED = 'true'
    process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = 'owner@example.com'

    const result = await sendApprovedEmail({
      to: 'other@example.com',
      subject: 'Test',
      text: 'Hello',
      approved: true,
    })

    expect(result.reason).toBe('recipient_not_allowed')
  })

  it('locks the sender and returns a redacted receipt on approved send', async () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    process.env.AGENTMAIL_SEND_ENABLED = 'true'
    process.env.AGENTMAIL_RECIPIENT_ALLOWLIST = 'owner@example.com'

    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ message_id: 'msg_123', thread_id: 'thr_456' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await sendApprovedEmail({
      to: 'owner@example.com',
      subject: 'FineGuard test',
      text: 'Approved test message',
      approved: true,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, options] = fetchMock.mock.calls[0]
    expect(String(url)).toContain(encodeURIComponent(AGENTMAIL_INBOX_ID))
    expect(options?.headers).toMatchObject({ Authorization: 'Bearer test-key' })
    expect(JSON.parse(String(options?.body))).toMatchObject({
      to: ['owner@example.com'],
      subject: 'FineGuard test',
      text: 'Approved test message',
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.sender).toBe(AGENTMAIL_INBOX_ID)
      expect(result.data.recipient).toBe('o***@example.com')
      expect(result.data.messageId).toBe('msg_123')
      expect(result.data.threadId).toBe('thr_456')
    }
  })
})
