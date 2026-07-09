DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

CREATE TABLE companies (
  id text PRIMARY KEY,
  name text NOT NULL,
  route text,
  status text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE deadlines (
  id text PRIMARY KEY,
  company_id text REFERENCES companies(id),
  type text,
  due_date date,
  status text,
  filed_at timestamptz,
  ref text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE alerts (
  id text PRIMARY KEY,
  company_id text,
  deadline_id text REFERENCES deadlines(id),
  type text,
  channel text,
  status text,
  recipient text,
  sent_at timestamptz,
  subject text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE recipients (
  id text PRIMARY KEY,
  company_id text,
  name text,
  email text,
  phone text,
  channels text[],
  created_at timestamptz DEFAULT now()
);

CREATE TABLE settings (
  id integer PRIMARY KEY DEFAULT 1,
  alert_days integer[],
  overdue_repeat integer,
  channels jsonb,
  created_at timestamptz DEFAULT now()
);
