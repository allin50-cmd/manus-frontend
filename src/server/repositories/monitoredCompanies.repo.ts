import { db } from '../db';
import { monitoredCompanies } from '../db/schema';
import { eq } from 'drizzle-orm';

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
