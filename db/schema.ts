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

export const osPeople = pgTable('os_people', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  title: text('title'),
  department: text('department'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const osTasks = pgTable('os_tasks', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('Open'),
  priority: priority('priority').notNull().default('Medium'),
  assignedTo: text('assigned_to'),
  dueDate: timestamp('due_date'),
  createdBy: text('created_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const osCallLogs = pgTable('os_call_logs', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  personId: text('person_id').references(() => osPeople.id, { onDelete: 'set null' }),
  direction: text('direction').notNull(),
  duration: integer('duration'),
  transcript: text('transcript'),
  notes: text('notes'),
  recordedAt: timestamp('recorded_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const osMessages = pgTable('os_messages', {
  id: text('id').primaryKey().$defaultFn(id),
  threadId: text('thread_id').notNull().references(() => osMessageThreads.id, { onDelete: 'cascade' }),
  fromPerson: text('from_person').notNull(),
  body: text('body').notNull(),
  attachments: jsonb('attachments').$type<string[]>().default([]),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const osQuotes = pgTable('os_quotes', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  quoteNumber: varchar('quote_number', { length: 50 }).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: text('status').notNull().default('Draft'),
  issueDate: timestamp('issue_date').notNull(),
  expiryDate: timestamp('expiry_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const osInvoices = pgTable('os_invoices', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  status: text('status').notNull().default('Draft'),
  issueDate: timestamp('issue_date').notNull(),
  dueDate: timestamp('due_date'),
  paidAt: timestamp('paid_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const osDocuments = pgTable('os_documents', {
  id: text('id').primaryKey().$defaultFn(id),
  companyId: text('company_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: varchar('file_type', { length: 50 }).notNull(),
  fileSize: integer('file_size'),
  storageUrl: text('storage_url').notNull(),
  category: text('category'),
  tags: jsonb('tags').$type<string[]>().default([]),
  uploadedBy: text('uploaded_by').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export type WorkItem = typeof workItems.$inferSelect
export type Action = typeof actions.$inferSelect
export type ActivityLog = typeof activityLogs.$inferSelect
export type Decision = typeof decisions.$inferSelect
export type Template = typeof templates.$inferSelect
export type OsMessageThread = typeof osMessageThreads.$inferSelect
export type OsPerson = typeof osPeople.$inferSelect
export type OsTask = typeof osTasks.$inferSelect
export type OsCallLog = typeof osCallLogs.$inferSelect
export type OsMessage = typeof osMessages.$inferSelect
export type OsQuote = typeof osQuotes.$inferSelect
export type OsInvoice = typeof osInvoices.$inferSelect
export type OsDocument = typeof osDocuments.$inferSelect
