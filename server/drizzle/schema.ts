import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// ─── Tenant Settings type ────────────────────────────────────────────────────

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

// ─── Tenants ─────────────────────────────────────────────────────────────────

export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Subdomain identifier: acme → acme.clerkos.app
  slug: text('slug').notNull().unique(),
  // free | professional | enterprise
  plan: varchar('plan', { length: 32 }).notNull().default('free'),
  settings: jsonb('settings').$type<TenantSettings>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── Users / Clerks ──────────────────────────────────────────────────────────

export const users = pgTable(
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
    // standard clerk | admin (senior clerk / manager)
    role: varchar('role', { length: 64 }).default('standard clerk').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastSignedIn: timestamp('last_signed_in').defaultNow().notNull(),
  },
  (t) => ({
    // openId unique per tenant
    openIdTenantIdx: uniqueIndex('users_open_id_tenant_idx').on(t.tenantId, t.openId),
    // email unique per tenant
    emailTenantIdx: uniqueIndex('users_email_tenant_idx').on(t.tenantId, t.email),
    tenantIdx: index('users_tenant_idx').on(t.tenantId),
  }),
);

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Cases ───────────────────────────────────────────────────────────────────

export const cases = pgTable(
  'clerk_cases',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    referenceNumber: varchar('reference_number', { length: 64 }).notNull(),
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
  },
  (t) => ({
    // referenceNumber unique per tenant
    refTenantIdx: uniqueIndex('cases_ref_tenant_idx').on(t.tenantId, t.referenceNumber),
    tenantIdx: index('cases_tenant_idx').on(t.tenantId),
  }),
);

export type Case = typeof cases.$inferSelect;
export type InsertCase = typeof cases.$inferInsert;

// ─── Hearings ────────────────────────────────────────────────────────────────

export const hearings = pgTable(
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
    // scheduled | completed | postponed | cancelled
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

export type Hearing = typeof hearings.$inferSelect;
export type InsertHearing = typeof hearings.$inferInsert;

// ─── Documents ───────────────────────────────────────────────────────────────

export const documents = pgTable(
  'clerk_documents',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: integer('case_id').notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    // Azure Blob path: tenants/{tenantId}/cases/{caseId}/docs/{docId}/v{version}
    blobPath: text('blob_path'),
    fileUrl: text('file_url').notNull(),
    fileType: varchar('file_type', { length: 32 }).notNull(),
    fileSize: integer('file_size'),
    documentType: varchar('document_type', { length: 64 }).notNull(),
    version: integer('version').default(1).notNull(),
    // SHA-256 hash of file content for integrity checking
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

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Bundles ─────────────────────────────────────────────────────────────────

export const bundles = pgTable(
  'clerk_bundles',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    caseId: integer('case_id').notNull(),
    // JSON index of included documents
    indexJson: jsonb('index_json').$type<BundleIndex>(),
    // Azure Blob path of generated PDF
    pdfBlobPath: text('pdf_blob_path'),
    // SHA-256 of entire bundle for integrity
    auditHash: varchar('audit_hash', { length: 64 }),
    // pending | generating | ready | failed
    status: varchar('status', { length: 32 }).default('pending').notNull(),
    // Azure Durable Functions orchestration instance ID
    orchestrationId: varchar('orchestration_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('bundles_tenant_idx').on(t.tenantId),
    caseIdx: index('bundles_case_idx').on(t.tenantId, t.caseId),
  }),
);

export type BundleIndex = {
  documents: Array<{ id: number; fileName: string; documentType: string; pageRange?: string }>;
  generatedAt: string;
  caseReference: string;
};

export type Bundle = typeof bundles.$inferSelect;
export type InsertBundle = typeof bundles.$inferInsert;

// ─── Clerk Allocations ───────────────────────────────────────────────────────

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
  },
  (t) => ({
    tenantIdx: index('allocations_tenant_idx').on(t.tenantId),
  }),
);

export type ClerkAllocation = typeof clerkAllocations.$inferSelect;
export type InsertClerkAllocation = typeof clerkAllocations.$inferInsert;

// ─── Clerk Diaries ───────────────────────────────────────────────────────────

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

// ─── Audit Events ─────────────────────────────────────────────────────────────

export const auditEvents = pgTable(
  'clerk_audit_events',
  {
    id: serial('id').primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    entityType: varchar('entity_type', { length: 64 }).notNull(),
    entityId: integer('entity_id').notNull(),
    action: varchar('action', { length: 64 }).notNull(),
    actorId: integer('actor_id'),
    actorOpenId: varchar('actor_open_id', { length: 64 }),
    previousState: text('previous_state'),
    nextState: text('next_state'),
    metadata: text('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('audit_tenant_idx').on(t.tenantId),
    entityIdx: index('audit_entity_idx').on(t.tenantId, t.entityType, t.entityId),
  }),
);

export type AuditEvent = typeof auditEvents.$inferSelect;
export type InsertAuditEvent = typeof auditEvents.$inferInsert;
