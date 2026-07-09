-- Enums
CREATE TYPE alert_action AS ENUM ('push', 'pull', '...');

-- Companies table with route_id
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id text UNIQUE NOT NULL,   -- e.g. 'sc-fg'
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Alerts table with structured owner
CREATE TABLE alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES companies(id),
  owner jsonb NOT NULL,            -- {action: alert_action, target: text}
  created_at timestamptz DEFAULT now()
);

-- Add more tables as needed
