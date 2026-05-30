CREATE TABLE IF NOT EXISTS "governance_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"rule_type" text NOT NULL,
	"rule_config" jsonb NOT NULL,
	"priority" integer DEFAULT 100 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_policies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "governance_decisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"decision_id" text NOT NULL,
	"request_digest" text NOT NULL,
	"agent_id" text NOT NULL,
	"session_id" text NOT NULL,
	"action_type" text NOT NULL,
	"target_resource" text NOT NULL,
	"decision" text NOT NULL,
	"policy_id" text,
	"conditions" jsonb,
	"reason" text,
	"decided_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "governance_decisions_decision_id_unique" UNIQUE("decision_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "rate_limit_counters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" text NOT NULL,
	"bucket" text NOT NULL,
	"request_time" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gov_decisions_agent_id" ON "governance_decisions" ("agent_id","decided_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_gov_decisions_session_id" ON "governance_decisions" ("session_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_rl_counters" ON "rate_limit_counters" ("agent_id","bucket","request_time");
--> statement-breakpoint
-- Seed default policies
INSERT INTO "governance_policies" ("name", "description", "rule_type", "rule_config", "priority", "is_active")
VALUES
  ('Block irreversible path patterns', 'Deny requests targeting system or admin paths', 'hard_block', '{"patterns":["/admin/","/system/"]}', 10, true),
  ('Rate limit 100 rpm per agent', 'Reject agents exceeding 100 requests per minute', 'rate_limit', '{"max_rpm":100,"window_seconds":60}', 20, true),
  ('Voice reception resource allowlist', 'Only allow voice-reception endpoints', 'resource_allowlist', '{"resources":["/process-transcript"]}', 30, true)
ON CONFLICT ("name") DO NOTHING;
