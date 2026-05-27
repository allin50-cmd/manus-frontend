# Global Coordination Layer (v1)

## Architecture Rationale

VaultLine runs as serverless functions on Vercel. Each cold start is a new
process with a fresh in-memory circuit breaker — there is no shared runtime
state between instances. Under concurrent load this means:

- Instance A trips the `companies_house_api` circuit after 5 failures
- Instance B, cold-started 2s later, has no record of that degradation
- Instance B makes N more calls to a broken dependency before opening its own circuit

The Global Coordination Layer solves this by using **PostgreSQL as a lightweight
coordination bus**. It is not distributed consensus, not a queue, not a lock
manager. It is a shared snapshot store with eventual-consistency semantics.

## Why PostgreSQL

The existing system already uses PostgreSQL for all durable state. Adding a
coordination layer here costs:

- Zero new infrastructure
- Zero operational overhead
- Zero dependency on Redis, SQS, or any external service

The trade-off is latency and precision: PostgreSQL round-trips are ~5–20ms.
For a circuit breaker that cares about "is this dependency degraded", eventual
consistency over a 5-second window is sufficient.

## Tables

### `global_resilience_state`

One row per dependency. Updated opportunistically on circuit state changes.
`OPEN` state from any instance propagates to others on next reconcile.

| Column           | Purpose |
|-----------------|---------|
| `dependency`     | Primary key — logical dependency name |
| `circuit_state`  | `closed` / `open` / `half-open` |
| `failure_count`  | Rolling failure count at last write |
| `last_failure_at`| When the most recent failure was recorded |
| `cooldown_until` | When the circuit is expected to auto-close |
| `updated_at`     | Used for stale-state expiry |
| `instance_id`    | Which instance wrote this row |

### `scheduler_leases`

One row per named scheduler job. Implements a lease with expiry — no hard
locks, safe under crash recovery.

| Column            | Purpose |
|------------------|---------|
| `lease_name`      | Primary key — e.g. `fineguard-compliance-check` |
| `holder_instance` | UUID of the instance currently holding the lease |
| `acquired_at`     | When the lease was acquired |
| `expires_at`      | When it auto-expires (no holder can keep it forever) |

### `global_incident_state`

Latest-write-wins incident status for cross-instance observability consistency.
Not transactionally guaranteed — used for display only.

## Reconciliation Model

`syncGlobalCircuitState()` is called opportunistically (e.g. on startup or
periodic poll). It:

1. Reads all `global_resilience_state` rows updated within `staleTtlMs` (default 5 min)
2. For each row where `circuit_state = 'open'` and the local circuit is not already open:
   - Configures a transient circuit with `failureThreshold: 1` and `cooldownMs: remainingMs`
   - Records one failure to open it locally
3. Returns a count of circuits synced

**OPEN wins over CLOSED**: this is the safe default. A false-positive open
circuit costs one request probe. A false-negative closed circuit costs N
wasted requests to a broken dependency.

**Stale states are ignored**: if an instance died 10 minutes ago with an OPEN
circuit, we don't propagate that. The TTL defaults to 5 minutes — calibrate
to your worst-case instance crash→garbage-collection window.

## Scheduler Lease Behaviour

Before running `fineguard-compliance-check`, the scheduler:

1. Evaluates whether the `pause_scheduler` override is active (see Operations
   Control Plane docs). If active, returns `{ skipped: true, reason: 'scheduler_paused' }`.
2. Calls `acquireSchedulerLease('fineguard-compliance-check', 5 * 60_000)`.
3. If another instance holds an unexpired lease, returns
   `{ skipped: true, reason: 'lease_held_by_other_instance' }`.
4. On success, processes all companies.
5. Releases the lease on completion (both success and failure paths).

**Crash safety**: if the instance dies mid-run, the lease expires after 5 min.
The next invocation after that will acquire and continue. No manual recovery
needed.

**DB unavailable fallback**: if PostgreSQL is unreachable, the lease call
returns `acquired: true`. This means multiple instances may run concurrently
during a DB outage. That is intentional — scheduler starvation is worse than
duplicate CH polling in degraded mode.

## Retry Amplification Protection

`retry-budget.ts` tracks retry attempts per dependency in a rolling window.
When a dependency exceeds `maxRetries` in `windowMs`:

1. The circuit is opened immediately (no waiting for the threshold)
2. Further retry attempts are denied
3. The budget state is logged for observability

This prevents N instances × M retries × K companies = N×M×K calls during a
CH outage. The budget is per-process (resets on cold start), which is
consistent with the circuit breaker's lifetime semantics.

## Eventual Consistency Semantics

- **Write path**: local state is updated synchronously; Postgres write is
  fire-and-forget. A write failure is logged but never blocks the caller.
- **Read path**: local memory is always the fast-path source of truth. Postgres
  is consulted for cross-instance coordination, not for every request.
- **Convergence time**: typically 5–30 seconds from a state change to all
  instances reflecting it, limited by reconcile frequency and DB latency.
- **Conflict resolution**: OPEN wins. Latest `updated_at` wins for closed state.

## Failure Modes Still Possible

1. **DB outage during reconcile**: local state diverges. Instances self-heal
   as soon as DB recovers. Scheduler may run on multiple instances during outage.
2. **Simultaneous failure spikes on all instances**: each opens its circuit
   independently before global sync. This is not a problem — it just means the
   global table gets many concurrent writes to the same row (UPSERT handles this).
3. **Clock skew**: if instance clocks are more than `windowMs` apart, sliding-
   window expiry behaves unexpectedly. Vercel normalises NTP so this is unlikely.
4. **Row deletion**: if someone manually deletes a `global_resilience_state` row,
   the circuit resets on next reconcile. Treat the table as append-only in prod.

## Why This Is NOT Distributed Consensus

Raft, Paxos, and similar protocols guarantee **linearizability** — all nodes
agree on the total order of writes. This system guarantees no such thing.

Two instances can disagree about circuit state for up to `CACHE_TTL_MS` (30s
for overrides) or `staleTtlMs` (5min for circuits). That is acceptable because:

- Circuit breaker decisions are advisory, not authoritative
- The cost of a diverged decision is a few extra failed HTTP requests
- The cost of full consensus (Redis, etcd, CockroachDB) is infrastructure sprawl

The design follows the principle: "globally coherent enough under failure" —
not "perfect distributed agreement".

## Serverless Coordination Limitations

Vercel functions are stateless, short-lived, and subject to concurrent cold
starts. This means:

- Reconciliation only happens when a function is invoked — there is no
  background polling process
- A dependency can stay locally CLOSED for up to `expiresAt - now` seconds
  if the instance never hits `syncGlobalCircuitState()`
- The lease model prevents duplicate scheduler runs but not duplicate API calls

These limitations are acceptable for the current scale. At higher throughput,
consider calling `syncGlobalCircuitState()` at request startup on warm
instances, or add an explicit reconcile cron.
