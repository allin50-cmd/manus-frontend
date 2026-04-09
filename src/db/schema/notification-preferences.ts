import {
  pgTable,
  uuid,
  boolean,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const notificationPreferences = pgTable(
  'notification_preferences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    emailEnabled: boolean('email_enabled').notNull().default(true),
    smsEnabled: boolean('sms_enabled').notNull().default(false),
    leadDaysLow: integer('lead_days_low').notNull().default(30),
    leadDaysMedium: integer('lead_days_medium').notNull().default(14),
    leadDaysUrgent: integer('lead_days_urgent').notNull().default(7),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqTenantId: uniqueIndex('np_tenant_id_uniq').on(table.tenantId),
  }),
);

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreference =
  typeof notificationPreferences.$inferInsert;
