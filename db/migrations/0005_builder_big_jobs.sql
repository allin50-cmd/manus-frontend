-- Migration 0005: Builder Big Jobs Leads
-- Apply via Supabase SQL Editor.
-- Idempotent: safe to run twice.

CREATE TABLE IF NOT EXISTS builder_big_jobs_leads (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source              VARCHAR(100) NOT NULL DEFAULT 'intake_form',
  company_name        VARCHAR(255) NOT NULL,
  contact_name        VARCHAR(255) NOT NULL,
  email               VARCHAR(255) NOT NULL,
  phone               VARCHAR(50),
  postcode_area       VARCHAR(255),
  job_types           TEXT,
  min_job_size_band   VARCHAR(50),
  max_travel_miles    INTEGER,
  preferred_contact   VARCHAR(50),
  notes               TEXT,
  estimated_value_band VARCHAR(50),
  planning_status     VARCHAR(50),
  lead_score          INTEGER NOT NULL DEFAULT 0,
  status              VARCHAR(50) NOT NULL DEFAULT 'new',
  assigned_to         VARCHAR(100),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bbj_leads_status_idx ON builder_big_jobs_leads (status);
CREATE INDEX IF NOT EXISTS bbj_leads_score_idx  ON builder_big_jobs_leads (lead_score DESC);
CREATE INDEX IF NOT EXISTS bbj_leads_created_idx ON builder_big_jobs_leads (created_at DESC);
