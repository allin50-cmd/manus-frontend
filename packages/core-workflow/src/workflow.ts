import { WorkflowState } from './states';
import { VALID_TRANSITIONS, isValidTransition } from './transitions';

export class InvalidTransitionError extends Error {
  readonly from: WorkflowState;
  readonly to: WorkflowState;
  readonly allowed: readonly WorkflowState[];

  constructor(from: WorkflowState, to: WorkflowState) {
    const allowed = VALID_TRANSITIONS[from];
    const allowedStr = allowed.length > 0 ? allowed.join(', ') : '(none — terminal state)';
    super(`Invalid transition: ${from} → ${to}. Allowed from ${from}: ${allowedStr}`);
    this.name = 'InvalidTransitionError';
    this.from = from;
    this.to = to;
    this.allowed = allowed;
  }
}

/**
 * Assert that a state transition is valid.
 * Throws InvalidTransitionError if not permitted.
 *
 * @example
 *   transition('CAPTURED', 'ANALYSED'); // ok
 *   transition('CLOSED', 'CAPTURED');   // throws
 */
export function transition(from: WorkflowState, to: WorkflowState): void {
  if (!isValidTransition(from, to)) {
    throw new InvalidTransitionError(from, to);
  }
}

/**
 * Apply a transition and return the new state.
 * Equivalent to calling transition() then returning `to`.
 */
export function advance(from: WorkflowState, to: WorkflowState): WorkflowState {
  transition(from, to);
  return to;
}

/** Returns true if the state has no outgoing transitions. */
export function isTerminal(state: WorkflowState): boolean {
  return VALID_TRANSITIONS[state].length === 0;
}

/** Returns all states reachable in one step from `from`. */
export function nextStates(from: WorkflowState): readonly WorkflowState[] {
  return VALID_TRANSITIONS[from];
}
