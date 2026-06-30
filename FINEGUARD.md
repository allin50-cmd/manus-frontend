# FineGuard Compliance Workflow

Automated Companies House deadline monitoring: snapshot → alert schedule → reminder dispatch.

---

## 1. Apply the database migration

Run **once** against your Supabase database (copy from the SQL editor or `psql`):

```bash
psql "$DATABASE_URL" -f db/migrations/0006_fineguard_workflow.sql
```

The migration is idempotent (`IF NOT EXISTS`) — safe to run multiple times.

---

## 2. Required environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase Postgres connection string (transaction pooler, port 6543) |
| `COMPANIES_HOUSE_API_KEY` | REST API key from developer.company-information.service.gov.uk |
| `JWT_SECRET` | Same secret used by the main app session cookie |

---

## 3. Optional environment variables

| Variable | Default | Description |
|---|---|---|
| `RESEND_API_KEY` | *(absent)* | If set, due reminders are emailed via Resend. If absent, messages are written to `fg_message_logs` with `status='logged'` — the workflow **never fails** due to a missing email key. |
| `RESEND_FROM` | `FineGuard Alerts <alerts@fineguard.co.uk>` | Sender address |
| `CRON_SECRET` | *(absent)* | If set, allows unauthenticated POST to `/api/fineguard/process` when the `x-cron-secret` header matches. Required for GitHub Actions cron. |

---

## 4. Manual POST test (session cookie)

Sign in at `/login`, then:

```bash
# Process all active monitored companies
curl -X POST https://your-app.vercel.app/api/fineguard/process \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session-cookie>" \
  -d '{}'

# Process a single company
curl -X POST https://your-app.vercel.app/api/fineguard/process \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<your-session-cookie>" \
  -d '{"companyNumber":"00000006"}'
```

Response shape:

```json
{
  "success": true,
  "runId": "uuid",
  "processedCompanies": 1,
  "snapshotsCreated": 1,
  "alertsCreated": 14,
  "duplicatesSkipped": 0,
  "remindersProcessed": 0,
  "messagesSent": 0,
  "messagesLogged": 0,
  "errors": 0,
  "results": [...]
}
```

Running the same company a second time returns `alertsCreated: 0, duplicatesSkipped: 14`.

---

## 5. GitHub Actions cron call

Add to `.github/workflows/fineguard-daily.yml`:

```yaml
name: FineGuard Daily Processing
on:
  schedule:
    - cron: '0 8 * * *'   # 08:00 UTC daily
  workflow_dispatch:

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger workflow
        run: |
          curl -sf -X POST "${{ vars.APP_URL }}/api/fineguard/process" \
            -H "Content-Type: application/json" \
            -H "x-cron-secret: ${{ secrets.CRON_SECRET }}" \
            -d '{}' | jq .
```

Required secrets/vars: `APP_URL`, `CRON_SECRET`.

---

## 6. Local test script

Add a company to `monitored_companies` first:

```bash
curl -X POST http://localhost:3000/api/monitored \
  -H "Content-Type: application/json" \
  -H "Cookie: session=<cookie>" \
  -d '{"companyNumber":"00000006","companyName":"Test Company"}'
```

Then run the idempotency test:

```bash
TEST_COMPANY_NUMBER=00000006 npm run fineguard:test-workflow
```

Expected output on second run: `duplicatesSkipped > 0`, `alertsCreated = 0`.

---

## 7. Alert thresholds

Seven reminder dates are pre-scheduled per filing deadline:

| daysBefore | reminderDate | Fires when |
|---|---|---|
| 90 | dueDate − 90 days | 90 days out |
| 60 | dueDate − 60 days | 60 days out |
| 30 | dueDate − 30 days | 30 days out |
| 14 | dueDate − 14 days | 2 weeks out |
| 7 | dueDate − 7 days | 1 week out |
| 0 | dueDate | Due today |
| −1 (overdue) | dueDate + 1 day | Day after deadline |

Alerts with `reminderDate ≤ today` and `status = 'pending'` are processed each run.

---

## 8. Tracing a run

Every write in a single `processCompany()` call shares the same `run_id` (UUID).
Query all activity for a run:

```sql
SELECT action, entity_type, entity_id, detail, occurred_at
FROM fg_activity_log
WHERE run_id = '<your-run-id>'
ORDER BY occurred_at;
```

The eight standard activity actions are:

```
process_started  →  company_checked  →  snapshot_created  →  alerts_scheduled
→  reminder_processed  →  message_sent_or_logged  →  process_completed
                                                        (or process_failed)
```
