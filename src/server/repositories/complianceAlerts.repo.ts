import { db } from '../db';
import { complianceAlerts } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export async function findByCompany(companyNumber: string) {
  return db
    .select()
    .from(complianceAlerts)
    .where(
      and(
        eq(complianceAlerts.companyNumber, companyNumber),
        eq(complianceAlerts.status, 'active')
      )
    );
}

export async function insertAlert(data: {
  companyNumber: string;
  alertType: string;
  stripeSubscriptionId?: string;
  stripeItemId?: string;
}) {
  await db
    .insert(complianceAlerts)
    .values({ ...data, status: 'active' })
    .onConflictDoNothing();
}

export async function insertAlerts(
  companyNumber: string,
  alertTypes: string[],
  stripeSubscriptionId?: string
) {
  if (alertTypes.length === 0) return;
  // Single multi-row INSERT instead of N sequential round-trips
  await db
    .insert(complianceAlerts)
    .values(alertTypes.map((alertType) => ({ companyNumber, alertType, stripeSubscriptionId, status: 'active' })))
    .onConflictDoNothing();
}

export async function deactivateAlertsForCompany(companyNumber: string): Promise<void> {
  await db
    .update(complianceAlerts)
    .set({ status: 'cancelled' })
    .where(eq(complianceAlerts.companyNumber, companyNumber));
}

export async function reactivateAlertsForCompany(companyNumber: string): Promise<void> {
  await db
    .update(complianceAlerts)
    .set({ status: 'active' })
    .where(
      and(
        eq(complianceAlerts.companyNumber, companyNumber),
        eq(complianceAlerts.status, 'cancelled'),
      ),
    );
}
