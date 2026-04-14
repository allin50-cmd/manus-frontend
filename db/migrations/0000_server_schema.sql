-- =============================================================================
-- Migration: 0000_server_schema.sql
-- Description: Baseline billing + operational tables.
--              Must run BEFORE 0001_temporal_core.sql which ALTERs these tables.
--              All statements are idempotent (CREATE ... IF NOT EXISTS).
-- =============================================================================

-- ── monitored_companies ───────────────────────────────────────────────────────
-- Canonical company row.  Subsequent migrations add:
--   0001: tenant_id
--   0002: billing_status, last_checkout_session_id
--   0003: billing_status_updated_at
--   0004: last_stripe_event_at

CREATE TABLE IF NOT EXISTS monitored_companies (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number         VARCHAR(50)  NOT NULL UNIQUE,
  company_name           VARCHAR(255) NOT NULL,
  stripe_session_id      VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id     VARCHAR(255),
  activated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── compliance_alerts ─────────────────────────────────────────────────────────
-- Per-company alert subscriptions.  0003 adds cancelled_reason.

CREATE TABLE IF NOT EXISTS compliance_alerts (
  id                     UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number         VARCHAR(50) NOT NULL,
  alert_type             VARCHAR(50) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  stripe_item_id         VARCHAR(255),
  status                 VARCHAR(20) NOT NULL DEFAULT 'active',
  activated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS alerts_company_alert_uniq
  ON compliance_alerts (company_number, alert_type);
CREATE INDEX IF NOT EXISTS alerts_company_number_idx ON compliance_alerts (company_number);
CREATE INDEX IF NOT EXISTS alerts_status_idx         ON compliance_alerts (status);

-- ── stripe_webhook_events ─────────────────────────────────────────────────────
-- Webhook idempotency log.  0003 adds status/payload/failure_reason/created_at,
-- 0004 adds error_type, 0005 adds attempt_count/event_created_at/dead_letter.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id     VARCHAR(255) NOT NULL UNIQUE,
  type         VARCHAR(100) NOT NULL,
  processed_at TIMESTAMPTZ
);

-- ── zapier_hooks ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS zapier_hooks (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  url        TEXT         NOT NULL,
  event      VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zapier_hooks_event_idx ON zapier_hooks (event);

-- ── deployment_status ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deployment_status (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  environment  VARCHAR(20) NOT NULL,
  status       VARCHAR(20) NOT NULL,
  commit       VARCHAR(50) NOT NULL,
  workflow_run VARCHAR(50) NOT NULL,
  deployed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── leads ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  company    VARCHAR(255),
  product    VARCHAR(50),
  phone      VARCHAR(50),
  message    TEXT,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── intake_forms ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intake_forms (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_ref    VARCHAR(50)  NOT NULL UNIQUE,
  client_name   VARCHAR(255) NOT NULL,
  client_email  VARCHAR(255),
  client_phone  VARCHAR(50),
  matter_type   VARCHAR(100) NOT NULL,
  urgency       VARCHAR(20)  NOT NULL,
  description   TEXT,
  claim_value   VARCHAR(50),
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── compliance_bundles ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_bundles (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id        VARCHAR(50)  NOT NULL UNIQUE,
  company_name     VARCHAR(255) NOT NULL,
  company_number   VARCHAR(50)  NOT NULL,
  requestor_name   VARCHAR(255),
  requestor_email  VARCHAR(255),
  bundle_type      VARCHAR(50)  DEFAULT 'full',
  estimated_time   VARCHAR(100),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ── contacts ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS contacts (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255),
  message    TEXT         NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
