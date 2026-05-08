import { ConfidenceScores, StateDecision, SwarmNode } from './types';

export function decideFailureState(
  confidence: ConfidenceScores,
  currentNode: SwarmNode,
): StateDecision {
  const { comms, navigation, mission, safety, consensus,
          nav_integrity, clock_health } = confidence;
  const current = currentNode.state;

  // 1. Safety breach — always RED
  if (safety < 60) {
    return {
      nextState: 'RED',
      reason: `safety=${safety} — safety confidence below hard threshold`,
      allowedActions: ['EMERGENCY_HOLD', 'SAFE_STOP', 'REQUEST_HUMAN_REVIEW'],
      blockedActions: ['ADVANCE', 'AUTONOMOUS_RETASK', 'MISSION_ESCALATION'],
    };
  }

  // 2. Navigation integrity failure — AMBER (slow, cautious)
  if ((nav_integrity ?? 100) < 50) {
    return {
      nextState: 'AMBER',
      reason: `nav_integrity=${nav_integrity ?? 100} — navigation integrity critically low (possible spoofing or sensor conflict)`,
      allowedActions: ['REDUCE_SPEED', 'RELOCALIZE', 'REQUEST_HUMAN_REVIEW'],
      blockedActions: ['ADVANCE', 'HIGH_SPEED_ADVANCE', 'AUTONOMOUS_RETASK'],
    };
  }

  // 3. Clock health failure — BLACK (untrustworthy timing)
  if ((clock_health ?? 100) < 40) {
    return {
      nextState: 'BLACK',
      reason: `clock_health=${clock_health ?? 100} — clock health / timing integrity compromised`,
      allowedActions: ['LOCAL_FALLBACK', 'HOLD_POSITION', 'POWER_SAVE'],
      blockedActions: ['NEW_TASK_ACCEPTANCE', 'COORDINATED_MANEUVER', 'EVENT_BROADCAST'],
    };
  }

  // 4. RECOVER state: stay until recovery completes
  if (current === 'RECOVER') {
    return {
      nextState: 'RECOVER',
      reason: 'Awaiting recovery replay and reconciliation',
      allowedActions: ['REPLAY_EVENTS', 'VERIFY_STATE_HASH', 'SYNC_CONFIDENCE'],
      blockedActions: ['IMMEDIATE_REJOIN', 'TASK_EXECUTION_BEFORE_RECONCILIATION'],
    };
  }

  // 5. BLACK: if comms/consensus improved, transition to RECOVER
  if (current === 'BLACK') {
    if (comms > 50 && consensus >= 30) {
      return {
        nextState: 'RECOVER',
        reason: `comms=${comms} consensus=${consensus} — comms restored above recovery threshold`,
        allowedActions: ['REPLAY_EVENTS', 'VERIFY_STATE_HASH', 'SYNC_CONFIDENCE'],
        blockedActions: ['IMMEDIATE_REJOIN', 'TASK_EXECUTION_BEFORE_RECONCILIATION'],
      };
    }
    return {
      nextState: 'BLACK',
      reason: `comms=${comms} consensus=${consensus} — still isolated`,
      allowedActions: ['LOCAL_FALLBACK', 'HOLD_POSITION', 'RETURN_TO_LAST_SAFE_POINT', 'POWER_SAVE'],
      blockedActions: ['NEW_TASK_ACCEPTANCE', 'COORDINATED_MANEUVER', 'HIGH_RISK_ACTION'],
    };
  }

  // 6. RED: require operator approval to leave
  if (current === 'RED') {
    if (!(safety >= 70 && currentNode.operatorResumeApproved)) {
      return {
        nextState: 'RED',
        reason: safety < 70
          ? `safety=${safety} — safety not yet restored`
          : 'Safety restored but awaiting operator resume approval',
        allowedActions: ['SAFE_STOP', 'REQUEST_HUMAN_REVIEW'],
        blockedActions: ['ADVANCE', 'AUTONOMOUS_RETASK', 'HIGH_SPEED_ADVANCE'],
      };
    }
  }

  // 7. Isolation check
  if (comms < 35 || consensus < 30) {
    return {
      nextState: 'BLACK',
      reason: `comms=${comms} consensus=${consensus} — node isolated or consensus confidence lost`,
      allowedActions: ['LOCAL_FALLBACK', 'HOLD_POSITION', 'RETURN_TO_LAST_SAFE_POINT', 'POWER_SAVE'],
      blockedActions: ['NEW_TASK_ACCEPTANCE', 'COORDINATED_MANEUVER', 'HIGH_RISK_ACTION'],
    };
  }

  // 8. Degradation check
  if (navigation < 65 || mission < 60 || consensus < 60) {
    return {
      nextState: 'AMBER',
      reason: `nav=${navigation} mission=${mission} consensus=${consensus} — degraded confidence`,
      allowedActions: ['REDUCE_SPEED', 'RELOCALIZE', 'REQUEST_RELAY', 'CONTINUE_LOW_RISK_TASK'],
      blockedActions: ['HIGH_SPEED_ADVANCE', 'HIGH_RISK_MANEUVER', 'AUTONOMOUS_ESCALATION'],
    };
  }

  // 9. Legacy AMBER thresholds (comms/nav/safety bands)
  if (comms < 70 || navigation < 70 || mission < 70 || safety < 80 || consensus < 70) {
    return {
      nextState: 'AMBER',
      reason: `degraded: comms=${comms} nav=${navigation}`,
      allowedActions: ['REDUCE_SPEED', 'RELOCALIZE', 'CONTINUE_LOW_RISK_TASK'],
      blockedActions: ['HIGH_SPEED_ADVANCE', 'HIGH_RISK_MANEUVER'],
    };
  }

  return {
    nextState: 'GREEN',
    reason: 'All confidence scores within normal operating range',
    allowedActions: ['ADVANCE', 'SCAN', 'REROUTE', 'COORDINATE', 'RELAY', 'DELIVER'],
    blockedActions: [],
  };
}
