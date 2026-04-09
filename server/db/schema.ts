import { pgTable, uuid, varchar, timestamp, text, boolean, integer, index, date, jsonb } from 'drizzle-orm/pg-core';
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

<<<<<<< HEAD
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
  userIntent: varchar('user_intent', { length: 50 }), // accountant, business_owner, acsp_provider, company_secretary
  onboardingComplete: boolean('onboarding_complete').default(false).notNull(),
  notificationPrefs: jsonb('notification_prefs'), // { filing_deadlines, overdue_warnings, director_changes, weekly_digest, product_updates }
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

=======
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
});

>>>>>>> claude/fineguard-pilot-execution-DXFpY
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

<<<<<<< HEAD
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;

export type Alert = typeof alerts.$inferSelect;
export type NewAlert = typeof alerts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

// ============================================================================
// ACSP (Authorised Corporate Service Provider) TABLES
// ============================================================================

/**
 * ACSP Clients Table
 * Companies managed by the user's ACSP practice
 */
export const acspClients = pgTable('acsp_clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  clientRef: varchar('client_ref', { length: 100 }), // internal reference
  serviceType: varchar('service_type', { length: 50 }).notNull(), // formation, filing, registered_office, verification
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, suspended, terminated
  acspRegNumber: varchar('acsp_reg_number', { length: 50 }), // ACSP registration number
  identityVerified: boolean('identity_verified').default(false).notNull(),
  amlChecked: boolean('aml_checked').default(false).notNull(),
  lastFilingDate: varchar('last_filing_date', { length: 20 }),
  nextFilingDue: varchar('next_filing_due', { length: 20 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * ACSP Filings Table
 * Tracks filings made on behalf of ACSP clients
 */
export const acspFilings = pgTable('acsp_filings', {
  id: uuid('id').primaryKey().defaultRandom(),
  acspClientId: uuid('acsp_client_id').notNull().references(() => acspClients.id),
  userId: uuid('user_id').notNull().references(() => users.id),
  filingType: varchar('filing_type', { length: 100 }).notNull(), // annual_accounts, confirmation_statement, change_of_director, change_of_address, incorporation, dissolution
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, submitted, accepted, rejected
  dueDate: varchar('due_date', { length: 20 }),
  submittedAt: timestamp('submitted_at'),
  referenceNumber: varchar('reference_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// BUSINESS WORKFLOW & TEAM MANAGEMENT TABLES
// ============================================================================

/**
 * Team Members Table
 * Team members within the user's organisation
 */
export const teamMembers = pgTable('team_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id), // owner/admin
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('analyst').notNull(), // admin, manager, analyst, reviewer
  department: varchar('department', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, inactive
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Workflows Table
 * Business workflows for compliance processing
 */
export const workflows = pgTable('workflows', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  workflowType: varchar('workflow_type', { length: 50 }).notNull(), // compliance_review, company_enrichment, filing_batch, risk_assessment, onboarding
  status: varchar('status', { length: 20 }).default('draft').notNull(), // draft, active, paused, completed, cancelled
  priority: varchar('priority', { length: 20 }).default('medium').notNull(), // low, medium, high, critical
  assignedTo: uuid('assigned_to').references(() => teamMembers.id),
  dueDate: varchar('due_date', { length: 20 }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Workflow Tasks Table
 * Individual tasks within a workflow
 */
export const workflowTasks = pgTable('workflow_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workflowId: uuid('workflow_id').notNull().references(() => workflows.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, in_progress, review, completed, blocked
  assignedTo: uuid('assigned_to').references(() => teamMembers.id),
  companyNumber: varchar('company_number', { length: 50 }), // if task relates to a company
  companyName: varchar('company_name', { length: 255 }),
  priority: varchar('priority', { length: 20 }).default('medium').notNull(),
  dueDate: varchar('due_date', { length: 20 }),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// IMPORT HISTORY TABLE
// ============================================================================

/**
 * Import History Table
 * Tracks bulk data imports (XLSX/CSV) into the ACSP system
 */
export const importHistory = pgTable('import_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  totalRows: integer('total_rows').notNull(),
  importedRows: integer('imported_rows').notNull(),
  skippedRows: integer('skipped_rows').default(0).notNull(),
  errorRows: integer('error_rows').default(0).notNull(),
  importType: varchar('import_type', { length: 50 }).default('acsp_clients').notNull(),
  columnMapping: text('column_mapping'), // JSON string of the mapping used
  workflowId: uuid('workflow_id').references(() => workflows.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ============================================================================
// STRIPE BILLING / SUBSCRIPTIONS TABLE
// ============================================================================

/**
 * Subscriptions Table
 * Tracks per-service billing (£1/mo per company per service)
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  services: varchar('services', { length: 500 }).default('').notNull(), // comma-separated: companies_house,corporate_tax,self_assessment,vat_returns
  status: varchar('status', { length: 30 }).default('active').notNull(), // active, past_due, canceled, inactive
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ============================================================================
// ALERT TRACKING & PREFERENCES TABLES
// ============================================================================

/**
 * Alert Logs Table
 * Tracks all compliance alerts sent to clients and advisors
 */
export const alertLogs = pgTable('alert_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').references(() => users.id).notNull(),
  advisorId: uuid('advisor_id').references(() => users.id),
  companyId: varchar('company_id', { length: 50 }).notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(), // filing_due, director_change, overdue, etc.
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  riskLevel: varchar('risk_level', { length: 20 }).notNull(), // Low, Medium, High, Critical
  channels: varchar('channels', { length: 100 }).notNull(), // outlook, teams, both
  triggerType: varchar('trigger_type', { length: 20 }).notNull(), // automatic, digest, manual, threshold
  recipientCount: integer('recipient_count').default(0).notNull(),
  status: varchar('status', { length: 20 }).default('sent').notNull(), // sent, pending, failed, bounced
  metadata: jsonb('metadata'), // Additional alert data (deadline, penalty, etc.)
  sentAt: timestamp('sent_at').defaultNow().notNull(),
  deliveredAt: timestamp('delivered_at'),
  failureReason: text('failure_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  clientIdIdx: index('alert_logs_client_id_idx').on(table.clientId),
  companyIdIdx: index('alert_logs_company_id_idx').on(table.companyId),
  sentAtIdx: index('alert_logs_sent_at_idx').on(table.sentAt),
}));

/**
 * Alert Preferences Table
 * Stores user preferences for alert delivery (frequency, channels, thresholds)
 */
export const alertPreferences = pgTable('alert_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  digestFrequency: varchar('digest_frequency', { length: 20 }).default('daily').notNull(), // daily, weekly, never
  minRiskThreshold: varchar('min_risk_threshold', { length: 20 }).default('Medium').notNull(), // Low, Medium, High, Critical
  enabledChannels: varchar('enabled_channels', { length: 100 }).default('outlook,teams').notNull(), // comma-separated: outlook, teams
  includeAttachments: boolean('include_attachments').default(true).notNull(),
  includeRecommendations: boolean('include_recommendations').default(true).notNull(),
  enableAutomatic: boolean('enable_automatic').default(true).notNull(), // Real-time automatic alerts
  enableThresholdAlerts: boolean('enable_threshold_alerts').default(true).notNull(), // Only alert on threshold breaches
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('alert_preferences_user_id_idx').on(table.userId),
}));

export type AlertLog = typeof alertLogs.$inferSelect;
export type NewAlertLog = typeof alertLogs.$inferInsert;

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type NewAlertPreference = typeof alertPreferences.$inferInsert;

// Export types
export type ImportHistory = typeof importHistory.$inferSelect;
export type NewImportHistory = typeof importHistory.$inferInsert;

export type AcspClient = typeof acspClients.$inferSelect;
export type NewAcspClient = typeof acspClients.$inferInsert;

export type AcspFiling = typeof acspFilings.$inferSelect;
export type NewAcspFiling = typeof acspFilings.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type Workflow = typeof workflows.$inferSelect;
export type NewWorkflow = typeof workflows.$inferInsert;

export type WorkflowTask = typeof workflowTasks.$inferSelect;
export type NewWorkflowTask = typeof workflowTasks.$inferInsert;
=======
export type MonitoredCompany = typeof monitoredCompanies.$inferSelect;
export type NewMonitoredCompany = typeof monitoredCompanies.$inferInsert;
>>>>>>> claude/fineguard-pilot-execution-DXFpY
