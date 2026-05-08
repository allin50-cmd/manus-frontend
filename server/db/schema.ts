import { pgTable, uuid, varchar, timestamp, text, index } from 'drizzle-orm/pg-core';

export const deploymentStatus = pgTable('deployment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: varchar('environment', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  commit: varchar('commit', { length: 50 }).notNull(),
  workflowRun: varchar('workflow_run', { length: 50 }).notNull(),
  deployedAt: timestamp('deployed_at').defaultNow().notNull(),
}, (t) => [
  index('deployment_status_environment_idx').on(t.environment),
  index('deployment_status_deployed_at_idx').on(t.deployedAt),
]);

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: varchar('lead_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  product: varchar('product', { length: 50 }),
  phone: varchar('phone', { length: 50 }),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('leads_email_idx').on(t.email),
  index('leads_created_at_idx').on(t.createdAt),
]);

export const intakeForms = pgTable('intake_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  matterRef: varchar('matter_ref', { length: 50 }).notNull().unique(),
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  clientPhone: varchar('client_phone', { length: 50 }),
  matterType: varchar('matter_type', { length: 100 }).notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull(),
  description: text('description'),
  claimValue: varchar('claim_value', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('intake_forms_matter_type_idx').on(t.matterType),
  index('intake_forms_created_at_idx').on(t.createdAt),
]);

export const complianceBundles = pgTable('compliance_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  bundleId: varchar('bundle_id', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  requestorName: varchar('requestor_name', { length: 255 }),
  requestorEmail: varchar('requestor_email', { length: 255 }),
  bundleType: varchar('bundle_type', { length: 50 }).default('full'),
  estimatedTime: varchar('estimated_time', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('compliance_bundles_company_number_idx').on(t.companyNumber),
]);

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(), // new, read, replied
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('contacts_status_idx').on(t.status),
  index('contacts_created_at_idx').on(t.createdAt),
]);

export const monitoredCompanies = pgTable('monitored_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull(),
  activatedAt: timestamp('activated_at').defaultNow().notNull(),
});

export type DeploymentStatus = typeof deploymentStatus.$inferSelect;
export type NewDeploymentStatus = typeof deploymentStatus.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type IntakeForm = typeof intakeForms.$inferSelect;
export type NewIntakeForm = typeof intakeForms.$inferInsert;
export type ComplianceBundle = typeof complianceBundles.$inferSelect;
export type NewComplianceBundle = typeof complianceBundles.$inferInsert;
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;

/**
 * Companies House Portfolio Table
 * Persists the firm's monitored company portfolio.
 * complianceData stores the JSON-encoded response from the CH service, refreshed on every sync.
 */
export const chPortfolio = pgTable('ch_portfolio', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyNumber: varchar('company_number', { length: 20 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  serviceType: varchar('service_type', { length: 100 }),
  complianceStatus: varchar('compliance_status', { length: 20 }).default('pending').notNull(), // overdue | due_soon | compliant | pending
  complianceData: text('compliance_data'), // JSON string — full ComplianceStatus from CH service
  addedAt: timestamp('added_at').defaultNow().notNull(),
  lastSynced: timestamp('last_synced'),
});

// ── Inferred types ────────────────────────────────────────────────────────────

export type ChPortfolioEntry = typeof chPortfolio.$inferSelect;
export type NewChPortfolioEntry = typeof chPortfolio.$inferInsert;
