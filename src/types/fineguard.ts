// ============================================================================
// FineGuard Core Types
// Shared between frontend and server (via separate type declarations)
// ============================================================================

export type CompanyStatus = 'active' | 'dissolved' | 'liquidation' | 'administration' | 'unknown';

export type DeadlineStatus = 'safe' | 'due_soon' | 'urgent' | 'overdue' | 'handled';

export type AlertType =
  | 'confirmation_statement'
  | 'annual_accounts'
  | 'officer_change';

export type AlertStatus = 'pending' | 'acknowledged' | 'handled';

export type AuditEventType =
  | 'company_checked'
  | 'monitoring_started'
  | 'monitoring_stopped'
  | 'alert_created'
  | 'alert_handled'
  | 'status_updated'
  | 'sweep_run';

// ─── API Response Shapes ─────────────────────────────────────────────────────

export interface CompanyCheckResult {
  companyNumber: string;
  companyName: string;
  companyStatus: CompanyStatus;
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
  isMonitored: boolean;
  monitoringId: string | null;
}

export interface MonitoringSubscription {
  id: string;
  companyId: string;
  companyNumber: string;
  companyName: string;
  monitoringEnabled: boolean;
  nextDeadlineAt: string | null;
  currentStatus: DeadlineStatus;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  companyId: string;
  companyNumber: string;
  companyName: string;
  type: AlertType;
  status: AlertStatus;
  dueDate: string;
  triggeredAt: string;
  handledAt: string | null;
  message: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  companyId: string;
  eventType: AuditEventType;
  eventSummary: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CompanyHistory {
  company: {
    id: string;
    companyNumber: string;
    companyName: string;
    companyStatus: CompanyStatus;
  };
  monitoring: MonitoringSubscription | null;
  alerts: Alert[];
  auditLog: AuditEntry[];
}

// ─── Status Display Helpers ───────────────────────────────────────────────────

export const STATUS_LABELS: Record<DeadlineStatus, string> = {
  safe: 'No issues detected',
  due_soon: 'Due soon',
  urgent: 'Action needed now',
  overdue: 'Overdue',
  handled: 'Handled',
};

export const STATUS_COLORS: Record<DeadlineStatus, string> = {
  safe: 'green',
  due_soon: 'amber',
  urgent: 'red',
  overdue: 'red',
  handled: 'gray',
};

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  confirmation_statement: 'Confirmation statement',
  annual_accounts: 'Annual accounts',
  officer_change: 'Officer change',
};
