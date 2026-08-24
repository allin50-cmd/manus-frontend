# Property consolidation — Stage 1

Stage 1 is deliberately non-destructive. It converts exports from the existing UltraTech Property Manus application into lossless, reviewable staging records. It does not connect to Supabase, alter Prisma models, or write production data.

## Source contract

The audited source application persists landlord/property data in these shared `fg_*` tables:

- `fg_properties`
- `fg_tenants`
- `fg_certificates`
- `fg_inspections`
- `fg_maintenance_requests`
- `fg_contractors`
- `fg_rent_payments`
- `fg_expenses`
- `fg_documents`
- `fg_calendar_events`
- `fg_landlord_messages`

There is no separate tenancy model in the source. Do not create one during migration.

Certificate fields are the one fully verified typed source contract in this stage. The complete original row is retained alongside that projection so no unverified source field is lost.

## Run

Place source exports in a directory using the source table names:

```text
export/
  fg_properties.json
  fg_tenants.json
  fg_certificates.json
  ...
```

Each file may be either a JSON array or an object shaped as `{ "data": [...] }`.

Then run:

```bash
node scripts/manus-migration/map-property-export.mjs scripts/manus-migration/export
```

Optional output directory:

```bash
node scripts/manus-migration/map-property-export.mjs /path/to/export --out /tmp/property-stage1
```

The mapper writes only local JSON beneath `mapped/property-stage1` by default. That directory is already excluded from git by the migration toolkit rules.

## Verification gates before any database write

1. Every available source table maps without malformed JSON, duplicate IDs, invalid certificate enum values, or invalid certificate dates.
2. `summary.json` row counts match the source export counts exactly.
3. Re-running the same export produces identical `source_hash` values.
4. Missing source files are reported as `missing`; they are never treated as empty tables.
5. The complete original row remains in `source_record` for every staged record.
6. No canonical Prisma property schema is created until real source field names have been inspected.
7. No production write occurs in Stage 1.

## Next stage

After a real export passes these gates, inspect the actual keys and relationships for properties, tenants, maintenance and the remaining source tables. Only then define the canonical PostgreSQL/Prisma property domain and an explicit import transaction with reconciliation counts and rollback evidence.
