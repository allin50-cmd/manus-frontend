import { SwarmNode } from "./types";
import { UltraEvent, createStateHash } from "./event-log";
import { decideFailureState } from "./failure-state-machine";

export type RecoveryResult = {
  status: "RECOVERED" | "QUARANTINED" | "NEEDS_REVIEW";
  node: SwarmNode;
  reason: string;
  replayedEvents: number;
};

export function replayNodeEvents(node: SwarmNode, events: UltraEvent[]): SwarmNode {
  return events.reduce<SwarmNode>((current, event) => ({
    ...current,
    state: event.nextState,
    confidence: event.confidenceAfter,
    currentTask: event.actionApproved,
    cellId: event.cellId,
    lastSeenAt: event.timestamp,
    operatorResumeApproved: current.operatorResumeApproved,
  }), node);
}

export function reconcileRecoveredNode(
  node: SwarmNode,
  eventsSinceDisconnect: UltraEvent[]
): RecoveryResult {
  if (eventsSinceDisconnect.length === 0) {
    return {
      status: "NEEDS_REVIEW",
      node: {
        ...node,
        state: "RECOVER",
        currentTask: "AWAITING_EVENT_REPLAY",
      },
      reason: "No replay events available for recovered node",
      replayedEvents: 0,
    };
  }

  const replayedNode = replayNodeEvents(node, eventsSinceDisconnect);
  const recalculatedState = decideFailureState(replayedNode.confidence, replayedNode).nextState;

  const reconciledNode: SwarmNode = {
    ...replayedNode,
    state: recalculatedState === "BLACK" ? "RECOVER" : recalculatedState,
    currentTask:
      recalculatedState === "BLACK"
        ? "REPLAY_COMPLETE_BUT_STILL_DEGRADED"
        : replayedNode.currentTask,
  };

  // Compute hash of the reconciled state
  const recalculatedHash = createStateHash({
    nodeId: reconciledNode.id,
    state: reconciledNode.state,
    confidence: reconciledNode.confidence,
    cellId: reconciledNode.cellId,
    task: reconciledNode.currentTask,
  });

  const lastEventHash = eventsSinceDisconnect[eventsSinceDisconnect.length - 1].stateHash;

  if (!lastEventHash) {
    return {
      status: "NEEDS_REVIEW",
      node: reconciledNode,
      reason: "Missing state hash on final replay event",
      replayedEvents: eventsSinceDisconnect.length,
    };
  }

  // STATE HASH COMPARISON – added per your correction
  if (recalculatedHash !== lastEventHash) {
    return {
      status: "NEEDS_REVIEW",
      node: {
        ...reconciledNode,
        state: "RECOVER",
        currentTask: "STATE_HASH_MISMATCH_REVIEW",
      },
      reason: "Recovered node state hash does not match final replay event",
      replayedEvents: eventsSinceDisconnect.length,
    };
  }

  // Safety quarantine check — use QUARANTINE state so dashboard can distinguish from RED
  if (reconciledNode.confidence.safety < 60) {
    return {
      status: "QUARANTINED",
      node: {
        ...reconciledNode,
        state: "QUARANTINE",
        cellId: "quarantine-cell",
        currentTask: "QUARANTINE_SAFE_HOLD",
        operatorResumeApproved: false,
      },
      reason: "Recovered node has unsafe confidence state",
      replayedEvents: eventsSinceDisconnect.length,
    };
  }

  // Success
  return {
    status: "RECOVERED",
    node: {
      ...reconciledNode,
      state: recalculatedState === "GREEN" ? "GREEN" : "AMBER",
      cellId: recalculatedState === "GREEN" ? "primary-swarm" : "degraded-cell",
    },
    reason: "Replay completed and node reconciled into trusted state",
    replayedEvents: eventsSinceDisconnect.length,
  };
}
