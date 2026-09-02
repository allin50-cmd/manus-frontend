-- Creates the "os_*" tables that db/schema.ts (Drizzle) defines and that
-- app/api/os/**/route.ts already queries via getDb(). These tables were
-- never actually created by any prior migration — 001/002 create an
-- unrelated set of tables (companies/alerts/apps/tenants/etc.) that don't
-- match this schema at all, so every /api/os/* route (quotes, invoices,
-- tasks, call-logs, messages, people, documents) has been returning 500
-- in any environment this hasn't been manually patched into.
--
-- Deliberately does NOT create work_items/actions/activity_logs/decisions/
-- templates/alert_recipients/alert_deliveries/alert_events from the same
-- schema.ts file — those are explicitly marked there as "placeholder
-- tables ... expand later during full consolidation" and duplicate the
-- real, live Prisma-managed tables (WorkItem, Decision, etc.) under
-- different (snake_case) names. Creating them now would stand up a second,
-- disconnected copy of live data models with no sync path — a bigger,
-- separate decision, not part of connecting already-built code together.
--
-- NOT yet applied to any shared/staging/production database — verified
-- locally only. Per ai/11_ARCHITECTURE_AUTHORITY.md's production release
-- invariant, running this against a real database needs the same
-- deliberate, approved, evidenced process as any other schema change.

CREATE TABLE IF NOT EXISTS os_message_threads (
  id text PRIMARY KEY,
  subject text NOT NULL,
  participant_names jsonb DEFAULT '[]',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  unread_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  linked_work_item_id text REFERENCES "WorkItem"(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_people (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email varchar(255),
  phone varchar(20),
  title text,
  department text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_tasks (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Open',
  priority "Priority" NOT NULL DEFAULT 'Medium',
  assigned_to text,
  due_date timestamptz,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_call_logs (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  person_id text REFERENCES os_people(id) ON DELETE SET NULL,
  direction text NOT NULL,
  duration integer,
  transcript text,
  notes text,
  recorded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_messages (
  id text PRIMARY KEY,
  thread_id text NOT NULL REFERENCES os_message_threads(id) ON DELETE CASCADE,
  from_person text NOT NULL,
  body text NOT NULL,
  attachments jsonb DEFAULT '[]',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_quotes (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  quote_number varchar(50) NOT NULL,
  amount integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'Draft',
  issue_date timestamptz NOT NULL,
  expiry_date timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_invoices (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  invoice_number varchar(50) NOT NULL,
  amount integer NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'Draft',
  issue_date timestamptz NOT NULL,
  due_date timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_documents (
  id text PRIMARY KEY,
  company_id text NOT NULL,
  file_name text NOT NULL,
  file_type varchar(50) NOT NULL,
  file_size integer,
  storage_url text NOT NULL,
  category text,
  tags jsonb DEFAULT '[]',
  uploaded_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
