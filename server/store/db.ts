// ============================================================================
// PostgreSQL Store (Production)
// Uses Drizzle ORM via the existing db connection.
// ============================================================================

import { randomUUID } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import {
  fgCompanies,
  fgMonitoring,
  fgAlerts,
  fgAuditLog,
} from '../db/fineguard-schema.js';
import {
  FineGuardStore,
  Company,
  MonitoringSubscription,
  Alert,
  AlertType,
  AuditEntry,
} from './types.js';

export class DbStore implements FineGuardStore {
  // ─── Companies ──────────────────────────────────────────────────────────────

  async upsertCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
    const existing = await db
      .select()
      .from(fgCompanies)
      .where(eq(fgCompanies.companyNumber, data.companyNumber))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(fgCompanies)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fgCompanies.id, existing[0].id))
        .returning();
      return rowToCompany(updated);
    }

    const [inserted] = await db
      .insert(fgCompanies)
      .values({ id: randomUUID(), ...data })
      .returning();
    return rowToCompany(inserted);
  }

  async getCompanyByNumber(companyNumber: string): Promise<Company | null> {
    const rows = await db
      .select()
      .from(fgCompanies)
      .where(eq(fgCompanies.companyNumber, companyNumber))
      .limit(1);
    return rows[0] ? rowToCompany(rows[0]) : null;
  }

  async getCompanyById(id: string): Promise<Company | null> {
    const rows = await db
      .select()
      .from(fgCompanies)
      .where(eq(fgCompanies.id, id))
      .limit(1);
    return rows[0] ? rowToCompany(rows[0]) : null;
  }

  async getAllMonitoredCompanies(): Promise<Company[]> {
    const subs = await db
      .select()
      .from(fgMonitoring)
      .where(eq(fgMonitoring.monitoringEnabled, true));

    if (subs.length === 0) return [];

    const companies = await Promise.all(
      subs.map((s) =>
        db.select().from(fgCompanies).where(eq(fgCompanies.id, s.companyId)).limit(1),
      ),
    );

    return companies.flat().map(rowToCompany);
  }

  // ─── Monitoring ─────────────────────────────────────────────────────────────

  async createOrUpdateMonitoring(
    companyId: string,
    data: Partial<Omit<MonitoringSubscription, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<MonitoringSubscription> {
    const existing = await db
      .select()
      .from(fgMonitoring)
      .where(eq(fgMonitoring.companyId, companyId))
      .limit(1);

    if (existing[0]) {
      const [updated] = await db
        .update(fgMonitoring)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(fgMonitoring.companyId, companyId))
        .returning();
      return rowToMonitoring(updated);
    }

    const [inserted] = await db
      .insert(fgMonitoring)
      .values({
        id: randomUUID(),
        companyId,
        monitoringEnabled: true,
        currentStatus: 'safe',
        ...data,
      })
      .returning();
    return rowToMonitoring(inserted);
  }

  async getMonitoring(companyId: string): Promise<MonitoringSubscription | null> {
    const rows = await db
      .select()
      .from(fgMonitoring)
      .where(eq(fgMonitoring.companyId, companyId))
      .limit(1);
    return rows[0] ? rowToMonitoring(rows[0]) : null;
  }

  // ─── Alerts ─────────────────────────────────────────────────────────────────

  async createAlert(data: Omit<Alert, 'id' | 'createdAt'>): Promise<Alert> {
    const [inserted] = await db
      .insert(fgAlerts)
      .values({ id: randomUUID(), ...data })
      .returning();
    return rowToAlert(inserted);
  }

  async getAlertsByCompany(companyId: string): Promise<Alert[]> {
    const rows = await db
      .select()
      .from(fgAlerts)
      .where(eq(fgAlerts.companyId, companyId));
    return rows.map(rowToAlert).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async getAlertById(id: string): Promise<Alert | null> {
    const rows = await db.select().from(fgAlerts).where(eq(fgAlerts.id, id)).limit(1);
    return rows[0] ? rowToAlert(rows[0]) : null;
  }

  async markAlertHandled(id: string): Promise<Alert | null> {
    const [updated] = await db
      .update(fgAlerts)
      .set({ status: 'handled', handledAt: new Date() })
      .where(eq(fgAlerts.id, id))
      .returning();
    return updated ? rowToAlert(updated) : null;
  }

  async alertExistsForThreshold(
    companyId: string,
    type: AlertType,
    thresholdDays: number,
    dueDate: string,
  ): Promise<boolean> {
    const rows = await db
      .select()
      .from(fgAlerts)
      .where(
        and(
          eq(fgAlerts.companyId, companyId),
          eq(fgAlerts.type, type),
          eq(fgAlerts.thresholdDays, thresholdDays),
          eq(fgAlerts.dueDate, dueDate),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  async getPendingAlerts(): Promise<Alert[]> {
    const rows = await db
      .select()
      .from(fgAlerts)
      .where(eq(fgAlerts.status, 'pending'));
    return rows.map(rowToAlert).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }

  // ─── Audit ───────────────────────────────────────────────────────────────────

  async createAuditEntry(data: Omit<AuditEntry, 'id' | 'createdAt'>): Promise<AuditEntry> {
    const [inserted] = await db
      .insert(fgAuditLog)
      .values({ id: randomUUID(), ...data })
      .returning();
    return rowToAudit(inserted);
  }

  async getAuditByCompany(companyId: string): Promise<AuditEntry[]> {
    const rows = await db
      .select()
      .from(fgAuditLog)
      .where(eq(fgAuditLog.companyId, companyId));
    return rows.map(rowToAudit).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// ─── Row Mappers ──────────────────────────────────────────────────────────────

function rowToCompany(row: any): Company {
  return {
    id: row.id,
    companyNumber: row.companyNumber,
    companyName: row.companyName,
    companyStatus: row.companyStatus,
    incorporationDate: row.incorporationDate,
    confirmationStatementDue: row.confirmationStatementDue,
    accountsDue: row.accountsDue,
    lastOfficerChangeAt: row.lastOfficerChangeAt,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

function rowToMonitoring(row: any): MonitoringSubscription {
  return {
    id: row.id,
    companyId: row.companyId,
    monitoringEnabled: row.monitoringEnabled,
    nextDeadlineAt: row.nextDeadlineAt,
    currentStatus: row.currentStatus,
    lastCheckedAt: row.lastCheckedAt instanceof Date ? row.lastCheckedAt.toISOString() : row.lastCheckedAt,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

function rowToAlert(row: any): Alert {
  return {
    id: row.id,
    companyId: row.companyId,
    type: row.type,
    status: row.status,
    dueDate: row.dueDate,
    triggeredAt: row.triggeredAt instanceof Date ? row.triggeredAt.toISOString() : row.triggeredAt,
    handledAt: row.handledAt instanceof Date ? row.handledAt.toISOString() : row.handledAt,
    thresholdDays: row.thresholdDays,
    message: row.message,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

function rowToAudit(row: any): AuditEntry {
  return {
    id: row.id,
    companyId: row.companyId,
    eventType: row.eventType,
    eventSummary: row.eventSummary,
    metadataJson: row.metadataJson,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}
