# Database — UltraCore

**Last updated:** 2026-06-28

---

## Database

**Provider:** Supabase Postgres  
**Connection:** `DATABASE_URL` environment variable  
**ORM:** Drizzle (`drizzle-orm/postgres-js`)  
**Schema file:** `db/schema.ts` — single source of truth  
**Migrations:** `db/migrations/` — 9 idempotent SQL files  

---

## Table Inventory

### Core OS Tables

| Table | Drizzle export | Purpose |
|---|---|---|
| `work_items` | `workItems` | Client projects and jobs |
| `actions` | `actions` | Actions associated with work items |
| `activity_logs` | `activityLogs` | Audit trail for work item events |
| `decisions` | `decisions` | Business decision log |
| `templates` | `templates` | Reusable message/document templates |

### OS Module Tables (`os_` prefix)

| Table | Drizzle export | Purpose |
|---|---|---|
| `os_invoices` | `osInvoices` | Invoices with status tracking |
| `os_call_logs` | `osCallLogs` | Call log with direction and outcome |
| `os_message_threads` | `osMessageThreads` | Message thread headers |
| `os_messages` | `osMessages` | Individual messages within threads |
| `os_people` | `osPeople` | Contacts (clients, suppliers, team, etc.) |
| `os_alerts` | `osAlerts` | System-generated business alerts |
| `os_documents` | `osDocuments` | Document records with approval workflow |
| `os_tasks` | `osTasks` | Tasks (internal and client-linked) |
| `os_quotes` | `osQuotes` | Sales quotes |

### FineGuard Tables (`fg_` prefix)

| Table | Drizzle export | Purpose |
|---|---|---|
| `fg_company_snapshots` | `fgCompanySnapshots` | Companies House data snapshots |
| `fg_alerts` | `fgAlerts` | Filing deadline / change alerts |
| `fg_reminder_events` | `fgReminderEvents` | Scheduled reminder records |
| `fg_message_logs` | `fgMessageLogs` | Alert message delivery log |
| `fg_activity_log` | `fgActivityLog` | FineGuard audit trail |

### ClerkOS Tables (`clerk_` prefix)

| Table | Drizzle export | Purpose |
|---|---|---|
| `clerk_users` | `clerkUsers` | ClerkOS user accounts |
| `clerk_cases` | `clerkCases` | Legal cases |
| `clerk_hearings` | `clerkHearings` | Hearing records |
| `clerk_documents` | `clerkDocuments` | Case documents |
| `clerk_bundles` | `clerkBundles` | Document bundles |
| `clerk_allocations` | `clerkAllocations` | Resource allocations |
| `clerk_diaries` | `clerkDiaries` | Diary entries |
| `clerk_audit_events` | `clerkAuditEvents` | ClerkOS audit trail |

### Legacy / Other Tables

| Table | Drizzle export | Purpose |
|---|---|---|
| `leads` | `leads` | Lead intake forms |
| `intake_forms` | `intakeForms` | General intake forms |
| `compliance_bundles` | `complianceBundles` | FineGuard bundle records |
| `contacts` | `contacts` | Legacy contacts (pre-os_people) |
| `monitored_companies` | `monitoredCompanies` | Companies House monitoring list |
| `fineguard_leads` | `fineguardLeads` | FineGuard lead capture |
| `alert_history` | `alertHistory` | Legacy alert history |
| `tenants` | `tenants` | Multi-tenant scaffold (unused) |
| `builder_big_jobs_leads` | `builderBigJobsLeads` | Builder sector leads |
| `deployment_status` | `deploymentStatus` | Deployment tracking |

### Measurement Tables (`ut_` prefix)

| Table | Drizzle export | Purpose |
|---|---|---|
| `ut_activity_events` | `utActivityEvents` | Event stream for all OS actions |
| `ut_daily_metrics` | `utDailyMetrics` | Daily aggregation (DAU, throughput) |
| `ut_weekly_reports` | `utWeeklyReports` | Weekly report data |

---

## Enums

Defined in `db/schema.ts`:

| Enum | Values |
|---|---|
| `WorkItemType` | Renovation, NewBuild, Commercial, Residential, Planning, Other |
| `WorkItemStatus` | New, Active, OnHold, Complete, Cancelled |
| `Priority` | Critical, High, Medium, Low |
| `ActionType` | Note, Call, Email, Meeting, Task, Other |
| `ActionStatus` | Pending, Done, Cancelled |
| `EventType` | status_changed, action_added, note_added, etc. |
| `DecisionStatus` | Proposed, Approved, Rejected, Superseded |
| `InvoiceStatus` | Draft, Sent, Paid, Overdue, Cancelled |
| `CallDirection` | Inbound, Outbound |
| `CallOutcome` | Answered, Missed, Voicemail, NoAnswer |
| `PersonCategory` | Client, Supplier, TeamMember, Partner, Lead, Other |
| `AlertSeverity` | Critical, Warning, Info |
| `DocumentStatus` | PendingReview, Approved, Rejected, Archived |
| `TaskStatus` | NotStarted, InProgress, Blocked, Done |
| `QuoteStatus` | Draft, Sent, Accepted, Rejected, Expired |

---

## Migration Files

Located in `db/migrations/`. Applied in numerical order. Never edit existing migrations — only add new ones.

Pattern: `db/migrations/NNNN_description.sql`

---

## Prisma Status

**Prisma is fully removed from active code.**

Orphaned files that remain:
- `prisma/schema.prisma` — not imported anywhere, safe to delete
- `prisma/seed.ts` — references `@prisma/client` which is not installed, safe to delete

`@prisma/client` is not in `package.json`. Zero Prisma imports in `app/` or `lib/`.

---

## Connection Management

`lib/db.ts` creates a singleton Drizzle client:

```typescript
export async function getDb(): Promise<DrizzleDb> {
  if (g.__ultratech_db) return g.__ultratech_db
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not configured')
  const client = postgres(url, { max: 10 })
  const db = drizzle(client, { schema })
  g.__ultratech_db = db
  return db
}
```

Connection pool: max 10 connections (suitable for Vercel serverless).
