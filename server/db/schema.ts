import { pgTable, uuid, varchar, timestamp, text, boolean, numeric, integer } from 'drizzle-orm/pg-core';

// ============================================================================
// EXISTING TABLES (preserved)
// ============================================================================

export const deploymentStatus = pgTable('deployment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: varchar('environment', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  commit: varchar('commit', { length: 50 }).notNull(),
  workflowRun: varchar('workflow_run', { length: 50 }).notNull(),
  deployedAt: timestamp('deployed_at').defaultNow().notNull(),
});

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
});

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
});

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
});

export const contacts = pgTable('contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: varchar('ticket_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 255 }),
  message: text('message').notNull(),
  status: varchar('status', { length: 20 }).default('new').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// FINEGUARD SAAS TABLES
// ============================================================================

/**
 * Firms Table - Accounting firms using the platform
 */
export const firms = pgTable('firms', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmName: varchar('firm_name', { length: 255 }).notNull(),
  subscriptionPlan: varchar('subscription_plan', { length: 50 }).default('free').notNull(), // free, pro, enterprise
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Users Table - Accountants who use the platform
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  firmId: uuid('firm_id').references(() => firms.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Companies Table - Client companies managed by accounting firms
 */
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  firmId: uuid('firm_id').references(() => firms.id).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  companyNumber: varchar('company_number', { length: 50 }),
  vatNumber: varchar('vat_number', { length: 50 }),
  accountingYearEnd: varchar('accounting_year_end', { length: 10 }),
  companyStatus: varchar('company_status', { length: 50 }),
  incorporationDate: varchar('incorporation_date', { length: 20 }),
  complianceStatus: varchar('compliance_status', { length: 20 }).default('unknown'), // compliant, warning, overdue, unknown
  lastChecked: timestamp('last_checked'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Deadlines Table - Filing deadlines per company
 */
export const deadlines = pgTable('deadlines', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  deadlineType: varchar('deadline_type', { length: 100 }).notNull(), // accounts, confirmation_statement, vat_return, etc.
  dueDate: varchar('due_date', { length: 20 }),
  status: varchar('status', { length: 20 }).default('pending'), // pending, filed, overdue
  lastChecked: timestamp('last_checked').defaultNow(),
});

/**
 * VAT Check Reports Table - Results of VAT pre-submission checks
 */
export const vatCheckReports = pgTable('vat_check_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  userId: uuid('user_id').references(() => users.id),
  firmId: uuid('firm_id').references(() => firms.id),
  box1: numeric('box1', { precision: 15, scale: 2 }),
  box2: numeric('box2', { precision: 15, scale: 2 }),
  box3: numeric('box3', { precision: 15, scale: 2 }),
  box4: numeric('box4', { precision: 15, scale: 2 }),
  box5: numeric('box5', { precision: 15, scale: 2 }),
  box6: numeric('box6', { precision: 15, scale: 2 }),
  box7: numeric('box7', { precision: 15, scale: 2 }),
  box8: numeric('box8', { precision: 15, scale: 2 }),
  box9: numeric('box9', { precision: 15, scale: 2 }),
  result: varchar('result', { length: 20 }).notNull(), // PASS, WARNING, ERROR
  warnings: text('warnings'), // JSON array of warning messages
  errors: text('errors'),     // JSON array of error messages
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Timeline Events Table - Chronological compliance events per company
 */
export const timelineEvents = pgTable('timeline_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id).notNull(),
  eventType: varchar('event_type', { length: 100 }).notNull(),
  // accounts_filed, confirmation_filed, director_appointment, director_resignation,
  // vat_return_submitted, vat_validation, deadline_alert, document_upload, company_check
  source: varchar('source', { length: 100 }), // companies_house, hmrc, manual, fineguard
  notes: text('notes'),
  eventDate: timestamp('event_date').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Alerts Table - Compliance alerts for firms
 */
export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  firmId: uuid('firm_id').references(() => firms.id).notNull(),
  alertType: varchar('alert_type', { length: 100 }).notNull(),
  // vat_deadline, accounts_overdue, confirmation_overdue, director_change, strike_off_notice
  severity: varchar('severity', { length: 20 }).notNull(), // low, medium, high, critical
  message: text('message').notNull(),
  resolved: boolean('resolved').default(false).notNull(),
  resolvedAt: timestamp('resolved_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Documents Table - 7-year document vault
 */
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id),
  firmId: uuid('firm_id').references(() => firms.id).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  fileUrl: varchar('file_url', { length: 1000 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  documentType: varchar('document_type', { length: 100 }), // vat_return, accounts, correspondence, etc.
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  retentionUntil: timestamp('retention_until'), // 7 years from upload
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Tool Transactions Table - Pay-per-use billing records
 */
export const toolTransactions = pgTable('tool_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  firmId: uuid('firm_id').references(() => firms.id).notNull(),
  toolName: varchar('tool_name', { length: 100 }).notNull(), // vat_checker, deadline_scanner
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
  status: varchar('status', { length: 20 }).default('completed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Audit Log Table - All user actions
 */
export const auditLog = pgTable('audit_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  entityType: varchar('entity_type', { length: 50 }), // company, document, vat_report, etc.
  entityId: uuid('entity_id'),
  details: text('details'), // JSON with additional info
  ipAddress: varchar('ip_address', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type DeploymentStatus = typeof deploymentStatus.$inferSelect;
export type Lead = typeof leads.$inferSelect;
export type IntakeForm = typeof intakeForms.$inferSelect;
export type ComplianceBundle = typeof complianceBundles.$inferSelect;
export type Contact = typeof contacts.$inferSelect;

export type Firm = typeof firms.$inferSelect;
export type NewFirm = typeof firms.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;

export type Deadline = typeof deadlines.$inferSelect;
export type NewDeadline = typeof deadlines.$inferInsert;

export type VatCheckReport = typeof vatCheckReports.$inferSelect;
export type NewVatCheckReport = typeof vatCheckReports.$inferInsert;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type NewTimelineEvent = typeof timelineEvents.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;

export type ToolTransaction = typeof toolTransactions.$inferSelect;
export type NewToolTransaction = typeof toolTransactions.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
