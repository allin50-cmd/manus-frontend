# Runtime Architecture

**Repository:** allin50-cmd/manus-frontend
**Date:** 2026-05-25

---

## Overview

The application runs in two distinct runtime contexts that share a single Express app factory.

```
server/app.ts
  └─ createApp(): Express
       ├─ server/index.ts   → local Node.js runtime (dev + self-hosted)
       └─ api/index.ts      → Vercel serverless runtime (production)
```

---

## Local Node.js Runtime

**Entry point:** `server/index.ts`

Used for:
- Local development (`npm run dev:full`)
- Docker / self-hosted deployments

Behaviour:
- Calls `createApp()` then `app.listen(PORT)`
- Serves static files from `dist/` via `express.static`
- Handles SPA routing via catch-all `GET *` that sends `dist/index.html`
- Binds to `process.env.PORT` (default 3000)

```
npm run dev:full     # Vite (frontend HMR) + Express (API) concurrently
npm run server       # Express only
npm run server:watch # Express with tsx --watch
```

---

## Vercel Serverless Runtime

**Entry point:** `api/index.ts`

Used for:
- Production hosting at Vercel

Behaviour:
- Exports `createApp()` result as the default export
- `isVercel === true` at runtime, so Express skips:
  - `express.static` (Vercel CDN handles assets)
  - SPA fallback `GET *` (Vercel routing handles it via `vercel.json`)
- All `/api/*` routes are handled by the same Express app
- Static files are served by Vercel's CDN from the `dist/` build output

The `isVercel` flag is set at module load time:

```ts
const isVercel = Boolean(process.env.VERCEL);
```

Vercel automatically sets `process.env.VERCEL = "1"` in all serverless function invocations.

---

## Middleware Order (preserved in both runtimes)

The order below is enforced in `server/app.ts` and must not be changed:

1. **Stripe webhook** — `express.raw()`, registered before `express.json()`
2. **tRPC** — `/api/trpc`, registered before general JSON middleware
3. `cors()`
4. `express.json()`
5. `express.urlencoded()`
6. **Logging** middleware
7. **Admin auth** guard — `/api/admin/*`
8. API route handlers (health, Stripe, deployments, lead, intake, compliance, contact, scheduler)
9. `express.static` (local only — skipped on Vercel)
10. **`/api/*` JSON 404 guard** — catches unmatched API paths; returns `{ error: "Not found" }` as JSON
11. **SPA fallback** `GET *` (local only — skipped on Vercel)
12. Express error handler

The Stripe webhook must stay at position 1 because it requires access to the raw request body before `express.json()` parses it.

The `/api/*` guard must stay after all API route handlers and after `express.static` to ensure legitimate API routes are matched first.

---

## Environment Variables

See `docs/vercel-deployment.md` for the full list.

In local development, variables are loaded from `.env` via `dotenv.config()` inside `createApp()`. In Vercel, variables are injected by the platform at runtime — `dotenv.config()` is a no-op when the variables are already in the environment.

---

## Audit Lineage

The audit architecture is unchanged by the runtime split. Both runtimes write to the same `clerk_audit_events` table via `writeAuditEvent()`. See `docs/dual-layer-lineage.md` for the dual-layer design rationale.

---

## Azure Infrastructure (Reserved)

Azure is retained only for VaultLine audit infrastructure (Azure Service Bus, Azure Blob Storage). It is not used for application hosting. The Azure deployment workflows (`deploy-vaultline.yml`, `azure-static-web-apps-ci-cd.yml`) have been removed. Application hosting moved to Vercel + Cloudflare.
