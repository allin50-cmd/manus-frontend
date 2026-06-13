import { getStoredSession, storeSession, clearSession } from './auth'

const BASE = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '')

async function request<T>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean },
): Promise<T> {
  const session = options?.skipAuth ? null : await getStoredSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (session) {
    headers['Cookie'] = `session=${session}`
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    await clearSession()
    throw new AuthError()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Request failed')
  }

  return res.json() as Promise<T>
}

export class AuthError extends Error {
  constructor() { super('Unauthenticated') }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function login(passcode: string): Promise<{ person: string }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ passcode }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body?.error ?? 'Login failed')
  }

  // Extract session cookie
  const setCookie = res.headers.get('set-cookie') ?? ''
  const match = setCookie.match(/session=([^;]+)/)
  if (!match) throw new ApiError(500, 'No session cookie in response')

  const data = await res.json()
  await storeSession(match[1], data.person ?? 'user')
  return { person: data.person ?? 'user' }
}

export async function logout() {
  await fetch(`${BASE}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: `session=${await getStoredSession()}` },
  }).catch(() => {})
  await clearSession()
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

export type DashboardData = {
  compliance: { compliant: number; atRisk: number; actionRequired: number; overdue: number; total: number }
  metrics: { openActions: number; decisionNeeded: number; alertDeliveries: number; completedThisWeek: number }
  priorityItems: Array<{ id: string; title: string; company: string | null; priority: string; dueDate: string | null }>
  teamPulse: Array<{ owner: string; count: number }>
}

export function getDashboard(): Promise<DashboardData> {
  return request('/api/dashboard')
}

// ── Filings (Work Items) ──────────────────────────────────────────────────────

export type WorkItem = {
  id: string
  title: string
  company: string | null
  type: string
  status: string
  priority: string
  dueDate: string | null
  owner: string
  notes: string | null
}

export function getFilings(): Promise<WorkItem[]> {
  return request('/api/work-items?limit=200')
}

export function getWorkItem(id: string): Promise<WorkItem> {
  return request(`/api/work-items/${id}`)
}

// ── Portfolio ─────────────────────────────────────────────────────────────────

export type PortfolioCompany = {
  id: string
  name: string
  contacts: number
  workItems: number
  overdue: number
}

export function getPortfolio(): Promise<PortfolioCompany[]> {
  return request('/api/portfolio')
}

// ── Decisions ─────────────────────────────────────────────────────────────────

export type Decision = {
  id: string
  question: string
  options: string | null
  recommendation: string | null
  decisionBy: string
  dueDate: string | null
  status: string
  workItem: { id: string; title: string; company: string | null }
}

export function getDecisions(): Promise<Decision[]> {
  return request('/api/decisions')
}

export function resolveDecision(id: string, decision: string): Promise<void> {
  return request(`/api/decisions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, status: 'Approved' }),
  })
}

// ── Alert Deliveries ──────────────────────────────────────────────────────────

export type AlertDelivery = {
  id: string
  status: string
  channel: string
  createdAt: string
  sentAt: string | null
  workItem: { id: string; title: string; company: string | null; priority: string }
  recipient: { name: string; role: string } | null
}

export function getAlerts(): Promise<AlertDelivery[]> {
  return request('/api/alert-deliveries?limit=50')
}
