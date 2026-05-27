/**
 * Execution Governance — Decision Gate
 *
 * Public entry point for the governance module. Implements an OODA loop:
 *
 *   OBSERVE  accept the raw GovernanceEvent (caller's responsibility to gather data)
 *   ORIENT   evaluate policy rules, risk, jurisdiction, client configuration
 *   DECIDE   return ALLOW / MODIFY / ESCALATE / DENY with reason codes
 *   ACT      caller acts only if decision is ALLOW or MODIFY
 *   AUDIT    every call produces a VaultLine-ready audit payload on the decision
 *
 * Escalated or denied actions MUST NOT execute automatically.
 * The returned vaultLineEvent should be persisted by the caller via writeAuditEvent().
 */

import { randomUUID } from 'crypto';
import type { GovernanceEvent, GovernanceDecision, ClientPolicy, SystemState } from './types';
import { buildDecision } from './policyEngine';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(s: string): boolean {
  return UUID_RE.test(s);
}

export type { GovernanceEvent, GovernanceDecision, ClientPolicy, SystemState };
export type { ExecutionDomain, ExecutionDecision, RiskLevel, ReasonCode } from './types';

/**
 * Evaluate execution governance for an incoming event.
 *
 * @param event        the action requesting authorisation
 * @param clientPolicy client-specific thresholds and overrides
 * @param systemState  current system health — defaults to GREEN
 * @returns            deterministic decision with audit payload
 *
 * @example
 * ```ts
 * const decision = evaluateExecutionGovernance(event, policy);
 * if (decision.decision === 'ALLOW') {
 *   await doWork();
 * } else {
 *   await escalate(decision);
 * }
 * await writeAuditEvent({ ...decision.vaultLineEvent, tenantId });
 * ```
 */
export function evaluateExecutionGovernance(
  event: GovernanceEvent,
  clientPolicy: ClientPolicy,
  systemState: SystemState = 'GREEN',
): GovernanceDecision {
  // OBSERVE — ensure the event carries a valid RFC 4122 UUID.
  // correlationId and entityUuid in clerk_audit_events are uuid columns;
  // PostgreSQL rejects non-UUID strings at insert time.
  const observed: GovernanceEvent = {
    ...event,
    id: event.id && isUUID(event.id) ? event.id : randomUUID(),
  };

  // ORIENT + DECIDE — pure rule evaluation, no I/O.
  return buildDecision(observed, clientPolicy, systemState);
}
