// ============================================================================
// API Client
// Typed wrappers around FineGuard API endpoints.
// ============================================================================

const BASE = '/api/fg';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as any).error ?? `Request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Types mirrored from server (no shared bundle needed) ────────────────────

export type DeadlineStatus = 'safe' | 'due_soon' | 'urgent' | 'overdue' | 'handled';
export type AlertType = 'confirmation_statement' | 'annual_accounts' | 'officer_change';
export type AlertStatus = 'pending' | 'acknowledged' | 'handled';

export interface CompanyCheckResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  incorporationDate: string | null;
  nextConfirmationStatementDue: string | null;
  nextAccountsDue: string | null;
  lastOfficerChangeAt: string | null;
  status: DeadlineStatus;
  statusLabel: string;
  statusReason: string;
  daysUntilNextDeadline: number | null;
  nextDeadlineType: AlertType | null;
  nextDeadlineDate: string | null;
  nextDeadlineLabel: string | null;
  registeredAddress: {
    line1: string | null;
    line2: string | null;
    locality: string | null;
    postalCode: string | null;
    country: string | null;
  };
  isMonitored: boolean;
  monitoringId: string | null;
  companyId: string;
}

export interface MonitoringData {
  company: {
    id: string;
    companyNumber: string;
    companyName: string;
    companyStatus: string;
    confirmationStatementDue: string | null;
    accountsDue: string | null;
  };
  monitoring: {
    id: string;
    monitoringEnabled: boolean;
    currentStatus: DeadlineStatus;
    nextDeadlineAt: string | null;
    lastCheckedAt: string | null;
    createdAt: string;
  } | null;
  alerts: AlertItem[];
  auditLog: AuditItem[];
}

export interface AlertItem {
  id: string;
  companyId: string;
  companyName?: string;
  companyNumber?: string;
  type: AlertType;
  status: AlertStatus;
  dueDate: string;
  triggeredAt: string;
  handledAt: string | null;
  thresholdDays: number;
  message: string;
  createdAt: string;
}

export interface AuditItem {
  id: string;
  companyId: string;
  eventType: string;
  eventSummary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface SearchResult {
  companyNumber: string;
  companyName: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  searchCompanies: (q: string) =>
    request<{ results: SearchResult[] }>(`/company/search?q=${encodeURIComponent(q)}`),

  getCompany: (number: string) =>
    request<CompanyCheckResult>(`/company/${encodeURIComponent(number)}`),

  startMonitoring: (companyId: string) =>
    request<{ ok: boolean; monitoring: any }>('/monitoring', {
      method: 'POST',
      body: JSON.stringify({ companyId }),
    }),

  stopMonitoring: (companyId: string) =>
    request<{ ok: boolean }>(`/monitoring/${companyId}`, { method: 'DELETE' }),

  getMonitoring: (companyId: string) =>
    request<MonitoringData>(`/monitoring/${companyId}`),

  getAllAlerts: () =>
    request<{ alerts: AlertItem[] }>('/alerts'),

  getCompanyAlerts: (companyId: string) =>
    request<{ alerts: AlertItem[] }>(`/alerts/${companyId}`),

  markAlertHandled: (alertId: string) =>
    request<{ ok: boolean; alert: AlertItem }>(`/alerts/${alertId}/handled`, {
      method: 'PATCH',
    }),

  getHistory: (companyId: string) =>
    request<MonitoringData>(`/history/${companyId}`),

  runSweep: () =>
    request<{ ok: boolean; companiesChecked: number; alertsCreated: number }>('/sweep', {
      method: 'POST',
    }),
};
