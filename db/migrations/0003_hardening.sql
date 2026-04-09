-- ── 0003_hardening.sql ────────────────────────────────────────────────────────
-- Implements audit issues C1–C6, H3–H4 from the production hardening review.
-- All statements are idempotent (IF NOT EXISTS / DO $$ BEGIN ... EXCEPTION).

-- ── C1: Two-phase webhook idempotency ─────────────────────────────────────────
-- Add stripe_event_status enum (for replay/recovery tracking)
DO $$ BEGIN
  CREATE TYPE stripe_event_status AS ENUM ('processing', 'processed', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Restructure stripe_webhook_events: replace single unique eventId + processedAt
-- with status-aware columns. The unique constraint moves to a partial index.
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS status stripe_event_status NOT NULL DEFAULT 'processing';

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS payload JSONB;

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(500);

ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Make processedAt nullable (only set on success)
ALTER TABLE stripe_webhook_events
  ALTER COLUMN processed_at DROP NOT NULL,
  ALTER COLUMN processed_at DROP DEFAULT;

-- Drop the old simple unique constraint on event_id (replaced by partial index below)
DO $$ BEGIN
  ALTER TABLE stripe_webhook_events DROP CONSTRAINT stripe_webhook_events_event_id_unique;
EXCEPTION WHEN undefined_object THEN null;
END $$;

-- Partial unique index: at most one active (processing|processed) record per event.
-- Failed events may be retried and will update their status back to processing.
CREATE UNIQUE INDEX IF NOT EXISTS swe_active_event_uniq
  ON stripe_webhook_events (event_id)
  WHERE status IN ('processing', 'processed');

-- ── C5/C6: Billing state machine audit columns + indexes ──────────────────────
ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS billing_status_updated_at TIMESTAMP;

-- Indexes for customer/subscription lookups (were O(n) full-table scans before)
CREATE INDEX IF NOT EXISTS mc_stripe_customer_idx
  ON monitored_companies (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mc_stripe_subscription_idx
  ON monitored_companies (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ── H3: cancelled_reason column on compliance_alerts ─────────────────────────
-- Allows reactivateAlertsForCompany to only reactivate billing-cancelled alerts,
-- not alerts cancelled for other reasons (manual admin, etc.)
ALTER TABLE compliance_alerts
  ADD COLUMN IF NOT EXISTS cancelled_reason VARCHAR(50);

-- ── C3: Unique obligation per (company, type) ─────────────────────────────────
-- Prevents double-insertion of obligations on concurrent/retried activation.
CREATE UNIQUE INDEX IF NOT EXISTS co_company_type_uniq
  ON compliance_obligations (monitored_company_id, obligation_type);
