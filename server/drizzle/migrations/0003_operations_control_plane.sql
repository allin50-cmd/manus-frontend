CREATE TABLE IF NOT EXISTS "operational_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "target" text NOT NULL,
  "override_type" varchar(32) NOT NULL,
  "value" jsonb NOT NULL DEFAULT '{}',
  "expires_at" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "created_by" text NOT NULL,
  "reason" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "operational_annotations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "incident_status" text NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "created_by" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "op_overrides_target_idx" ON "operational_overrides" ("target");
CREATE INDEX IF NOT EXISTS "op_overrides_expires_idx" ON "operational_overrides" ("expires_at");
CREATE INDEX IF NOT EXISTS "op_annotations_created_idx" ON "operational_annotations" ("created_at");
