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
