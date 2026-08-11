import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isFirecrawlConfigured, scrapeUrl } from '../firecrawl'

describe('firecrawl service abstraction', () => {
  const original = process.env.FIRECRAWL_API_KEY

  beforeEach(() => {
    delete process.env.FIRECRAWL_API_KEY
  })

  afterEach(() => {
    if (original === undefined) delete process.env.FIRECRAWL_API_KEY
    else process.env.FIRECRAWL_API_KEY = original
  })

  it('reports not configured when the API key is missing', () => {
    expect(isFirecrawlConfigured()).toBe(false)
  })

  it('reports configured once the API key is set', () => {
    process.env.FIRECRAWL_API_KEY = 'test-key'
    expect(isFirecrawlConfigured()).toBe(true)
  })

  it('fails gracefully instead of throwing when unconfigured', async () => {
    const result = await scrapeUrl('https://example.com')
    expect(result).toEqual({ ok: false, reason: 'not_configured', error: 'FIRECRAWL_API_KEY is not set' })
  })
})
