// ============================================================================
// FineGuard Store Interface
// Abstraction over storage so we can run with in-memory (dev) or PostgreSQL (prod)
// ============================================================================

export type CompanyStatus = 'active' | 'dissolved' | 'liquidation' | 'administration' | 'unknown';
export type DeadlineStatus = 'safe' | 'due_soon' | 'urgent' | 'overdue' | 'handled';
export type AlertType = 'confirmation_statement' | 'annual_accounts' | 'officer_change';
export type AlertStatus = 'pending' | 'acknowledged' | 'handled';
export type AuditEventType =
  | 'company_checked'
  | 'monitoring_started'
  | 'monitoring_stopped'
  | 'alert_created'
  | 'alert_handled'
  | 'status_updated'
  | 'sweep_run';

export interface Company {
  id: string;
  companyNumber: string;
  companyName: string;
  companyStatus: CompanyStatus;
  incorporationDate: string | null;
  confirmationStatementDue: string | null;
  accountsDue: string | null;
  lastOfficerChangeAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringSubscription {
  id: string;
  companyId: string;
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
  type: AlertType;
  status: AlertStatus;
  dueDate: string;
  triggeredAt: string;
  handledAt: string | null;
  thresholdDays: number;
  message: string;
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  companyId: string;
  eventType: AuditEventType;
  eventSummary: string;
  metadataJson: string;
  createdAt: string;
}

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface FineGuardStore {
  // Companies
  upsertCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company>;
  getCompanyByNumber(companyNumber: string): Promise<Company | null>;
  getCompanyById(id: string): Promise<Company | null>;
  getAllMonitoredCompanies(): Promise<Company[]>;

  // Monitoring
  createOrUpdateMonitoring(
    companyId: string,
    data: Partial<Omit<MonitoringSubscription, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MonitoringSubscription>;
  getMonitoring(companyId: string): Promise<MonitoringSubscription | null>;

  // Alerts
  createAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert>;
  getAlertsByCompany(companyId: string): Promise<Alert[]>;
  getAlertById(id: string): Promise<Alert | null>;
  markAlertHandled(id: string): Promise<Alert | null>;
  alertExistsForThreshold(
    companyId: string,
    type: AlertType,
    thresholdDays: number,
    dueDate: string,
  ): Promise<boolean>;
  getPendingAlerts(): Promise<Alert[]>;

  // Audit
  createAuditEntry(data: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry>;
  getAuditByCompany(companyId: string): Promise<AuditEntry[]>;
}
