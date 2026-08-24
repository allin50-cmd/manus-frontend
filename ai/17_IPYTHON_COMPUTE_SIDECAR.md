# IPython Compute Sidecar

## Decision

Use IPython/ipykernel only as an isolated, disposable compute and evidence sidecar for UltraCore. It must not sit on the production authority path, hold production credentials, approve actions, execute consequential business actions, or become a second workflow engine.

## Why it fits

The Jupyter kernel protocol gives us a clean process boundary for interactive Python execution, rich outputs, inspection and reproducible analytical steps. That is useful for:

- migration profiling and reconciliation
- CSV/Excel/data-quality analysis
- compliance and finance calculations
- evidence generation for Runtime receipts
- ad-hoc investigation by authorised operators
- model/agent evaluation and test harnesses
- chart/table/report generation
- safe experimentation before code is promoted into deterministic services

The kernel is stateful by design, so it is excellent for exploration but should never be treated as the source of truth.

## Architecture

```text
Operator / UltraCore UI
        |
        v
Typed Compute Request
        |
        v
UltraCore Compute Broker
  - authenticate user
  - authorise capability
  - validate input schema
  - allocate run id
  - redact secrets
  - set CPU/RAM/time/network limits
        |
        v
Ephemeral Sandbox
  - Python
  - ipykernel/IPython
  - read-only input bundle
  - temporary working directory
  - no production credentials
  - no direct write access to canonical DB
        |
        v
Typed Result Bundle
  - JSON result
  - stdout/stderr
  - tables/charts/files
  - package/runtime manifest
  - code hash
  - input hash
  - timestamps
        |
        v
UltraCore Evidence Adapter
        |
        +--> immutable Runtime receipt / Activity evidence
        +--> operator review
        +--> separately authorised canonical action
```

## Authority boundary

The kernel may answer questions and produce evidence. It may not directly perform a consequential action.

Allowed:

- SELECT/read-only extracts supplied by UltraCore
- calculate deadlines, penalties, forecasts and reconciliations
- transform a bounded input dataset
- generate a proposed import mapping
- generate charts/reports
- test deterministic algorithms
- compare expected versus actual records

Forbidden:

- direct production database writes
- access to Supabase service-role keys, JWT signing keys or cloud root credentials
- sending customer email/SMS/WhatsApp
- approving or executing Runtime actions
- altering audit records
- deploying code
- changing IAM, billing, DNS or infrastructure
- becoming an autonomous long-lived agent

Any desired write must return a proposed structured action to UltraCore, pass existing policy/authority checks, and execute through the normal Runtime actuator.

## Integration pattern

Do not expose a raw Jupyter server to end users as the first implementation. Build a small Compute Broker that speaks to an ephemeral kernel or sandbox internally and exposes typed jobs to UltraCore.

Example request:

```json
{
  "capability": "property_import_reconciliation",
  "input_bundle_id": "bundle_...",
  "parameters": {
    "source_system": "manus-fineguard"
  },
  "limits": {
    "cpu_seconds": 30,
    "memory_mb": 512,
    "wall_seconds": 60,
    "network": "none"
  }
}
```

Example result:

```json
{
  "status": "ok",
  "run_id": "compute_...",
  "result": {
    "properties": 29,
    "orphan_tenancies": 0,
    "duplicate_source_ids": 0
  },
  "evidence": {
    "input_sha256": "...",
    "code_sha256": "...",
    "result_sha256": "...",
    "runtime": "python-3.x/ipykernel",
    "artifacts": []
  }
}
```

## Best first use in our stack

The Manus property migration is the ideal pilot.

1. UltraCore exports the source records into an immutable input bundle.
2. The compute sidecar profiles fields and types.
3. It detects duplicates, nulls and orphan relationships.
4. It produces the proposed Property/Tenancy/Certificate/Maintenance mapping.
5. It calculates reconciliation counts and hashes.
6. UltraCore records the compute receipt.
7. A deterministic importer, not the notebook/kernel, performs the approved write.
8. A second compute run verifies source versus destination and emits final evidence.

This gives us immediate value without putting IPython on the critical path.

## Additional high-value uses

### FineGuard

- regulatory dataset diffing
- penalty/deadline test vectors
- accountant portfolio anomaly analysis
- Companies House/HMRC data reconciliation
- evidence packs for rule changes

### Accuracy PIE

- planning-lead scoring experiments
- postcode/radius analysis
- win-rate and quote analysis
- campaign attribution

### MediaWorks

- campaign spend/return analysis
- receivables ageing
- creative experiment evaluation

### UltraTech Runtime

- RFC 8785/JCS cross-language conformance experiments
- receipt-chain verification
- adversarial test generation
- replay analysis
- agent evaluation datasets

## State and reproducibility rules

Interactive kernel state is disposable. Every accepted result must be reproducible from:

- immutable input bundle
- versioned Python code or notebook source
- locked dependency manifest
- declared runtime image
- explicit parameters
- deterministic seed where applicable

Do not treat hidden notebook state, manually-created variables or execution order as production evidence.

## Security model

Kernel access is equivalent to code execution in the sandbox. Therefore:

- one sandbox per run/session boundary
- run as an unprivileged user
- filesystem scoped to temporary workdir
- production filesystem not mounted
- no Docker socket
- no cloud instance metadata access
- deny outbound network by default
- allowlisted egress only for specific read-only jobs
- short wall-clock timeout
- CPU/RAM/process limits
- kill sandbox after run
- scan/size-limit returned artifacts
- never inject long-lived secrets into kernel environment

A custom IPython kernel that merely blocks `!` or selected imports is not a sufficient security boundary. Isolation must be enforced outside Python.

## Deployment options

### Phase 1 — local/dev proof

MacBook or isolated CI runner using `jupyter_client`/`ipykernel` to prove typed request -> kernel execution -> typed result -> evidence hash.

### Phase 2 — sandboxed service

Run ephemeral containers/microVMs on an execution host. UltraCore/Vercel sends jobs to the broker; Vercel itself should not host long-lived kernels.

Candidates should be evaluated separately from the product runtime: AWS ECS/Fargate task-per-job, an isolated EC2 worker pool, or a dedicated sandbox platform. Selection is an infrastructure decision, not a reason to couple kernels into Next.js.

### Phase 3 — operator analysis workspace

Only if needed, add a protected JupyterLab-style analyst interface for trusted internal users. Keep it separate from customer-facing JustWorks/FineGuard UI and from Runtime authority.

## Receipt extension

A compute run can fit the existing evidence chain:

```text
OBJECTIVE
 -> INTENT
 -> POLICY
 -> AUTHORITY
 -> COMPUTE_REQUEST
 -> COMPUTE_EXECUTION
 -> COMPUTE_RESULT
 -> EVIDENCE
 -> (optional) PROPOSED_ACTION
 -> APPROVAL
 -> EXECUTION
 -> RESULT
```

Suggested compute evidence fields:

- run_id
- capability
- kernel/runtime version
- image digest
- code hash
- input bundle hash
- parameter hash
- stdout/stderr hash
- result hash
- artifact hashes
- started_at / completed_at
- exit status
- resource limits

## Recommendation

Adopt the pattern, not a notebook-first product.

Build one narrow proof around the property migration reconciliation. If it produces deterministic, receipt-linked value, generalise the broker into an UltraCore Compute capability. Keep every engine swappable: IPython is one execution backend behind the broker, not a permanent architectural dependency.
