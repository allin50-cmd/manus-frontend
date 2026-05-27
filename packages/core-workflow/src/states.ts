/**
 * UltraCore canonical 10-state matter lifecycle.
 *
 * Consumed by: accuracy-pie, ultai, fineguard, vaultline
 *
 * State semantics:
 *   CAPTURED      — matter received from intake or PIE
 *   ANALYSED      — initial analysis complete
 *   ESTIMATED     — cost/time estimate produced
 *   VERIFIED      — external verification passed (e.g. Companies House, CH API)
 *   CONFIRMED     — client has confirmed scope and terms
 *   HITL_REQUIRED — human-in-the-loop required before proceeding
 *   APPROVED      — approved (human or automated gate cleared)
 *   EXECUTED      — primary action executed
 *   RECORDED      — VaultLine audit record written
 *   CLOSED        — terminal state (completed or rejected)
 */

export const WorkflowState = {
  CAPTURED: 'CAPTURED',
  ANALYSED: 'ANALYSED',
  ESTIMATED: 'ESTIMATED',
  VERIFIED: 'VERIFIED',
  CONFIRMED: 'CONFIRMED',
  HITL_REQUIRED: 'HITL_REQUIRED',
  APPROVED: 'APPROVED',
  EXECUTED: 'EXECUTED',
  RECORDED: 'RECORDED',
  CLOSED: 'CLOSED',
} as const;

export type WorkflowState = (typeof WorkflowState)[keyof typeof WorkflowState];

export const ALL_STATES: readonly WorkflowState[] = Object.values(WorkflowState);
