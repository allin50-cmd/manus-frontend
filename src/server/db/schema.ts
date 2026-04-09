import { pgTable, pgEnum, uuid, varchar, timestamp, text, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const billingStatusEnum = pgEnum('billing_status', [
  'inactive',
  'pending',
  'active',
  'past_due',
  'cancelled',
]);

export const deploymentStatus = pgTable('deployment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: varchar('environment', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  commit: varchar('commit', { length: 50 }).notNull(),
  workflowRun: varchar('workflow_run', { length: 50 }).notNull(),
  deployedAt: timestamp('deployed_at').defaultNow().notNull(),
});

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: varchar('lead_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  product: varchar('product', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const intakeForms = pgTable('intake_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  matterRef: varchar('matter_ref', { length: 50 }).notNull().unique(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  clientPhone: varchar('client_phone', { length: 50 }),
  matterType: varchar('matter_type', { length: 100 }).notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull(),
  description: text('description'),
  claimValue: varchar('claim_value', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const complianceBundles = pgTable('compliance_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  bundleId: varchar('bundle_id', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  requestorName: varchar('requestor_name', { length: 255 }),
  requestorEmail: varchar('requestor_email', { length: 255 }),
  bundleType: varchar('bundle_type', { length: 50 }).default('full'),
  estimatedTime: varchar('estimated_time', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const monitoredCompanies = pgTable(
  'monitored_companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    billingStatus: billingStatusEnum('billing_status').notNull().default('inactive'),
    billingStatusUpdatedAt: timestamp('billing_status_updated_at'),
    lastCheckoutSessionId: varchar('last_checkout_session_id', { length: 255 }),
    activatedAt: timestamp('activated_at').defaultNow().notNull(),
  },
  (t) => ({
    stripeCustomerIdx: index('mc_stripe_customer_idx').on(t.stripeCustomerId),
    stripeSubscriptionIdx: index('mc_stripe_subscription_idx').on(t.stripeSubscriptionId),
  }),
);

export const complianceAlerts = pgTable(
  'compliance_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyNumber: varchar('company_number', { length: 50 }).notNull(),
    alertType: varchar('alert_type', { length: 50 }).notNull(), // accounts_filing | confirmation_statement | strike_off
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripeItemId: varchar('stripe_item_id', { length: 255 }),
    status: varchar('status', { length: 20 }).default('active').notNull(), // active | cancelled
    cancelledReason: varchar('cancelled_reason', { length: 50 }), // billing_cancelled | manual | null
    activatedAt: timestamp('activated_at').defaultNow().notNull(),
  },
  (t) => ({
    companyAlertUniq: uniqueIndex('alerts_company_alert_uniq').on(t.companyNumber, t.alertType),
    companyNumberIdx: index('alerts_company_number_idx').on(t.companyNumber),
    statusIdx: index('alerts_status_idx').on(t.status),
  }),
);

export const stripeEventStatusEnum = pgEnum('stripe_event_status', [
  'processing',
  'processed',
  'failed',
]);

export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    eventId: varchar('event_id', { length: 255 }).notNull(), // Stripe event ID — idempotency key
    type: varchar('type', { length: 100 }).notNull(),
    status: stripeEventStatusEnum('status').notNull().default('processing'),
    failureReason: varchar('failure_reason', { length: 500 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    processedAt: timestamp('processed_at'),
  },
  (t) => ({
    // Partial unique index: only one active (processing|processed) record per event ID
    // Failed events can be retried (their status is updated back to processing)
    activeEventUniq: uniqueIndex('swe_active_event_uniq')
      .on(t.eventId)
      .where(sql`status IN ('processing', 'processed')`),
  }),
);

export const zapierHooks = pgTable(
  'zapier_hooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    url: text('url').notNull(),
    event: varchar('event', { length: 100 }).notNull(), // company.activated | compliance.alert
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    eventIdx: index('zapier_hooks_event_idx').on(t.event),
  }),
);

export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;
export type ComplianceAlert = typeof complianceAlerts.$inferSelect;
export type NewComplianceAlert = typeof complianceAlerts.$inferInsert;
export type ZapierHook = typeof zapierHooks.$inferSelect;
export type NewZapierHook = typeof zapierHooks.$inferInsert;
export type StripeWebhookEvent = typeof stripeWebhookEvents.$inferSelect;
export type NewStripeWebhookEvent = typeof stripeWebhookEvents.$inferInsert;
