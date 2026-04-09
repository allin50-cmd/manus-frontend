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
import { monitoredCompanies } from './monitored-companies';

export const obligationTypeEnum = pgEnum('obligation_type', [
  'accounts_filing',
  'confirmation_statement',
]);

export const obligationStatusEnum = pgEnum('obligation_status', [
  'pending',
  'monitoring',
  'due_soon',
  'urgent',
  'overdue',
  'resolved',
  'paused',
  'failed',
]);

export const complianceObligations = pgTable(
  'compliance_obligations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    monitoredCompanyId: uuid('monitored_company_id')
      .notNull()
      .references(() => monitoredCompanies.id),
    obligationType: obligationTypeEnum('obligation_type').notNull(),
    status: obligationStatusEnum('status').notNull().default('pending'),
    dueDate: date('due_date'),
    nextActionAt: timestamp('next_action_at'),
    workflowId: varchar('workflow_id', { length: 255 }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    idxTenantId: index('co_tenant_id_idx').on(table.tenantId),
    idxMonitoredCompanyId: index('co_monitored_company_id_idx').on(
      table.monitoredCompanyId,
    ),
    idxDueDate: index('co_due_date_idx').on(table.dueDate),
    idxWorkflowId: index('co_workflow_id_idx').on(table.workflowId),
  }),
);

export type ComplianceObligation = typeof complianceObligations.$inferSelect;
export type NewComplianceObligation =
  typeof complianceObligations.$inferInsert;
