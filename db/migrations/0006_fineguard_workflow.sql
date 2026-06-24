-- Migration 0006: FineGuard workflow tables
-- Adds: fg_company_snapshots, fg_alerts, fg_reminder_events, fg_message_logs, fg_activity_log

CREATE TABLE IF NOT EXISTS fg_company_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  raw_data JSONB NOT NULL,
  company_name VARCHAR(255),
  company_status VARCHAR(50),
  accounts_next_due DATE,
  confirmation_statement_next_due DATE,
  last_accounts_made_up_to DATE,
  last_confirmation_statement_date DATE,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fg_snapshots_company_idx ON fg_company_snapshots (company_number);
CREATE INDEX IF NOT EXISTS fg_snapshots_fetched_idx ON fg_company_snapshots (fetched_at DESC);

CREATE TABLE IF NOT EXISTS fg_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  alert_type VARCHAR(50) NOT NULL,
  due_date DATE NOT NULL,
  reminder_date DATE NOT NULL,
  days_before INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  CONSTRAINT fg_alerts_unique_idx UNIQUE (company_number, alert_type, due_date, reminder_date)
);

CREATE INDEX IF NOT EXISTS fg_alerts_company_idx ON fg_alerts (company_number);
CREATE INDEX IF NOT EXISTS fg_alerts_pending_idx ON fg_alerts (status, reminder_date)
  WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS fg_reminder_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES fg_alerts (id) ON DELETE CASCADE,
  company_number VARCHAR(50) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  detail TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fg_reminder_events_alert_idx ON fg_reminder_events (alert_id);

CREATE TABLE IF NOT EXISTS fg_message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL DEFAULT 'email',
  recipient VARCHAR(255),
  subject VARCHAR(500),
  body TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'logged',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fg_message_logs_company_idx ON fg_message_logs (company_number);

CREATE TABLE IF NOT EXISTS fg_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50),
  entity_id VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  detail JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fg_activity_log_entity_idx ON fg_activity_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS fg_activity_log_occurred_idx ON fg_activity_log (occurred_at DESC);
