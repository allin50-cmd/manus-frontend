# Property Domain Foundation

## Objective

Move the live Manus landlord/agent capability into the canonical `manus-frontend` / Supabase stack without creating a second task, alert, company, or audit system.

## Boundary

This slice introduces only dedicated property-domain persistence:

- `Property`
- `Tenancy`
- `PropertyCertificate`
- `MaintenanceJob`

Existing canonical systems remain authoritative for:

- workspace identity: `Tenant`
- people/business CRM: `Company` / `Contact`
- operational work: `WorkItem` / `Action`
- alerts: `AlertRecipient` / `AlertDelivery` / `AlertEvent`
- audit/activity: `ActivityLog`

Property records must not be encoded as generic WorkItems. A remedial or consequential task generated from a property event may create/link to a WorkItem in a later slice.

## Import identity

Every source-backed property-domain table has nullable `sourceSystem` and `sourceId` fields with a composite unique index. Manus imports use:

- `sourceSystem = "manus-fineguard"`
- `sourceId = <stable source record id>`

This makes imports idempotent and allows repeatable dry-runs without duplicate records.

## Tenant scoping

Every Property belongs to the canonical UltraCore `Tenant` workspace. Tenancies, certificates and maintenance jobs inherit workspace scope through Property.

No production import may run until the target tenant/workspace is explicitly identified and source record counts have been reconciled.

## Target routes

The first user-facing property workspace should preserve the proven Manus journeys under:

- `/la`
- `/la/properties`
- `/la/maintenance`
- `/la/compliance`

API routes should be authenticated and tenant-scoped. No public/no-auth property data is to be introduced into the canonical production app.

## Migration sequence

1. Discover actual Manus endpoints and response shapes.
2. Record confirmed endpoints in `scripts/manus-migration/endpoints.json` locally only.
3. Export source data.
4. Map to the four property-domain tables in dry-run mode.
5. Reconcile counts, stable IDs, addresses and relationships.
6. Apply the additive property schema migration to the target database.
7. Import into a non-production/test workspace first.
8. Verify `/la` journeys and persistence.
9. Import production records.
10. Only after parity is proven, retire the equivalent Manus routes.

## Required reconciliation before production import

At minimum record and compare:

- property count
- tenancy count
- certificate/compliance count
- maintenance/remedial job count
- duplicate source IDs
- orphaned tenancy/certificate/job records
- property addresses/postcodes
- active tenancy monthly rent values
- certificate expiry dates

Any orphan or duplicate source identity fails the import closed.

## Current gate

The Vercel preview-only endpoint discovery branch is separate from this foundation branch. The migration in this branch is additive SQL only and MUST remain draft/unmerged until `prisma/schema.prisma` is updated to the exact same model contract and the normal repository gates pass.
