import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isAgentMailConfigured, draftEmail } from '../agentmail'

describe('agentmail service abstraction', () => {
  const original = process.env.AGENTMAIL_API_KEY

  beforeEach(() => {
    delete process.env.AGENTMAIL_API_KEY
  })

  afterEach(() => {
    if (original === undefined) delete process.env.AGENTMAIL_API_KEY
    else process.env.AGENTMAIL_API_KEY = original
  })

  it('reports not configured when the API key is missing', () => {
    expect(isAgentMailConfigured()).toBe(false)
  })

  it('reports configured once the API key is set', () => {
    process.env.AGENTMAIL_API_KEY = 'test-key'
    expect(isAgentMailConfigured()).toBe(true)
  })

  it('fails gracefully instead of throwing when unconfigured', async () => {
    const result = await draftEmail({ person: 'Dagon', contact: 'jane@example.com', context: 'follow up' })
    expect(result).toEqual({ ok: false, reason: 'not_configured', error: 'AGENTMAIL_API_KEY is not set' })
  })
})
