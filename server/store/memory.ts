// ============================================================================
// In-Memory Store
// Zero-dependency store for local development without a database.
// Data is lost on restart — swap for DbStore in production.
// ============================================================================

import { randomUUID } from 'crypto';
import {
  FineGuardStore,
  Company,
  MonitoringSubscription,
  Alert,
  AlertType,
  AuditEntry,
  DeadlineStatus,
} from './types.js';

export class MemoryStore implements FineGuardStore {
  private companies = new Map<string, Company>();
  private monitoring = new Map<string, MonitoringSubscription>(); // keyed by companyId
  private alerts = new Map<string, Alert>();
  private auditLog = new Map<string, AuditEntry>();

  // ─── Companies ──────────────────────────────────────────────────────────────

  async upsertCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const existing = [...this.companies.values()].find(
      (c) => c.companyNumber === data.companyNumber,
    );

    const now = new Date().toISOString();

    if (existing) {
      const updated: Company = { ...existing, ...data, updatedAt: now };
      this.companies.set(existing.id, updated);
      return updated;
    }

    const company: Company = {
      id: randomUUID(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.companies.set(company.id, company);
    return company;
  }

  async getCompanyByNumber(companyNumber: string): Promise<Company | null> {
    return (
      [...this.companies.values()].find((c) => c.companyNumber === companyNumber) ?? null
    );
  }

  async getCompanyById(id: string): Promise<Company | null> {
    return this.companies.get(id) ?? null;
  }

  async getAllMonitoredCompanies(): Promise<Company[]> {
    const monitoredIds = [...this.monitoring.values()]
      .filter((m) => m.monitoringEnabled)
      .map((m) => m.companyId);

    return monitoredIds
      .map((id) => this.companies.get(id))
      .filter((c): c is Company => c !== undefined);
  }

  // ─── Monitoring ─────────────────────────────────────────────────────────────

  async createOrUpdateMonitoring(
    companyId: string,
    data: Partial<Omit<MonitoringSubscription, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MonitoringSubscription> {
    const now = new Date().toISOString();
    const existing = this.monitoring.get(companyId);

    if (existing) {
      const updated: MonitoringSubscription = { ...existing, ...data, updatedAt: now };
      this.monitoring.set(companyId, updated);
      return updated;
    }

    const sub: MonitoringSubscription = {
      id: randomUUID(),
      companyId,
      monitoringEnabled: true,
      nextDeadlineAt: null,
      currentStatus: 'safe' as DeadlineStatus,
      lastCheckedAt: null,
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    this.monitoring.set(companyId, sub);
    return sub;
  }

  async getMonitoring(companyId: string): Promise<MonitoringSubscription | null> {
    return this.monitoring.get(companyId) ?? null;
  }

  // ─── Alerts ─────────────────────────────────────────────────────────────────

  async createAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const now = new Date().toISOString();
    const alert: Alert = { id: randomUUID(), ...data, createdAt: now };
    this.alerts.set(alert.id, alert);
    return alert;
  }

  async getAlertsByCompany(companyId: string): Promise<Alert[]> {
    return [...this.alerts.values()]
      .filter((a) => a.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAlertById(id: string): Promise<Alert | null> {
    return this.alerts.get(id) ?? null;
  }

  async markAlertHandled(id: string): Promise<Alert | null> {
    const alert = this.alerts.get(id);
    if (!alert) return null;
    const updated: Alert = {
      ...alert,
      status: 'handled',
      handledAt: new Date().toISOString(),
    };
    this.alerts.set(id, updated);
    return updated;
  }

  async alertExistsForThreshold(
    companyId: string,
    type: AlertType,
    thresholdDays: number,
    dueDate: string,
  ): Promise<boolean> {
    return [...this.alerts.values()].some(
      (a) =>
        a.companyId === companyId &&
        a.type === type &&
        a.thresholdDays === thresholdDays &&
        a.dueDate === dueDate,
    );
  }

  async getPendingAlerts(): Promise<Alert[]> {
    return [...this.alerts.values()]
      .filter((a) => a.status === 'pending')
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  // ─── Audit ───────────────────────────────────────────────────────────────────

  async createAuditEntry(data: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry> {
    const now = new Date().toISOString();
    const entry: AuditEntry = { id: randomUUID(), ...data, createdAt: now };
    this.auditLog.set(entry.id, entry);
    return entry;
  }

  async getAuditByCompany(companyId: string): Promise<AuditEntry[]> {
    return [...this.auditLog.values()]
      .filter((e) => e.companyId === companyId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
