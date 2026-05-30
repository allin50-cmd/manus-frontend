# Vercel Deployment

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

---

## Deployment Model

The application deploys to Vercel using native GitHub integration (no custom deploy workflow). On every push to `main`, Vercel:

1. Runs `npm ci`
2. Runs `npm run build` (produces `dist/`)
3. Deploys the Express API via `@vercel/node` from `api/index.ts`
4. Serves the built frontend from `dist/` via Vercel's CDN

The CI quality gate in `.github/workflows/ci.yml` runs independently on all branches and includes type-checking and tests.

---

## File Structure

```
api/
  index.ts          # Vercel serverless entry — exports createApp()

server/
  app.ts            # Express app factory — createApp()
  index.ts          # Local Node runtime — calls app.listen()

vercel.json         # Routing: /api/* → serverless, everything else → CDN/SPA
```

---

## Required Environment Variables

Set these in the Vercel project dashboard under **Settings → Environment Variables**:

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `COMPANIES_HOUSE_API_KEY` | Yes | Companies House API key |
| `ADMIN_API_KEY` | Yes | Admin endpoint authentication key |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `STRIPE_PRICE_ID` | Yes | Stripe subscription price ID |
| `APP_URL` | Yes | Public base URL (e.g. `https://yourapp.vercel.app`) |
| `VITE_API_URL` | If used | Frontend API base URL |
| `DEPLOY_RECORD_TOKEN` | Optional | Token for deployment recording endpoint |

**Build-time note:** `COMPANIES_HOUSE_API_KEY` must be set in Vercel for the build step even though it is not used at build time. The `npm run build` step does not call the API; the CI workflow uses `placeholder-ci-build-only` for the same reason.

**Cold-start note:** `DATABASE_URL` is required for every serverless function invocation. The DB pool is initialized lazily on first request — `api/index.ts` can be imported without DATABASE_URL set, but the first database operation will throw if it is absent. Ensure the env var is configured in Vercel before deploying.

---

## Routing

`vercel.json` routes:

- `/api/*` → `api/index.ts` (serverless function, all HTTP methods)
- Static files → served from `dist/` by Vercel CDN (`handle: filesystem`)
- Everything else → `dist/index.html` (SPA fallback)

The Express app itself also enforces a `/api/*` JSON 404 guard as a defense-in-depth measure. On Vercel, the static serving and SPA fallback are omitted from the Express layer (`isVercel === true`) because Vercel's CDN handles them.

---

## Scheduler Endpoint

`GET /api/internal/run-compliance-check` remains an externally-triggered HTTP route authenticated by `X-ADMIN-KEY`. It is NOT converted to an in-process interval worker.

To trigger it from a cron service (e.g. Vercel Cron, GitHub Actions schedule, or an external scheduler):

```
GET https://yourapp.vercel.app/api/internal/run-compliance-check
X-ADMIN-KEY: <ADMIN_API_KEY value>
```

**Important:** Vercel serverless functions have a maximum execution duration (default 10s on Hobby, 60s on Pro). If the monitored companies list grows large, consider migrating to a dedicated worker or Vercel Cron job.

---

## Rollback Plan

Vercel maintains a full deployment history. To roll back:

1. Open the Vercel dashboard → Deployments
2. Find the last known-good deployment
3. Click **Promote to Production**

For a code-level rollback: revert the commit on `main` and push — Vercel will redeploy automatically.

---

## Cloudflare Role

Cloudflare sits in front of Vercel as a CDN/WAF proxy. DNS is managed in Cloudflare; all traffic flows through Cloudflare before reaching Vercel. No Cloudflare Workers are used for application logic.

---

## Known Serverless Constraints

- **No persistent in-process state** — do not cache data in module-level variables between requests; a new function instance may be allocated for each invocation.
- **Cold starts** — the first request after a period of inactivity will incur a cold start. The DB pool is initialized per cold start.
- **Function duration limits** — the scheduler endpoint may time out if compliance checks across many companies take longer than the serverless timeout.
- **No filesystem writes** — the `dist/` directory is read-only on Vercel; do not attempt to write files at runtime.
- **`express.static` is skipped** — Vercel serves static assets directly from CDN; the `isVercel` flag ensures Express never tries to serve them.
