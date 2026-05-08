export type FailureState = 'GREEN' | 'AMBER' | 'RED' | 'BLACK' | 'RECOVER' | 'QUARANTINE';

export interface ConfidenceScores {
  comms: number;
  navigation: number;
  mission: number;
  safety: number;
  consensus: number;
  nav_integrity?: number;  // 0–100; low = possible spoofing or sensor conflict
  clock_health?: number;   // 0–100; low = timing corruption / loss of sync
}

export interface SwarmNode {
  id: string;
  role: 'ASRP' | 'AUM' | 'AIR_RELAY' | 'SENSOR' | 'OPERATOR';
  state: FailureState;
  cellId: string;
  lastSeenAt: number;
  confidence: ConfidenceScores;
  currentTask?: string;
  operatorResumeApproved?: boolean;
  recoveryAttempts?: number;  // increments each BLACK→RECOVER transition; ≥3 → QUARANTINE
}

export interface StateDecision {
  nextState: FailureState;
  reason: string;
  allowedActions: string[];
  blockedActions: string[];
}

export interface AIRecommendation {
  action: string;
  confidence: number;
}

export interface ShieldDecision {
  decision: 'ALLOW' | 'MODIFY' | 'DENY' | 'REQUEST_HUMAN_REVIEW';
  approvedAction: string;
  reason: string;
}
