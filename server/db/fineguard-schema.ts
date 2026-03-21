// ============================================================================
// FineGuard Database Schema (Drizzle / PostgreSQL)
// Extends the existing schema with FineGuard-specific tables.
// ============================================================================

import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  integer,
} from 'drizzle-orm/pg-core';

export const fgCompanies = pgTable('fg_companies', {
  id: uuid('id').primaryKey(),
  companyNumber: varchar('company_number', { length: 20 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyStatus: varchar('company_status', { length: 50 }).notNull().default('unknown'),
  incorporationDate: varchar('incorporation_date', { length: 20 }),
  confirmationStatementDue: varchar('confirmation_statement_due', { length: 20 }),
  accountsDue: varchar('accounts_due', { length: 20 }),
  lastOfficerChangeAt: varchar('last_officer_change_at', { length: 20 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fgMonitoring = pgTable('fg_monitoring', {
  id: uuid('id').primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => fgCompanies.id),
  monitoringEnabled: boolean('monitoring_enabled').notNull().default(true),
  nextDeadlineAt: varchar('next_deadline_at', { length: 20 }),
  currentStatus: varchar('current_status', { length: 20 }).notNull().default('safe'),
  lastCheckedAt: timestamp('last_checked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const fgAlerts = pgTable('fg_alerts', {
  id: uuid('id').primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => fgCompanies.id),
  type: varchar('type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  dueDate: varchar('due_date', { length: 20 }).notNull(),
  triggeredAt: timestamp('triggered_at').defaultNow().notNull(),
  handledAt: timestamp('handled_at'),
  thresholdDays: integer('threshold_days').notNull(),
  message: text('message').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const fgAuditLog = pgTable('fg_audit_log', {
  id: uuid('id').primaryKey(),
  companyId: uuid('company_id')
    .notNull()
    .references(() => fgCompanies.id),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  eventSummary: text('event_summary').notNull(),
  metadataJson: text('metadata_json').notNull().default('{}'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Types
export type FgCompany = typeof fgCompanies.$inferSelect;
export type FgMonitoring = typeof fgMonitoring.$inferSelect;
export type FgAlert = typeof fgAlerts.$inferSelect;
export type FgAuditEntry = typeof fgAuditLog.$inferSelect;
