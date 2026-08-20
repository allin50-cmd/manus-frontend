-- Property consolidation staging only.
-- This does not create canonical application tables and is safe to rerun.
-- Source rows are retained losslessly until field-level reconciliation is complete.

create table if not exists public.migration_staging_property_records (
  source_table text not null,
  source_id text not null,
  source_record jsonb not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  primary key (source_table, source_id)
);

create index if not exists migration_staging_property_records_table_idx
  on public.migration_staging_property_records (source_table);

create table if not exists public.migration_staging_property_certificates (
  source_id text primary key,
  property_source_id text,
  certificate_type text,
  certificate_status text,
  expiry_date timestamptz,
  issue_date timestamptz,
  engineer_name text,
  certificate_number text,
  file_url text,
  notes text,
  source_record jsonb not null,
  source_hash text not null,
  imported_at timestamptz not null default now(),
  constraint migration_certificate_type_check check (
    certificate_type is null or certificate_type in (
      'gas_safety','eicr','epc','deposit_protection','smoke_alarms','co_alarms','fire_extinguisher'
    )
  ),
  constraint migration_certificate_status_check check (
    certificate_status is null or certificate_status in (
      'valid','expiring_soon','expired','not_required'
    )
  )
);

-- Deliberately no tenancy staging table. The source application has fg_tenants
-- but no separate tenancy model; inventing one during migration would duplicate semantics.
