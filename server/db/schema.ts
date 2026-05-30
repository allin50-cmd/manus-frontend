import { pgTable, uuid, varchar, timestamp, text, boolean, jsonb, integer, numeric, index } from 'drizzle-orm/pg-core';
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

/**
 * Audit Leads Table
 * Tracks prospects who signed up for the free AI revenue audit
 */
export const auditLeads = pgTable('audit_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull().unique(),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  chamberSize: varchar('chamber_size', { length: 50 }),
  painPoints: text('pain_points'), // JSON array stored as text
  stage: varchar('stage', { length: 50 }).default('signed_up').notNull(), // signed_up, audit_viewed, negotiating, closed_won, escalated
  agentDecision: text('agent_decision'), // Last JSON decision from sales agent
  auditViewedAt: timestamp('audit_viewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLead = typeof auditLeads.$inferSelect;
export type NewAuditLead = typeof auditLeads.$inferInsert;

/**
 * Zapier REST-hook Subscriptions Table
 * Stores active Zapier webhook subscriptions per event type.
 */
export const zapierSubscriptions = pgTable('zapier_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  hookUrl: text('hook_url').notNull(),
  event: varchar('event', { length: 100 }).notNull(), // new_audit_lead | new_lead | deal_escalated | deal_closed
  apiKey: varchar('api_key', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type ZapierSubscription = typeof zapierSubscriptions.$inferSelect;
export type NewZapierSubscription = typeof zapierSubscriptions.$inferInsert;

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

// ── FineGuard Alert Centre ────────────────────────────────────────────────────

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alerts = pgTable('alerts', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  title: text('title').notNull(),
  description: text('description'),
  source: varchar('source', { length: 20 }).notNull(),       // voice_agent|api|manual|system
  severity: varchar('severity', { length: 10 }).notNull(),   // LOW|MEDIUM|HIGH|CRITICAL
  status: varchar('status', { length: 10 }).notNull().default('OPEN'), // OPEN|ESCALATED|CRITICAL|CLOSED
  ownerId: uuid('owner_id'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  statusChangedAt: timestamp('status_changed_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const escalationRules = pgTable('escalation_rules', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  condition: jsonb('condition').notNull(), // {"status":"OPEN","severity":"HIGH","min_minutes":15}
  targetStatus: varchar('target_status', { length: 10 }).notNull(), // ESCALATED|CRITICAL
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const alertEvents = pgTable('alert_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  alertId: uuid('alert_id').notNull(),
  companyId: uuid('company_id').notNull(),
  eventType: varchar('event_type', { length: 30 }).notNull(),
  previousValue: jsonb('previous_value'),
  newValue: jsonb('new_value'),
  createdBy: text('created_by'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type Company = typeof companies.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type EscalationRule = typeof escalationRules.$inferSelect;
export type AlertEvent = typeof alertEvents.$inferSelect;

// ── PIE Leads ─────────────────────────────────────────────────────────────────

export const pieLeads = pgTable('pie_leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  ref: text('ref').notNull().unique(),
  address: text('address').notNull(),
  description: text('description').notNull().default(''),
  source: text('source').notNull().default(''),
  dateScraped: text('date_scraped').notNull(),
  inferredBuildType: text('inferred_build_type').notNull(),
  inferredFloorAreaM2: numeric('inferred_floor_area_m2').notNull(),
  estimateConfidence: text('estimate_confidence').notNull().default('low'),
  rateSource: text('rate_source').notNull().default('placeholder'),
  rateValidationStatus: text('rate_validation_status').notNull().default('PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION'),
  floorAreaSource: text('floor_area_source').notNull(),
  floorAreaConfidence: text('floor_area_confidence').notNull().default('low'),
  opportunityScore: integer('opportunity_score').notNull(),
  estimatedBuildValue: numeric('estimated_build_value').notNull(),
  crmStage: text('crm_stage').notNull().default('New'),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  crmStageIdx: index('idx_pie_leads_crm_stage').on(t.crmStage),
}));

export type PieLead = typeof pieLeads.$inferSelect;
export type NewPieLead = typeof pieLeads.$inferInsert;
