DO $$ BEGIN
 CREATE TYPE "ActionStatus" AS ENUM('Open', 'Done', 'Cancelled', 'Blocked');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "ActionType" AS ENUM('LogNote', 'CreateFollowUp', 'ChangeStatus', 'DraftMessage', 'EscalateToGeorge', 'GenerateDocument', 'MarkComplete', 'Archive', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "DecisionStatus" AS ENUM('Open', 'Approved', 'Rejected', 'MoreInfoNeeded', 'Paused');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "EventType" AS ENUM('Created', 'NoteAdded', 'StatusChanged', 'ActionCreated', 'ActionCompleted', 'DecisionRequested', 'DecisionMade', 'FollowUpSet', 'Archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "Priority" AS ENUM('Low', 'Medium', 'High', 'Urgent');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "WorkItemStatus" AS ENUM('Captured', 'Controlled', 'InProgress', 'Waiting', 'FollowUpDue', 'Escalated', 'DecisionNeeded', 'Completed', 'Paused', 'NotFit', 'Archived');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "WorkItemType" AS ENUM('Partnership', 'ConstructionLead', 'PlanningLead', 'ComplianceAlert', 'DocumentRecord', 'MediaBrief', 'InternalTask', 'Other');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "actions" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"action_type" "ActionType" NOT NULL,
	"label" text NOT NULL,
	"status" "ActionStatus" DEFAULT 'Open' NOT NULL,
	"assigned_to" text,
	"due_date" timestamp,
	"result" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "activity_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"action_id" text,
	"person" text NOT NULL,
	"event_type" "EventType" NOT NULL,
	"summary" text NOT NULL,
	"old_status" text,
	"new_status" text,
	"evidence_link" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_allocations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"clerk_id" integer NOT NULL,
	"case_id" integer NOT NULL,
	"task_type" varchar(64) NOT NULL,
	"priority" varchar(16) DEFAULT 'medium' NOT NULL,
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"due_date" date,
	"notes" text,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" integer,
	"entity_uuid" uuid,
	"action" varchar(64) NOT NULL,
	"actor_id" integer,
	"actor_open_id" varchar(64),
	"previous_state" text,
	"next_state" text,
	"metadata" text,
	"correlation_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_bundles" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" integer NOT NULL,
	"index_json" jsonb,
	"pdf_blob_path" text,
	"audit_hash" varchar(64),
	"status" varchar(32) DEFAULT 'pending' NOT NULL,
	"orchestration_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_cases" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"reference_number" varchar(64) NOT NULL,
	"title" text NOT NULL,
	"status" varchar(32) DEFAULT 'open' NOT NULL,
	"case_type" varchar(64) NOT NULL,
	"plaintiff" text NOT NULL,
	"defendant" text NOT NULL,
	"judge" varchar(255),
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_diaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"clerk_id" integer NOT NULL,
	"date" date NOT NULL,
	"hearing_id" integer,
	"allocation_id" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" integer NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"blob_path" text,
	"file_url" text NOT NULL,
	"file_type" varchar(32) NOT NULL,
	"file_size" integer,
	"document_type" varchar(64) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"content_hash" varchar(64),
	"approved_for_bundle" integer DEFAULT 0 NOT NULL,
	"uploaded_by" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_hearings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"case_id" integer NOT NULL,
	"hearing_date" date NOT NULL,
	"hearing_time" varchar(5) NOT NULL,
	"courtroom" varchar(64) NOT NULL,
	"judge" varchar(255) NOT NULL,
	"status" varchar(32) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "clerk_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"login_method" varchar(64),
	"role" varchar(64) DEFAULT 'standard clerk' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "compliance_bundles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bundle_id" varchar(50) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"company_number" varchar(50) NOT NULL,
	"requestor_name" varchar(255),
	"requestor_email" varchar(255),
	"bundle_type" varchar(50) DEFAULT 'full',
	"estimated_time" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "compliance_bundles_bundle_id_unique" UNIQUE("bundle_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ticket_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"subject" varchar(255),
	"message" text NOT NULL,
	"status" varchar(20) DEFAULT 'new' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "contacts_ticket_id_unique" UNIQUE("ticket_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "decisions" (
	"id" text PRIMARY KEY NOT NULL,
	"work_item_id" text NOT NULL,
	"question" text NOT NULL,
	"options" text,
	"recommendation" text,
	"decision_by" text DEFAULT 'George' NOT NULL,
	"decision" text,
	"status" "DecisionStatus" DEFAULT 'Open' NOT NULL,
	"due_date" timestamp,
	"decided_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "deployment_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"environment" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"commit" varchar(50) NOT NULL,
	"workflow_run" varchar(50) NOT NULL,
	"deployed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "intake_forms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"matter_ref" varchar(50) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_email" varchar(255),
	"client_phone" varchar(50),
	"matter_type" varchar(100) NOT NULL,
	"urgency" varchar(20) NOT NULL,
	"description" text,
	"claim_value" varchar(50),
	"source_ref" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "intake_forms_matter_ref_unique" UNIQUE("matter_ref")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"company" varchar(255),
	"product" varchar(50),
	"phone" varchar(50),
	"message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "leads_lead_id_unique" UNIQUE("lead_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "monitored_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_number" varchar(50) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"stripe_session_id" varchar(255) NOT NULL,
	"activated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "monitored_companies_company_number_unique" UNIQUE("company_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "templates" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"use_case" text NOT NULL,
	"body" text NOT NULL,
	"approved" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"plan" varchar(32) DEFAULT 'free' NOT NULL,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "work_items" (
	"id" text PRIMARY KEY NOT NULL,
	"type" "WorkItemType" NOT NULL,
	"title" text NOT NULL,
	"company" text,
	"contact_name" text,
	"owner" text NOT NULL,
	"status" "WorkItemStatus" DEFAULT 'Captured' NOT NULL,
	"priority" "Priority" DEFAULT 'Medium' NOT NULL,
	"next_action" text,
	"due_date" timestamp,
	"decision_needed" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "allocations_tenant_idx" ON "clerk_allocations" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_tenant_idx" ON "clerk_audit_events" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "clerk_audit_events" ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_uuid_idx" ON "clerk_audit_events" ("tenant_id","entity_type","entity_uuid");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bundles_tenant_idx" ON "clerk_bundles" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bundles_case_idx" ON "clerk_bundles" ("tenant_id","case_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cases_ref_tenant_idx" ON "clerk_cases" ("tenant_id","reference_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_tenant_idx" ON "clerk_cases" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diaries_tenant_idx" ON "clerk_diaries" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "diaries_clerk_date_idx" ON "clerk_diaries" ("tenant_id","clerk_id","date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_tenant_idx" ON "clerk_documents" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_case_idx" ON "clerk_documents" ("tenant_id","case_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hearings_tenant_idx" ON "clerk_hearings" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "hearings_case_idx" ON "clerk_hearings" ("tenant_id","case_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_open_id_tenant_idx" ON "clerk_users" ("tenant_id","open_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_tenant_idx" ON "clerk_users" ("tenant_id","email");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_idx" ON "clerk_users" ("tenant_id");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "actions" ADD CONSTRAINT "actions_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_action_id_actions_id_fk" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_allocations" ADD CONSTRAINT "clerk_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_audit_events" ADD CONSTRAINT "clerk_audit_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_bundles" ADD CONSTRAINT "clerk_bundles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_cases" ADD CONSTRAINT "clerk_cases_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_diaries" ADD CONSTRAINT "clerk_diaries_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_documents" ADD CONSTRAINT "clerk_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_hearings" ADD CONSTRAINT "clerk_hearings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "clerk_users" ADD CONSTRAINT "clerk_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "decisions" ADD CONSTRAINT "decisions_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "work_items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
