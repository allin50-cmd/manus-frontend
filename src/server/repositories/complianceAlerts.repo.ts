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
  for (const alertType of alertTypes) {
    await insertAlert({ companyNumber, alertType, stripeSubscriptionId });
  }
}
