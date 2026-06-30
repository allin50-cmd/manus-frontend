-- Captures emails from visitors who checked a company but haven't subscribed yet.
-- Used for follow-up outreach to non-converting leads.
CREATE TABLE IF NOT EXISTS fineguard_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  company_number VARCHAR(50),
  status VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
