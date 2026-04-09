// Extended by 0001_temporal_core.sql — tenant_id added additively
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const monitoredCompanies = pgTable(
  'monitored_companies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    // Nullable for migration compatibility — existing rows have no tenant_id yet
    tenantId: uuid('tenant_id').references(() => tenants.id),
    companyNumber: varchar('company_number', { length: 50 }).notNull(),
    companyName: varchar('company_name', { length: 255 }).notNull(),
    stripeSessionId: varchar('stripe_session_id', { length: 255 }),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    activatedAt: timestamp('activated_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    mcTenantCompanyUniq: uniqueIndex('mc_tenant_company_uniq').on(
      table.tenantId,
      table.companyNumber,
    ),
  }),
);

export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;
