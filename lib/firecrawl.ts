// Service abstraction for Firecrawl. Not wired into any route or UI yet, and
// not covered by any existing CLAUDE.md policy — treat this as scaffolding
// only, pending explicit product approval (see "Before Adding
// Infrastructure" in CLAUDE.md) before real integration begins. Mirrors
// lib/agentmail.ts's shape: missing config is a normal, non-throwing result.

export function isFirecrawlConfigured(): boolean {
  return typeof process.env.FIRECRAWL_API_KEY === 'string' && process.env.FIRECRAWL_API_KEY.length > 0
}

export type FirecrawlResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'not_configured' | 'unavailable'; error: string }

export async function scrapeUrl(_url: string): Promise<FirecrawlResult<{ content: string }>> {
  if (!isFirecrawlConfigured()) {
    return { ok: false, reason: 'not_configured', error: 'FIRECRAWL_API_KEY is not set' }
  }
  return { ok: false, reason: 'unavailable', error: 'Firecrawl integration not yet implemented' }
}
