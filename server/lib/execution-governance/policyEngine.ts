import type {
  GovernanceEvent,
  GovernanceDecision,
  ClientPolicy,
  ExecutionDecision,
  ReasonCode,
  SystemState,
} from './types';
import { buildGovernanceAuditPayload } from './auditEvent';

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_MIN_CONFIDENCE = 0.7;

// Call-centre actions that must be escalated regardless of confidence.
const CALL_CENTRE_RESTRICTED_ACTIONS = [
  'refund',
  'legal_advice',
  'legal advice',
  'cancellation',
  'cancel',
  'payment_promise',
  'payment promise',
];

// ─── Rule evaluation ──────────────────────────────────────────────────────────

interface RuleResult {
  triggered: boolean;
  decision: ExecutionDecision;
  reasonCode: ReasonCode;
  requiredActions: string[];
}

function ruleSystemState(systemState: SystemState): RuleResult | null {
  if (systemState === 'BLACK') {
    return {
      triggered: true,
      decision: 'DENY',
      reasonCode: 'SYSTEM_STATE_BLACK',
      requiredActions: ['audit_only_mode_active', 'no_mutations_permitted'],
    };
  }
  if (systemState === 'RED') {
    return {
      triggered: true,
      decision: 'ESCALATE',
      reasonCode: 'SYSTEM_STATE_RED',
      requiredActions: ['require_human_review', 'hold_for_approval'],
    };
  }
  if (systemState === 'AMBER') {
    // AMBER narrows: escalate anything below high confidence; low-risk still allowed.
    return null; // handled as a modifier in the main evaluator
  }
  return null; // GREEN — no system constraint
}

function ruleLowConfidence(event: GovernanceEvent, policy: ClientPolicy): RuleResult | null {
  const threshold = policy.minimumConfidenceScore ?? DEFAULT_MIN_CONFIDENCE;
  if (event.confidenceScore < threshold) {
    return {
      triggered: true,
      decision: 'ESCALATE',
      reasonCode: 'LOW_CONFIDENCE',
      requiredActions: ['require_human_review'],
    };
  }
  return null;
}

function ruleCriticalRisk(event: GovernanceEvent, policy: ClientPolicy): RuleResult | null {
  if (event.riskLevel !== 'critical') return null;
  if (policy.humanOverrideActive === true) return null; // explicitly lifted
  return {
    triggered: true,
    decision: 'DENY',
    reasonCode: 'CRITICAL_RISK',
    requiredActions: ['require_human_override', 'escalate_to_senior_clerk'],
  };
}

function rulePaymentThreshold(event: GovernanceEvent, policy: ClientPolicy): RuleResult | null {
  if (event.domain !== 'payment_approval') return null;
  const threshold = policy.paymentApprovalThresholdPence;
  if (threshold === undefined) return null;
  const amount = (event.payload?.amountPence as number | undefined) ?? 0;
  if (amount > threshold) {
    return {
      triggered: true,
      decision: 'ESCALATE',
      reasonCode: 'PAYMENT_THRESHOLD_EXCEEDED',
      requiredActions: ['require_payment_approval', 'notify_finance_team'],
    };
  }
  return null;
}

function ruleConfidentialDocument(event: GovernanceEvent, policy: ClientPolicy): RuleResult | null {
  if (event.domain !== 'document_release') return null;
  const patterns = policy.confidentialDataPatterns ?? [];
  const summary = (event.inputSummary + ' ' + JSON.stringify(event.payload ?? {})).toLowerCase();
  const matched = patterns.some(p => summary.includes(p.toLowerCase()));
  if (!matched) return null;
  // DENY if risk is high/critical, otherwise ESCALATE
  const decision: ExecutionDecision =
    event.riskLevel === 'high' || event.riskLevel === 'critical' ? 'DENY' : 'ESCALATE';
  return {
    triggered: true,
    decision,
    reasonCode: 'CONFIDENTIAL_DATA_DETECTED',
    requiredActions: ['require_document_review', 'notify_data_protection_officer'],
  };
}

function ruleCallCentreRestrictedAction(event: GovernanceEvent): RuleResult | null {
  if (event.domain !== 'ai_call_centre') return null;
  const action = event.actionRequested.toLowerCase();
  const triggered = CALL_CENTRE_RESTRICTED_ACTIONS.some(r => action.includes(r));
  if (!triggered) return null;
  return {
    triggered: true,
    decision: 'ESCALATE',
    reasonCode: 'CALL_CENTRE_RESTRICTED_ACTION',
    requiredActions: ['transfer_to_human_agent', 'log_restricted_action'],
  };
}

function ruleJurisdictionMissing(event: GovernanceEvent): RuleResult | null {
  if (event.domain !== 'compliance_workflow') return null;
  if (event.jurisdiction !== null && event.jurisdiction.trim() !== '') return null;
  return {
    triggered: true,
    decision: 'ESCALATE',
    reasonCode: 'JURISDICTION_MISSING',
    requiredActions: ['request_jurisdiction_clarification'],
  };
}

// ─── Main evaluator ───────────────────────────────────────────────────────────

/**
 * Evaluate all policy rules in priority order and return the strictest decision.
 *
 * Decision precedence (most restrictive wins):
 *   DENY > ESCALATE > MODIFY > ALLOW
 *
 * Pure and deterministic — no side effects, no I/O.
 */
export function applyPolicyRules(
  event: GovernanceEvent,
  policy: ClientPolicy,
  systemState: SystemState,
): { decision: ExecutionDecision; reasonCodes: ReasonCode[]; requiredActions: string[] } {
  const triggered: RuleResult[] = [];

  // System-state rules evaluated first — BLACK/RED override everything.
  const stateRule = ruleSystemState(systemState);
  if (stateRule) triggered.push(stateRule);

  // AMBER modifier: raise minimum confidence requirement to 0.9.
  const amberPolicy: ClientPolicy =
    systemState === 'AMBER'
      ? { ...policy, minimumConfidenceScore: Math.max(policy.minimumConfidenceScore ?? 0, 0.9) }
      : policy;

  triggered.push(
    ...[
      ruleLowConfidence(event, amberPolicy),
      ruleCriticalRisk(event, policy),
      rulePaymentThreshold(event, policy),
      ruleConfidentialDocument(event, policy),
      ruleCallCentreRestrictedAction(event),
      ruleJurisdictionMissing(event),
    ].filter((r): r is RuleResult => r !== null),
  );

  if (triggered.length === 0) {
    return {
      decision: 'ALLOW',
      reasonCodes: ['POLICY_ALLOW'],
      requiredActions: [],
    };
  }

  // Most-restrictive decision wins.
  const precedence: Record<ExecutionDecision, number> = {
    DENY: 4,
    ESCALATE: 3,
    MODIFY: 2,
    ALLOW: 1,
  };
  triggered.sort((a, b) => precedence[b.decision] - precedence[a.decision]);

  const decision = triggered[0].decision;
  const reasonCodes = [...new Set(triggered.map(r => r.reasonCode))];
  const requiredActions = [...new Set(triggered.flatMap(r => r.requiredActions))];

  return { decision, reasonCodes, requiredActions };
}

// ─── Full decision builder ────────────────────────────────────────────────────

/**
 * Build a complete GovernanceDecision from policy evaluation results.
 * Called by decisionGate after the ORIENT phase.
 */
export function buildDecision(
  event: GovernanceEvent,
  policy: ClientPolicy,
  systemState: SystemState,
): GovernanceDecision {
  const { decision, reasonCodes, requiredActions } = applyPolicyRules(event, policy, systemState);
  const humanReviewRequired = decision === 'ESCALATE' || decision === 'DENY';
  const now = new Date().toISOString();

  const result: GovernanceDecision = {
    decision,
    reasonCodes,
    requiredActions,
    humanReviewRequired,
    createdAt: now,
    // Placeholder — filled in after the object is constructed.
    vaultLineEvent: null as unknown as GovernanceDecision['vaultLineEvent'],
  };
  result.vaultLineEvent = buildGovernanceAuditPayload(event, result);
  return result;
}
