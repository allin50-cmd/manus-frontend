import {
  pgTable,
  uuid,
  varchar,
  jsonb,
  date,
  boolean,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { complianceObligations } from './compliance-obligations';

export const externalSourceSnapshots = pgTable(
  'external_source_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    obligationId: uuid('obligation_id')
      .notNull()
      .references(() => complianceObligations.id),
    source: varchar('source', { length: 100 }).notNull(), // e.g. 'companies_house'
    rawData: jsonb('raw_data').$type<Record<string, unknown>>(),
    dueDate: date('due_date'),
    resolved: boolean('resolved').notNull().default(false),
    checkedAt: timestamp('checked_at').notNull().defaultNow(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => ({
    idxObligationId: index('ess_obligation_id_idx').on(table.obligationId),
  }),
);

export type ExternalSourceSnapshot = typeof externalSourceSnapshots.$inferSelect;
export type NewExternalSourceSnapshot =
  typeof externalSourceSnapshots.$inferInsert;
