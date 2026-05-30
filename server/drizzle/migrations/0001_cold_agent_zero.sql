ALTER TABLE "clerk_audit_events" ALTER COLUMN "entity_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clerk_audit_events" ADD COLUMN "entity_uuid" uuid;--> statement-breakpoint
ALTER TABLE "clerk_audit_events" ADD COLUMN "correlation_id" uuid;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_entity_uuid_idx" ON "clerk_audit_events" ("tenant_id","entity_type","entity_uuid");