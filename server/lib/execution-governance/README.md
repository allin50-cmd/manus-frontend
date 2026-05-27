# Execution Governance

A shared, deterministic gate that every AI or automation action passes through before execution.

## Model

Every action is evaluated against a fixed set of policy rules. The gate returns one of:

| Decision | Meaning |
|---|---|
| `ALLOW` | Action may proceed immediately |
| `MODIFY` | Action may proceed with constraints applied |
| `ESCALATE` | Action requires human review before execution |
| `DENY` | Action must not execute under any circumstance |

**Escalated and denied actions must never execute automatically.**

## OODA Loop

```
OBSERVE   → accept GovernanceEvent (actor, domain, confidence, risk, jurisdiction, payload)
ORIENT    → evaluate policy rules against client configuration and system state
DECIDE    → return ALLOW / MODIFY / ESCALATE / DENY with reason codes
ACT       → caller executes only if ALLOW or MODIFY
AUDIT     → every call produces a VaultLine-ready audit payload (persisted by caller)
```

## Usage

```typescript
import { evaluateExecutionGovernance } from './decisionGate';

const decision = evaluateExecutionGovernance(event, clientPolicy);

if (decision.decision === 'ALLOW') {
  await doWork();
} else {
  await escalate(decision);
}

// Persist the audit trail — supply tenantId before calling writeAuditEvent()
await writeAuditEvent({ ...decision.vaultLineEvent, tenantId });
```

## Policy Rules

Rules are evaluated in priority order. The most restrictive decision wins (DENY > ESCALATE > MODIFY > ALLOW).

| # | Condition | Decision |
|---|---|---|
| 1 | `confidenceScore < 0.7` (or client minimum) | ESCALATE |
| 2 | `riskLevel === 'critical'` and no human override | DENY |
| 3 | `domain === 'payment_approval'` and `amount > threshold` | ESCALATE |
| 4 | `domain === 'document_release'` and confidential data detected | ESCALATE (medium risk) / DENY (high risk) |
| 5 | `domain === 'ai_call_centre'` and action is refund, legal advice, cancellation, or payment promise | ESCALATE |
| 6 | `domain === 'compliance_workflow'` and `jurisdiction === null` | ESCALATE |
| 7 | No rules triggered | ALLOW |

## Adaptive System States

The system state narrows allowed action as operational uncertainty increases.

| State | Behaviour |
|---|---|
| `GREEN` | Full automation allowed — default |
| `AMBER` | Assisted automation only — minimum confidence raised to 0.9 |
| `RED` | All execution escalated — human review required |
| `BLACK` | Read-only / audit-only — all mutations denied |

```typescript
const decision = evaluateExecutionGovernance(event, policy, 'AMBER');
```

## Domains

| Domain | What it governs |
|---|---|
| `compliance_workflow` | Advancing matter states, regulatory filings |
| `payment_approval` | Billing charges, Stripe checkout |
| `document_release` | Releasing compliance bundles, AML reports |
| `ai_call_centre` | AI agent actions on inbound calls |

## VaultLine Integration

Every decision includes a `vaultLineEvent` field. This is a `VaultLineAuditPayload` — compatible with `InsertAuditEvent` once `tenantId` is supplied. The governance module does not write to the database; the caller persists the event.

```typescript
// decision.vaultLineEvent shape:
{
  entityType: 'governance_decision',
  action: 'ALLOW' | 'MODIFY' | 'ESCALATE' | 'DENY',
  actorOpenId: event.actor,
  correlationId: event.id,
  metadata: JSON.stringify({ domain, reasonCodes, riskLevel, ... })
}
```

## Files

| File | Purpose |
|---|---|
| `types.ts` | All type definitions — `GovernanceEvent`, `GovernanceDecision`, `ClientPolicy`, etc. |
| `policyEngine.ts` | Pure rule evaluation — deterministic, no I/O |
| `auditEvent.ts` | Builds VaultLine-ready audit payload from event + decision |
| `decisionGate.ts` | Public entry point — `evaluateExecutionGovernance()` |
| `examples.ts` | Four domain examples for integration reference |
| `execution-governance.test.ts` | Unit tests for all rules, system states, and audit payload |
