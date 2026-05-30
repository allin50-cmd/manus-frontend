CREATE TABLE IF NOT EXISTS "pie_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ref" text NOT NULL,
	"address" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"date_scraped" text NOT NULL,
	"inferred_build_type" text NOT NULL,
	"inferred_floor_area_m2" numeric NOT NULL,
	"estimate_confidence" text DEFAULT 'low' NOT NULL,
	"rate_source" text DEFAULT 'placeholder' NOT NULL,
	"rate_validation_status" text DEFAULT 'PLACEHOLDER_RATE_REQUIRES_ACCURACY_VALIDATION' NOT NULL,
	"floor_area_source" text NOT NULL,
	"floor_area_confidence" text DEFAULT 'low' NOT NULL,
	"opportunity_score" integer NOT NULL,
	"estimated_build_value" numeric NOT NULL,
	"crm_stage" text DEFAULT 'New' NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pie_leads_ref_unique" UNIQUE("ref")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_pie_leads_crm_stage" ON "pie_leads" ("crm_stage");
