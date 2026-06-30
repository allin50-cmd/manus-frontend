-- Migration 0007: UltraTech OS Validation & Measurement Framework
-- Tables: ut_activity_events, ut_daily_metrics, ut_weekly_reports, os_quotes
--
-- All statements use IF NOT EXISTS — idempotent, safe to run multiple times.

-- ─── Activity event stream ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ut_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  source VARCHAR(50),
  notes TEXT,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ut_events_type_idx     ON ut_activity_events (event_type);
CREATE INDEX IF NOT EXISTS ut_events_occurred_idx ON ut_activity_events (occurred_at DESC);
CREATE INDEX IF NOT EXISTS ut_events_user_idx     ON ut_activity_events (user_id) WHERE user_id IS NOT NULL;

-- ─── Daily aggregated metrics ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ut_daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  dau INTEGER NOT NULL DEFAULT 0,
  app_opens INTEGER NOT NULL DEFAULT 0,
  tasks_created INTEGER NOT NULL DEFAULT 0,
  tasks_completed INTEGER NOT NULL DEFAULT 0,
  calls_logged INTEGER NOT NULL DEFAULT 0,
  alerts_generated INTEGER NOT NULL DEFAULT 0,
  alerts_acknowledged INTEGER NOT NULL DEFAULT 0,
  documents_uploaded INTEGER NOT NULL DEFAULT 0,
  quotes_created INTEGER NOT NULL DEFAULT 0,
  invoices_created INTEGER NOT NULL DEFAULT 0,
  companies_added INTEGER NOT NULL DEFAULT 0,
  contacts_added INTEGER NOT NULL DEFAULT 0,
  workflow_leaks INTEGER NOT NULL DEFAULT 0,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ut_daily_date_idx ON ut_daily_metrics (date DESC);

-- ─── Weekly summary reports ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ut_weekly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  week_end DATE NOT NULL,
  total_business_actions INTEGER NOT NULL DEFAULT 0,
  ut_actions INTEGER NOT NULL DEFAULT 0,
  workflow_leaks INTEGER NOT NULL DEFAULT 0,
  consolidation_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  prev_week_rate NUMERIC(5,2),
  trend VARCHAR(10),
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ut_weekly_start_idx ON ut_weekly_reports (week_start DESC);

-- ─── Quotes (proposals / estimates before invoicing) ─────────────────────────

CREATE TABLE IF NOT EXISTS os_quotes (
  id TEXT PRIMARY KEY,
  number VARCHAR(32) NOT NULL UNIQUE,
  client_name TEXT NOT NULL,
  client_email VARCHAR(255),
  description TEXT,
  amount_pence INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Draft',
  valid_until TIMESTAMPTZ,
  linked_work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS os_quotes_status_idx  ON os_quotes (status);
CREATE INDEX IF NOT EXISTS os_quotes_created_idx ON os_quotes (created_at DESC);
