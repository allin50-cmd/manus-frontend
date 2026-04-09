import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { monitoredCompanies } from '../db/schema';
import type { MonitoredCompany } from '../db/schema';

export interface InsertMonitoredCompanyInput {
  tenantId: string;
  companyNumber: string;
  companyName: string;
  stripeSessionId?: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export async function insertMonitoredCompany(
  data: InsertMonitoredCompanyInput,
): Promise<{ id: string }> {
  const [row] = await db
    .insert(monitoredCompanies)
    .values({
      tenantId: data.tenantId,
      companyNumber: data.companyNumber,
      companyName: data.companyName,
      stripeSessionId: data.stripeSessionId,
      stripeSubscriptionId: data.stripeSubscriptionId,
      stripeCustomerId: data.stripeCustomerId,
    })
    .returning({ id: monitoredCompanies.id });

  if (!row) {
    throw new Error('Failed to insert monitored company');
  }
  return { id: row.id };
}

export async function findCompanyById(
  id: string,
): Promise<MonitoredCompany | null> {
  const [row] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.id, id))
    .limit(1);

  return row ?? null;
}

export async function findCompanyByNumber(
  tenantId: string,
  companyNumber: string,
): Promise<MonitoredCompany | null> {
  const [row] = await db
    .select()
    .from(monitoredCompanies)
    .where(
      and(
        eq(monitoredCompanies.tenantId, tenantId),
        eq(monitoredCompanies.companyNumber, companyNumber),
      ),
    )
    .limit(1);

  return row ?? null;
}
