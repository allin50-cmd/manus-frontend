export type AppHealthResult = { status: 'ok' | 'error' | 'unknown'; reason?: string }

export async function checkAppHealth(healthUrl: string | null, timeoutMs = 4000): Promise<AppHealthResult> {
  if (!healthUrl) return { status: 'unknown', reason: 'No health endpoint registered' }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(healthUrl, { signal: controller.signal, cache: 'no-store' })
    clearTimeout(timeout)

    if (!res.ok) return { status: 'error', reason: `HTTP ${res.status}` }

    const body = await res.json().catch(() => ({}))
    return { status: body.status === 'ok' ? 'ok' : 'error' }
  } catch {
    return { status: 'error', reason: 'Health check timed out or unreachable' }
  }
}
