import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  date,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { complianceObligations } from './compliance-obligations';

export const alertUrgencyEnum = pgEnum('alert_urgency', [
  'low',
  'medium',
  'urgent',
]);

export const alertChannelEnum = pgEnum('alert_channel', [
  'email',
  'sms',
  'dashboard',
]);

export const alertStatusEnum = pgEnum('alert_status', [
  'queued',
  'sent',
  'failed',
  'deduplicated',
]);

export const alerts = pgTable(
  'alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    obligationId: uuid('obligation_id')
      .notNull()
      .references(() => complianceObligations.id),
    urgency: alertUrgencyEnum('urgency').notNull(),
    channel: alertChannelEnum('channel').notNull(),
    status: alertStatusEnum('status').notNull().default('queued'),
    dedupeKey: varchar('dedupe_key', { length: 500 }).notNull().unique(),
    dueDate: date('due_date').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sentAt: timestamp('sent_at'),
  },
  (table) => ({
    idxObligationId: index('alert_obligation_id_idx').on(table.obligationId),
    idxTenantId: index('alert_tenant_id_idx').on(table.tenantId),
    idxDedupeKey: index('alert_dedupe_key_idx').on(table.dedupeKey),
  }),
);

export type AlertRecord = typeof alerts.$inferSelect;
export type NewAlertRecord = typeof alerts.$inferInsert;
