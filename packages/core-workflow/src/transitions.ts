import { WorkflowState } from './states';

/**
 * Valid outgoing transitions for each state.
 *
 * Design rules:
 * - Forward-only: no state may transition back to an earlier state.
 * - HITL_REQUIRED is a holding state reachable from ANALYSED, ESTIMATED,
 *   VERIFIED, or CONFIRMED whenever human review is required.
 *   It resolves to APPROVED (proceed) or CLOSED (reject).
 * - CLOSED is terminal: no outgoing transitions.
 */
export const VALID_TRANSITIONS: Record<WorkflowState, readonly WorkflowState[]> = {
  [WorkflowState.CAPTURED]: [WorkflowState.ANALYSED, WorkflowState.CLOSED],
  [WorkflowState.ANALYSED]: [WorkflowState.ESTIMATED, WorkflowState.HITL_REQUIRED, WorkflowState.CLOSED],
  [WorkflowState.ESTIMATED]: [WorkflowState.VERIFIED, WorkflowState.HITL_REQUIRED],
  [WorkflowState.VERIFIED]: [WorkflowState.CONFIRMED, WorkflowState.HITL_REQUIRED],
  [WorkflowState.CONFIRMED]: [WorkflowState.APPROVED, WorkflowState.HITL_REQUIRED],
  [WorkflowState.HITL_REQUIRED]: [WorkflowState.APPROVED, WorkflowState.CLOSED],
  [WorkflowState.APPROVED]: [WorkflowState.EXECUTED],
  [WorkflowState.EXECUTED]: [WorkflowState.RECORDED],
  [WorkflowState.RECORDED]: [WorkflowState.CLOSED],
  [WorkflowState.CLOSED]: [],
};

/** Returns true if the transition from → to is permitted. */
export function isValidTransition(from: WorkflowState, to: WorkflowState): boolean {
  return (VALID_TRANSITIONS[from] as readonly WorkflowState[]).includes(to);
}
