import {
  pgTable,
  uuid,
  integer,
  varchar,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { alerts } from './alerts';

export const alertAttempts = pgTable('alert_attempts', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id')
    .notNull()
    .references(() => alerts.id),
  attemptNumber: integer('attempt_number').notNull(),
  status: varchar('status', { length: 50 }).notNull(),
  errorMessage: text('error_message'),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
});

export type AlertAttempt = typeof alertAttempts.$inferSelect;
export type NewAlertAttempt = typeof alertAttempts.$inferInsert;
