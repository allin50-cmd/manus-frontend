-- supabase-setup.sql
-- Idempotent setup script for UltraTechOS on Supabase Postgres.
-- Run in the Supabase SQL Editor to create all tables, enums, and indexes.
-- Safe to re-run: CREATE TABLE IF NOT EXISTS and duplicate_object guards throughout.
-- Source of truth: db/schema.ts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Enums ────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "WorkItemType" AS ENUM (
    'Partnership', 'ConstructionLead', 'PlanningLead', 'ComplianceAlert',
    'DocumentRecord', 'MediaBrief', 'InternalTask', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "WorkItemStatus" AS ENUM (
    'Captured', 'Controlled', 'InProgress', 'Waiting', 'FollowUpDue',
    'Escalated', 'DecisionNeeded', 'Completed', 'Paused', 'NotFit', 'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High', 'Urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ActionType" AS ENUM (
    'LogNote', 'CreateFollowUp', 'ChangeStatus', 'DraftMessage',
    'EscalateToGeorge', 'GenerateDocument', 'MarkComplete', 'Archive', 'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "ActionStatus" AS ENUM ('Open', 'Done', 'Cancelled', 'Blocked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM (
    'Created', 'NoteAdded', 'StatusChanged', 'ActionCreated', 'ActionCompleted',
    'DecisionRequested', 'DecisionMade', 'FollowUpSet', 'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DecisionStatus" AS ENUM (
    'Open', 'Approved', 'Rejected', 'MoreInfoNeeded', 'Paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "InvoiceStatus" AS ENUM (
    'Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CallDirection" AS ENUM ('Inbound', 'Outbound');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "CallOutcome" AS ENUM ('Answered', 'Missed', 'Voicemail', 'NoAnswer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "PersonCategory" AS ENUM (
    'Team', 'Client', 'Partner', 'Supplier', 'Prospect'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "AlertSeverity" AS ENUM ('Critical', 'Warning', 'Info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM (
    'PendingReview', 'Approved', 'Rejected', 'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "TaskStatus" AS ENUM ('Open', 'InProgress', 'Done', 'Cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE "QuoteStatus" AS ENUM (
    'Draft', 'Sent', 'Accepted', 'Declined', 'Expired'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── Ultratech OS Core Tables ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS work_items (
  id              TEXT             PRIMARY KEY,
  type            "WorkItemType"   NOT NULL,
  title           TEXT             NOT NULL,
  company         TEXT,
  contact_name    TEXT,
  owner           TEXT             NOT NULL,
  status          "WorkItemStatus" NOT NULL DEFAULT 'Captured',
  priority        "Priority"       NOT NULL DEFAULT 'Medium',
  next_action     TEXT,
  due_date        TIMESTAMP,
  decision_needed BOOLEAN          NOT NULL DEFAULT FALSE,
  notes           TEXT,
  created_at      TIMESTAMP        NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actions (
  id           TEXT            PRIMARY KEY,
  work_item_id TEXT            NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  action_type  "ActionType"    NOT NULL,
  label        TEXT            NOT NULL,
  status       "ActionStatus"  NOT NULL DEFAULT 'Open',
  assigned_to  TEXT,
  due_date     TIMESTAMP,
  result       TEXT,
  created_at   TIMESTAMP       NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id            TEXT        PRIMARY KEY,
  work_item_id  TEXT        NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  action_id     TEXT        REFERENCES actions(id),
  person        TEXT        NOT NULL,
  event_type    "EventType" NOT NULL,
  summary       TEXT        NOT NULL,
  old_status    TEXT,
  new_status    TEXT,
  evidence_link TEXT,
  created_at    TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS decisions (
  id             TEXT             PRIMARY KEY,
  work_item_id   TEXT             NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  question       TEXT             NOT NULL,
  options        TEXT,
  recommendation TEXT,
  decision_by    TEXT             NOT NULL DEFAULT 'George',
  decision       TEXT,
  status         "DecisionStatus" NOT NULL DEFAULT 'Open',
  due_date       TIMESTAMP,
  decided_at     TIMESTAMP,
  created_at     TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id         TEXT      PRIMARY KEY,
  name       TEXT      NOT NULL,
  use_case   TEXT      NOT NULL,
  body       TEXT      NOT NULL,
  approved   BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ─── Brand-Suite Tables ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS deployment_status (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  environment  VARCHAR(20) NOT NULL,
  status       VARCHAR(20) NOT NULL,
  commit       VARCHAR(50) NOT NULL,
  workflow_run VARCHAR(50) NOT NULL,
  deployed_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  company    VARCHAR(255),
  product    VARCHAR(50),
  phone      VARCHAR(50),
  message    TEXT,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_forms (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_ref   VARCHAR(50)  NOT NULL UNIQUE,
  client_name  VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  matter_type  VARCHAR(100) NOT NULL,
  urgency      VARCHAR(20)  NOT NULL,
  description  TEXT,
  claim_value  VARCHAR(50),
  source_ref   VARCHAR(100),
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_bundles (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id        VARCHAR(50)  NOT NULL UNIQUE,
  company_name     VARCHAR(255) NOT NULL,
  company_number   VARCHAR(50)  NOT NULL,
  requestor_name   VARCHAR(255),
  requestor_email  VARCHAR(255),
  bundle_type      VARCHAR(50)  DEFAULT 'full',
  estimated_time   VARCHAR(100),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  VARCHAR(50)  NOT NULL UNIQUE,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  subject    VARCHAR(255),
  message    TEXT         NOT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'new',
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitored_companies (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number         VARCHAR(50)  NOT NULL UNIQUE,
  company_name           VARCHAR(255) NOT NULL,
  email                  VARCHAR(255),
  stripe_session_id      VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255),
  activated_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  cancelled_at           TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fineguard_leads (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  email          VARCHAR(255) NOT NULL,
  company_name   VARCHAR(255),
  company_number VARCHAR(50),
  status         VARCHAR(10),
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_history (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  deadline_type  VARCHAR(50) NOT NULL,
  due_date       VARCHAR(10) NOT NULL,
  days_before    INTEGER     NOT NULL,
  sent_at        TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS alert_history_unique_idx
  ON alert_history (company_number, deadline_type, due_date, days_before);

-- ─── FineGuard Workflow Tables ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fg_company_snapshots (
  id                               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id                           VARCHAR(36),
  company_number                   VARCHAR(50)  NOT NULL,
  raw_data                         JSONB        NOT NULL,
  company_name                     VARCHAR(255),
  company_status                   VARCHAR(50),
  accounts_next_due                DATE,
  confirmation_statement_next_due  DATE,
  last_accounts_made_up_to         DATE,
  last_confirmation_statement_date DATE,
  fetched_at                       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fg_alerts (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number VARCHAR(50) NOT NULL,
  alert_type     VARCHAR(50) NOT NULL,
  due_date       DATE        NOT NULL,
  reminder_date  DATE        NOT NULL,
  days_before    INTEGER     NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at   TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS fg_alerts_unique_idx
  ON fg_alerts (company_number, alert_type, due_date, reminder_date);

CREATE TABLE IF NOT EXISTS fg_reminder_events (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         VARCHAR(36),
  alert_id       UUID        REFERENCES fg_alerts(id) ON DELETE CASCADE,
  company_number VARCHAR(50) NOT NULL,
  event_type     VARCHAR(50) NOT NULL,
  detail         TEXT,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fg_message_logs (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         VARCHAR(36),
  company_number VARCHAR(50)  NOT NULL,
  channel        VARCHAR(20)  NOT NULL DEFAULT 'email',
  recipient      VARCHAR(255),
  subject        VARCHAR(500),
  body           TEXT,
  status         VARCHAR(20)  NOT NULL DEFAULT 'logged',
  sent_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fg_activity_log (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id      VARCHAR(36),
  entity_type VARCHAR(50),
  entity_id   VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  detail      JSONB,
  occurred_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ─── ClerkOS Tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  plan       VARCHAR(32) NOT NULL DEFAULT 'free',
  settings   JSONB,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clerk_users (
  id             SERIAL       PRIMARY KEY,
  tenant_id      UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  open_id        VARCHAR(64)  NOT NULL,
  name           TEXT,
  email          VARCHAR(320),
  login_method   VARCHAR(64),
  role           VARCHAR(64)  NOT NULL DEFAULT 'standard clerk',
  created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
  last_signed_in TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS users_open_id_tenant_idx ON clerk_users (tenant_id, open_id);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_tenant_idx   ON clerk_users (tenant_id, email);
CREATE INDEX        IF NOT EXISTS users_tenant_idx          ON clerk_users (tenant_id);

CREATE TABLE IF NOT EXISTS clerk_cases (
  id               SERIAL       PRIMARY KEY,
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number VARCHAR(64)  NOT NULL,
  title            TEXT         NOT NULL,
  status           VARCHAR(32)  NOT NULL DEFAULT 'open',
  case_type        VARCHAR(64)  NOT NULL,
  plaintiff        TEXT         NOT NULL,
  defendant        TEXT         NOT NULL,
  judge            VARCHAR(255),
  description      TEXT,
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS cases_ref_tenant_idx ON clerk_cases (tenant_id, reference_number);
CREATE INDEX        IF NOT EXISTS cases_tenant_idx      ON clerk_cases (tenant_id);

CREATE TABLE IF NOT EXISTS clerk_hearings (
  id           SERIAL       PRIMARY KEY,
  tenant_id    UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id      INTEGER      NOT NULL,
  hearing_date DATE         NOT NULL,
  hearing_time VARCHAR(5)   NOT NULL,
  courtroom    VARCHAR(64)  NOT NULL,
  judge        VARCHAR(255) NOT NULL,
  status       VARCHAR(32)  NOT NULL DEFAULT 'scheduled',
  notes        TEXT,
  created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS hearings_tenant_idx ON clerk_hearings (tenant_id);
CREATE INDEX IF NOT EXISTS hearings_case_idx   ON clerk_hearings (tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_documents (
  id                  SERIAL       PRIMARY KEY,
  tenant_id           UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id             INTEGER      NOT NULL,
  file_name           VARCHAR(255) NOT NULL,
  blob_path           TEXT,
  file_url            TEXT         NOT NULL,
  file_type           VARCHAR(32)  NOT NULL,
  file_size           INTEGER,
  document_type       VARCHAR(64)  NOT NULL,
  version             INTEGER      NOT NULL DEFAULT 1,
  content_hash        VARCHAR(64),
  approved_for_bundle INTEGER      NOT NULL DEFAULT 0,
  uploaded_by         INTEGER      NOT NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS documents_tenant_idx ON clerk_documents (tenant_id);
CREATE INDEX IF NOT EXISTS documents_case_idx   ON clerk_documents (tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_bundles (
  id               SERIAL       PRIMARY KEY,
  tenant_id        UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id          INTEGER      NOT NULL,
  index_json       JSONB,
  pdf_blob_path    TEXT,
  audit_hash       VARCHAR(64),
  status           VARCHAR(32)  NOT NULL DEFAULT 'pending',
  orchestration_id VARCHAR(255),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bundles_tenant_idx ON clerk_bundles (tenant_id);
CREATE INDEX IF NOT EXISTS bundles_case_idx   ON clerk_bundles (tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_allocations (
  id           SERIAL      PRIMARY KEY,
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_id     INTEGER     NOT NULL,
  case_id      INTEGER     NOT NULL,
  task_type    VARCHAR(64) NOT NULL,
  priority     VARCHAR(16) NOT NULL DEFAULT 'medium',
  status       VARCHAR(32) NOT NULL DEFAULT 'pending',
  due_date     DATE,
  notes        TEXT,
  assigned_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS allocations_tenant_idx ON clerk_allocations (tenant_id);

CREATE TABLE IF NOT EXISTS clerk_diaries (
  id            SERIAL    PRIMARY KEY,
  tenant_id     UUID      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_id      INTEGER   NOT NULL,
  date          DATE      NOT NULL,
  hearing_id    INTEGER,
  allocation_id INTEGER,
  notes         TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS diaries_tenant_idx     ON clerk_diaries (tenant_id);
CREATE INDEX IF NOT EXISTS diaries_clerk_date_idx ON clerk_diaries (tenant_id, clerk_id, date);

CREATE TABLE IF NOT EXISTS clerk_audit_events (
  id             SERIAL      PRIMARY KEY,
  tenant_id      UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type    VARCHAR(64) NOT NULL,
  entity_id      INTEGER,
  entity_uuid    UUID,
  action         VARCHAR(64) NOT NULL,
  actor_id       INTEGER,
  actor_open_id  VARCHAR(64),
  previous_state TEXT,
  next_state     TEXT,
  metadata       TEXT,
  correlation_id UUID,
  created_at     TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_tenant_idx      ON clerk_audit_events (tenant_id);
CREATE INDEX IF NOT EXISTS audit_entity_idx      ON clerk_audit_events (tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_entity_uuid_idx ON clerk_audit_events (tenant_id, entity_type, entity_uuid);

-- ─── Ultratech OS Module Tables ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS os_invoices (
  id                  TEXT             PRIMARY KEY,
  number              VARCHAR(32)      NOT NULL UNIQUE,
  client_name         TEXT             NOT NULL,
  client_email        VARCHAR(255),
  description         TEXT,
  amount_pence        INTEGER          NOT NULL,
  status              "InvoiceStatus"  NOT NULL DEFAULT 'Draft',
  issued_at           TIMESTAMP,
  due_at              TIMESTAMP,
  paid_at             TIMESTAMP,
  linked_work_item_id TEXT             REFERENCES work_items(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMP        NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_call_logs (
  id                  TEXT             PRIMARY KEY,
  direction           "CallDirection"  NOT NULL DEFAULT 'Inbound',
  caller_name         TEXT             NOT NULL,
  caller_phone        VARCHAR(50),
  duration_seconds    INTEGER          DEFAULT 0,
  outcome             "CallOutcome"    NOT NULL DEFAULT 'Answered',
  notes               TEXT,
  linked_work_item_id TEXT             REFERENCES work_items(id) ON DELETE SET NULL,
  called_at           TIMESTAMP        NOT NULL DEFAULT NOW(),
  created_at          TIMESTAMP        NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_message_threads (
  id                  TEXT      PRIMARY KEY,
  subject             TEXT      NOT NULL,
  participant_names   JSONB     DEFAULT '[]',
  last_message_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  unread_count        INTEGER   NOT NULL DEFAULT 0,
  is_pinned           BOOLEAN   NOT NULL DEFAULT FALSE,
  linked_work_item_id TEXT      REFERENCES work_items(id) ON DELETE SET NULL,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_messages (
  id         TEXT      PRIMARY KEY,
  thread_id  TEXT      NOT NULL REFERENCES os_message_threads(id) ON DELETE CASCADE,
  from_name  TEXT      NOT NULL,
  body       TEXT      NOT NULL,
  is_read    BOOLEAN   NOT NULL DEFAULT FALSE,
  sent_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_people (
  id              TEXT              PRIMARY KEY,
  name            TEXT              NOT NULL,
  phone           VARCHAR(50),
  email           VARCHAR(255),
  company         TEXT,
  role            TEXT,
  category        "PersonCategory"  NOT NULL DEFAULT 'Client',
  avatar_initials VARCHAR(4),
  notes           TEXT,
  created_at      TIMESTAMP         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_alerts (
  id                  TEXT             PRIMARY KEY,
  severity            "AlertSeverity"  NOT NULL DEFAULT 'Info',
  title               TEXT             NOT NULL,
  body                TEXT,
  source              TEXT,
  is_read             BOOLEAN          NOT NULL DEFAULT FALSE,
  linked_work_item_id TEXT             REFERENCES work_items(id) ON DELETE SET NULL,
  created_at          TIMESTAMP        NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS os_documents (
  id                  TEXT              PRIMARY KEY,
  filename            TEXT              NOT NULL,
  mime_type           VARCHAR(100),
  file_size_bytes     INTEGER,
  storage_path        TEXT,
  source              VARCHAR(50)       NOT NULL DEFAULT 'Upload',
  status              "DocumentStatus"  NOT NULL DEFAULT 'PendingReview',
  linked_work_item_id TEXT              REFERENCES work_items(id) ON DELETE SET NULL,
  linked_company      TEXT,
  uploaded_by         TEXT              NOT NULL DEFAULT 'George',
  created_at          TIMESTAMP         NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP         NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_tasks (
  id                  TEXT          PRIMARY KEY,
  title               TEXT          NOT NULL,
  assigned_to         TEXT          NOT NULL DEFAULT 'George',
  priority            "Priority"    NOT NULL DEFAULT 'Medium',
  status              "TaskStatus"  NOT NULL DEFAULT 'Open',
  due_at              TIMESTAMP,
  linked_work_item_id TEXT          REFERENCES work_items(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS os_quotes (
  id                  TEXT           PRIMARY KEY,
  number              VARCHAR(32)    NOT NULL UNIQUE,
  client_name         TEXT           NOT NULL,
  client_email        VARCHAR(255),
  description         TEXT,
  amount_pence        INTEGER        NOT NULL DEFAULT 0,
  status              "QuoteStatus"  NOT NULL DEFAULT 'Draft',
  valid_until         TIMESTAMP,
  linked_work_item_id TEXT           REFERENCES work_items(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP      NOT NULL DEFAULT NOW()
);

-- ─── Builder Big Jobs Tables ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS builder_big_jobs_leads (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  source               VARCHAR(100) NOT NULL DEFAULT 'intake_form',
  company_name         VARCHAR(255) NOT NULL,
  contact_name         VARCHAR(255) NOT NULL,
  email                VARCHAR(255) NOT NULL,
  phone                VARCHAR(50),
  postcode_area        VARCHAR(255),
  job_types            TEXT,
  min_job_size_band    VARCHAR(50),
  max_travel_miles     INTEGER,
  preferred_contact    VARCHAR(50),
  notes                TEXT,
  estimated_value_band VARCHAR(50),
  planning_status      VARCHAR(50),
  lead_score           INTEGER      NOT NULL DEFAULT 0,
  status               VARCHAR(50)  NOT NULL DEFAULT 'new',
  assigned_to          VARCHAR(100),
  created_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ─── UltraTech OS Measurement Tables ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ut_activity_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     VARCHAR(255),
  event_type  VARCHAR(50) NOT NULL,
  source      VARCHAR(50),
  notes       TEXT,
  metadata    JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ut_daily_metrics (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date                DATE        NOT NULL UNIQUE,
  dau                 INTEGER     NOT NULL DEFAULT 0,
  app_opens           INTEGER     NOT NULL DEFAULT 0,
  tasks_created       INTEGER     NOT NULL DEFAULT 0,
  tasks_completed     INTEGER     NOT NULL DEFAULT 0,
  calls_logged        INTEGER     NOT NULL DEFAULT 0,
  alerts_generated    INTEGER     NOT NULL DEFAULT 0,
  alerts_acknowledged INTEGER     NOT NULL DEFAULT 0,
  documents_uploaded  INTEGER     NOT NULL DEFAULT 0,
  quotes_created      INTEGER     NOT NULL DEFAULT 0,
  invoices_created    INTEGER     NOT NULL DEFAULT 0,
  companies_added     INTEGER     NOT NULL DEFAULT 0,
  contacts_added      INTEGER     NOT NULL DEFAULT 0,
  workflow_leaks      INTEGER     NOT NULL DEFAULT 0,
  computed_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ut_weekly_reports (
  id                     UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start             DATE         NOT NULL UNIQUE,
  week_end               DATE         NOT NULL,
  total_business_actions INTEGER      NOT NULL DEFAULT 0,
  ut_actions             INTEGER      NOT NULL DEFAULT 0,
  workflow_leaks         INTEGER      NOT NULL DEFAULT 0,
  consolidation_rate     NUMERIC(5,2) NOT NULL DEFAULT 0,
  prev_week_rate         NUMERIC(5,2),
  trend                  VARCHAR(10),
  computed_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
