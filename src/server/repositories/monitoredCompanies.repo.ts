import { db } from '../db';
import { monitoredCompanies, complianceAlerts } from '../db/schema';
import { eq, and, inArray, isNull, lte, or, sql } from 'drizzle-orm';
import type { AlertType } from '@/types/alerts';
import type { BillingStatus } from '@/types/stripe';

// ── Billing state machine ─────────────────────────────────────────────────────

/** Which statuses can transition into each target status */
const ALLOWED_FROM: Record<BillingStatus, BillingStatus[]> = {
  inactive:  [],                                   // set only at row creation
  pending:   ['inactive'],
  active:    ['inactive', 'pending', 'past_due', 'cancelled'],
  past_due:  ['active'],
  cancelled: ['active', 'past_due', 'pending'],
};

/**
 * Atomic conditional UPDATE: only transitions if billing_status is one of the
 * allowed predecessor states.  Returns true if the row was updated, false if
 * the transition was rejected (invalid state, out-of-order event, or company not found).
 *
 * Pass eventCreatedAt (Stripe event.created as Date) to enable ordering guard:
 * the update is rejected if an event with a higher timestamp was already processed.
 * This prevents a delayed invoice.payment_failed from overwriting a later checkout.
 */
export async function transitionBillingStatus(
  companyNumber: string,
  toStatus: BillingStatus,
  options?: { eventCreatedAt?: Date },
): Promise<boolean> {
  const allowed = ALLOWED_FROM[toStatus];
  if (allowed.length === 0) return false;

  const now = new Date();
  const eventTs = options?.eventCreatedAt;

  const result = await db
    .update(monitoredCompanies)
    .set({
      billingStatus: toStatus,
      billingStatusUpdatedAt: now,
      ...(eventTs ? { lastStripeEventAt: eventTs } : {}),
    })
    .where(
      and(
        eq(monitoredCompanies.companyNumber, companyNumber),
        inArray(monitoredCompanies.billingStatus, allowed),
        // Ordering guard: skip if a newer event was already applied
        ...(eventTs
          ? [or(isNull(monitoredCompanies.lastStripeEventAt), lte(monitoredCompanies.lastStripeEventAt, eventTs))]
          : []),
      ),
    )
    .returning({ id: monitoredCompanies.id });

  return result.length > 0;
}

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
  lastCheckoutSessionId?: string;
  billingStatus?: BillingStatus;
}) {
  const billingStatus = data.billingStatus ?? 'inactive';
  await db
    .insert(monitoredCompanies)
    .values({ ...data, billingStatus })
    .onConflictDoUpdate({
      target: monitoredCompanies.companyNumber,
      set: {
        stripeSessionId: data.stripeSessionId,
        stripeSubscriptionId: data.stripeSubscriptionId,
        stripeCustomerId: data.stripeCustomerId,
        lastCheckoutSessionId: data.lastCheckoutSessionId ?? data.stripeSessionId,
        billingStatus,
        billingStatusUpdatedAt: new Date(),
      },
    });
}

export async function updateBillingStatus(
  companyNumber: string,
  billingStatus: BillingStatus,
): Promise<void> {
  await db
    .update(monitoredCompanies)
    .set({ billingStatus })
    .where(eq(monitoredCompanies.companyNumber, companyNumber));
}

export async function findByStripeCustomerId(
  stripeCustomerId: string,
) {
  const [row] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return row ?? null;
}

/**
 * Update stripeSubscriptionId when a plan upgrade replaces the subscription object.
 * No-op if the stored value already matches.
 */
export async function updateSubscriptionId(
  companyNumber: string,
  stripeSubscriptionId: string,
): Promise<void> {
  await db
    .update(monitoredCompanies)
    .set({ stripeSubscriptionId })
    .where(
      and(
        eq(monitoredCompanies.companyNumber, companyNumber),
        // Only write if different — avoids unnecessary WAL churn
        sql`stripe_subscription_id IS DISTINCT FROM ${stripeSubscriptionId}`,
      ),
    );
}

export async function findByStripeSubscriptionId(
  stripeSubscriptionId: string,
) {
  const [row] = await db
    .select()
    .from(monitoredCompanies)
    .where(eq(monitoredCompanies.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return row ?? null;
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
