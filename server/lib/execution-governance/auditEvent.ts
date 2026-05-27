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
    entityUuid: null,
    action: decision.decision,
    actorId: null,
    actorOpenId: event.actor,
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
