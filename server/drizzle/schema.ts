import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  date,
} from 'drizzle-orm/pg-core';

// ─── Users / Clerks ──────────────────────────────────────────────────────────

export const users = pgTable('clerk_users', {
  id: serial('id').primaryKey(),
  openId: varchar('open_id', { length: 64 }).notNull().unique(),
  name: text('name'),
  email: varchar('email', { length: 320 }),
  loginMethod: varchar('login_method', { length: 64 }),
  role: varchar('role', { length: 64 }).default('standard clerk').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastSignedIn: timestamp('last_signed_in').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Cases ───────────────────────────────────────────────────────────────────

export const cases = pgTable('clerk_cases', {
  id: serial('id').primaryKey(),
  referenceNumber: varchar('reference_number', { length: 64 }).notNull().unique(),
  title: text('title').notNull(),
  // open | in_progress | closed | on_hold
  status: varchar('status', { length: 32 }).default('open').notNull(),
  caseType: varchar('case_type', { length: 64 }).notNull(),
  plaintiff: text('plaintiff').notNull(),
  defendant: text('defendant').notNull(),
  judge: varchar('judge', { length: 255 }),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ─── Hearings ────────────────────────────────────────────────────────────────

export const hearings = pgTable('clerk_hearings', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').notNull(),
  hearingDate: date('hearing_date').notNull(),
  // HH:mm
  hearingTime: varchar('hearing_time', { length: 5 }).notNull(),
  courtroom: varchar('courtroom', { length: 64 }).notNull(),
  judge: varchar('judge', { length: 255 }).notNull(),
  // scheduled | completed | postponed | cancelled
  status: varchar('status', { length: 32 }).default('scheduled').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = typeof hearings.$inferInsert;

// ─── Documents ───────────────────────────────────────────────────────────────

export const documents = pgTable('clerk_documents', {
  id: serial('id').primaryKey(),
  caseId: integer('case_id').notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileUrl: text('file_url').notNull(),
  fileType: varchar('file_type', { length: 32 }).notNull(),
  fileSize: integer('file_size'),
  documentType: varchar('document_type', { length: 64 }).notNull(),
  uploadedBy: integer('uploaded_by').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Clerk Allocations ───────────────────────────────────────────────────────

export const clerkAllocations = pgTable('clerk_allocations', {
  id: serial('id').primaryKey(),
  clerkId: integer('clerk_id').notNull(),
  caseId: integer('case_id').notNull(),
  taskType: varchar('task_type', { length: 64 }).notNull(),
  // low | medium | high | urgent
  priority: varchar('priority', { length: 16 }).default('medium').notNull(),
  // pending | in_progress | completed | cancelled
  status: varchar('status', { length: 32 }).default('pending').notNull(),
  dueDate: date('due_date'),
  notes: text('notes'),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ClerkAllocation = typeof clerkAllocations.$inferSelect;
export type InsertClerkAllocation = typeof clerkAllocations.$inferInsert;

// ─── Clerk Diaries ───────────────────────────────────────────────────────────

export const clerkDiaries = pgTable('clerk_diaries', {
  id: serial('id').primaryKey(),
  clerkId: integer('clerk_id').notNull(),
  // YYYY-MM-DD
  date: date('date').notNull(),
  hearingId: integer('hearing_id'),
  allocationId: integer('allocation_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type ClerkDiary = typeof clerkDiaries.$inferSelect;
export type InsertClerkDiary = typeof clerkDiaries.$inferInsert;

// ─── Audit Events ─────────────────────────────────────────────────────────────

export const auditEvents = pgTable('clerk_audit_events', {
  id: serial('id').primaryKey(),
  entityType: varchar('entity_type', { length: 64 }).notNull(),
  entityId: integer('entity_id').notNull(),
  action: varchar('action', { length: 64 }).notNull(),
  actorId: integer('actor_id'),
  actorOpenId: varchar('actor_open_id', { length: 64 }),
  previousState: text('previous_state'),
  nextState: text('next_state'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;
