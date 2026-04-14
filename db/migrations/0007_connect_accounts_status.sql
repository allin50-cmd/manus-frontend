-- ── 0007_connect_accounts_status.sql ─────────────────────────────────────────
-- Adds subscription and capability tracking to the connected_accounts table
-- so webhook handlers can persist state changes from Stripe events.
-- All statements are idempotent (ADD COLUMN IF NOT EXISTS).

-- ── Subscription tracking ─────────────────────────────────────────────────────
-- Populated by customer.subscription.updated / deleted webhook events.

-- The Stripe subscription ID (sub_***) for the platform subscription.
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Current subscription lifecycle status.
-- Values mirror Stripe: active, trialing, past_due, paused, cancelled.
-- NULL = no subscription yet.
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS subscription_status TEXT;

-- The Stripe price ID currently on the subscription (e.g. price_***).
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS subscription_price_id TEXT;

-- Timestamp of the last successful invoice payment.
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ;

-- ── Capability tracking ───────────────────────────────────────────────────────
-- Populated by v2.core.account[configuration.merchant].capability_status_updated
-- and v2.core.account[configuration.customer].capability_status_updated events.

-- card_payments capability status: pending | inactive | active | restricted
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS card_payments_status TEXT;

-- customer capability status (e.g. bank_transfers, link)
ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS customer_capability_status TEXT;

-- ── Index: fast lookup by subscription status ─────────────────────────────────
-- Useful for queries like "show all past_due accounts" for an admin dashboard.
CREATE INDEX IF NOT EXISTS ca_subscription_status_idx
  ON connected_accounts (subscription_status)
  WHERE subscription_status IS NOT NULL;
