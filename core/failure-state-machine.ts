import { ConfidenceScores, StateDecision, SwarmNode } from './types';

export function decideFailureState(
  confidence: ConfidenceScores,
  currentNode: SwarmNode,
): StateDecision {
  const { comms, navigation, mission, safety, consensus,
          nav_integrity, clock_health } = confidence;
  const current = currentNode.state;

  // ── Rule 1: QUARANTINE is the most sticky state ──────────────────────────
  // A quarantined node stays contained regardless of confidence scores.
  // Only explicit operator clearance (operatorResumeApproved) breaks out.
  if (current === 'QUARANTINE') {
    if (!currentNode.operatorResumeApproved) {
      return {
        nextState: 'QUARANTINE',
        reason: 'Node quarantined; awaiting operator review and explicit clearance',
        allowedActions: ['REQUEST_HUMAN_REVIEW', 'TELEMETRY_ONLY'],
        blockedActions: ['ADVANCE', 'COORDINATE', 'MISSION_ESCALATION', 'EVENT_BROADCAST'],
      };
    }
    // operator cleared — fall through to normal evaluation
  }

  // ── Rule 2: Hard safety breach ───────────────────────────────────────────
  if (safety < 60) {
    return {
      nextState: 'RED',
      reason: `safety=${safety} — safety confidence below hard threshold`,
      allowedActions: ['EMERGENCY_HOLD', 'SAFE_STOP', 'REQUEST_HUMAN_REVIEW'],
      blockedActions: ['ADVANCE', 'AUTONOMOUS_RETASK', 'MISSION_ESCALATION'],
    };
  }

  // ── Rule 3: RECOVER is sticky until recovery engine resolves it ──────────
  if (current === 'RECOVER') {
    return {
      nextState: 'RECOVER',
      reason: 'Awaiting recovery replay and reconciliation',
      allowedActions: ['REPLAY_EVENTS', 'VERIFY_STATE_HASH', 'SYNC_CONFIDENCE'],
      blockedActions: ['IMMEDIATE_REJOIN', 'TASK_EXECUTION_BEFORE_RECONCILIATION'],
    };
  }

  // ── Rule 4a: Confirmed consensus poisoning — trust critically low → QUARANTINE
  // trust < 10 means the node's mission data is definitively untrustworthy.
  // Analogous to nav_integrity < 20 for GNSS: suspected < threshold vs confirmed < floor.
  if ((confidence.trust ?? 100) < 10) {
    return {
      nextState: 'QUARANTINE',
      reason: `trust=${confidence.trust ?? 100} — consensus poisoning confirmed; node definitively untrusted`,
      allowedActions: ['REQUEST_HUMAN_REVIEW', 'TELEMETRY_ONLY'],
      blockedActions: ['ADVANCE', 'COORDINATE', 'MISSION_ESCALATION', 'AUTONOMOUS_RETASK', 'EVENT_BROADCAST'],
    };
  }

  // ── Rule 4b: Suspected consensus poisoning — trust degraded → AMBER ──────
  if ((confidence.trust ?? 100) < 40) {
    return {
      nextState: 'AMBER',
      reason: `trust=${confidence.trust ?? 100} — peer verification failed; possible consensus poisoning`,
      allowedActions: ['REDUCE_SPEED', 'TELEMETRY_ONLY', 'REQUEST_HUMAN_REVIEW'],
      blockedActions: ['ADVANCE', 'COORDINATE', 'MISSION_ESCALATION', 'AUTONOMOUS_RETASK'],
    };
  }

  // ── Rule 5: Confirmed GNSS spoofing → QUARANTINE ─────────────────────────
  // nav_integrity < 20 means the navigation data is so corrupted it is
  // logically untrustworthy; treat as a compromised node, not just degraded.
  if ((nav_integrity ?? 100) < 20) {
    return {
      nextState: 'QUARANTINE',
      reason: `nav_integrity=${nav_integrity ?? 100} — GNSS spoofing confirmed; node untrusted`,
      allowedActions: ['REQUEST_HUMAN_REVIEW', 'TELEMETRY_ONLY'],
      blockedActions: ['ADVANCE', 'COORDINATE', 'AUTONOMOUS_RETASK', 'MISSION_ESCALATION'],
    };
  }

  // ── Rule 6: Navigation integrity low — suspected spoofing ────────────────
  if ((nav_integrity ?? 100) < 50) {
    return {
      nextState: 'AMBER',
      reason: `nav_integrity=${nav_integrity ?? 100} — navigation integrity critically low (possible spoofing or sensor conflict)`,
      allowedActions: ['REDUCE_SPEED', 'RELOCALIZE', 'REQUEST_HUMAN_REVIEW'],
      blockedActions: ['ADVANCE', 'HIGH_SPEED_ADVANCE', 'AUTONOMOUS_RETASK'],
    };
  }

  // ── Rule 7: Clock health failure — untrustworthy timing ─────────────────
  if ((clock_health ?? 100) < 40) {
    return {
      nextState: 'BLACK',
      reason: `clock_health=${clock_health ?? 100} — clock health / timing integrity compromised`,
      allowedActions: ['LOCAL_FALLBACK', 'HOLD_POSITION', 'POWER_SAVE'],
      blockedActions: ['NEW_TASK_ACCEPTANCE', 'COORDINATED_MANEUVER', 'EVENT_BROADCAST'],
    };
  }

  // ── Rule 8: BLACK node — attempt comms-based recovery ───────────────────
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

  // ── Rule 9: RED node — require operator approval to exit ────────────────
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

  // ── Rule 10: Isolation check ─────────────────────────────────────────────
  if (comms < 35 || consensus < 30) {
    return {
      nextState: 'BLACK',
      reason: `comms=${comms} consensus=${consensus} — node isolated or consensus confidence lost`,
      allowedActions: ['LOCAL_FALLBACK', 'HOLD_POSITION', 'RETURN_TO_LAST_SAFE_POINT', 'POWER_SAVE'],
      blockedActions: ['NEW_TASK_ACCEPTANCE', 'COORDINATED_MANEUVER', 'HIGH_RISK_ACTION'],
    };
  }

  // ── Rule 11: Degradation check ───────────────────────────────────────────
  if (navigation < 65 || mission < 60 || consensus < 60) {
    return {
      nextState: 'AMBER',
      reason: `nav=${navigation} mission=${mission} consensus=${consensus} — degraded confidence`,
      allowedActions: ['REDUCE_SPEED', 'RELOCALIZE', 'REQUEST_RELAY', 'CONTINUE_LOW_RISK_TASK'],
      blockedActions: ['HIGH_SPEED_ADVANCE', 'HIGH_RISK_MANEUVER', 'AUTONOMOUS_ESCALATION'],
    };
  }

  // ── Rule 12: Legacy AMBER thresholds ────────────────────────────────────
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
