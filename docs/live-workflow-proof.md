# Live Workflow Proof

**Authority:** apps/registry.json + server/app.ts + server/workflow-proof.test.ts  
**Repository:** allin50-cmd/manus-frontend  
**Date:** 2026-05-26  
**Objective:** Prove the PIE→UltAi→FineGuard→VaultLine chain operates against a live Neon database using a simulated PIE sender (curl/Postman), without requiring the Accuracy PIE system to be deployed.

---

## What This Proves

The Accuracy PIE system (`status: unverified` in apps/registry.json) is absent from this repository. Its source location is unknown. However, the **receiving endpoint** is fully implemented at `POST /api/pie/opportunity` (`server/app.ts:538`). This document proves the receiving side by simulating the PIE sender manually.

**Chain being proved:**
```
Simulated PIE sender (curl)
  → POST /api/pie/opportunity          (UltAi ingest layer)
    → INSERT intake_forms              (UltAi persistence)
    → writeAuditEvent "captured"       (VaultLine)
    → evaluateFineGuardActivation()    (FineGuard rules — pure, deterministic)
    → UPSERT monitored_companies       (FineGuard activation)
    → writeAuditEvent "fineguard_activation_evaluated"  (VaultLine)
    → writeAuditEvent "fineguard_activation_triggered"  (VaultLine)
  ← HTTP 201 { ok: true, matterRef, sourceRef, urgency }
```

**This simulation is identical to what Accuracy PIE would send.** The PIE contract is defined at `server/lib/pie-schema.ts` (PieOpportunitySchema). The Bromley payload below satisfies that schema.

---

## Prerequisites

```
[ ] Vercel deployment live (or local dev server running)
[ ] DATABASE_URL connected to bootstrapped Neon database
[ ] System tenant 00000000-0000-0000-0000-000000000001 seeded (npm run db:bootstrap done)
[ ] curl or Postman available
[ ] Neon SQL Editor accessible (or psql)
```

---

## Simulation — Step by Step

### Step 1 — Set your base URL

**Live Vercel:**
```bash
export BASE_URL="https://your-project.vercel.app"
```

**Local dev server:**
```bash
# Terminal 1:
DATABASE_URL="..." DIRECT_URL="..." ADMIN_API_KEY="local" npm run dev

# Terminal 2:
export BASE_URL="http://localhost:3000"
```

---

### Step 2 — Health check

```bash
curl -s "$BASE_URL/api/health" | jq .
```

**Expected:**
```json
{"status": "ok", "timestamp": "...", "database": "connected"}
```

If `"database": "disconnected"`: stop here — DATABASE_URL is not reaching the server. Fix before continuing.

---

### Step 3 — Send the Bromley opportunity (first ingestion)

This is the simulated PIE sender. In production, Accuracy PIE calls this endpoint automatically when a new planning opportunity is scored.

```bash
curl -s -X POST "$BASE_URL/api/pie/opportunity" \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "24/AP/1234",
    "applicantName": "Bromley Development Ltd",
    "applicantEmail": "planning@bromley-dev.co.uk",
    "description": "Residential development, 4 dwellings, Bromley Borough",
    "siteAddress": "42 High Street, Bromley BR1 1AB",
    "district": "Bromley",
    "urgency": "high",
    "estimatedValue": "£2,400,000",
    "submittedAt": "2026-05-26T09:00:00+01:00"
  }' | jq .
```

**Expected HTTP 201:**
```json
{
  "ok": true,
  "replayed": false,
  "matterRef": "MAT-1748xxxxxxxxx",
  "sourceRef": "PIE:24/AP/1234",
  "urgency": "high"
}
```

**Record the `matterRef` value** — use it to query the audit trail.

---

### Step 4 — Verify intake row (UltAi persistence)

In Neon SQL Editor or psql:

```sql
SELECT
  id,
  matter_ref,
  client_name,
  matter_type,
  urgency,
  claim_value,
  source_ref,
  created_at
FROM intake_forms
WHERE source_ref = 'PIE:24/AP/1234';
```

**Expected one row:**

| column | expected value |
|---|---|
| `client_name` | `Bromley Development Ltd` |
| `matter_type` | `planning` |
| `urgency` | `high` |
| `claim_value` | `£2,400,000` |
| `source_ref` | `PIE:24/AP/1234` |
| `matter_ref` | `MAT-<timestamp>` (matches HTTP response) |

If zero rows: database write failed. Check Vercel function logs for FK constraint errors (system tenant not seeded).

---

### Step 5 — Verify FineGuard activation (monitored_companies)

```sql
SELECT
  id,
  company_name,
  company_number,
  stripe_session_id,
  activated_at
FROM monitored_companies
WHERE company_number = 'PIE:24/AP/1234';
```

**Expected one row:**

| column | expected value |
|---|---|
| `company_name` | `Bromley Development Ltd` |
| `company_number` | `PIE:24/AP/1234` |
| `stripe_session_id` | `pie-activation:24/AP/1234` |
| `activated_at` | non-null timestamp |

**Why this row exists:** The FineGuard activation rules evaluate:
- `pieOriginated` = `sourceRef.startsWith("PIE:")` → `true`
- `highUrgency` = `urgency ∈ {high, critical}` → `true`
- `highValue` = `£2,400,000 ≥ £1,000,000` → `true`
- `activate` = `pieOriginated AND (highUrgency OR highValue)` → `true`

All three rules fire. Activation is deterministic and requires no Companies House API key.

If zero rows: FineGuard activation failed silently (it never throws). Check the `fineguard_activation_evaluated` audit row's metadata for the `activate` field and any error.

---

### Step 6 — Verify VaultLine audit trail (3 events)

```sql
SELECT
  entity_type,
  action,
  entity_uuid,
  correlation_id,
  metadata::text,
  created_at
FROM clerk_audit_events
WHERE metadata LIKE '%PIE:24/AP/1234%'
ORDER BY created_at ASC;
```

**Expected exactly 3 rows, in order:**

| # | entity_type | action | entity_uuid |
|---|---|---|---|
| 1 | `intake` | `captured` | intake_forms.id |
| 2 | `intake` | `fineguard_activation_evaluated` | intake_forms.id |
| 3 | `monitoring_activation` | `fineguard_activation_triggered` | monitored_companies.id |

All three rows share the same `correlation_id` UUID. This is the VaultLine immutable audit thread for the Bromley opportunity.

**Inspect metadata for row 1 (captured):**
```sql
SELECT metadata
FROM clerk_audit_events
WHERE action = 'captured'
  AND metadata LIKE '%PIE:24/AP/1234%';
```

Expected metadata keys: `matterRef`, `matterType`, `urgency`, `sourceRef`, `upstreamSystem` (= `"PIE"`), `pieExternalRef` (= `"24/AP/1234"`), `siteAddress`, `district`.

**Inspect metadata for row 2 (fineguard_activation_evaluated):**
```sql
SELECT metadata
FROM clerk_audit_events
WHERE action = 'fineguard_activation_evaluated'
  AND metadata LIKE '%PIE:24/AP/1234%';
```

Expected metadata: `activate: true`, `reasons: {pieOriginated: true, highUrgency: true, highValue: true}`, `trigger: "first_ingestion"`.

---

### Step 7 — Test idempotency (replay detection)

Send the identical payload again:

```bash
curl -s -X POST "$BASE_URL/api/pie/opportunity" \
  -H "Content-Type: application/json" \
  -d '{
    "externalRef": "24/AP/1234",
    "applicantName": "Bromley Development Ltd",
    "urgency": "high",
    "estimatedValue": "£2,400,000"
  }' | jq .
```

**Expected HTTP 200 (not 201):**
```json
{
  "ok": true,
  "replayed": true,
  "matterRef": "MAT-<same as Step 3>"
}
```

**Verify no duplicate intake row:**
```sql
SELECT COUNT(*) FROM intake_forms WHERE source_ref = 'PIE:24/AP/1234';
-- Must return 1, not 2
```

**Verify replay audit event was written:**
```sql
SELECT action, created_at FROM clerk_audit_events
WHERE action = 'ingestion_replayed'
  AND metadata LIKE '%PIE:24/AP/1234%';
```

Expected: one row with `action = 'ingestion_replayed'`.

---

## Postman Collection (equivalent to curl above)

Create a collection with these requests:

**Request 1 — Health check**
- Method: `GET`
- URL: `{{BASE_URL}}/api/health`
- Expected: 200, `database: connected`

**Request 2 — PIE ingest (first)**
- Method: `POST`
- URL: `{{BASE_URL}}/api/pie/opportunity`
- Headers: `Content-Type: application/json`
- Body (raw JSON): see Step 3 payload above
- Expected: 201, `replayed: false`

**Request 3 — PIE ingest (replay)**
- Method: `POST`
- URL: `{{BASE_URL}}/api/pie/opportunity`
- Headers: `Content-Type: application/json`
- Body: same as Request 2
- Expected: 200, `replayed: true`

---

## Success Criteria

All of the following must be true for the workflow to be proved:

```
[ ] POST /api/pie/opportunity returns HTTP 201 with matterRef and sourceRef
[ ] intake_forms row exists with source_ref = 'PIE:24/AP/1234'
[ ] monitored_companies row exists with company_number = 'PIE:24/AP/1234' and activated_at set
[ ] clerk_audit_events has exactly 3 rows for this correlation_id: captured, fineguard_activation_evaluated, fineguard_activation_triggered
[ ] Second POST to same externalRef returns HTTP 200 with replayed: true
[ ] COUNT(*) on intake_forms for source_ref = 'PIE:24/AP/1234' returns 1 (not 2) after replay
```

---

## Blockers That Would Prevent This Simulation

| Blocker | Symptom | Resolution |
|---|---|---|
| No DATABASE_URL | `POST /api/pie/opportunity` returns 500 | Set DATABASE_URL, redeploy |
| System tenant not seeded | 500 FK constraint violation on clerk_audit_events | Run `npm run db:bootstrap` (includes seed step) |
| Brand-suite tables not migrated | 500 relation "intake_forms" does not exist | Run `npm run db:bootstrap` |
| ClerkOS tables not migrated | Audit writes silently fail (logged as `vaultline.write.failed`) | Run `npm run db:bootstrap` |
| Neon database suspended (free tier) | 503 or connection timeout | Open Neon console — free databases auto-wake on next connection, but may take ~1s |

---

## What This Does NOT Prove

| Gap | Status | Required for |
|---|---|---|
| Accuracy PIE system (actual upstream sender) | UNKNOWN — status: unverified in registry | Full automated ingestion |
| FineGuard scheduled compliance re-checks | Not implemented — no cron | Ongoing monitoring after activation |
| Email alerts | Not implemented | Alert delivery |
| Stripe payment for FineGuard subscription | Requires Stripe keys | Paid activation flow |
| 10-state lifecycle (CAPTURED→CLOSED) | packages/core-workflow does not exist | Full lifecycle tracking |
| Azure VaultLine (blob + service bus) | Provisioning unverified | Azure-backed audit storage |

These gaps do not block this simulation. The minimal chain — one PIE opportunity creates intake, triggers FineGuard, writes 3 audit events — is complete with DATABASE_URL alone.
