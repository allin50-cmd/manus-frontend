import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenants';

export const auditRecords = pgTable(
  'audit_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id),
    entityType: varchar('entity_type', { length: 100 }).notNull(),
    entityId: uuid('entity_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    payload: jsonb('payload').notNull().$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    idxTenantEntityId: index('ar_tenant_entity_id_idx').on(
      table.tenantId,
      table.entityType,
      table.entityId,
    ),
    idxEventType: index('ar_event_type_idx').on(table.eventType),
  }),
);

export type AuditRecordRow = typeof auditRecords.$inferSelect;
export type NewAuditRecordRow = typeof auditRecords.$inferInsert;
