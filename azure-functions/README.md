# FineGuard Pro — Azure Functions

Python-based background workers that replace cron-style job scheduling previously handled inside the Next.js app.

## Functions

### `dispatch_alerts` — Timer Trigger (daily at 06:00 UTC)

Scans every actively-monitored company, fetches live deadline data from the Companies House REST API, and fires outbound webhooks for every crossed alert window (60 / 30 / 14 / 7 days before due date) not yet dispatched.

Deduplication is handled by the `dispatched_notifications` PostgreSQL table — each `(companyNumber, alertType, dueDate, windowDays)` combination fires at most once.

## Local development

```bash
cd azure-functions

# Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows

pip install -r requirements.txt
pip install azure-functions-core-tools   # if not globally installed

# Copy and fill in the required environment variables
cp local.settings.json.example local.settings.json

func start
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `COMPANIES_HOUSE_API_KEY` | Yes | Companies House REST API key |
| `AZURE_COMMUNICATION_ENDPOINT` | Optional | ACS endpoint for direct email |
| `AZURE_COMMUNICATION_KEY` | Optional | ACS HMAC access key |
| `EMAIL_SENDER_ADDRESS` | Optional | ACS verified sender address |

## Deployment

```bash
# From the azure-functions/ directory
func azure functionapp publish <your-function-app-name> --python
```

Or via the `npm run deploy:azure` script at the repo root.
