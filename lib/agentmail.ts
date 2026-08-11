// Service abstraction for AgentMail (see CLAUDE.md's AgentMail Integration
// Policy). Not wired into any route or UI yet — this only defines the shape
// callers will use once integration lands, and makes "not configured" a
// normal, non-throwing outcome so the app can ship and start with zero
// AgentMail setup.

export function isAgentMailConfigured(): boolean {
  return typeof process.env.AGENTMAIL_API_KEY === 'string' && process.env.AGENTMAIL_API_KEY.length > 0
}

export type AgentMailResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: 'not_configured' | 'unavailable'; error: string }

// Placeholder for the real client once integration begins. Never throws on
// a missing key — callers check `ok` and fall back (e.g. to Resend, or to
// telling the user email isn't set up) instead of the app failing to start.
export async function draftEmail(_input: {
  person: string
  contact: string
  context: string
}): Promise<AgentMailResult<{ draft: string }>> {
  if (!isAgentMailConfigured()) {
    return { ok: false, reason: 'not_configured', error: 'AGENTMAIL_API_KEY is not set' }
  }
  return { ok: false, reason: 'unavailable', error: 'AgentMail integration not yet implemented' }
}
