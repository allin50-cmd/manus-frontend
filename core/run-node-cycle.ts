import { SwarmNode } from './types';
import { UltraEvent, createStateHash } from './event-log';
import { decideFailureState } from './failure-state-machine';
import { safetyShield } from './safety-shield';

// Monotonic counter for deterministic event IDs within a session.
let _eventSeq = 0;
export function resetEventSequence(): void { _eventSeq = 0; }

export function runNodeCycle(params: {
  missionId: string;
  node: SwarmNode;
  aiRecommendation: { action: string; confidence: number };
  eventLog: UltraEvent[];
}): { node: SwarmNode; eventLog: UltraEvent[] } {
  const { node, eventLog } = params;

  // Compute FSM decision once; pass it to safetyShield to avoid a second FSM call.
  const stateDecision = decideFailureState(node.confidence, node);
  const shield = safetyShield(node, params.aiRecommendation, stateDecision);

  const updatedNode: SwarmNode = {
    ...node,
    state: stateDecision.nextState,
    currentTask: shield.approvedAction,
    lastSeenAt: Date.now(),
    operatorResumeApproved: stateDecision.nextState === 'RED' ? node.operatorResumeApproved : undefined,
  };

  const stateHash = createStateHash({
    nodeId: updatedNode.id,
    state: updatedNode.state,
    confidence: updatedNode.confidence,
    cellId: updatedNode.cellId,
    task: updatedNode.currentTask,
  });

  const now = Date.now();
  const event: UltraEvent = {
    eventId: `${node.id}-${now}-${String(++_eventSeq).padStart(6, '0')}`,
    nodeId: node.id,
    missionId: params.missionId,
    timestamp: now,
    previousState: node.state,
    nextState: stateDecision.nextState,
    confidenceBefore: node.confidence,
    confidenceAfter: updatedNode.confidence,
    actionRecommended: params.aiRecommendation.action,
    actionApproved: shield.approvedAction,
    reason: stateDecision.reason,
    cellId: updatedNode.cellId,
    stateHash,
  };

  return { node: updatedNode, eventLog: [...eventLog, event] };
}
