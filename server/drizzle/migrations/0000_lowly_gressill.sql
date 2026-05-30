CREATE TABLE IF NOT EXISTS "clerk_audit_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" integer NOT NULL,
	"action" varchar(64) NOT NULL,
	"actor_id" integer,
	"actor_open_id" varchar(64),
	"previous_state" text,
	"next_state" text,
	"metadata" text,
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
CREATE INDEX IF NOT EXISTS "audit_tenant_idx" ON "clerk_audit_events" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_idx" ON "clerk_audit_events" ("tenant_id","entity_type","entity_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bundles_tenant_idx" ON "clerk_bundles" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bundles_case_idx" ON "clerk_bundles" ("tenant_id","case_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cases_ref_tenant_idx" ON "clerk_cases" ("tenant_id","reference_number");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cases_tenant_idx" ON "clerk_cases" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "allocations_tenant_idx" ON "clerk_allocations" ("tenant_id");--> statement-breakpoint
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
 ALTER TABLE "clerk_allocations" ADD CONSTRAINT "clerk_allocations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE cascade ON UPDATE no action;
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
