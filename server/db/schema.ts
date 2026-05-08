import { pgTable, uuid, varchar, timestamp, text, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * Deployment Status Table
 * Tracks all deployments across dev, staging, and production environments
 */
export const deploymentStatus = pgTable('deployment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: varchar('environment', { length: 20 }).notNull(), // dev, staging, prod
  status: varchar('status', { length: 20 }).notNull(), // success, failed, in_progress
  commit: varchar('commit', { length: 50 }).notNull(), // Git commit SHA
  workflowRun: varchar('workflow_run', { length: 50 }).notNull(), // GitHub workflow run ID
  deployedAt: timestamp('deployed_at').defaultNow().notNull(),
}, (t) => ({
  environmentIdx: index('deployment_status_environment_idx').on(t.environment),
  deployedAtIdx: index('deployment_status_deployed_at_idx').on(t.deployedAt),
}));

/**
 * Leads Table
 * Stores demo booking requests from all landing pages
 */
export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  leadId: varchar('lead_id', { length: 50 }).notNull().unique(), // LEAD-1234567890
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  product: varchar('product', { length: 50 }), // vaultline, ultai, fineguard
  phone: varchar('phone', { length: 50 }),
  message: text('message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  leadIdIdx: uniqueIndex('leads_lead_id_idx').on(t.leadId),
  emailIdx: index('leads_email_idx').on(t.email),
  createdAtIdx: index('leads_created_at_idx').on(t.createdAt),
}));

/**
 * Client Intake Forms Table
 * Stores client matter intake sheet submissions
 */
export const intakeForms = pgTable('intake_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  matterRef: varchar('matter_ref', { length: 50 }).notNull().unique(), // MAT-1234567890
  clientName: varchar('client_name', { length: 255 }).notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  clientPhone: varchar('client_phone', { length: 50 }),
  matterType: varchar('matter_type', { length: 100 }).notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull(), // low, medium, high, critical
  description: text('description'),
  claimValue: varchar('claim_value', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  matterRefIdx: uniqueIndex('intake_forms_matter_ref_idx').on(t.matterRef),
  clientEmailIdx: index('intake_forms_client_email_idx').on(t.clientEmail),
  createdAtIdx: index('intake_forms_created_at_idx').on(t.createdAt),
}));

/**
 * Compliance Bundle Requests Table
 * Stores requests for compliance bundle samples
 */
export const complianceBundles = pgTable('compliance_bundles', {
  id: uuid('id').primaryKey().defaultRandom(),
  bundleId: varchar('bundle_id', { length: 50 }).notNull().unique(), // BUNDLE-1234567890
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  requestorName: varchar('requestor_name', { length: 255 }),
  requestorEmail: varchar('requestor_email', { length: 255 }),
  bundleType: varchar('bundle_type', { length: 50 }).default('full'),
  estimatedTime: varchar('estimated_time', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  bundleIdIdx: uniqueIndex('compliance_bundles_bundle_id_idx').on(t.bundleId),
  companyNumberIdx: index('compliance_bundles_company_number_idx').on(t.companyNumber),
  createdAtIdx: index('compliance_bundles_created_at_idx').on(t.createdAt),
}));

/**
 * Contact Form Submissions Table
 * General contact form submissions
 */
export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().unique(), // TICKET-1234567890
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(), // new, read, replied
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  ticketIdIdx: uniqueIndex('contacts_ticket_id_idx').on(t.ticketId),
  emailIdx: index('contacts_email_idx').on(t.email),
  statusIdx: index('contacts_status_idx').on(t.status),
  createdAtIdx: index('contacts_created_at_idx').on(t.createdAt),
}));

/**
 * Monitored Companies Table
 * Tracks companies that have paid and activated FineGuard protection
 */
export const monitoredCompanies = pgTable('monitored_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull(),
  activatedAt: timestamp('activated_at').defaultNow().notNull(),
}, (t) => ({
  activatedAtIdx: index('monitored_companies_activated_at_idx').on(t.activatedAt),
}));

// Export types for use in the application
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

// ── Lunar Intake Engine ───────────────────────────────────────────────────────

/**
 * Intake Matters
 * One row per client submission through the Lunar → UltraCore pipeline.
 */
export const intakeMatters = pgTable('intake_matters', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  issueType: varchar('issue_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  urgency: varchar('urgency', { length: 20 }).notNull(),        // normal | high | critical
  riskScore: integer('risk_score').notNull(),
  decision: varchar('decision', { length: 20 }).notNull(),       // ALLOW | MODIFY | DENY | ESCALATE
  status: varchar('status', { length: 30 }).notNull().default('pending'), // pending | in_review | matter_created | rejected
  lolaMessage: text('lola_message'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  decisionIdx: index('intake_matters_decision_idx').on(t.decision),
  statusIdx: index('intake_matters_status_idx').on(t.status),
  createdAtIdx: index('intake_matters_created_at_idx').on(t.createdAt),
  emailIdx: index('intake_matters_email_idx').on(t.email),
}));

/**
 * Vault Events
 * Append-only tamper-evident audit log (SHA-256 hash per event).
 */
export const vaultEvents = pgTable('vault_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  intakeId: uuid('intake_id').references(() => intakeMatters.id),
  eventType: varchar('event_type', { length: 64 }).notNull(),
  payload: jsonb('payload').notNull(),
  hash: varchar('hash', { length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => ({
  intakeIdIdx: index('vault_events_intake_id_idx').on(t.intakeId),
  eventTypeIdx: index('vault_events_event_type_idx').on(t.eventType),
  createdAtIdx: index('vault_events_created_at_idx').on(t.createdAt),
}));

export type IntakeMatter = typeof intakeMatters.$inferSelect;
export type NewIntakeMatter = typeof intakeMatters.$inferInsert;
export type VaultEvent = typeof vaultEvents.$inferSelect;
export type NewVaultEvent = typeof vaultEvents.$inferInsert;
