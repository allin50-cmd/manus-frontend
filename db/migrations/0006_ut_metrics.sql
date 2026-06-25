CREATE TABLE IF NOT EXISTS ut_activity_events (
  id text PRIMARY KEY,
  user_id text,
  event_type text NOT NULL,
  source text,
  payload jsonb DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ut_activity_events_event_type
  ON ut_activity_events(event_type);

CREATE INDEX IF NOT EXISTS idx_ut_activity_events_occurred_at
  ON ut_activity_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_ut_activity_events_user_id
  ON ut_activity_events(user_id);

CREATE TABLE IF NOT EXISTS ut_daily_metrics (
  id text PRIMARY KEY,
  date date NOT NULL UNIQUE,
  active_users integer NOT NULL DEFAULT 0,
  events_count integer NOT NULL DEFAULT 0,
  leads_count integer NOT NULL DEFAULT 0,
  alerts_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ut_daily_metrics_date
  ON ut_daily_metrics(date);

CREATE TABLE IF NOT EXISTS ut_weekly_reports (
  id text PRIMARY KEY,
  week_start date NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft',
  summary text,
  metrics jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ut_weekly_reports_week_start
  ON ut_weekly_reports(week_start);

CREATE INDEX IF NOT EXISTS idx_ut_weekly_reports_status
  ON ut_weekly_reports(status);

CREATE TABLE IF NOT EXISTS os_quotes (
  id text PRIMARY KEY,
  quote text NOT NULL,
  author text,
  category text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
