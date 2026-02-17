import { pgTable, uuid, varchar, timestamp, text, boolean, integer, index, date } from 'drizzle-orm/pg-core';
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
});

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
});

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
});

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
});

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
});

// ============================================================================
// FINEGUARD PRO - USER APP TABLES
// ============================================================================

/**
 * Users Table
 * FineGuard Pro registered users
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 20 }).default('free').notNull(), // free, pro, enterprise
  role: varchar('role', { length: 20 }).default('user').notNull(), // user, admin, partner
  verified: boolean('verified').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Monitored Companies Table
 * Companies a user has added to their monitoring portfolio
 */
export const monitoredCompanies = pgTable('monitored_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyStatus: varchar('company_status', { length: 50 }),
  complianceStatus: varchar('compliance_status', { length: 20 }).default('unknown'), // compliant, warning, overdue, unknown
  riskLevel: varchar('risk_level', { length: 20 }).default('none'), // none, low, medium, high
  lastCheckedAt: timestamp('last_checked_at'),
  accountsNextDue: varchar('accounts_next_due', { length: 50 }),
  confirmationNextDue: varchar('confirmation_next_due', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Alerts Table
 * Compliance alerts generated for monitored companies
 */
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  companyId: uuid('company_id').notNull().references(() => monitoredCompanies.id),
  type: varchar('type', { length: 50 }).notNull(), // deadline_warning, overdue, status_change, director_change, filing_update
  severity: varchar('severity', { length: 20 }).notNull(), // info, warning, critical
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Sessions Table
 * Simple token-based sessions for user auth
 */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// COMPANIES HOUSE BULK DATA TABLE
// Source: BasicCompanyDataAsOneFile CSV from Companies House
// ============================================================================

/**
 * Companies House Bulk Data Table
 * Stores the full Companies House register (~5.5M companies)
 * Downloaded from: http://download.companieshouse.gov.uk/en_output.html
 */
export const chCompanies = pgTable('ch_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyName: varchar('company_name', { length: 500 }).notNull(),
  companyNumber: varchar('company_number', { length: 20 }).notNull().unique(),
  careOf: varchar('care_of', { length: 255 }),
  poBox: varchar('po_box', { length: 100 }),
  addressLine1: varchar('address_line_1', { length: 255 }),
  addressLine2: varchar('address_line_2', { length: 255 }),
  postTown: varchar('post_town', { length: 100 }),
  county: varchar('county', { length: 100 }),
  country: varchar('country', { length: 100 }),
  postCode: varchar('post_code', { length: 20 }),
  companyCategory: varchar('company_category', { length: 100 }),
  companyStatus: varchar('company_status', { length: 100 }),
  countryOfOrigin: varchar('country_of_origin', { length: 100 }),
  dissolutionDate: varchar('dissolution_date', { length: 20 }),
  incorporationDate: varchar('incorporation_date', { length: 20 }),
  accountsRefDay: varchar('accounts_ref_day', { length: 5 }),
  accountsRefMonth: varchar('accounts_ref_month', { length: 5 }),
  accountsNextDueDate: varchar('accounts_next_due_date', { length: 20 }),
  accountsLastMadeUpDate: varchar('accounts_last_made_up_date', { length: 20 }),
  accountsCategory: varchar('accounts_category', { length: 100 }),
  returnsNextDueDate: varchar('returns_next_due_date', { length: 20 }),
  returnsLastMadeUpDate: varchar('returns_last_made_up_date', { length: 20 }),
  numMortCharges: integer('num_mort_charges'),
  numMortOutstanding: integer('num_mort_outstanding'),
  numMortPartSatisfied: integer('num_mort_part_satisfied'),
  numMortSatisfied: integer('num_mort_satisfied'),
  sicCode1: varchar('sic_code_1', { length: 200 }),
  sicCode2: varchar('sic_code_2', { length: 200 }),
  sicCode3: varchar('sic_code_3', { length: 200 }),
  sicCode4: varchar('sic_code_4', { length: 200 }),
  numGenPartners: integer('num_gen_partners'),
  numLimPartners: integer('num_lim_partners'),
  uri: varchar('uri', { length: 500 }),
  confStmtNextDueDate: varchar('conf_stmt_next_due_date', { length: 20 }),
  confStmtLastMadeUpDate: varchar('conf_stmt_last_made_up_date', { length: 20 }),
  importedAt: timestamp('imported_at').defaultNow().notNull(),
}, (table) => [
  index('ch_company_number_idx').on(table.companyNumber),
  index('ch_company_name_idx').on(table.companyName),
  index('ch_company_status_idx').on(table.companyStatus),
  index('ch_post_code_idx').on(table.postCode),
]);

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

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type ChCompany = typeof chCompanies.$inferSelect;
export type NewChCompany = typeof chCompanies.$inferInsert;
