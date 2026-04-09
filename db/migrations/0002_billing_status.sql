-- Create billing_status enum type
DO $$ BEGIN
  CREATE TYPE billing_status AS ENUM ('inactive', 'pending', 'active', 'past_due', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Add billing_status to monitored_companies (defaults inactive for existing rows)
ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS billing_status billing_status NOT NULL DEFAULT 'inactive';

-- Add last_checkout_session_id for tracking the most recent Stripe Checkout Session
ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS last_checkout_session_id VARCHAR(255);
