# Operations Control Plane (v1)

## Operational Philosophy

The VaultLine resilience system is designed to be **self-protecting** under
normal conditions: circuit breakers open automatically when dependencies
degrade, the scheduler avoids duplicate runs, and graceful degradation
ensures requests never crash the caller.

But self-protection has limits. When:

- A dependency is known to be degraded *before* the circuit trips
- A maintenance window is scheduled
- A dependency is flapping and you want to suppress noise
- You need to annotate an incident for the on-call record

…you need **operator-controlled intervention** — the ability to influence
system behaviour without redeploying, editing DB rows manually, or
restarting services.

The Operations Control Plane provides this through a set of internal API
endpoints that apply temporary, audited, expiry-safe overrides to the
resilience system.

## Override Types

| Override              | Effect |
|----------------------|--------|
| `force_open`          | Dependency circuit is always treated as OPEN. All calls via `wrapGracefully` skip execution. |
| `force_closed`        | Dependency bypasses OPEN state (use with extreme care — disables protective behaviour). |
| `maintenance_mode`    | Dependency execution is skipped immediately. `wrapGracefully` returns `ok: false, overrideApplied: true`. No retries attempted. |
| `pause_scheduler`     | The FineGuard compliance scheduler will not acquire its lease. Returns `{ skipped: true, reason: 'scheduler_paused' }`. |
| `disable_retry_budget`| Per-dependency retry budget is bypassed (for debugging retry amplification issues). |

## Override Lifecycle

```
POST /api/internal/operations/override
  → validates payload
  → inserts row to operational_overrides
  → invalidates in-memory 30s cache
  → emits system_override_applied audit event

GET /api/internal/operations/overrides
  → returns all active (non-expired) overrides

DELETE /api/internal/operations/override/:id
  → removes specific override by UUID
  → invalidates in-memory cache
  → emits system_override_removed audit event
```

Overrides are **additive**: multiple overrides can exist for the same target.
The override engine checks for each type independently.

Overrides are **expiry-safe**: the `expires_at` field is optional. Without it,
the override persists until manually deleted. With it, it automatically
becomes inactive after the specified time (filter applied at query time — no
background job needed).

## Maintenance Mode Semantics

When `maintenance_mode` is active for a dependency:

1. `wrapGracefully()` detects the override *before* checking the circuit breaker
2. Returns immediately: `{ ok: false, error: 'maintenance_mode', degraded: true, overrideApplied: true, overrideType: 'maintenance_mode' }`
3. Records an operation failure in the ring buffer (for observability)
4. Logs `graceful.maintenance_mode.skip` with the override ID and reason
5. Does NOT record a circuit breaker failure — maintenance mode is operator intent, not dependency failure

**No retries attempted**: the caller's `retryable: true` flag is ignored.
Maintenance mode means "we know this will fail — don't waste attempts".

**Example workflow**:
```http
POST /api/internal/operations/override
{
  "target": "companies_house_api",
  "overrideType": "maintenance_mode",
  "createdBy": "ops@example.com",
  "reason": "CH API maintenance window 02:00-04:00 UTC",
  "expiresAt": "2026-05-26T04:00:00Z"
}
```

At 04:00 UTC the override expires automatically. Normal circuit breaker
behaviour resumes on the next request.

## Scheduler Pause Behaviour

The `pause_scheduler` override targets the special `scheduler` key (not a
dependency name). When active:

1. `GET /api/internal/run-compliance-check` checks for `pause_scheduler` override
2. If found: returns `{ skipped: true, reason: 'scheduler_paused', overrideId: '...' }`
3. **Does not** acquire the lease
4. **Does not** process any companies
5. **Does not** emit failures or audit events for individual companies

This is useful when you want to temporarily stop the CH polling storm without
disabling the endpoint or changing infrastructure.

## Incident Annotation

Annotations are append-only notes attached to an `incidentStatus` label:

```http
POST /api/internal/operations/annotate
{
  "incidentStatus": "degraded",
  "note": "Companies House API returning 503 from EU-West region since 14:32 UTC. CH status page shows active incident.",
  "createdBy": "on-call@example.com"
}
```

Annotations are:
- **Append-only**: no editing, no deletion
- **Included in `GET /api/internal/operations/incidents`** for operator review
- **Emitting `system_annotation_added` audit events** for the VaultLine audit trail
- **Not structurally validated**: `incidentStatus` is a free-text label — use
  whatever convention your on-call runbook defines (`nominal`, `degraded`,
  `incident`, etc.)

## Auditability Guarantees

Every control-plane mutation emits a `clerk_audit_events` row:

| Action | Emitted When |
|--------|-------------|
| `system_override_applied` | Override created via POST |
| `system_override_removed` | Override deleted via DELETE |
| `system_annotation_added` | Annotation added via POST |

All events include: `target`, `overrideType`, `createdBy`, `reason`, `expiresAt`,
`correlationId`. The audit write failure is caught and logged — it never blocks
the control-plane response.

## Safety Protections

The control plane prevents the following dangerous states:

1. **Unknown overrideType**: POST returns 400 with allowed values listed
2. **maintenance_mode on unknown dependency**: POST returns 400. Maintenance mode
   on an unrecognised dependency name is likely a typo and would silently do nothing.
3. **Contradictory overrides (force_open + force_closed on same target)**: POST
   returns 400 if the opposing override is already active on the same target.
   You cannot have both `force_open` and `force_closed` active simultaneously
   for the same dependency.
4. **Stale overrides**: expired overrides are filtered at query time. The in-memory
   cache is TTL'd at 30 seconds so a just-expired override may still be active
   for up to 30 more seconds. This is acceptable.

## Observability Integration

The `GET /api/internal/resilience` endpoint includes overrides in its response:

```json
{
  "overrides": {
    "companies_house_api": {
      "type": "maintenance_mode",
      "expiresAt": "2026-05-26T04:00:00.000Z",
      "reason": "CH API maintenance window"
    }
  },
  "global": {
    "circuits": { "companies_house_api": { ... } },
    "schedulerLease": { "held": false, "holderInstance": null, "expiresAt": null }
  }
}
```

This gives a single endpoint that shows: local circuit state, global coordinated
state, active overrides, and recent operation traces.

## Failure Scenarios

### Override engine DB unavailable
The `loadActiveOverrides()` function returns a stale in-memory cache on DB
error. If the cache was never populated (first load fails): returns an empty
map — **no overrides are active**. This means:

- `force_open` will not fire (circuit protection degrades to local-only)
- `maintenance_mode` will not fire (calls proceed normally)
- `pause_scheduler` will not fire (scheduler runs normally)

This is the safe default: better to run with no overrides than to incorrectly
block all traffic.

### Partial override write failure
If the Postgres insert succeeds but the audit event write fails, the override
is active and the cache is invalidated. The missing audit event is logged as
`vaultline.write.failed`. The override still works correctly.

### Multiple overrides for same target
All active overrides for a target are loaded. `wrapGracefully` checks in order:
`maintenance_mode` first, then `force_open`. Multiple active overrides of the
same type are redundant but harmless.

## Why This Is NOT Distributed Orchestration

The control plane does not:

- Automatically resolve incidents (no healing logic)
- Chain overrides causally (no "if X then Y" rules)
- Propagate state between dependencies (overrides are independent)
- Manage deployment state or rollbacks

It is a **human-in-the-loop control surface**: operators express intent, the
system applies it exactly as specified, and the audit trail records what was
done and by whom. All intelligence remains with the operator.

This is intentional. Autonomous orchestration systems are complex, hard to
reason about under failure, and tend to take unexpected actions at the worst
possible time. The goal here is **transparency** and **predictability** over
automation.
