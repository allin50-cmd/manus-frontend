-- Adds subscription ID and soft-cancel support to monitored_companies.
-- stripe_subscription_id: stored at activation so cancellations can be matched
--   to the right company without a Stripe API call.
-- cancelled_at: soft-delete. NULL = active monitoring. Non-null = cancelled.
--   The daily alert cron excludes rows where cancelled_at IS NOT NULL.
--   Re-subscribing clears cancelled_at back to NULL.
ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
