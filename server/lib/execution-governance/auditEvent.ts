import type { GovernanceEvent, GovernanceDecision, VaultLineAuditPayload } from './types';

/**
 * Build a VaultLine-ready audit payload from a governance event and its decision.
 *
 * The returned object is suitable for writeAuditEvent() once the caller
 * supplies a tenantId. Governance does not know the tenant — it is
 * infrastructure-agnostic by design.
 *
 * entityType  = "governance_decision"
 * action      = decision value (ALLOW / MODIFY / ESCALATE / DENY)
 * metadata    = full JSON record of both input event and output decision
 */
export function buildGovernanceAuditPayload(
  event: GovernanceEvent,
  decision: GovernanceDecision,
): VaultLineAuditPayload {
  return {
    entityType: 'governance_decision',
    entityId: null,
    // event.id is guaranteed to be a valid UUID by the time it reaches here
    // (decisionGate normalises it). Required: writeAuditEvent() throws when both
    // entityId and entityUuid are null.
    entityUuid: event.id,
    action: decision.decision,
    actorId: null,
    // varchar(64) column — truncate to prevent DB rejection on long actor strings
    actorOpenId: event.actor.slice(0, 64),
    previousState: null,
    nextState: decision.decision,
    correlationId: event.id,
    metadata: JSON.stringify({
      domain: event.domain,
      source: event.source,
      actionRequested: event.actionRequested,
      inputSummary: event.inputSummary,
      confidenceScore: event.confidenceScore,
      riskLevel: event.riskLevel,
      jurisdiction: event.jurisdiction,
      clientId: event.clientId,
      reasonCodes: decision.reasonCodes,
      requiredActions: decision.requiredActions,
      humanReviewRequired: decision.humanReviewRequired,
    }),
  };
}
