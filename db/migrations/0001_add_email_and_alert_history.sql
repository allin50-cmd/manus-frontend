-- Add email column to monitored_companies so we know where to send alerts
ALTER TABLE monitored_companies ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- alert_history prevents duplicate deadline alerts.
-- One row per (company, deadline type, due date, days-before threshold).
CREATE TABLE IF NOT EXISTS alert_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  deadline_type VARCHAR(50) NOT NULL,
  due_date VARCHAR(10) NOT NULL,
  days_before INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS alert_history_unique_idx
  ON alert_history (company_number, deadline_type, due_date, days_before);
