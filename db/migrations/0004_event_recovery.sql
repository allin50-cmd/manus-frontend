-- ── 0004_event_recovery.sql ───────────────────────────────────────────────────
-- Addresses stale-processing recovery, retry classification, and event ordering.
-- All statements are idempotent.

-- ── Retry classification on stripe_webhook_events ─────────────────────────────
-- Distinguishes transient failures (retryable — DB/network) from permanent ones
-- (bad metadata, logic errors).  Permanent errors are marked processed so Stripe
-- stops retrying; retryable ones surface as 500s so Stripe keeps trying.
ALTER TABLE stripe_webhook_events
  ADD COLUMN IF NOT EXISTS error_type VARCHAR(20); -- 'retryable' | 'permanent' | NULL

-- ── Event ordering guard on monitored_companies ───────────────────────────────
-- Tracks the highest Stripe event.created timestamp applied to billing status.
-- Billing transitions include a WHERE clause: last_stripe_event_at <= incoming.
-- Prevents a delayed invoice.payment_failed from overwriting a more recent
-- checkout.session.completed that already activated the company.
ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS last_stripe_event_at TIMESTAMP;

-- ── Index: find stale processing events quickly ───────────────────────────────
-- Used by resetStaleProcessingEvents() to locate events stuck in processing.
CREATE INDEX IF NOT EXISTS swe_status_created_idx
  ON stripe_webhook_events (status, created_at)
  WHERE status = 'processing';
