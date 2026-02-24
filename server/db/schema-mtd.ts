/**
 * FineGuard MTD Database Schema
 * Production-ready tables for MTD submission, connectors, imports, and audit trail.
 * Uses Drizzle ORM with Postgres.
 */
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  text,
  boolean,
  numeric,
  integer,
  jsonb,
  index,
} from 'drizzle-orm/pg-core';

// ─── Tenants ──────────────────────────────────────────────────────────────────

/**
 * Tenants table — one row per accounting firm / client organisation.
 * All other MTD tables are scoped by tenantId for strict isolation.
 */
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  vatNumber: varchar('vat_number', { length: 20 }),
  plan: varchar('plan', { length: 30 }).default('starter').notNull(), // starter, professional, enterprise
  isActive: boolean('is_active').default(true).notNull(),
  dataResidency: varchar('data_residency', { length: 10 }).default('UK').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ─── MCP Connectors ───────────────────────────────────────────────────────────

/**
 * mcpConnectors — stores OAuth credentials and metadata for Xero / QuickBooks / Sage / Dynamics integrations.
 * Tokens are encrypted at rest; raw values are never logged.
 */
export const mcpConnectors = pgTable(
  'mcp_connectors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    provider: varchar('provider', { length: 30 }).notNull(), // xero | quickbooks | sage | dynamics365
    externalTenantId: varchar('external_tenant_id', { length: 255 }), // Xero tenantId / QB realmId
    displayName: varchar('display_name', { length: 255 }),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | active | error | revoked
    // Encrypted token storage — keys stored in Azure Key Vault
    encryptedAccessToken: text('encrypted_access_token'),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    tokenExpiresAt: timestamp('token_expires_at'),
    scopes: text('scopes'), // space-separated OAuth scopes
    webhookSecret: varchar('webhook_secret', { length: 255 }), // for HMAC verification
    lastSyncAt: timestamp('last_sync_at'),
    metadata: jsonb('metadata'), // provider-specific extras
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('mcp_connectors_tenant_idx').on(t.tenantId),
    providerIdx: index('mcp_connectors_provider_idx').on(t.provider),
  })
);

// ─── Imports ──────────────────────────────────────────────────────────────────

/**
 * imports — tracks each CSV / PDF ingestion batch.
 */
export const imports = pgTable(
  'imports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    source: varchar('source', { length: 20 }).notNull(), // csv | pdf | xero | quickbooks | sage
    filename: varchar('filename', { length: 500 }),
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | processing | validated | approved | submitted | failed
    recordCount: integer('record_count').default(0),
    errorCount: integer('error_count').default(0),
    confidenceAvg: numeric('confidence_avg', { precision: 5, scale: 2 }),
    approvedAt: timestamp('approved_at'),
    approvedBy: varchar('approved_by', { length: 255 }),
    blobUrl: text('blob_url'), // Azure Blob reference for raw file
    mappingTemplateId: uuid('mapping_template_id'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('imports_tenant_idx').on(t.tenantId),
    createdAtIdx: index('imports_created_at_idx').on(t.createdAt),
    statusIdx: index('imports_status_idx').on(t.status),
  })
);

// ─── Canonical Invoice Records ────────────────────────────────────────────────

/**
 * invoiceRecords — canonical model persisted after normalisation / mapping.
 */
export const invoiceRecords = pgTable(
  'invoice_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    importId: uuid('import_id').notNull(),
    tenantId: uuid('tenant_id').notNull(),
    // Canonical fields
    invoiceId: varchar('invoice_id', { length: 255 }),
    clientId: varchar('client_id', { length: 255 }),
    date: varchar('date', { length: 10 }).notNull(), // YYYY-MM-DD
    netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
    vatAmount: numeric('vat_amount', { precision: 15, scale: 2 }).notNull(),
    vatCode: varchar('vat_code', { length: 20 }),
    currency: varchar('currency', { length: 3 }).default('GBP').notNull(),
    source: varchar('source', { length: 20 }).notNull(), // xero|quickbooks|pdf|csv
    confidence: numeric('confidence', { precision: 5, scale: 2 }).default('1.00'),
    // Validation
    validationErrors: jsonb('validation_errors'), // array of { code, message, field }
    isValid: boolean('is_valid').default(false),
    // Raw provider data reference
    rawDataRef: text('raw_data_ref'), // encrypted blob URL
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    importIdx: index('invoice_records_import_idx').on(t.importId),
    tenantIdx: index('invoice_records_tenant_idx').on(t.tenantId),
    createdAtIdx: index('invoice_records_created_at_idx').on(t.createdAt),
  })
);

// ─── Mapping Templates ────────────────────────────────────────────────────────

/**
 * mappingTemplates — per-tenant CSV header → canonical field mapping definitions.
 */
export const mappingTemplates = pgTable(
  'mapping_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    source: varchar('source', { length: 20 }).notNull(), // csv | pdf
    mappings: jsonb('mappings').notNull(), // { headerColumn: canonicalField, ... }
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('mapping_templates_tenant_idx').on(t.tenantId),
  })
);

// ─── MTD Submissions ──────────────────────────────────────────────────────────

/**
 * mtdSubmissions — tracks each HMRC MTD VAT submission attempt with full idempotency.
 */
export const mtdSubmissions = pgTable(
  'mtd_submissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull().unique(),
    vatNumber: varchar('vat_number', { length: 20 }).notNull(),
    periodKey: varchar('period_key', { length: 20 }).notNull(), // e.g. 23AA
    periodStart: varchar('period_start', { length: 10 }).notNull(), // YYYY-MM-DD
    periodEnd: varchar('period_end', { length: 10 }).notNull(),
    // VAT return fields (HMRC payload)
    vatDueSales: numeric('vat_due_sales', { precision: 15, scale: 2 }).notNull(),
    vatDueAcquisitions: numeric('vat_due_acquisitions', { precision: 15, scale: 2 }).default('0.00'),
    totalVatDue: numeric('total_vat_due', { precision: 15, scale: 2 }).notNull(),
    vatReclaimedCurrPeriod: numeric('vat_reclaimed_curr_period', { precision: 15, scale: 2 }).default('0.00'),
    netVatDue: numeric('net_vat_due', { precision: 15, scale: 2 }).notNull(),
    totalValueSalesExVAT: numeric('total_value_sales_ex_vat', { precision: 15, scale: 0 }).notNull(),
    totalValuePurchasesExVAT: numeric('total_value_purchases_ex_vat', { precision: 15, scale: 0 }).default('0'),
    totalValueGoodsSuppliedExVAT: numeric('total_value_goods_supplied_ex_vat', { precision: 15, scale: 0 }).default('0'),
    totalAcquisitionsExVAT: numeric('total_acquisitions_ex_vat', { precision: 15, scale: 0 }).default('0'),
    finalised: boolean('finalised').default(false),
    // Submission status
    status: varchar('status', { length: 20 }).default('pending').notNull(), // pending | submitted | accepted | rejected | error
    hmrcReceiptId: varchar('hmrc_receipt_id', { length: 255 }),
    hmrcCorrelationId: varchar('hmrc_correlation_id', { length: 255 }),
    hmrcProcessingDate: varchar('hmrc_processing_date', { length: 50 }),
    hmrcFormBundleNumber: varchar('hmrc_form_bundle_number', { length: 50 }),
    // Validation
    validationErrors: jsonb('validation_errors'),
    // Audit references
    requestBlobUrl: text('request_blob_url'),
    responseBlobUrl: text('response_blob_url'),
    submittedAt: timestamp('submitted_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('mtd_submissions_tenant_idx').on(t.tenantId),
    idempotencyIdx: index('mtd_submissions_idempotency_idx').on(t.idempotencyKey),
    createdAtIdx: index('mtd_submissions_created_at_idx').on(t.createdAt),
  })
);

// ─── HMRC OAuth Tokens ────────────────────────────────────────────────────────

/**
 * hmrcTokens — stores HMRC OAuth2 tokens per tenant (encrypted).
 */
export const hmrcTokens = pgTable(
  'hmrc_tokens',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull().unique(),
    encryptedAccessToken: text('encrypted_access_token').notNull(),
    encryptedRefreshToken: text('encrypted_refresh_token'),
    expiresAt: timestamp('expires_at').notNull(),
    scopes: text('scopes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('hmrc_tokens_tenant_idx').on(t.tenantId),
  })
);

// ─── Audit Events ─────────────────────────────────────────────────────────────

/**
 * auditEvents — append-only audit log mirrored to Azure Blob WORM storage.
 * DB copy for fast querying; authoritative record is the immutable blob.
 */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id').notNull(),
    eventType: varchar('event_type', { length: 100 }).notNull(), // import.created | submission.attempted | connector.refreshed | etc.
    actorId: varchar('actor_id', { length: 255 }), // user / service identity
    resourceType: varchar('resource_type', { length: 50 }), // import | submission | connector
    resourceId: uuid('resource_id'),
    payloadSummary: jsonb('payload_summary').notNull(), // redacted summary for fast display
    blobUrl: text('blob_url'), // Azure Blob reference for full encrypted payload
    severity: varchar('severity', { length: 10 }).default('info').notNull(), // info | warn | error | critical
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('audit_events_tenant_idx').on(t.tenantId),
    eventTypeIdx: index('audit_events_event_type_idx').on(t.eventType),
    createdAtIdx: index('audit_events_created_at_idx').on(t.createdAt),
  })
);

// ─── Type Exports ─────────────────────────────────────────────────────────────

export type Tenant = typeof tenants.$inferSelect;
export type NewTenant = typeof tenants.$inferInsert;

export type McpConnector = typeof mcpConnectors.$inferSelect;
export type NewMcpConnector = typeof mcpConnectors.$inferInsert;

export type Import = typeof imports.$inferSelect;
export type NewImport = typeof imports.$inferInsert;

export type InvoiceRecord = typeof invoiceRecords.$inferSelect;
export type NewInvoiceRecord = typeof invoiceRecords.$inferInsert;

export type MappingTemplate = typeof mappingTemplates.$inferSelect;
export type NewMappingTemplate = typeof mappingTemplates.$inferInsert;

export type MtdSubmission = typeof mtdSubmissions.$inferSelect;
export type NewMtdSubmission = typeof mtdSubmissions.$inferInsert;

export type HmrcToken = typeof hmrcTokens.$inferSelect;
export type NewHmrcToken = typeof hmrcTokens.$inferInsert;

export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
