import {
  pgTable,
  uuid,
  integer,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { obligationTypeEnum } from './compliance-obligations';

export const escalationPolicies = pgTable(
  'escalation_policies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    obligationType: obligationTypeEnum('obligation_type').notNull(),
    overdueAlertIntervalHours: integer('overdue_alert_interval_hours')
      .notNull()
      .default(24),
    maxOverdueAlerts: integer('max_overdue_alerts').notNull().default(14),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    uniqTenantObligationType: uniqueIndex('ep_tenant_obligation_type_uniq').on(
      table.tenantId,
      table.obligationType,
    ),
  }),
);

export type EscalationPolicy = typeof escalationPolicies.$inferSelect;
export type NewEscalationPolicy = typeof escalationPolicies.$inferInsert;
