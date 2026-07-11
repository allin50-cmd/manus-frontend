-- STAGING ONLY. Review against the existing UltraCore schema before running.
create table if not exists public.migration_staging_companies (
  source_id text primary key,
  name text,
  created_at timestamptz,
  source_record jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now()
);
