/**
 * db/schema.ts — Unified Drizzle schema for all three domains:
 *   1. Ultratech OS (work_items, actions, activity_logs, decisions, templates)
 *   2. Brand-suite (leads, contacts, compliance_bundles, intake_forms,
 *                   deployment_status, monitored_companies)
 *   3. ClerkOS (tenants, clerk_users, clerk_cases, clerk_hearings,
 *               clerk_documents, clerk_allocations, clerk_diaries,
 *               clerk_bundles, clerk_audit_events)
 *
 * Single source of truth → Supabase Postgres via drizzle-orm/postgres-js.
 */

import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Ultratech OS Enums ───────────────────────────────────────────────────────

export const workItemTypeEnum = pgEnum('WorkItemType', [
  'Partnership',
  'ConstructionLead',
  'PlanningLead',
  'ComplianceAlert',
  'DocumentRecord',
  'MediaBrief',
  'InternalTask',
  'Other',
]);

export const workItemStatusEnum = pgEnum('WorkItemStatus', [
  'Captured',
  'Controlled',
  'InProgress',
  'Waiting',
  'FollowUpDue',
  'Escalated',
  'DecisionNeeded',
  'Completed',
  'Paused',
  'NotFit',
  'Archived',
]);

export const priorityEnum = pgEnum('Priority', [
  'Low',
  'Medium',
  'High',
  'Urgent',
]);

export const actionTypeEnum = pgEnum('ActionType', [
  'LogNote',
  'CreateFollowUp',
  'ChangeStatus',
  'DraftMessage',
  'EscalateToGeorge',
  'GenerateDocument',
  'MarkComplete',
  'Archive',
  'Other',
]);

export const actionStatusEnum = pgEnum('ActionStatus', [
  'Open',
  'Done',
  'Cancelled',
  'Blocked',
]);

export const eventTypeEnum = pgEnum('EventType', [
  'Created',
  'NoteAdded',
  'StatusChanged',
  'ActionCreated',
  'ActionCompleted',
  'DecisionRequested',
  'DecisionMade',
  'FollowUpSet',
  'Archived',
]);

export const decisionStatusEnum = pgEnum('DecisionStatus', [
  'Open',
  'Approved',
  'Rejected',
  'MoreInfoNeeded',
  'Paused',
]);

// ─── Ultratech OS Tables ──────────────────────────────────────────────────────

export const workItems = pgTable('work_items', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  type: workItemTypeEnum('type').notNull(),
  title: text('title').notNull(),
  company: text('company'),
  contactName: text('contact_name'),
  owner: text('owner').notNull(),
  status: workItemStatusEnum('status').notNull().default('Captured'),
  priority: priorityEnum('priority').notNull().default('Medium'),
  nextAction: text('next_action'),
  dueDate: timestamp('due_date'),
  decisionNeeded: boolean('decision_needed').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const actions = pgTable('actions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workItemId: text('work_item_id')
    .notNull()
    .references(() => workItems.id, { onDelete: 'cascade' }),
  actionType: actionTypeEnum('action_type').notNull(),
  label: text('label').notNull(),
  status: actionStatusEnum('status').notNull().default('Open'),
  assignedTo: text('assigned_to'),
  dueDate: timestamp('due_date'),
  result: text('result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

export const activityLogs = pgTable('activity_logs', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workItemId: text('work_item_id')
    .notNull()
    .references(() => workItems.id, { onDelete: 'cascade' }),
  actionId: text('action_id').references(() => actions.id),
  person: text('person').notNull(),
  eventType: eventTypeEnum('event_type').notNull(),
  summary: text('summary').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  evidenceLink: text('evidence_link'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const decisions = pgTable('decisions', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  workItemId: text('work_item_id')
    .notNull()
    .references(() => workItems.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options'),
  recommendation: text('recommendation'),
  decisionBy: text('decision_by').notNull().default('George'),
  decision: text('decision'),
  status: decisionStatusEnum('status').notNull().default('Open'),
  dueDate: timestamp('due_date'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const templates = pgTable('templates', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  useCase: text('use_case').notNull(),
  body: text('body').notNull(),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Ultratech OS inferred types
export type WorkItem = typeof workItems.$inferSelect;
export type NewWorkItem = typeof workItems.$inferInsert;
export type Action = typeof actions.$inferSelect;
export type NewAction = typeof actions.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type NewActivityLog = typeof activityLogs.$inferInsert;
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;

// ─── Brand-Suite Tables ───────────────────────────────────────────────────────

/**
 * Deployment Status Table
 * Tracks all deployments across dev, staging, and production environments
 */
export const deploymentStatus = pgTable('deployment_status', {
  id: uuid('id').primaryKey().defaultRandom(),
  environment: varchar('environment', { length: 20 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  commit: varchar('commit', { length: 50 }).notNull(),
  workflowRun: varchar('workflow_run', { length: 50 }).notNull(),
  deployedAt: timestamp('deployed_at').defaultNow().notNull(),
});

/**
 * Leads Table
 * Stores demo booking requests from all landing pages
 */
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

/**
 * Client Intake Forms Table
 * Stores client matter intake sheet submissions
 */
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
  sourceRef: varchar('source_ref', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Compliance Bundle Requests Table
 * Stores requests for compliance bundle samples
 */
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

/**
 * Contact Form Submissions Table
 * General contact form submissions
 */
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

/**
 * Monitored Companies Table
 * Tracks companies that have paid and activated FineGuard protection
 */
export const monitoredCompanies = pgTable('monitored_companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  stripeSessionId: varchar('stripe_session_id', { length: 255 }).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  activatedAt: timestamp('activated_at').defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
})

/**
 * FineGuard Leads Table
 * Captures emails from visitors who checked a company but haven't paid yet.
 */
export const fineguardLeads = pgTable('fineguard_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  companyName: varchar('company_name', { length: 255 }),
  companyNumber: varchar('company_number', { length: 50 }),
  status: varchar('status', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export type FineguardLead = typeof fineguardLeads.$inferSelect;
export type NewFineguardLead = typeof fineguardLeads.$inferInsert;

/**
 * Alert History Table
 * Prevents duplicate deadline alerts from being sent.
 * One row per (company, deadline type, due date, days-before threshold).
 */
export const alertHistory = pgTable(
  'alert_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyNumber: varchar('company_number', { length: 50 }).notNull(),
    deadlineType: varchar('deadline_type', { length: 50 }).notNull(),
    dueDate: varchar('due_date', { length: 10 }).notNull(),
    daysBefore: integer('days_before').notNull(),
    sentAt: timestamp('sent_at').defaultNow().notNull(),
  },
  (t) => ({
    uniqueAlert: uniqueIndex('alert_history_unique_idx').on(
      t.companyNumber,
      t.deadlineType,
      t.dueDate,
      t.daysBefore,
    ),
  }),
);

// ─── FineGuard Workflow Tables ────────────────────────────────────────────────

/**
 * FineGuard Company Snapshots
 * One row per Companies House API fetch. Stores raw response + extracted dates.
 * Append-only — never updated, only inserted.
 */
export const fgCompanySnapshots = pgTable('fg_company_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: varchar('run_id', { length: 36 }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  rawData: jsonb('raw_data').notNull(),
  companyName: varchar('company_name', { length: 255 }),
  companyStatus: varchar('company_status', { length: 50 }),
  accountsNextDue: date('accounts_next_due'),
  confirmationStatementNextDue: date('confirmation_statement_next_due'),
  lastAccountsMadeUpTo: date('last_accounts_made_up_to'),
  lastConfirmationStatementDate: date('last_confirmation_statement_date'),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FineGuard Alerts
 * One row per (company_number, alert_type, due_date, reminder_date).
 * Unique constraint prevents duplicates if the same company is processed repeatedly.
 * daysBefore: 90 | 60 | 30 | 14 | 7 | 0 | negative (overdue sentinel)
 * status: 'pending' → 'sent' | 'logged' | 'suppressed'
 */
export const fgAlerts = pgTable(
  'fg_alerts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    companyNumber: varchar('company_number', { length: 50 }).notNull(),
    alertType: varchar('alert_type', { length: 50 }).notNull(),
    dueDate: date('due_date').notNull(),
    reminderDate: date('reminder_date').notNull(),
    daysBefore: integer('days_before').notNull(),
    status: varchar('status', { length: 20 }).default('pending').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }),
  },
  (t) => ({
    uniqueAlert: uniqueIndex('fg_alerts_unique_idx').on(
      t.companyNumber,
      t.alertType,
      t.dueDate,
      t.reminderDate,
    ),
  }),
);

/**
 * FineGuard Reminder Events
 * Append-only log of every time an fgAlert row is processed by the cron/route.
 */
export const fgReminderEvents = pgTable('fg_reminder_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: varchar('run_id', { length: 36 }),
  alertId: uuid('alert_id').references(() => fgAlerts.id, { onDelete: 'cascade' }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  detail: text('detail'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FineGuard Message Logs
 * Records every message dispatched (or logged when no provider is configured).
 */
export const fgMessageLogs = pgTable('fg_message_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: varchar('run_id', { length: 36 }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).default('email').notNull(),
  recipient: varchar('recipient', { length: 255 }),
  subject: varchar('subject', { length: 500 }),
  body: text('body'),
  status: varchar('status', { length: 20 }).default('logged').notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * FineGuard Activity Log
 * Append-only audit trail — one row per major workflow step.
 */
export const fgActivityLog = pgTable('fg_activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  runId: varchar('run_id', { length: 36 }),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: varchar('entity_id', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  detail: jsonb('detail'),
  occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
});

// Brand-suite inferred types
export type AlertHistory = typeof alertHistory.$inferSelect;
export type NewAlertHistory = typeof alertHistory.$inferInsert;
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
export type FgCompanySnapshot = typeof fgCompanySnapshots.$inferSelect;
export type NewFgCompanySnapshot = typeof fgCompanySnapshots.$inferInsert;
export type FgAlert = typeof fgAlerts.$inferSelect;
export type NewFgAlert = typeof fgAlerts.$inferInsert;
export type FgReminderEvent = typeof fgReminderEvents.$inferSelect;
export type NewFgReminderEvent = typeof fgReminderEvents.$inferInsert;
export type FgMessageLog = typeof fgMessageLogs.$inferSelect;
export type NewFgMessageLog = typeof fgMessageLogs.$inferInsert;
export type FgActivityLogEntry = typeof fgActivityLog.$inferSelect;
export type NewFgActivityLogEntry = typeof fgActivityLog.$inferInsert;

// ─── ClerkOS Tables ──────────────────────────────────────────────────────────

export type TenantSettings = {
  timezone?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  caseNumberPrefix?: string;
  maxCasesPerClerk?: number;
  bundleConfig?: {
    pageSize?: 'A4' | 'Letter';
    includeIndex?: boolean;
    includeAuditTrail?: boolean;
  };
  azureStorage?: {
    containerName?: string;
    customEndpoint?: string;
  };
};

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  plan: varchar('plan', { length: 32 }).notNull().default('free'),
  settings: jsonb('settings').$type<TenantSettings>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export const clerkUsers = pgTable(
  'clerk_users',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    openId: varchar('open_id', { length: 64 }).notNull(),
    name: text('name'),
    email: varchar('email', { length: 320 }),
    loginMethod: varchar('login_method', { length: 64 }),
    role: varchar('role', { length: 64 }).default('standard clerk').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastSignedIn: timestamp('last_signed_in').defaultNow().notNull(),
  },
  (t) => ({
    openIdTenantIdx: uniqueIndex('users_open_id_tenant_idx').on(t.tenantId, t.openId),
    emailTenantIdx: uniqueIndex('users_email_tenant_idx').on(t.tenantId, t.email),
    tenantIdx: index('users_tenant_idx').on(t.tenantId),
  }),
);

export type ClerkUser = typeof clerkUsers.$inferSelect;
export type InsertClerkUser = typeof clerkUsers.$inferInsert;

export const clerkCases = pgTable(
  'clerk_cases',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    referenceNumber: varchar('reference_number', { length: 64 }).notNull(),
    title: text('title').notNull(),
    status: varchar('status', { length: 32 }).default('open').notNull(),
    caseType: varchar('case_type', { length: 64 }).notNull(),
    plaintiff: text('plaintiff').notNull(),
    defendant: text('defendant').notNull(),
    judge: varchar('judge', { length: 255 }),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    refTenantIdx: uniqueIndex('cases_ref_tenant_idx').on(t.tenantId, t.referenceNumber),
    tenantIdx: index('cases_tenant_idx').on(t.tenantId),
  }),
);

export type ClerkCase = typeof clerkCases.$inferSelect;
export type InsertClerkCase = typeof clerkCases.$inferInsert;

export const clerkHearings = pgTable(
  'clerk_hearings',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: integer('case_id').notNull(),
    hearingDate: date('hearing_date').notNull(),
    hearingTime: varchar('hearing_time', { length: 5 }).notNull(),
    courtroom: varchar('courtroom', { length: 64 }).notNull(),
    judge: varchar('judge', { length: 255 }).notNull(),
    status: varchar('status', { length: 32 }).default('scheduled').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('hearings_tenant_idx').on(t.tenantId),
    caseIdx: index('hearings_case_idx').on(t.tenantId, t.caseId),
  }),
);

export type ClerkHearing = typeof clerkHearings.$inferSelect;
export type InsertClerkHearing = typeof clerkHearings.$inferInsert;

export const clerkDocuments = pgTable(
  'clerk_documents',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: integer('case_id').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    blobPath: text('blob_path'),
    fileUrl: text('file_url').notNull(),
    fileType: varchar('file_type', { length: 32 }).notNull(),
    fileSize: integer('file_size'),
    documentType: varchar('document_type', { length: 64 }).notNull(),
    version: integer('version').default(1).notNull(),
    contentHash: varchar('content_hash', { length: 64 }),
    approvedForBundle: integer('approved_for_bundle').default(0).notNull(),
    uploadedBy: integer('uploaded_by').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('documents_tenant_idx').on(t.tenantId),
    caseIdx: index('documents_case_idx').on(t.tenantId, t.caseId),
  }),
);

export type ClerkDocument = typeof clerkDocuments.$inferSelect;
export type InsertClerkDocument = typeof clerkDocuments.$inferInsert;

export type BundleIndex = {
  documents: Array<{ id: number; fileName: string; documentType: string; pageRange?: string }>;
  generatedAt: string;
  caseReference: string;
};

export const clerkBundles = pgTable(
  'clerk_bundles',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: integer('case_id').notNull(),
    indexJson: jsonb('index_json').$type<BundleIndex>(),
    pdfBlobPath: text('pdf_blob_path'),
    auditHash: varchar('audit_hash', { length: 64 }),
    status: varchar('status', { length: 32 }).default('pending').notNull(),
    orchestrationId: varchar('orchestration_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('bundles_tenant_idx').on(t.tenantId),
    caseIdx: index('bundles_case_idx').on(t.tenantId, t.caseId),
  }),
);

export type ClerkBundle = typeof clerkBundles.$inferSelect;
export type InsertClerkBundle = typeof clerkBundles.$inferInsert;

export const clerkAllocations = pgTable(
  'clerk_allocations',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clerkId: integer('clerk_id').notNull(),
    caseId: integer('case_id').notNull(),
    taskType: varchar('task_type', { length: 64 }).notNull(),
    priority: varchar('priority', { length: 16 }).default('medium').notNull(),
    status: varchar('status', { length: 32 }).default('pending').notNull(),
    dueDate: date('due_date'),
    notes: text('notes'),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    completedAt: timestamp('completed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('allocations_tenant_idx').on(t.tenantId),
  }),
);

export type ClerkAllocation = typeof clerkAllocations.$inferSelect;
export type InsertClerkAllocation = typeof clerkAllocations.$inferInsert;

export const clerkDiaries = pgTable(
  'clerk_diaries',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    clerkId: integer('clerk_id').notNull(),
    date: date('date').notNull(),
    hearingId: integer('hearing_id'),
    allocationId: integer('allocation_id'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('diaries_tenant_idx').on(t.tenantId),
    clerkDateIdx: index('diaries_clerk_date_idx').on(t.tenantId, t.clerkId, t.date),
  }),
);

export type ClerkDiary = typeof clerkDiaries.$inferSelect;
export type InsertClerkDiary = typeof clerkDiaries.$inferInsert;

export const clerkAuditEvents = pgTable(
  'clerk_audit_events',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: integer('entity_id'),
    entityUuid: uuid('entity_uuid'),
    action: varchar('action', { length: 64 }).notNull(),
    actorId: integer('actor_id'),
    actorOpenId: varchar('actor_open_id', { length: 64 }),
    previousState: text('previous_state'),
    nextState: text('next_state'),
    metadata: text('metadata'),
    correlationId: uuid('correlation_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('audit_tenant_idx').on(t.tenantId),
    entityIdx: index('audit_entity_idx').on(t.tenantId, t.entityType, t.entityId),
    entityUuidIdx: index('audit_entity_uuid_idx').on(t.tenantId, t.entityType, t.entityUuid),
  }),
);

export type ClerkAuditEvent = typeof clerkAuditEvents.$inferSelect;
export type InsertClerkAuditEvent = typeof clerkAuditEvents.$inferInsert;

// ─── Ultratech OS Module Tables ──────────────────────────────────────────────

export const invoiceStatusEnum = pgEnum('InvoiceStatus', [
  'Draft',
  'Sent',
  'Paid',
  'Overdue',
  'Cancelled',
]);

export const osInvoices = pgTable('os_invoices', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  number: varchar('number', { length: 32 }).notNull().unique(),
  clientName: text('client_name').notNull(),
  clientEmail: varchar('client_email', { length: 255 }),
  description: text('description'),
  amountPence: integer('amount_pence').notNull(),
  status: invoiceStatusEnum('status').notNull().default('Draft'),
  issuedAt: timestamp('issued_at'),
  dueAt: timestamp('due_at'),
  paidAt: timestamp('paid_at'),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type OsInvoice = typeof osInvoices.$inferSelect;
export type NewOsInvoice = typeof osInvoices.$inferInsert;

export const callDirectionEnum = pgEnum('CallDirection', ['Inbound', 'Outbound']);
export const callOutcomeEnum = pgEnum('CallOutcome', ['Answered', 'Missed', 'Voicemail', 'NoAnswer']);

export const osCallLogs = pgTable('os_call_logs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  direction: callDirectionEnum('direction').notNull().default('Inbound'),
  callerName: text('caller_name').notNull(),
  callerPhone: varchar('caller_phone', { length: 50 }),
  durationSeconds: integer('duration_seconds').default(0),
  outcome: callOutcomeEnum('outcome').notNull().default('Answered'),
  notes: text('notes'),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  calledAt: timestamp('called_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
export type OsCallLog = typeof osCallLogs.$inferSelect;
export type NewOsCallLog = typeof osCallLogs.$inferInsert;

export const osMessageThreads = pgTable('os_message_threads', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  subject: text('subject').notNull(),
  participantNames: jsonb('participant_names').$type<string[]>().default([]),
  lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
  unreadCount: integer('unread_count').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
export type OsMessageThread = typeof osMessageThreads.$inferSelect;
export type NewOsMessageThread = typeof osMessageThreads.$inferInsert;

export const osMessages = pgTable('os_messages', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  threadId: text('thread_id').notNull().references(() => osMessageThreads.id, { onDelete: 'cascade' }),
  fromName: text('from_name').notNull(),
  body: text('body').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
export type OsMessage = typeof osMessages.$inferSelect;
export type NewOsMessage = typeof osMessages.$inferInsert;

export const personCategoryEnum = pgEnum('PersonCategory', [
  'Team',
  'Client',
  'Partner',
  'Supplier',
  'Prospect',
]);

export const osPeople = pgTable('os_people', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  company: text('company'),
  role: text('role'),
  category: personCategoryEnum('category').notNull().default('Client'),
  avatarInitials: varchar('avatar_initials', { length: 4 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type OsPerson = typeof osPeople.$inferSelect;
export type NewOsPerson = typeof osPeople.$inferInsert;

export const alertSeverityEnum = pgEnum('AlertSeverity', ['Critical', 'Warning', 'Info']);

export const osAlerts = pgTable('os_alerts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  severity: alertSeverityEnum('severity').notNull().default('Info'),
  title: text('title').notNull(),
  body: text('body'),
  source: text('source'),
  isRead: boolean('is_read').notNull().default(false),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  resolvedAt: timestamp('resolved_at'),
});
export type OsAlert = typeof osAlerts.$inferSelect;
export type NewOsAlert = typeof osAlerts.$inferInsert;

export const documentStatusEnum = pgEnum('DocumentStatus', [
  'PendingReview',
  'Approved',
  'Rejected',
  'Archived',
]);

export const osDocuments = pgTable('os_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  filename: text('filename').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSizeBytes: integer('file_size_bytes'),
  storagePath: text('storage_path'),
  source: varchar('source', { length: 50 }).default('Upload').notNull(),
  status: documentStatusEnum('status').notNull().default('PendingReview'),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  linkedCompany: text('linked_company'),
  uploadedBy: text('uploaded_by').notNull().default('George'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type OsDocument = typeof osDocuments.$inferSelect;
export type NewOsDocument = typeof osDocuments.$inferInsert;

export const taskStatusEnum = pgEnum('TaskStatus', [
  'Open',
  'InProgress',
  'Done',
  'Cancelled',
]);

export const osTasks = pgTable('os_tasks', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text('title').notNull(),
  assignedTo: text('assigned_to').notNull().default('George'),
  priority: priorityEnum('priority').notNull().default('Medium'),
  status: taskStatusEnum('status').notNull().default('Open'),
  dueAt: timestamp('due_at'),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
export type OsTask = typeof osTasks.$inferSelect;
export type NewOsTask = typeof osTasks.$inferInsert;

// ─── Builder Big Jobs Tables ──────────────────────────────────────────────────

/**
 * Builder Big Jobs Leads Table
 * Builder preferences and incoming project leads for the BBJ lead gen product.
 * Shared Supabase instance — isolated product, separate table.
 */
export const builderBigJobsLeads = pgTable('builder_big_jobs_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  source: varchar('source', { length: 100 }).default('intake_form').notNull(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  postcodeArea: varchar('postcode_area', { length: 255 }),
  jobTypes: text('job_types'),
  minJobSizeBand: varchar('min_job_size_band', { length: 50 }),
  maxTravelMiles: integer('max_travel_miles'),
  preferredContact: varchar('preferred_contact', { length: 50 }),
  notes: text('notes'),
  estimatedValueBand: varchar('estimated_value_band', { length: 50 }),
  planningStatus: varchar('planning_status', { length: 50 }),
  leadScore: integer('lead_score').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('new').notNull(),
  assignedTo: varchar('assigned_to', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export type BuilderBigJobsLead = typeof builderBigJobsLeads.$inferSelect;
export type NewBuilderBigJobsLead = typeof builderBigJobsLeads.$inferInsert;
