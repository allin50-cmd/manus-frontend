-- ── 0006_connect_accounts.sql ─────────────────────────────────────────────────
-- Stores the mapping between internal users and Stripe Connect account IDs.
-- In this sample, a "user" is identified by their email address.
-- In production, replace created_by_email with your real user/tenant FK.

CREATE TABLE IF NOT EXISTS connected_accounts (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_account_id TEXT        NOT NULL UNIQUE,  -- e.g. acct_1ABC...
  display_name     TEXT        NOT NULL,
  email            TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by Stripe account ID (used on every webhook / API call)
CREATE INDEX IF NOT EXISTS ca_stripe_account_idx
  ON connected_accounts (stripe_account_id);
