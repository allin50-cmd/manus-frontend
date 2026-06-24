-- ─── Migration 0004: Email integrity constraint + ops visibility view ─────────
--
-- 1. Adds a CHECK constraint requiring active (non-cancelled) monitored companies
--    to have an email address. NOT VALID means existing rows are not checked
--    immediately — only new inserts and updates are enforced. This allows the
--    migration to succeed even if historic rows have a null email, while blocking
--    any future activation without an email.
--
--    To validate existing rows after ops has reviewed and fixed them:
--      VALIDATE CONSTRAINT active_company_requires_email;
--
-- 2. Adds a VIEW for operational monitoring queries. Run these in Supabase
--    SQL Editor or any postgres client connected to the production database.

-- ─── Constraint ───────────────────────────────────────────────────────────────
-- Wrapped in DO block so re-running the migration is safe (idempotent).
-- PostgreSQL raises duplicate_object if the constraint already exists;
-- we catch that and continue rather than erroring.

DO $$ BEGIN
  ALTER TABLE monitored_companies
    ADD CONSTRAINT active_company_requires_email
    CHECK (cancelled_at IS NOT NULL OR email IS NOT NULL)
    NOT VALID;
EXCEPTION WHEN duplicate_object THEN
  RAISE NOTICE 'Constraint active_company_requires_email already exists — skipping.';
END $$;

-- ─── Ops visibility view ──────────────────────────────────────────────────────

CREATE OR REPLACE VIEW fineguard_ops_status AS

-- Category 1: Active companies with no email — will never receive alerts.
-- This should always be empty. If rows appear here, ops action is required.
SELECT
  'active_missing_email'            AS category,
  mc.company_number,
  mc.company_name,
  mc.email,
  mc.stripe_session_id              AS reference,
  mc.activated_at                   AS event_time,
  'No email — alerts cannot send'   AS detail
FROM monitored_companies mc
WHERE mc.email IS NULL
  AND mc.cancelled_at IS NULL

UNION ALL

-- Category 2: Manual activations (no Stripe payment recorded).
-- These bypassed checkout. Review to confirm they are legitimate admin actions.
SELECT
  'manual_activation'               AS category,
  mc.company_number,
  mc.company_name,
  mc.email,
  mc.stripe_session_id              AS reference,
  mc.activated_at                   AS event_time,
  'Activated without Stripe payment' AS detail
FROM monitored_companies mc
WHERE mc.stripe_session_id = 'manual'
  AND mc.cancelled_at IS NULL

UNION ALL

-- Category 3: Alerts sent in the last 7 days.
-- Use this to confirm the cron is running and emails are going out.
SELECT
  'alert_sent'                                                          AS category,
  ah.company_number,
  mc.company_name,
  mc.email,
  ah.deadline_type                                                      AS reference,
  ah.sent_at                                                            AS event_time,
  CONCAT(ah.deadline_type, ' · due ', ah.due_date, ' · ', ah.days_before::text, '-day window') AS detail
FROM alert_history ah
LEFT JOIN monitored_companies mc ON mc.company_number = ah.company_number
WHERE ah.sent_at > NOW() - INTERVAL '7 days'

UNION ALL

-- Category 4: Recently cancelled subscriptions.
SELECT
  'cancelled'                       AS category,
  mc.company_number,
  mc.company_name,
  mc.email,
  mc.stripe_subscription_id        AS reference,
  mc.cancelled_at                   AS event_time,
  'Subscription cancelled'          AS detail
FROM monitored_companies mc
WHERE mc.cancelled_at IS NOT NULL
  AND mc.cancelled_at > NOW() - INTERVAL '30 days'

ORDER BY event_time DESC NULLS LAST;

COMMENT ON VIEW fineguard_ops_status IS
'FineGuard operational monitoring view. Run in Supabase SQL Editor.
 Useful queries:
   SELECT * FROM fineguard_ops_status WHERE category = ''active_missing_email'';
   SELECT * FROM fineguard_ops_status WHERE category = ''alert_sent'' ORDER BY event_time DESC;
   SELECT * FROM fineguard_ops_status WHERE category = ''manual_activation'';
   SELECT COUNT(*), category FROM fineguard_ops_status GROUP BY category;
 Last cron run (approximate — time of last alert sent or skipped):
   SELECT MAX(sent_at) AS last_alert_sent FROM alert_history;
 All active companies summary:
   SELECT company_name, company_number, email, activated_at
   FROM monitored_companies WHERE cancelled_at IS NULL ORDER BY activated_at DESC;';
