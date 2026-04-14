-- ── 0005_attempt_count.sql ────────────────────────────────────────────────────
-- Adds attempt_count + dead_letter to prevent infinite retry loops.
-- All statements are idempotent.

-- ── Add dead_letter to stripe_event_status enum ───────────────────────────────
-- dead_letter is included in the partial unique index so exhausted events
-- cannot be re-claimed by Stripe retries.
DO $$ BEGIN
  ALTER TYPE stripe_event_status ADD VALUE IF NOT EXISTS 'dead_letter';
EXCEPTION WHEN others THEN null;
END $$;

-- ── attempt_count: tracks how many times the event has been attempted ─────────
-- Incremented by the handler on failure and by the recovery job on stale reset.
-- When attempt_count reaches MAX_ATTEMPTS (5), recovery moves to dead_letter.
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS attempt_count INTEGER NOT NULL DEFAULT 0;

-- ── event_created_at: Stripe's event.created timestamp (Unix s → TIMESTAMP) ──
-- Stored at claim time for ordering queries and recovery prioritization.
-- Denormalized from event.created * 1000 so queries don't need the payload.
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS event_created_at TIMESTAMP;

-- ── Update partial unique index to include dead_letter ────────────────────────
-- Drop the existing partial index and recreate with the expanded set.
-- dead_letter must block re-claiming; failed must allow it.
DROP INDEX IF EXISTS swe_active_event_uniq;

CREATE UNIQUE INDEX IF NOT EXISTS swe_active_event_uniq
  ON stripe_webhook_events (event_id)
  WHERE status IN ('processing', 'processed', 'dead_letter');

-- ── Index for fast recovery queries ──────────────────────────────────────────
-- Replaces the index from 0004 with a more specific partial index.
DROP INDEX IF EXISTS swe_status_created_idx;

CREATE INDEX IF NOT EXISTS swe_stale_processing_idx
  ON stripe_webhook_events (created_at)
  WHERE status = 'processing';
