-- =============================================================================
-- supabase-setup.sql — Schema for:
--   1. Ultratech OS (work_items, actions, activity_logs, decisions, templates)
--   2. FineGuard / Brand-suite (leads, contacts, compliance_bundles,
--                               intake_forms, deployment_status,
--                               monitored_companies)
--
-- Run this once against a fresh Supabase Postgres database.
-- All statements are idempotent (CREATE TYPE IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
-- ClerkOS tables are parked on the future/clerkos-azure-platform branch.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Ultratech OS Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE "WorkItemType" AS ENUM (
    'Partnership',
    'ConstructionLead',
    'PlanningLead',
    'ComplianceAlert',
    'DocumentRecord',
    'MediaBrief',
    'InternalTask',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkItemStatus" AS ENUM (
    'Captured',
    'Controlled',
    'InProgress',
    'Waiting',
    'FollowUpDue',
    'Escalated',
    'DecisionNeeded',
    'Completed',
    'Paused',
    'NotFit',
    'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "Priority" AS ENUM (
    'Low',
    'Medium',
    'High',
    'Urgent'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionType" AS ENUM (
    'LogNote',
    'CreateFollowUp',
    'ChangeStatus',
    'DraftMessage',
    'EscalateToGeorge',
    'GenerateDocument',
    'MarkComplete',
    'Archive',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ActionStatus" AS ENUM (
    'Open',
    'Done',
    'Cancelled',
    'Blocked'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "EventType" AS ENUM (
    'Created',
    'NoteAdded',
    'StatusChanged',
    'ActionCreated',
    'ActionCompleted',
    'DecisionRequested',
    'DecisionMade',
    'FollowUpSet',
    'Archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "DecisionStatus" AS ENUM (
    'Open',
    'Approved',
    'Rejected',
    'MoreInfoNeeded',
    'Paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Ultratech OS Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS work_items (
  id               TEXT             PRIMARY KEY,
  type             "WorkItemType"   NOT NULL,
  title            TEXT             NOT NULL,
  company          TEXT,
  contact_name     TEXT,
  owner            TEXT             NOT NULL,
  status           "WorkItemStatus" NOT NULL DEFAULT 'Captured',
  priority         "Priority"       NOT NULL DEFAULT 'Medium',
  next_action      TEXT,
  due_date         TIMESTAMPTZ,
  decision_needed  BOOLEAN          NOT NULL DEFAULT FALSE,
  notes            TEXT,
  created_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS actions (
  id           TEXT           PRIMARY KEY,
  work_item_id TEXT           NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  action_type  "ActionType"   NOT NULL,
  label        TEXT           NOT NULL,
  status       "ActionStatus" NOT NULL DEFAULT 'Open',
  assigned_to  TEXT,
  due_date     TIMESTAMPTZ,
  result       TEXT,
  created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id             TEXT        PRIMARY KEY,
  work_item_id   TEXT        NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  action_id      TEXT        REFERENCES actions(id),
  person         TEXT        NOT NULL,
  event_type     "EventType" NOT NULL,
  summary        TEXT        NOT NULL,
  old_status     TEXT,
  new_status     TEXT,
  evidence_link  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
  due_date       TIMESTAMPTZ,
  decided_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS templates (
  id         TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  use_case   TEXT        NOT NULL,
  body       TEXT        NOT NULL,
  approved   BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- Brand-Suite Tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "compliance_bundles" (
  "id"               uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bundle_id"        varchar(50)  NOT NULL,
  "company_name"     varchar(255) NOT NULL,
  "company_number"   varchar(50)  NOT NULL,
  "requestor_name"   varchar(255),
  "requestor_email"  varchar(255),
  "bundle_type"      varchar(50)  DEFAULT 'full',
  "estimated_time"   varchar(100),
  "created_at"       timestamp    DEFAULT now() NOT NULL,
  CONSTRAINT "compliance_bundles_bundle_id_unique" UNIQUE("bundle_id")
);

CREATE TABLE IF NOT EXISTS "contacts" (
  "id"         uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "ticket_id"  varchar(50)  NOT NULL,
  "name"       varchar(255) NOT NULL,
  "email"      varchar(255) NOT NULL,
  "subject"    varchar(255),
  "message"    text         NOT NULL,
  "status"     varchar(20)  DEFAULT 'new' NOT NULL,
  "created_at" timestamp    DEFAULT now() NOT NULL,
  CONSTRAINT "contacts_ticket_id_unique" UNIQUE("ticket_id")
);

CREATE TABLE IF NOT EXISTS "deployment_status" (
  "id"           uuid        PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "environment"  varchar(20) NOT NULL,
  "status"       varchar(20) NOT NULL,
  "commit"       varchar(50) NOT NULL,
  "workflow_run" varchar(50) NOT NULL,
  "deployed_at"  timestamp   DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "intake_forms" (
  "id"           uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "matter_ref"   varchar(50)  NOT NULL,
  "client_name"  varchar(255) NOT NULL,
  "client_email" varchar(255),
  "client_phone" varchar(50),
  "matter_type"  varchar(100) NOT NULL,
  "urgency"      varchar(20)  NOT NULL,
  "description"  text,
  "claim_value"  varchar(50),
  "source_ref"   varchar(100),
  "created_at"   timestamp    DEFAULT now() NOT NULL,
  CONSTRAINT "intake_forms_matter_ref_unique" UNIQUE("matter_ref")
);

CREATE TABLE IF NOT EXISTS "leads" (
  "id"         uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "lead_id"    varchar(50)  NOT NULL,
  "name"       varchar(255) NOT NULL,
  "email"      varchar(255) NOT NULL,
  "company"    varchar(255),
  "product"    varchar(50),
  "phone"      varchar(50),
  "message"    text,
  "created_at" timestamp    DEFAULT now() NOT NULL,
  CONSTRAINT "leads_lead_id_unique" UNIQUE("lead_id")
);

CREATE TABLE IF NOT EXISTS "monitored_companies" (
  "id"                uuid         PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "company_number"    varchar(50)  NOT NULL,
  "company_name"      varchar(255) NOT NULL,
  "stripe_session_id" varchar(255) NOT NULL,
  "activated_at"      timestamp    DEFAULT now() NOT NULL,
  CONSTRAINT "monitored_companies_company_number_unique" UNIQUE("company_number")
);

-- ClerkOS tables and indexes removed — parked on future/clerkos-azure-platform branch.
