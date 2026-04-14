-- =============================================================================
-- Migration: 0001_temporal_core.sql
-- Description: Temporal compliance workflow system — core tables
-- =============================================================================

-- ── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE obligation_type AS ENUM (
    'accounts_filing',
    'confirmation_statement'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE obligation_status AS ENUM (
    'pending',
    'monitoring',
    'due_soon',
    'urgent',
    'overdue',
    'resolved',
    'paused',
    'failed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE workflow_status AS ENUM (
    'running',
    'paused',
    'completed',
    'failed',
    'terminated'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_urgency AS ENUM ('low', 'medium', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_channel AS ENUM ('email', 'sms', 'dashboard');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_status AS ENUM ('queued', 'sent', 'failed', 'deduplicated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 1. tenants ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(255) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── 2. Extend monitored_companies with tenant_id (additive) ──────────────────

ALTER TABLE monitored_companies
  ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Partial unique index: only enforced when tenant_id is set (backward compat)
CREATE UNIQUE INDEX IF NOT EXISTS mc_tenant_company_uniq
  ON monitored_companies (tenant_id, company_number)
  WHERE tenant_id IS NOT NULL;

-- ── 3. users ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  email       VARCHAR(255) NOT NULL UNIQUE,
  name        VARCHAR(255) NOT NULL,
  role        VARCHAR(50) NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_tenant_id_idx ON users (tenant_id);

-- ── 4. compliance_obligations ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS compliance_obligations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID NOT NULL REFERENCES tenants(id),
  monitored_company_id  UUID NOT NULL REFERENCES monitored_companies(id),
  obligation_type       obligation_type NOT NULL,
  status                obligation_status NOT NULL DEFAULT 'pending',
  due_date              DATE,
  next_action_at        TIMESTAMP,
  workflow_id           VARCHAR(255),
  created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS co_tenant_id_idx
  ON compliance_obligations (tenant_id);
CREATE INDEX IF NOT EXISTS co_monitored_company_id_idx
  ON compliance_obligations (monitored_company_id);
CREATE INDEX IF NOT EXISTS co_due_date_idx
  ON compliance_obligations (due_date);
CREATE INDEX IF NOT EXISTS co_workflow_id_idx
  ON compliance_obligations (workflow_id);

-- ── 5. workflow_instances ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_instances (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  obligation_id  UUID NOT NULL REFERENCES compliance_obligations(id),
  workflow_id    VARCHAR(255) NOT NULL UNIQUE,
  task_queue     VARCHAR(255) NOT NULL,
  status         workflow_status NOT NULL DEFAULT 'running',
  started_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at   TIMESTAMP,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS wi_workflow_id_idx
  ON workflow_instances (workflow_id);
CREATE INDEX IF NOT EXISTS wi_obligation_id_idx
  ON workflow_instances (obligation_id);

-- ── 6. alerts ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  obligation_id  UUID NOT NULL REFERENCES compliance_obligations(id),
  urgency        alert_urgency NOT NULL,
  channel        alert_channel NOT NULL,
  status         alert_status NOT NULL DEFAULT 'queued',
  dedupe_key     VARCHAR(500) NOT NULL UNIQUE,
  due_date       DATE NOT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at        TIMESTAMP
);

CREATE INDEX IF NOT EXISTS alert_obligation_id_idx ON alerts (obligation_id);
CREATE INDEX IF NOT EXISTS alert_tenant_id_idx     ON alerts (tenant_id);
CREATE INDEX IF NOT EXISTS alert_dedupe_key_idx    ON alerts (dedupe_key);

-- ── 7. alert_attempts ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS alert_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id        UUID NOT NULL REFERENCES alerts(id),
  attempt_number  INTEGER NOT NULL,
  status          VARCHAR(50) NOT NULL,
  error_message   TEXT,
  attempted_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aa_alert_id_idx ON alert_attempts (alert_id);

-- ── 8. audit_records ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL REFERENCES tenants(id),
  entity_type  VARCHAR(100) NOT NULL,
  entity_id    UUID NOT NULL,
  event_type   VARCHAR(100) NOT NULL,
  payload      JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ar_tenant_entity_id_idx
  ON audit_records (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS ar_event_type_idx
  ON audit_records (event_type);

-- ── 9. external_source_snapshots ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS external_source_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  obligation_id  UUID NOT NULL REFERENCES compliance_obligations(id),
  source         VARCHAR(100) NOT NULL, -- e.g. 'companies_house'
  raw_data       JSONB,
  due_date       DATE,
  resolved       BOOLEAN NOT NULL DEFAULT FALSE,
  checked_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ess_obligation_id_idx
  ON external_source_snapshots (obligation_id);

-- ── 10. notification_preferences ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notification_preferences (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) UNIQUE,
  email_enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  sms_enabled       BOOLEAN NOT NULL DEFAULT FALSE,
  lead_days_low     INTEGER NOT NULL DEFAULT 30,
  lead_days_medium  INTEGER NOT NULL DEFAULT 14,
  lead_days_urgent  INTEGER NOT NULL DEFAULT 7,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── 11. escalation_policies ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS escalation_policies (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID NOT NULL REFERENCES tenants(id),
  obligation_type             obligation_type NOT NULL,
  overdue_alert_interval_hours INTEGER NOT NULL DEFAULT 24,
  max_overdue_alerts          INTEGER NOT NULL DEFAULT 14,
  created_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, obligation_type)
);

-- ── 12. Seed data ─────────────────────────────────────────────────────────────

INSERT INTO tenants (id, name, slug, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'FineGuard Demo',
  'fineguard-demo',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
