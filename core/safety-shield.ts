import { AIRecommendation, ShieldDecision, SwarmNode } from './types';
import { decideFailureState } from './failure-state-machine';

export function safetyShield(node: SwarmNode, ai: AIRecommendation): ShieldDecision {
  const stateDecision = decideFailureState(node.confidence, node);

  // 1. Hard safety block
  if (node.confidence.safety < 60) {
    return { decision: 'DENY', approvedAction: 'EMERGENCY_HOLD', reason: 'Safety shield denied action' };
  }

  // 2. Quarantine — connected but untrusted; all actions blocked for review
  if (stateDecision.nextState === 'QUARANTINE') {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
      approvedAction: 'HOLD_AND_REQUEST_REVIEW',
      reason: 'Node quarantined; operator review and explicit clearance required before any action',
    };
  }

  // 3. Recovery shield
  if (stateDecision.nextState === 'RECOVER') {
    return {
      decision: 'MODIFY',
      approvedAction: 'REPLAY_EVENTS_AND_VERIFY_HASH',
      reason: 'Node entering recovery; replay and hash verification required',
    };
  }

  // 3. Navigation integrity / spoofing alert
  if ((node.confidence.nav_integrity ?? 100) < 40) {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
      approvedAction: 'HOLD_AND_REQUEST_OPERATOR',
      reason: 'Navigation integrity compromised (possible spoofing); human review required',
    };
  }

  // 4. Isolation / timing
  if (stateDecision.nextState === 'BLACK') {
    return {
      decision: 'MODIFY',
      approvedAction: 'LOCAL_FALLBACK',
      reason: 'Comms or consensus degraded; switching to isolated fallback',
    };
  }

  // 5. Degradation
  if (stateDecision.nextState === 'AMBER') {
    return {
      decision: 'MODIFY',
      approvedAction: 'REDUCE_SPEED_AND_RELOCALIZE',
      reason: 'Node degraded; limiting autonomy',
    };
  }

  // 6. RED awaiting operator approval
  if (stateDecision.nextState === 'RED') {
    return {
      decision: 'MODIFY',
      approvedAction: 'AWAIT_OPERATOR_APPROVAL',
      reason: stateDecision.reason,
    };
  }

  // 7. Low AI confidence
  if (ai.confidence < 75) {
    return {
      decision: 'REQUEST_HUMAN_REVIEW',
      approvedAction: 'HOLD_PENDING_REVIEW',
      reason: 'AI confidence below approval threshold',
    };
  }

  return { decision: 'ALLOW', approvedAction: ai.action, reason: 'AI recommendation passed deterministic safety shield' };
}
