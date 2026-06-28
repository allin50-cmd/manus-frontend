# Final Production Audit

**Repository:** allin50-cmd/manus-frontend
**Branch:** claude/ultracore-consolidation-audit-KmP0r
**Date:** 2026-05-25
**Audit type:** Pre-merge operational readiness — stabilization pass only

---

## Scope

This document records the final pre-merge production audit of the Vercel + Cloudflare deployment. No architectural changes were introduced. The audit covered:

- Request lifecycle observability
- Error boundary integrity
- Idempotency and replay safety
- DB connection strategy under Vercel
- HTTP middleware correctness
- Cloudflare edge configuration
- Rollback and recovery procedures

---

## Operational Guarantees

### Observability

Every externally meaningful operation emits a structured log event via `server/lib/logger.ts`:

| Operation | Event key | Fields |
|---|---|---|
| Any inbound request | `request.received` | method, path |
| Lead captured | `lead.captured` | correlationId, leadId, product |
| Lead failed | `lead.failed` | correlationId, error |
| Intake captured | `intake.captured` | correlationId, matterRef, matterType, urgency, sourceRef, durationMs |
| Compliance check executed | `compliance.check.executed` | correlationId, companyNumber, companyName, riskLevel, status, overdueFilings, durationMs |
| Compliance company not found | `compliance.company_not_found` | correlationId, companyNumber |
| Contact captured | `contact.captured` | correlationId, ticketId |
| Contact failed | `contact.failed` | correlationId, error |
| Stripe monitoring activation | `stripe.monitoring_activation` | correlationId, companyNumber, companyName |
| Stripe monitoring activation failed | `stripe.monitoring_activation.failed` | correlationId, error |
| Stripe webhook signature failed | `stripe.webhook.signature_failed` | correlationId, error |
| Stripe webhook unconfigured | `stripe.webhook.unconfigured` | correlationId |
| Scheduler run start | `scheduler.run.start` | correlationId (runId), companiesTotal |
| Scheduler company alert | `compliance.alert.required` | correlationId, companyNumber, status, riskLevel, overdueFilings |
| Scheduler company failed | `scheduler.company.failed` | correlationId, companyNumber, error |
| Scheduler run complete | `scheduler.run.complete` | correlationId, companiesChecked, alertsRequired, durationMs |
| Scheduler run failed | `scheduler.run.failed` | correlationId, error |
| VaultLine write failed | `vaultline.write.failed` | correlationId, endpoint, error |
| CH retry | `ch.getCompanyProfile: attempt N failed, retrying` | correlationId, attempt, error |

In production (`NODE_ENV=production`), all log events are emitted as single-line JSON to stdout, suitable for ingestion by Vercel Log Drains, Datadog, or any structured log aggregator.

### Correlation ID coverage

All API routes that write to the database or call external services carry a `correlationId` (UUID v4, generated per request):

- `POST /api/stripe/webhook` ✅ (generated at handler entry)
- `POST /api/stripe/checkout` — no correlationId (read-only Stripe call, no audit write; acceptable)
- `POST /api/intake` ✅
- `POST /api/compliance-bundle` ✅
- `POST /api/lead` ✅
- `POST /api/contact` ✅
- `GET /api/internal/run-compliance-check` ✅ (runId + per-company correlationId)

Admin read endpoints (`GET /api/admin/*`) do not require correlationIds — they are read-only, no audit chain.

---

## Error Boundary Integrity

### Client-facing errors

All 4xx/5xx responses are JSON with a stable `error` or `ok:false` shape. No stack traces, no internal error messages are sent to clients. Verified for all routes:

- Validation errors: `{ ok: false, error: "<message>" }` (400)
- Auth errors: `{ error: "Unauthorized" }` (401)
- Not found: `{ error: "Not found" }` (404)
- Server errors: `{ error: "Internal server error" }` or `{ ok: false, error: "<safe message>" }` (500)
- The only internal message surfaced: `COMPANIES_HOUSE_API_KEY` → replaced with `"Companies House API not configured. Please contact support."` — safe.

### Async route failures

All route handlers are wrapped in `try/catch`. No async errors can hang requests:
- Every `catch` block returns a response.
- The Express error handler catches anything that escapes.

### Scheduler batch isolation

Per-company failures in `GET /api/internal/run-compliance-check` are caught per iteration. One company's CH API failure does not abort the batch. The error is logged and the company is recorded in the results array with `status: 'error'`. The scheduler always returns a 200 with a full results summary.

### VaultLine write failures

All `writeAuditEvent()` calls are `.catch()`-chained — a VaultLine write failure logs an error event but never causes the HTTP response to fail. The primary data write (intake, compliance bundle, etc.) is not rolled back. This is intentional: the audit trail is a secondary concern; the primary operation must succeed independently.

---

## Idempotency and Replay Safety

### Stripe webhook (`POST /api/stripe/webhook`)

| Concern | Behavior |
|---|---|
| Duplicate delivery (Stripe retries) | `onConflictDoUpdate` on `monitoredCompanies.companyNumber` — safe, idempotent |
| Duplicate audit events | Append-only — each delivery produces one audit event; duplicate events are harmless |
| Signature failure | Returns 400 immediately; no DB write |
| Missing metadata (`companyNumber`/`companyName`) | Guard: `if (companyNumber && companyName)` — silently skips; session still returns `{ received: true }` |

**Stripe idempotency guarantee:** The company activation state is idempotent. The audit trail is append-only; duplicates add evidence but do not corrupt state.

### Scheduler (`GET /api/internal/run-compliance-check`)

| Concern | Behavior |
|---|---|
| Repeated runs | Each run produces new audit events per company — intentionally append-only |
| Concurrent runs | No locking; two concurrent runs produce duplicate audit events (harmless) |
| Company list changing between runs | Each run re-reads `monitored_companies` — new companies picked up, deleted companies absent |

**Scheduler idempotency:** Not idempotent by design. Each run is an independent compliance snapshot. Multiple runs do not corrupt state; they produce additive audit evidence.

### POST /api/intake (repeated submissions with same sourceRef)

| Concern | Behavior |
|---|---|
| Same `sourceRef` submitted twice | Two `intake_forms` rows created, two audit events written |
| `matterRef` uniqueness | `MAT-${Date.now()}` — practically unique; no constraint enforced at DB level |

**Intake idempotency:** Not idempotent. Each submission creates a new record. Same `sourceRef` is allowed — the dual-layer lineage design documents this as intentional. See `docs/dual-layer-lineage.md`.

### POST /api/compliance-bundle (repeated requests)

Each request creates a new `compliance_bundles` row with a fresh Companies House API call. Not idempotent. Each run is an independent compliance snapshot at the time of the call.

---

## DB Connection Strategy

### Configuration

`server/db/index.ts` sets pool max based on runtime:

| Runtime | `max` per instance |
|---|---|
| Local Node.js (`npm run server`) | 10 |
| Vercel (`VERCEL=1`) | 1 |

The pool is lazily initialized — created on first DB access, not at module load. This makes `api/index.ts` safe to import without `DATABASE_URL` set.

### Production recommendation

For a standard PostgreSQL instance (e.g., Neon, Supabase, self-hosted):
- Use a **connection pooler** (PgBouncer, Neon's built-in pooler, Supabase Transaction Pooler)
- Connect via the pooler URL (not the direct DB URL)
- Pool mode: **Transaction mode** (compatible with Drizzle + serverless)
- `max: 1` per function instance (already enforced on Vercel) + pooler handles the fan-out

Without a pooler, a burst of 50 concurrent Vercel invocations with `max: 1` each = 50 simultaneous DB connections. PostgreSQL default `max_connections = 100`. Account for other processes (migrations, seed, admin tools).

### `idle_timeout: 20s` and `connect_timeout: 10s`

These remain unchanged. On Vercel, a warm function instance that hasn't made a DB call in 20 seconds will close its idle connection and reconnect on the next call. This is correct behavior for serverless.

---

## HTTP Middleware Correctness

### Middleware ordering (INVARIANT — do not reorder)

```
1. POST /api/stripe/webhook   express.raw()   BEFORE express.json()
2. /api/trpc                  tRPC middleware  BEFORE cors/json
3. cors()
4. express.json({ limit: '100kb' })
5. express.urlencoded({ extended: true, limit: '100kb' })
6. request logging (log.info request.received)
7. /api/admin/* auth guard
8. API route handlers
9. express.static (local only)
10. /api/* JSON 404 guard
11. SPA fallback (local only)
12. Express error handler
```

### Body size limits

`express.json()` and `express.urlencoded()` both explicitly set `limit: '100kb'`. Requests exceeding this receive a 413 from Express before reaching any route handler.

`express.raw()` on the Stripe webhook uses Express's default of 100kb. Stripe payloads are typically < 5kb.

### CORS

`app.use(cors())` with no options allows all origins. This is appropriate:
- Public APIs (intake, compliance, lead, contact) are intended to be called from browser
- Admin endpoints are protected by `X-ADMIN-KEY` — CORS open does not bypass this
- Stripe webhook is not called from a browser — CORS header presence is harmless

### Trust proxy

`app.set('trust proxy', 1)` is set when `VERCEL=1`. This ensures:
- `req.ip` reflects the real client IP (through Cloudflare → Vercel → Express)
- `req.protocol` reflects the original scheme (https)
- `X-Forwarded-For` is trusted from the first proxy hop

Not set in local development (not needed, no reverse proxy).

### Stripe raw body invariant

The Stripe webhook route uses `express.raw({ type: 'application/json' })` as its own middleware, registered **before** `express.json()`. This means:
- The raw Buffer is available for `stripe.webhooks.constructEvent()`
- The global `express.json()` never sees this request
- **Critical:** Do not move `express.json()` above the Stripe webhook route — this will break signature verification

---

## Cloudflare Edge Configuration

### Cache Rules

```
/api/*                    → Cache Level: Bypass
/                         → Cache Level: Bypass
/*.html                   → Cache Level: Bypass
/assets/*                 → Cache Level: Cache Everything
                            Edge TTL: 1 year (filenames are content-hashed by Vite)
```

### API Cache-Control

For API responses that should never be cached by intermediate proxies:

Express does not set `Cache-Control` headers on API responses by default. Cloudflare's default behavior will not cache non-200 responses. For extra safety, add a Cloudflare Transform Rule:

- URL matches `/api/*`
- Action: Set response header `Cache-Control: no-store, no-cache`

### Stripe Webhook Bypass Rules

Stripe sends webhooks from a fixed set of IP addresses. Create a Cloudflare WAF exception:

```
URL path: /api/stripe/webhook
Method: POST
Action: Skip WAF, Skip rate limiting
Condition: IP in Stripe published ranges
```

This prevents Cloudflare from:
- Rate-limiting legitimate Stripe retry storms
- Challenging the webhook with JS challenges (Stripe cannot execute JavaScript)
- Modifying the request body (would break HMAC signature verification)

### Scheduler Route Protection

`GET /api/internal/run-compliance-check` is authenticated by `X-ADMIN-KEY` in Express. Additional Cloudflare protection options:

**Option A (recommended):** Cloudflare WAF rule to allow only known cron provider IP ranges; block all others.

**Option B:** Cloudflare Access: add a service auth token policy for this path.

**Option C:** Accept Express-layer auth only (`X-ADMIN-KEY` is sufficient if the key is strong).

### Rate Limiting Boundaries

Recommended Cloudflare rate limiting rules:

| Path | Limit | Window | Action |
|---|---|---|---|
| `/api/intake` | 10 requests | 1 minute / IP | Block for 1 hour |
| `/api/compliance-bundle` | 5 requests | 1 minute / IP | Block for 1 hour (CH API cost) |
| `/api/lead` | 5 requests | 1 minute / IP | Block for 10 minutes |
| `/api/contact` | 5 requests | 1 minute / IP | Block for 10 minutes |
| `/api/stripe/webhook` | Exempt | — | Never rate limit |
| `/api/internal/*` | Exempt | — | Protected by WAF IP rule |

### Bot Fight Mode

Enable Cloudflare Bot Fight Mode. Exempt:
- `/api/stripe/webhook` — Stripe is a known bot
- `/api/internal/run-compliance-check` — cron caller is a bot

Stripe's ASN (AS394161) should be added to a WAF exception so it bypasses Bot Fight Mode.

---

## Rollback and Recovery

### Deployment rollback

**Instant (Vercel dashboard):**
1. Vercel → Project → Deployments → find last good deployment → Promote to Production

**Git rollback:**
```bash
git revert HEAD
git push origin main
```

### Failed migration recovery

If a migration fails partway through:

1. Connect to the database
2. Identify which statements executed successfully by checking table/column state
3. For ClerkOS migrations: check `brand_suite_migrations` and `drizzle_migrations` tables
4. Manually apply the remaining statements from the failed migration file
5. Re-run `npm run db:migrate:clerkos` — the migrator tracks applied migrations and will skip already-applied ones

If the migration is unrecoverable, restore from the last DB snapshot and re-apply clean migrations.

### DB restore from empty

```bash
export DATABASE_URL=postgresql://user:pass@host:5432/dbname

# 1. Wipe (if needed)
psql $DATABASE_URL -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# 2. Re-bootstrap
npm run db:bootstrap
# → db:migrate:clerkos + db:migrate + db:seed:clerkos
```

### Webhook replay strategy

Stripe retains webhook events for 72 hours. To replay failed deliveries:

1. Log in to Stripe Dashboard → Developers → Webhooks → select endpoint
2. Find failed events → click "Resend"
3. The `onConflictDoUpdate` on `monitoredCompanies.companyNumber` ensures replayed events are safe

For non-Stripe webhooks: no replay mechanism exists; retry from the originating system.

### Reseeding tenant data

The system tenant (`00000000-0000-0000-0000-000000000001`) is seeded by `db:seed:clerkos`. The seed script uses `onConflictDoNothing()` — safe to re-run against a populated database.

```bash
DATABASE_URL=<url> npm run db:seed:clerkos
```

---

## Runtime Constraints

| Constraint | Detail |
|---|---|
| Vercel execution timeout | 10s (Hobby) / 60s (Pro). Scheduler endpoint may time out with large company lists. |
| DB connections per instance | max: 1 on Vercel. Use a connection pooler for bursts. |
| No persistent in-process state | Module variables persist across warm invocations within a single instance, but not across instances. |
| No filesystem writes at runtime | `dist/` is read-only on Vercel CDN. Do not write runtime data. |
| Scheduler is not atomic | Concurrent runs produce duplicate audit events. They are harmless and append-only. |
| Azure credentials in codebase | Azure Service Bus / Blob Storage clients remain in `server/services/`. They do not initialize unless their env vars are set. Not a runtime issue for Vercel. |
| `express.static` skipped on Vercel | Vercel CDN serves static assets directly. Express never receives requests for `/assets/*`. |

---

## Known Non-Blocking Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Scheduler timeout on large company lists | Medium | Vercel Pro 60s limit covers ~15 companies with 3-retry CH calls. Document and monitor. |
| No webhook replay for non-Stripe sources | Low | Stripe handles this natively. No other webhooks exist. |
| DB connection exhaustion without pooler | Medium | `max: 1` per Vercel instance reduces exposure. Pooler required for >50 concurrent users. |
| `POST /api/stripe/checkout` no correlationId | Low | Stripe returns its own session ID; tracing can use session.id. Non-audit route. |
| Admin read endpoints no correlationId | Low | Read-only, no audit chain. Not observable risk. |
| `matterRef` uniqueness is timestamp-based | Low | Clock skew could produce duplicates under extreme concurrency. Acceptable for current scale. |

---

## Changed Files (This Pass)

| File | Change |
|---|---|
| `server/app.ts` | Stripe webhook: correlationId at handler entry, structured logs; request middleware: structured log; POST /api/lead: correlationId + structured logs; POST /api/contact: correlationId + structured logs; removed redundant console.log for filing counts; express.json/urlencoded explicit limit |
| `server/db/index.ts` | `max: 1` on Vercel (`VERCEL=1`), `max: 10` locally |
| `docs/final-production-audit.md` | This file |

---

## Middleware Ordering Parity Confirmation

**CONFIRMED.** Middleware order in `server/app.ts` is identical to the original `server/index.ts` production-hardened version, with the following intentional additions only:

- `app.set('trust proxy', 1)` on Vercel (not middleware, config only)
- `limit: '100kb'` on `express.json()` and `express.urlencoded()` (restricts, not reorders)

The Stripe webhook raw-body registration position, tRPC position, `cors()`/`express.json()` order, admin auth guard position, `/api/*` JSON 404 guard position — all unchanged.

---

## Production Rollout Order

1. **Provision PostgreSQL** with connection pooler enabled
2. **Set Vercel environment variables** — all Required vars from `docs/deployment-checklist.md`
3. **Run bootstrap**: `DATABASE_URL=<url> npm run db:bootstrap`
4. **Deploy**: push `main` — Vercel deploys automatically
5. **Verify health**: `GET /api/health` → `{ "status": "ok", "database": "connected" }`
6. **Verify API guard**: `GET /api/intake` → 404 JSON
7. **Verify SPA**: `GET /vaultline` → 200 HTML
8. **Set up Cloudflare** — DNS, cache rules, Stripe webhook exception, rate limits
9. **Update Stripe** — webhook endpoint to production URL
10. **Validate Stripe** — send test webhook, verify 200 response
11. **Configure cron** — point external scheduler at `/api/internal/run-compliance-check`

---

## Recommended Vercel Plan Tier

**Pro tier** required for production:
- Execution timeout: 60s (Hobby: 10s — scheduler will time out)
- Log retention: 1 day (Hobby) vs 3 days (Pro)
- Concurrent builds: 2 (Pro)
- Team collaboration and deployment protection

---

## Recommended DB Pooling Configuration

| Provider | Mode | `max` per instance |
|---|---|---|
| Neon (built-in pooler) | Transaction mode | 1 |
| Supabase (Transaction Pooler) | Transaction mode | 1 |
| PgBouncer (self-hosted) | Transaction mode | 1 |

Set `DATABASE_URL` to the pooler connection string, not the direct connection string.

---

## MERGE RECOMMENDATION

**MERGE — GO**

All quality gates pass:
- `npm run type-check`: ✅ clean
- `npm run type-check:server` (strict): ✅ clean
- `npm test`: ✅ 38/38
- `npm run build`: ✅ `dist/` produced
- `npm run db:generate:clerkos`: ✅ "No schema changes" (zero drift)

All pre-merge invariants confirmed:
- Middleware ordering: preserved exactly
- API 404 guard: present in both runtimes
- Stripe raw body invariant: intact
- UUID audit writes: operational
- Correlation IDs: all audit-chain routes covered
- No stack traces in client responses
- No architectural drift introduced
- No Azure deployment reintroduction
- No new background workers
- No schema changes

The branch is production-ready. No further stabilization required before merge.
