# Graceful Failure v2 — Circuit-Aware Resilience

**Repository:** allin50-cmd/manus-frontend
**Status:** Production-ready (additive, in-memory, serverless-safe)

This is the failure-handling layer that wraps external-dependency calls
across VaultLine. It exists to keep primary flows responsive when an
upstream is degraded — without queues, workers, retries that pile up,
or any new infrastructure.

---

## What v2 adds over v1

v1 introduced `wrapGracefully(ctx, fn)` and the `system_failure_captured`
audit event. v2 layers a per-dependency circuit breaker on top so that
*sustained* failures fast-fail instead of repeating the same timeout.

| Concern | v1 alone | v2 with circuit breaker |
|---|---|---|
| Single failure → primary flow survives | ✓ | ✓ |
| 100 consecutive failures → 100 timeout waits | ✗ (still tries each one) | ✓ (fast-fail after threshold) |
| Recovery probe after upstream heals | manual | automatic (HALF-OPEN) |
| Per-dependency health visibility | log lines | audit metadata + structured logs |

---

## Architecture

```
caller code
    │
    ▼
wrapGracefully(ctx, fn)
    │
    ├── shouldAllowExecution(dependency)?
    │     ├── circuit OPEN within cooldown ──► return { ok: false, error: 'circuit_open' }
    │     │                                     emit log + audit (system_failure_captured)
    │     │                                     fn() NEVER called
    │     └── allowed ──► run fn()
    │                       │
    │                       ├── resolved ──► recordSuccess(dep), return { ok: true, value }
    │                       └── rejected ──► recordFailure(dep), emit log + audit,
    │                                         return { ok: false, error, errorCategory }
    ▼
caller chooses degradation strategy based on { ok, error, degraded }
```

Two primitives, two files:

- `server/lib/circuit-breaker.ts` — pure in-memory state + transitions
- `server/lib/wrap-gracefully.ts` — wrapper that uses the breaker and emits audit

Everything else (Stripe webhook, scheduler, PIE→FineGuard) calls
`wrapGracefully` at the boundary of the dependency.

---

## Circuit Lifecycle

```
        ┌──────────┐ 5 failures within 60s  ┌────────┐
        │  CLOSED  ├──────────────────────► │  OPEN  │
        └──▲───┬───┘                        └───┬────┘
           │   │                                │
   success │   │ failure (counter resets        │ after 30s cooldown
           │   │  if >60s since last)           │
           │   │                                ▼
           │   │                         ┌───────────┐
           │   └────────────────────────►│ HALF-OPEN │
           │       failure (re-open)     │ (1 probe) │
           └─────────────────────────────┴─────┬─────┘
                  first success                │
                  closes the circuit ◄─────────┘
```

### State semantics

- **CLOSED** — normal operation. Failures accumulate inside a sliding
  60s window. When `failureThreshold` (default 5) is hit, the circuit
  transitions to OPEN.
- **OPEN** — fast-fail. `shouldAllowExecution` returns `false`;
  `wrapGracefully` skips `fn()` entirely and returns `circuit_open`.
  After `cooldownMs` (default 30s), the next call is allowed through
  as a probe — the state transitions to HALF-OPEN.
- **HALF-OPEN** — one probe in flight. A success closes the circuit and
  resets the counter. A failure re-opens it with a fresh cooldown.

### Defaults

```ts
{
  failureThreshold: 5,
  windowMs: 60_000,
  cooldownMs: 30_000,
}
```

Per-dependency override via `configureDependency(name, partialConfig)`.

---

## Configured Dependencies

| Dependency | Wraps | Threshold | Window | Cooldown | Degradation strategy |
|---|---|---|---|---|---|
| `companies_house_api` | `companiesHouseService.getComplianceStatus` in scheduler | 5 | 60s | 30s | Skip the company, continue the loop. Mark result `status: 'skipped'`. |
| `stripe_webhook_processing` | `monitored_companies` upsert in Stripe webhook | 5 | 60s | 30s | **Always 200 to Stripe.** DB enrichment is skipped; the activation is audited as `system_failure_captured`. |
| `fineguard_activation` | `monitored_companies` upsert in PIE→FineGuard helper | 5 | 60s | 30s | Skip activation. PIE intake response unaffected (always 201). A `fineguard_activation_failed` audit with `circuitState: open` is written so operators see the degradation. Replay path re-attempts on next delivery (after cooldown the circuit goes HALF-OPEN). |

The Companies House service is *not* wrapped at the `getCompanyProfile`
call in `POST /api/compliance-bundle` — that endpoint is interactive and
returns 500 to the user on failure (existing behaviour preserved). The
breaker is applied where the value of fast-fail is highest: the
scheduler loop (many calls per run) and the FineGuard upsert (silent
caller, no user-facing retry).

---

## `wrapGracefully` contract

```ts
async function wrapGracefully<T>(
  ctx: WrapContext,
  fn: () => Promise<T>,
): Promise<WrapResult<T>>
```

### Inputs

```ts
interface WrapContext {
  operation: string;                 // free-form, surfaces in logs + audit
  dependency?: string;               // enables circuit breaker bookkeeping
  errorCategory?: ErrorCategory;     // override the inferred category
  retryable?: boolean;               // override the inferred retryable flag
  correlationId?: string;
  sourceRef?: string;
  entityUuid?: string;
  upstreamSystem?: string;
  tenantId?: string;                 // if present, audit event is written on failure
}
```

### Outputs

```ts
type WrapResult<T> =
  | { ok: true;  value: T;        circuitState: 'closed' | 'half-open'; degraded: false }
  | { ok: false; error: string;   circuitState: CircuitStateName;       degraded: boolean; errorCategory: ErrorCategory };
```

### Guarantees

- **Never throws.** Every code path (including a panicking `fn`, a
  rejected audit write, a broken JSON.stringify) is caught.
- **Audit failures don't propagate.** The audit write is itself
  `.catch()`-ed and downgraded to a `vaultline.write.failed` log line.
- **Fast-fail is constant-time.** When the circuit is OPEN within
  cooldown, `fn` is not invoked — no timeout wait, no retry budget burn.

---

## `system_failure_captured` audit event

Written by `wrapGracefully` whenever `fn` rejects OR the circuit
short-circuits the call. Requires `tenantId` and `entityUuid` in the
context; without them the failure is logged-only.

```json
{
  "entityType": "system",
  "entityUuid": "<provided>",
  "action": "system_failure_captured",
  "correlationId": "<provided or 'unknown'>",
  "metadata": {
    "operation": "scheduler.companies_house.compliance_status",
    "dependency": "companies_house_api",
    "sourceRef": null,
    "upstreamSystem": "COMPANIES_HOUSE",
    "error": "ETIMEDOUT",
    "errorCategory": "external_api",
    "retryable": true,
    "circuitState": "open",
    "failureCount": 6,
    "cooldownRemainingMs": 28741,
    "degradedMode": true
  }
}
```

### errorCategory values

| Category | When | Retryable default |
|---|---|---|
| `validation` | Zod-style or "required/invalid/expected" errors | `false` |
| `database` | varchar overflow, constraint violation, missing relation | `true` |
| `external_api` | timeout, ECONNREFUSED, 5xx/429/408 | `true` |
| `circuit_open` | breaker short-circuited the call | `true` (after cooldown) |
| `runtime` | anything else | `false` |

Callers can override `errorCategory` and `retryable` in the context.

---

## Structured Log Events

| Event | Level | Fields |
|---|---|---|
| `graceful.circuit_open.skip` | warn | operation, dependency, correlationId, sourceRef, circuitState, failureCount, cooldownRemainingMs |
| `graceful.operation_failed` | error | + errorCategory, error |
| `vaultline.write.failed` | error | endpoint=system_failure_captured, correlationId, error |

All other domain events (`pie.fineguard.activated`, `scheduler.run.complete`, etc.) remain unchanged.

---

## Serverless Implications

- **Cold-start reset.** Each Vercel function instance maintains its own
  circuit state. When the instance is reclaimed (or scaled out), the
  state vanishes. This is deliberate — no Redis, no shared cache.
- **N-instance fan-out.** Under autoscaling, N instances each accumulate
  failures independently. The aggregate threshold is `N × 5` before
  every instance has opened its circuit. Acceptable for our traffic
  shape (low concurrency, sequential PIE delivery, on-demand scheduler).
- **Replay-path recovery.** PIE retries hit potentially a different
  instance (fresh circuit), so a transient outage affecting one
  instance doesn't permanently disable activation for that intake.

---

## Degradation Strategy vs Retry Strategy

| | Retry (existing `withRetry`) | Circuit breaker (new) |
|---|---|---|
| Scope | Per-call, in-line | Per-dependency, across calls |
| Goal | Recover from transient blips | Stop wasting time on sustained outages |
| Cost | Latency adds with each attempt | Constant-time fast-fail |
| When to use | The upstream sometimes flakes within seconds | The upstream is genuinely down |
| Composition | `wrapGracefully(ctx, () => withRetry(fn))` — both | breaker decides if `withRetry` even runs |

The scheduler uses both: `withRetry` for the per-call backoff, `wrapGracefully` for the per-dependency breaker.

---

## Operational Notes

- **Tuning thresholds.** Default `(5, 60s, 30s)` is conservative. If
  Companies House sees a 2-minute outage, expect ~5 failures (covering
  the first ~10 companies in a scheduler run), then the rest of the run
  fast-fails until cooldown. After cooldown, one probe per instance.
- **Detecting open circuits.** SQL query:
  ```sql
  SELECT metadata->>'dependency' AS dep,
         count(*) AS opens,
         max(created_at) AS last_open
  FROM clerk_audit_events
  WHERE action = 'system_failure_captured'
    AND metadata->>'circuitState' = 'open'
    AND created_at > now() - interval '15 minutes'
  GROUP BY dep;
  ```
- **No alerting hooked up yet.** This is a structured-data layer;
  alerting on `degradedMode: true` rows is a future operational task.

---

## What v2 does NOT do

- No persistence — circuit state is per-process, per-cold-start.
- No retry — recovery is via the HALF-OPEN probe, not by replaying
  failed calls.
- No queueing — failed operations are not stored for later replay.
  Domain-level idempotency (PIE replay, ON CONFLICT upserts) handles that.
- No Companies House response caching — listed in the v2 spec as
  "return cached/stale response if available" but no cache exists today;
  the breaker just skips the call. Adding a TTL cache is the natural
  v2.5 extension.

---

## Future v3 directions

- TTL cache for Companies House to satisfy "stale response on circuit open"
- Per-instance circuit telemetry exposed at `/api/internal/health`
- Adaptive thresholds (higher for read-only deps, lower for write deps)
- Bulkhead pattern (concurrent-call cap per dependency)
