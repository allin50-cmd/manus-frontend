import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';
import { complianceObligations } from './compliance-obligations';

export const workflowStatusEnum = pgEnum('workflow_status', [
  'running',
  'paused',
  'completed',
  'failed',
  'terminated',
]);

export const workflowInstances = pgTable(
  'workflow_instances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    obligationId: uuid('obligation_id')
      .notNull()
      .references(() => complianceObligations.id),
    workflowId: varchar('workflow_id', { length: 255 }).notNull().unique(),
    taskQueue: varchar('task_queue', { length: 255 }).notNull(),
    status: workflowStatusEnum('status').notNull().default('running'),
    startedAt: timestamp('started_at').notNull().defaultNow(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    idxWorkflowId: index('wi_workflow_id_idx').on(table.workflowId),
    idxObligationId: index('wi_obligation_id_idx').on(table.obligationId),
  }),
);

export type WorkflowInstanceRecord = typeof workflowInstances.$inferSelect;
export type NewWorkflowInstanceRecord = typeof workflowInstances.$inferInsert;
