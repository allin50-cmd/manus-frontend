import { relations } from 'drizzle-orm'
import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core'

const id = () => crypto.randomUUID()

export const workItemType = pgEnum('WorkItemType', [
  'Partnership',
  'ConstructionLead',
  'PlanningLead',
  'ComplianceAlert',
  'DocumentRecord',
  'MediaBrief',
  'InternalTask',
  'Other',
])

export const workItemStatus = pgEnum('WorkItemStatus', [
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
])

export const priority = pgEnum('Priority', ['Low', 'Medium', 'High', 'Urgent'])

export const actionType = pgEnum('ActionType', [
  'LogNote',
  'CreateFollowUp',
  'ChangeStatus',
  'DraftMessage',
  'EscalateToGeorge',
  'GenerateDocument',
  'MarkComplete',
  'Archive',
  'Other',
])

export const actionStatus = pgEnum('ActionStatus', ['Open', 'Done', 'Cancelled', 'Blocked'])

export const eventType = pgEnum('EventType', [
  'Created',
  'NoteAdded',
  'StatusChanged',
  'ActionCreated',
  'ActionCompleted',
  'DecisionRequested',
  'DecisionMade',
  'FollowUpSet',
  'Archived',
])

export const decisionStatus = pgEnum('DecisionStatus', [
  'Open',
  'Approved',
  'Rejected',
  'MoreInfoNeeded',
  'Paused',
])

export const workItems = pgTable('work_items', {
  id: text('id').primaryKey().$defaultFn(id),
  type: workItemType('type').notNull(),
  title: text('title').notNull(),
  company: text('company'),
  contactName: text('contact_name'),
  owner: text('owner').notNull(),
  status: workItemStatus('status').notNull().default('Captured'),
  priority: priority('priority').notNull().default('Medium'),
  nextAction: text('next_action'),
  dueDate: timestamp('due_date'),
  decisionNeeded: boolean('decision_needed').notNull().default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const actions = pgTable('actions', {
  id: text('id').primaryKey().$defaultFn(id),
  workItemId: text('work_item_id').notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  actionType: actionType('action_type').notNull(),
  label: text('label').notNull(),
  status: actionStatus('status').notNull().default('Open'),
  assignedTo: text('assigned_to'),
  dueDate: timestamp('due_date'),
  result: text('result'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

export const activityLogs = pgTable('activity_logs', {
  id: text('id').primaryKey().$defaultFn(id),
  workItemId: text('work_item_id').notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  actionId: text('action_id').references(() => actions.id),
  person: text('person').notNull(),
  eventType: eventType('event_type').notNull(),
  summary: text('summary').notNull(),
  oldStatus: text('old_status'),
  newStatus: text('new_status'),
  evidenceLink: text('evidence_link'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const decisions = pgTable('decisions', {
  id: text('id').primaryKey().$defaultFn(id),
  workItemId: text('work_item_id').notNull().references(() => workItems.id, { onDelete: 'cascade' }),
  question: text('question').notNull(),
  options: text('options'),
  recommendation: text('recommendation'),
  decisionBy: text('decision_by').notNull().default('George'),
  decision: text('decision'),
  status: decisionStatus('status').notNull().default('Open'),
  dueDate: timestamp('due_date'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const templates = pgTable('templates', {
  id: text('id').primaryKey().$defaultFn(id),
  name: text('name').notNull(),
  useCase: text('use_case').notNull(),
  body: text('body').notNull(),
  approved: boolean('approved').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Minimal placeholder tables used by existing alert screens.
// Expand these later during full consolidation.
export const alertRecipients = pgTable('alert_recipients', {
  id: text('id').primaryKey().$defaultFn(id),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  company: text('company'),
  role: text('role'),
  channel: text('channel').notNull().default('Email'),
  escalationLevel: integer('escalation_level').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  suppressedUntil: timestamp('suppressed_until'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const alertDeliveries = pgTable('alert_deliveries', {
  id: text('id').primaryKey().$defaultFn(id),
  recipientId: text('recipient_id').references(() => alertRecipients.id),
  workItemId: text('work_item_id').references(() => workItems.id),
  status: text('status').notNull().default('Pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  sentAt: timestamp('sent_at'),
})

export const alertEvents = pgTable('alert_events', {
  id: text('id').primaryKey().$defaultFn(id),
  recipientId: text('recipient_id').references(() => alertRecipients.id),
  deliveryId: text('delivery_id').references(() => alertDeliveries.id),
  eventType: text('event_type').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const osMessageThreads = pgTable('os_message_threads', {
  id: text('id').primaryKey().$defaultFn(id),
  subject: text('subject').notNull(),
  participantNames: jsonb('participant_names').$type<string[]>().default([]),
  lastMessageAt: timestamp('last_message_at').notNull().defaultNow(),
  unreadCount: integer('unread_count').notNull().default(0),
  isPinned: boolean('is_pinned').notNull().default(false),
  linkedWorkItemId: text('linked_work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// FineGuard workflow tables
export const fgCompanySnapshots = pgTable('fg_company_snapshots', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: varchar('run_id', { length: 36 }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  rawData: jsonb('raw_data').notNull(),
  companyName: varchar('company_name', { length: 255 }),
  companyStatus: varchar('company_status', { length: 50 }),
  accountsNextDue: date('accounts_next_due'),
  confirmationStatementNextDue: date('confirmation_statement_next_due'),
  lastAccountsMadeUpTo: date('last_accounts_made_up_to'),
  lastConfirmationStatementDate: date('last_confirmation_statement_date'),
  fetchedAt: timestamp('fetched_at').notNull().defaultNow(),
})

export const fgAlerts = pgTable('fg_alerts', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  alertType: varchar('alert_type', { length: 50 }).notNull(),
  dueDate: date('due_date').notNull(),
  reminderDate: date('reminder_date').notNull(),
  daysBefore: integer('days_before').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  processedAt: timestamp('processed_at'),
})

export const fgReminderEvents = pgTable('fg_reminder_events', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: varchar('run_id', { length: 36 }),
  alertId: uuid('alert_id').references(() => fgAlerts.id, { onDelete: 'cascade' }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  detail: text('detail'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
})

export const fgMessageLogs = pgTable('fg_message_logs', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: varchar('run_id', { length: 36 }),
  companyNumber: varchar('company_number', { length: 50 }).notNull(),
  channel: varchar('channel', { length: 20 }).notNull().default('email'),
  recipient: varchar('recipient', { length: 255 }),
  subject: varchar('subject', { length: 500 }),
  body: text('body'),
  status: varchar('status', { length: 20 }).notNull().default('logged'),
  sentAt: timestamp('sent_at').notNull().defaultNow(),
})

export const fgActivityLog = pgTable('fg_activity_log', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: varchar('run_id', { length: 36 }),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: varchar('entity_id', { length: 255 }),
  action: varchar('action', { length: 100 }).notNull(),
  detail: jsonb('detail'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
})

// UltraCore tracking
export const utActivityEvents = pgTable('ut_activity_events', {
  id: uuid('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  workItemId: text('work_item_id').references(() => workItems.id, { onDelete: 'set null' }),
  userId: text('user_id'),
  companyId: text('company_id'),
  source: varchar('source', { length: 50 }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  occurredAt: timestamp('occurred_at').notNull().defaultNow(),
})

// Monitored companies registry
export const monitoredCompanies = pgTable('monitored_companies', {
  id: text('id').primaryKey(),
  companyNumber: varchar('company_number', { length: 50 }).notNull().unique(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastProcessedAt: timestamp('last_processed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export type WorkItem = typeof workItems.$inferSelect
export type Action = typeof actions.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect
export type Decision = typeof decisions.$inferSelect
export type Template = typeof templates.$inferSelect
export type OsMessageThread = typeof osMessageThreads.$inferSelect
