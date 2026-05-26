# Vercel Deployment Checklist

**Authority:** apps/registry.json + vercel.json + direct source inspection  
**Repository:** allin50-cmd/manus-frontend  
**Branch:** claude/ultracore-consolidation-audit-KmP0r  
**Date:** 2026-05-26  
**Objective:** Deploy the app to Vercel so that `POST /api/pie/opportunity` on the live URL persists records in Neon.

---

## Prerequisites

Complete these before touching Vercel. Every item is a hard dependency.

### P0 — Neon database created and bootstrapped

```
[ ] Neon project created at console.neon.tech
[ ] DATABASE_URL copied (pooler connection string — contains "-pooler" in hostname)
[ ] DIRECT_URL copied (direct connection string — no "-pooler")
[ ] npm run db:bootstrap run locally with both vars set
[ ] Bootstrap output shows "Brand-suite migration completed" and "ClerkOS migration completed" and "System tenant ready"
[ ] db:bootstrap exit code 0
```

If bootstrap has not run: **do not deploy**. The app will start but every DB write will fail with a foreign key constraint error on the system tenant row.

### P0 — GitHub repository pushed

```
[ ] Branch claude/ultracore-consolidation-audit-KmP0r pushed to allin50-cmd/manus-frontend
[ ] (or) main branch has all required code
```

Current branch status: committed and pushed to `claude/ultracore-consolidation-audit-KmP0r`.  
For production deployment, merge to `main` first.

---

## Step 1 — Create Vercel Project

1. Go to [vercel.com](https://vercel.com) → **Add New → Project**
2. **Import Git Repository** → select `allin50-cmd/manus-frontend`
3. **Framework Preset:** `Other` (Vercel detects from `vercel.json` automatically)
4. **Root Directory:** leave blank (project root `/`)
5. **Build Command:** leave blank (Vercel reads from `vercel.json` — `package.json` script `build`)
6. **Output Directory:** leave blank (`vercel.json` specifies `distDir: "dist"`)
7. **Install Command:** leave blank (defaults to `npm ci`)
8. **DO NOT click Deploy yet** — set env vars first (Step 2)

---

## Step 2 — Set Environment Variables

In the Vercel project → **Settings → Environment Variables**.

### Required (production will not function without these)

| Name | Value | Environments |
|---|---|---|
| `DATABASE_URL` | Neon pooler URL | Production, Preview |
| `ADMIN_API_KEY` | `openssl rand -hex 32` output | Production, Preview |

### Optional — enables additional features when set

| Name | Value | Environments | Feature enabled |
|---|---|---|---|
| `COMPANIES_HOUSE_API_KEY` | CH API key from developer.company-information.service.gov.uk | Production | `POST /api/compliance-bundle`, scheduler |
| `STRIPE_SECRET_KEY` | `sk_live_...` or `sk_test_...` | Production, Preview | Stripe checkout |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from Stripe dashboard | Production | Stripe webhook |
| `STRIPE_PRICE_ID` | `price_...` from Stripe dashboard | Production | FineGuard subscription checkout |
| `APP_URL` | `https://your-project.vercel.app` | Production | Stripe redirect URLs |
| `DEPLOY_RECORD_TOKEN` | `openssl rand -hex 32` output | Production | Deployment recording endpoint |

### NOT needed in Vercel

| Name | Reason |
|---|---|
| `DIRECT_URL` | Migrations-only. Run `npm run db:bootstrap` locally before deploy; never needed at Vercel runtime. |
| `NODE_ENV` | Vercel sets `NODE_ENV=production` automatically. |
| `PORT` | Vercel manages the port; the serverless function does not call `app.listen()`. |
| `AZURE_B2C_*` | Not required for PIE path; tRPC auth falls back gracefully. Set later when B2C auth is needed. |
| `AZURE_STORAGE_*`, `AZURE_SERVICE_BUS_*` | Azure integrations are P2. Not required for Neon + Vercel path. |

---

## Step 3 — Deploy

1. Return to the Vercel project → **Deployments** → click **Deploy** (or trigger by pushing to the target branch)
2. Watch the build log for these signals:

**Build phase — expected output:**
```
Installing dependencies...
Running "npm run build"
  vite v5 building for production...
  ✓ N modules transformed.
  ✓ built in ~5s
Build completed.
```

**Build failures and fixes:**

| Error | Cause | Fix |
|---|---|---|
| `Error: DATABASE_URL environment variable is not set` | DB client called at build time | Should not happen (lazy init). If it does: check for accidental top-level DB calls in new code. |
| TypeScript errors | Type-check failure | Run `npm run type-check && npm run type-check:server` locally first |
| `Cannot find module` | Missing dependency | Run `npm ci` locally, commit `package-lock.json` |

---

## Step 4 — Verify Health Endpoint

After deployment completes, get your deployment URL (e.g. `https://your-project.vercel.app`).

```bash
curl https://your-project.vercel.app/api/health
```

**Expected (DATABASE_URL correctly set and bootstrap run):**
```json
{"status":"ok","timestamp":"2026-05-26T...","database":"connected"}
```

**If you see `"database":"disconnected"` or 503:**
- Verify `DATABASE_URL` is set in Vercel env vars (not just locally)
- Verify the Neon database is active (not suspended — free tier suspends after inactivity)
- Verify `npm run db:bootstrap` completed successfully
- Check Vercel function logs: Dashboard → Deployments → Functions → `/api/health`

---

## Step 5 — Smoke Test PIE Endpoint

```bash
export VERCEL_URL="https://your-project.vercel.app"

curl -s -X POST "$VERCEL_URL/api/pie/opportunity" \
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
  "matterRef": "MAT-<timestamp>",
  "sourceRef": "PIE:24/AP/1234",
  "urgency": "high"
}
```

**If 500 `DATABASE_URL not set`:** DATABASE_URL env var not reaching the function — re-check Vercel env vars.  
**If 500 FK constraint error:** System tenant not seeded — run `npm run db:bootstrap` and verify seed step ran.  
**If 400 validation error:** Payload schema mismatch — check `server/lib/pie-schema.ts`.

---

## Step 6 — Verify Audit Trail (Neon SQL Editor)

In the Neon console → **SQL Editor** for your project:

```sql
-- 1. Verify intake row was created
SELECT id, matter_ref, source_ref, urgency, claim_value, created_at
FROM intake_forms
WHERE source_ref = 'PIE:24/AP/1234';

-- 2. Verify FineGuard activated
SELECT id, company_name, company_number, activated_at
FROM monitored_companies
WHERE company_number = 'PIE:24/AP/1234';

-- 3. Verify VaultLine audit trail — expect 3 rows
SELECT entity_type, action, entity_uuid, correlation_id, created_at
FROM clerk_audit_events
ORDER BY created_at DESC
LIMIT 5;
```

**Expected audit rows (in order):**

| entity_type | action | entity_uuid |
|---|---|---|
| `intake` | `captured` | intake_forms.id |
| `intake` | `fineguard_activation_evaluated` | intake_forms.id |
| `monitoring_activation` | `fineguard_activation_triggered` | monitored_companies.id |

All three rows share the same `correlation_id` UUID.

---

## Step 7 — Idempotency Check

Send the same payload a second time:

```bash
curl -s -X POST "$VERCEL_URL/api/pie/opportunity" \
  -H "Content-Type: application/json" \
  -d '{"externalRef":"24/AP/1234","applicantName":"Bromley Development Ltd","urgency":"high","estimatedValue":"£2,400,000"}' \
  | jq .
```

**Expected HTTP 200:**
```json
{
  "ok": true,
  "replayed": true,
  "matterRef": "MAT-<same timestamp as first call>"
}
```

No new intake row is created. A 4th audit row (`ingestion_replayed`) is written. The monitored_companies row is upserted (no change if already active).

---

## Rollback

| Scenario | Action |
|---|---|
| Bad deployment | Vercel Dashboard → Deployments → previous deployment → Promote to Production |
| Bad migration | `ALTER TABLE intake_forms DROP CONSTRAINT intake_forms_source_ref_unique;` (safe — only removes UNIQUE, no data loss) |
| Full database reset | Neon Console → Branches → Delete the branch → create fresh one → re-run bootstrap |
| Accidental Bromley data in prod | `DELETE FROM monitored_companies WHERE company_number = 'PIE:24/AP/1234'; DELETE FROM intake_forms WHERE source_ref = 'PIE:24/AP/1234';` (cascade deletes audit rows) |

---

## Current Blockers

| # | Blocker | Severity | Unblocked by |
|---|---|---|---|
| B1 | Neon project not created | P1 | Create project at console.neon.tech |
| B2 | `DATABASE_URL` and `DIRECT_URL` not available | P1 | B1 |
| B3 | `npm run db:bootstrap` not run | P1 | B2 |
| B4 | Vercel project not created | P1 | B1, B2, B3 |
| B5 | `main` branch not at current state | P2 | Merge feature branch to main |

All blockers are environmental. No code changes required.
