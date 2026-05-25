CREATE TABLE IF NOT EXISTS "global_resilience_state" (
  "dependency" text PRIMARY KEY NOT NULL,
  "circuit_state" varchar(16) NOT NULL DEFAULT 'closed',
  "failure_count" integer NOT NULL DEFAULT 0,
  "last_failure_at" timestamptz,
  "cooldown_until" timestamptz,
  "last_success_at" timestamptz,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "instance_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "scheduler_leases" (
  "lease_name" text PRIMARY KEY NOT NULL,
  "holder_instance" text NOT NULL,
  "acquired_at" timestamptz NOT NULL DEFAULT now(),
  "expires_at" timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS "global_incident_state" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "status" text NOT NULL DEFAULT 'nominal',
  "signals" jsonb,
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "instance_id" text NOT NULL
);

CREATE INDEX IF NOT EXISTS "global_resilience_state_updated_idx" ON "global_resilience_state" ("updated_at");
CREATE INDEX IF NOT EXISTS "scheduler_leases_expires_idx" ON "scheduler_leases" ("expires_at");
