import { db } from '../db';
import { monitoredCompanies, complianceAlerts } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { AlertType } from '@/types/alerts';

export interface CompanyWithAlerts {
  id: string;
  companyNumber: string;
  companyName: string;
  stripeSessionId: string;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  activatedAt: Date;
  activeAlerts: AlertType[];
}

export async function findByCompanyNumber(companyNumber: string) {
  const [row] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.companyNumber, companyNumber))
    .limit(1);
  return row ?? null;
}

export async function upsertMonitoredCompany(data: {
  companyNumber: string;
  companyName: string;
  stripeSessionId: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}) {
  await db
    .insert(monitoredCompanies)
    .values(data)
    .onConflictDoUpdate({
      target: monitoredCompanies.companyNumber,
      set: {
        stripeSessionId: data.stripeSessionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
      },
    });
}

export async function listAll() {
  return db.select().from(monitoredCompanies);
}

/**
 * Single LEFT JOIN query — replaces the N+1 pattern of listAll() + getAlertsForCompany() per row.
 * Returns companies with their active alerts embedded, in one round-trip.
 */
export async function listAllWithAlerts(): Promise<CompanyWithAlerts[]> {
  const rows = await db
    .select({
      company: monitoredCompanies,
      alertType: complianceAlerts.alertType,
      alertStatus: complianceAlerts.status,
    })
    .from(monitoredCompanies)
    .leftJoin(
      complianceAlerts,
      eq(complianceAlerts.companyNumber, monitoredCompanies.companyNumber),
    );

  const map = new Map<string, CompanyWithAlerts>();
  for (const row of rows) {
    if (!map.has(row.company.id)) {
      map.set(row.company.id, { ...row.company, activeAlerts: [] });
    }
    if (row.alertType && row.alertStatus === 'active') {
      map.get(row.company.id)!.activeAlerts.push(row.alertType as AlertType);
    }
  }
  return Array.from(map.values());
}
