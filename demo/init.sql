-- ============================================================
-- ClerkOS Demo — Schema + Seed Data
-- Runs automatically on first PostgreSQL boot via Docker.
-- ============================================================

-- ─── VaultLine Brand Tables (legacy marketing routes) ────────

CREATE TABLE IF NOT EXISTS deployment_status (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  environment     varchar(20) NOT NULL,
  status          varchar(20) NOT NULL,
  commit          varchar(50) NOT NULL,
  workflow_run    varchar(50) NOT NULL,
  deployed_at     timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leads (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     varchar(50) NOT NULL UNIQUE,
  name        varchar(255) NOT NULL,
  email       varchar(255) NOT NULL,
  company     varchar(255),
  product     varchar(50),
  phone       varchar(50),
  message     text,
  created_at  timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS intake_forms (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_ref    varchar(50) NOT NULL UNIQUE,
  client_name   varchar(255) NOT NULL,
  client_email  varchar(255),
  client_phone  varchar(50),
  matter_type   varchar(100) NOT NULL,
  urgency       varchar(20) NOT NULL,
  description   text,
  claim_value   varchar(50),
  created_at    timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS compliance_bundles (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id       varchar(50) NOT NULL UNIQUE,
  company_name    varchar(255) NOT NULL,
  company_number  varchar(50) NOT NULL,
  requestor_name  varchar(255),
  requestor_email varchar(255),
  bundle_type     varchar(50) DEFAULT 'full',
  estimated_time  varchar(100),
  created_at      timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id   varchar(50) NOT NULL UNIQUE,
  name        varchar(255) NOT NULL,
  email       varchar(255) NOT NULL,
  subject     varchar(255),
  message     text        NOT NULL,
  status      varchar(20) NOT NULL DEFAULT 'new',
  created_at  timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitored_companies (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_number    varchar(50) NOT NULL UNIQUE,
  company_name      varchar(255) NOT NULL,
  stripe_session_id varchar(255) NOT NULL,
  activated_at      timestamp   NOT NULL DEFAULT NOW()
);

-- ─── ClerkOS Core Tables ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS tenants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  plan        varchar(32) NOT NULL DEFAULT 'free',
  settings    jsonb,
  created_at  timestamp   NOT NULL DEFAULT NOW(),
  updated_at  timestamp   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clerk_users (
  id              serial      PRIMARY KEY,
  tenant_id       uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  open_id         varchar(64) NOT NULL,
  name            text,
  email           varchar(320),
  login_method    varchar(64),
  role            varchar(64) NOT NULL DEFAULT 'standard clerk',
  created_at      timestamp   NOT NULL DEFAULT NOW(),
  updated_at      timestamp   NOT NULL DEFAULT NOW(),
  last_signed_in  timestamp   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_open_id_tenant_idx ON clerk_users(tenant_id, open_id);
CREATE INDEX        IF NOT EXISTS users_tenant_idx          ON clerk_users(tenant_id);

CREATE TABLE IF NOT EXISTS clerk_cases (
  id               serial      PRIMARY KEY,
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  reference_number varchar(64) NOT NULL,
  title            text        NOT NULL,
  status           varchar(32) NOT NULL DEFAULT 'open',
  case_type        varchar(64) NOT NULL,
  plaintiff        text        NOT NULL,
  defendant        text        NOT NULL,
  judge            varchar(255),
  description      text,
  created_at       timestamp   NOT NULL DEFAULT NOW(),
  updated_at       timestamp   NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS cases_ref_tenant_idx ON clerk_cases(tenant_id, reference_number);
CREATE INDEX        IF NOT EXISTS cases_tenant_idx      ON clerk_cases(tenant_id);

CREATE TABLE IF NOT EXISTS clerk_hearings (
  id           serial      PRIMARY KEY,
  tenant_id    uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id      integer     NOT NULL,
  hearing_date date        NOT NULL,
  hearing_time varchar(5)  NOT NULL,
  courtroom    varchar(64) NOT NULL,
  judge        varchar(255) NOT NULL,
  status       varchar(32) NOT NULL DEFAULT 'scheduled',
  notes        text,
  created_at   timestamp   NOT NULL DEFAULT NOW(),
  updated_at   timestamp   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS hearings_tenant_idx ON clerk_hearings(tenant_id);
CREATE INDEX IF NOT EXISTS hearings_case_idx   ON clerk_hearings(tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_documents (
  id                  serial       PRIMARY KEY,
  tenant_id           uuid         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id             integer      NOT NULL,
  file_name           varchar(255) NOT NULL,
  blob_path           text,
  file_url            text         NOT NULL,
  file_type           varchar(32)  NOT NULL,
  file_size           integer,
  document_type       varchar(64)  NOT NULL,
  version             integer      NOT NULL DEFAULT 1,
  content_hash        varchar(64),
  approved_for_bundle integer      NOT NULL DEFAULT 0,
  uploaded_by         integer      NOT NULL,
  created_at          timestamp    NOT NULL DEFAULT NOW(),
  updated_at          timestamp    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS documents_tenant_idx ON clerk_documents(tenant_id);
CREATE INDEX IF NOT EXISTS documents_case_idx   ON clerk_documents(tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_bundles (
  id               serial      PRIMARY KEY,
  tenant_id        uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  case_id          integer     NOT NULL,
  index_json       jsonb,
  pdf_blob_path    text,
  audit_hash       varchar(64),
  status           varchar(32) NOT NULL DEFAULT 'pending',
  orchestration_id varchar(255),
  created_at       timestamp   NOT NULL DEFAULT NOW(),
  updated_at       timestamp   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bundles_tenant_idx ON clerk_bundles(tenant_id);
CREATE INDEX IF NOT EXISTS bundles_case_idx   ON clerk_bundles(tenant_id, case_id);

CREATE TABLE IF NOT EXISTS clerk_allocations (
  id           serial      PRIMARY KEY,
  tenant_id    uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_id     integer     NOT NULL,
  case_id      integer     NOT NULL,
  task_type    varchar(64) NOT NULL,
  priority     varchar(16) NOT NULL DEFAULT 'medium',
  status       varchar(32) NOT NULL DEFAULT 'pending',
  due_date     date,
  notes        text,
  assigned_at  timestamp   NOT NULL DEFAULT NOW(),
  completed_at timestamp,
  created_at   timestamp   NOT NULL DEFAULT NOW(),
  updated_at   timestamp   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS allocations_tenant_idx ON clerk_allocations(tenant_id);

CREATE TABLE IF NOT EXISTS clerk_diaries (
  id            serial    PRIMARY KEY,
  tenant_id     uuid      NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  clerk_id      integer   NOT NULL,
  date          date      NOT NULL,
  hearing_id    integer,
  allocation_id integer,
  notes         text,
  created_at    timestamp NOT NULL DEFAULT NOW(),
  updated_at    timestamp NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS diaries_tenant_idx      ON clerk_diaries(tenant_id);
CREATE INDEX IF NOT EXISTS diaries_clerk_date_idx  ON clerk_diaries(tenant_id, clerk_id, date);

CREATE TABLE IF NOT EXISTS clerk_audit_events (
  id             serial      PRIMARY KEY,
  tenant_id      uuid        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  entity_type    varchar(64) NOT NULL,
  entity_id      integer     NOT NULL,
  action         varchar(64) NOT NULL,
  actor_id       integer,
  actor_open_id  varchar(64),
  previous_state text,
  next_state     text,
  metadata       text,
  created_at     timestamp   NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_tenant_idx  ON clerk_audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS audit_entity_idx  ON clerk_audit_events(tenant_id, entity_type, entity_id);

-- ─── Demo Seed Data ───────────────────────────────────────────
-- Tenant slug 'alpha' matches localStorage default set in src/main.tsx
-- open_id 'admin-user' matches localStorage default

INSERT INTO tenants (id, name, slug, plan, settings) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Alpha Crown Court',
  'alpha',
  'professional',
  '{"timezone":"Europe/London","dateFormat":"DD/MM/YYYY","caseNumberPrefix":"ALPHA","bundleConfig":{"pageSize":"A4","includeIndex":true,"includeAuditTrail":true}}'
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO clerk_users (tenant_id, open_id, name, email, role) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'admin-user', 'Patricia Chen',   'patricia.chen@alpha.gov.uk', 'admin (senior clerk / manager)'),
  ('a0000000-0000-0000-0000-000000000001', 'clerk-001',  'Marcus Webb',     'marcus.webb@alpha.gov.uk',   'standard clerk'),
  ('a0000000-0000-0000-0000-000000000001', 'clerk-002',  'Aisha Okonkwo',   'aisha.okonkwo@alpha.gov.uk', 'standard clerk')
ON CONFLICT DO NOTHING;

INSERT INTO clerk_cases (tenant_id, reference_number, title, status, case_type, plaintiff, defendant, judge, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0001', 'Smith v Jones',
   'in_progress', 'Civil', 'Margaret Smith', 'Kevin Jones',
   'His Honour Judge Patel', 'Property boundary dispute — survey evidence submitted, directions hearing listed'),
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0002', 'R v Davies',
   'open', 'Criminal', 'Crown Prosecution Service', 'Thomas Davies',
   'His Honour Judge Williams', 'Fraud by false representation — plea and trial preparation hearing listed'),
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0003', 'Brown v Wilson Holdings Ltd',
   'open', 'Civil', 'David Brown', 'Wilson Holdings Ltd',
   'Her Honour Judge Clarke', 'Breach of commercial lease — rent arrears £84,000'),
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0004', 'Estate of Phillips',
   'in_progress', 'Probate', 'James Phillips (Executor)', 'Beneficiaries',
   'District Judge Morton', 'Contested will — expert valuation of estate outstanding'),
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0005', 'Thompson Trading v Marks & Co',
   'on_hold', 'Commercial', 'Thompson Trading Ltd', 'Marks & Co LLP',
   'His Honour Judge Patel', 'Supply chain contract dispute — mediation ordered by court'),
  ('a0000000-0000-0000-0000-000000000001', 'ALPHA-2026-0006', 'R v Harrison',
   'closed', 'Criminal', 'Crown Prosecution Service', 'Sarah Harrison',
   'Her Honour Judge Clarke', 'Concluded — guilty plea to two counts of theft, community order 18 months')
ON CONFLICT DO NOTHING;

-- Hearings: today + upcoming (dates relative to container start)
INSERT INTO clerk_hearings (tenant_id, case_id, hearing_date, hearing_time, courtroom, judge, status, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, CURRENT_DATE,                '10:00', 'Court 1', 'His Honour Judge Patel',      'scheduled', 'Directions hearing — both solicitors confirmed, bundle required'),
  ('a0000000-0000-0000-0000-000000000001', 2, CURRENT_DATE,                '14:30', 'Court 3', 'His Honour Judge Williams',   'scheduled', 'PTPH — CPS counsel James Hartley, defence Priya Mehta'),
  ('a0000000-0000-0000-0000-000000000001', 3, CURRENT_DATE + '2 days'::interval, '09:30', 'Court 2', 'Her Honour Judge Clarke', 'scheduled', 'CMC — parties ordered to exchange witness statements'),
  ('a0000000-0000-0000-0000-000000000001', 4, CURRENT_DATE + '3 days'::interval, '11:00', 'Court 1', 'District Judge Morton',  'scheduled', 'Interim application — injunction to freeze estate assets'),
  ('a0000000-0000-0000-0000-000000000001', 5, CURRENT_DATE + '7 days'::interval, '10:00', 'Court 4', 'His Honour Judge Patel', 'scheduled', 'Mediation review — parties to file outcome report'),
  ('a0000000-0000-0000-0000-000000000001', 6, CURRENT_DATE - '14 days'::interval,'09:00', 'Court 2', 'Her Honour Judge Clarke', 'completed', 'Sentencing — community order imposed, probation service notified');

-- Documents attached to cases
INSERT INTO clerk_documents (tenant_id, case_id, file_name, file_url, file_type, file_size, document_type, approved_for_bundle, uploaded_by) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 'boundary-survey-report.pdf',   '/demo/boundary-survey-report.pdf',   'pdf', 2097152, 'expert_report',     1, 1),
  ('a0000000-0000-0000-0000-000000000001', 1, 'witness-statement-smith.pdf',  '/demo/witness-statement-smith.pdf',  'pdf',  524288, 'witness_statement',  1, 1),
  ('a0000000-0000-0000-0000-000000000001', 2, 'indictment-davies.pdf',        '/demo/indictment-davies.pdf',        'pdf',  131072, 'court_order',        0, 1),
  ('a0000000-0000-0000-0000-000000000001', 4, 'will-original-phillips.pdf',   '/demo/will-original-phillips.pdf',   'pdf',  786432, 'exhibit',            0, 1),
  ('a0000000-0000-0000-0000-000000000001', 3, 'lease-agreement-2022.pdf',     '/demo/lease-agreement-2022.pdf',     'pdf', 1048576, 'contract',           1, 1);

-- Pending clerk allocations (clerk_id=1 = Patricia Chen)
INSERT INTO clerk_allocations (tenant_id, clerk_id, case_id, task_type, priority, status, due_date, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, 1, 'Prepare hearing bundle',       'high',   'pending', CURRENT_DATE + '1 day'::interval,  'Bundle for today directions hearing — 2 docs approved'),
  ('a0000000-0000-0000-0000-000000000001', 1, 2, 'Transcribe PTPH recording',    'medium', 'pending', CURRENT_DATE + '3 days'::interval, NULL),
  ('a0000000-0000-0000-0000-000000000001', 1, 4, 'Chase expert valuation',       'high',   'pending', CURRENT_DATE + '2 days'::interval, 'Expert report 5 days overdue — escalate to judge''s clerk');

-- Diary entries for today
INSERT INTO clerk_diaries (tenant_id, clerk_id, date, hearing_id, notes) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1, CURRENT_DATE, 1, 'Directions hearing Smith v Jones — set up Court 1 by 09:45, photocopied bundle x3'),
  ('a0000000-0000-0000-0000-000000000001', 1, CURRENT_DATE, 2, 'PTPH R v Davies — confirm CPS file received, dock availability checked');

-- Audit trail
INSERT INTO clerk_audit_events (tenant_id, entity_type, entity_id, action, actor_open_id, previous_state, next_state) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'case', 1, 'create',     'admin-user', NULL,          'open'),
  ('a0000000-0000-0000-0000-000000000001', 'case', 1, 'transition', 'admin-user', 'open',        'in_progress'),
  ('a0000000-0000-0000-0000-000000000001', 'case', 6, 'create',     'admin-user', NULL,          'open'),
  ('a0000000-0000-0000-0000-000000000001', 'case', 6, 'transition', 'admin-user', 'open',        'in_progress'),
  ('a0000000-0000-0000-0000-000000000001', 'case', 6, 'transition', 'admin-user', 'in_progress', 'closed');
