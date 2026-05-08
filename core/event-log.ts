import { ConfidenceScores, FailureState } from './types';

export interface UltraEvent {
  eventId: string;
  nodeId: string;
  missionId: string;
  timestamp: number;
  previousState: FailureState;
  nextState: FailureState;
  confidenceBefore: ConfidenceScores;
  confidenceAfter: ConfidenceScores;
  actionRecommended: string;
  actionApproved: string;
  reason: string;
  cellId: string;
  stateHash?: string;
}

export interface StateHashInput {
  nodeId: string;
  state: string;
  confidence: ConfidenceScores;
  cellId: string;
  task?: string;
}

// DJB2-variant hash — deterministic, no Node crypto needed, browser-safe
export function createStateHash(input: StateHashInput): string {
  const str = JSON.stringify({
    n: input.nodeId,
    s: input.state,
    c: input.confidence,
    cell: input.cellId,
    t: input.task ?? '',
  });
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
