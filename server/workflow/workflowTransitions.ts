import type { WorkItemStatus } from '@/lib/types'

export type TransitionMap<S extends string> = Readonly<Record<S, readonly S[]>>

// Single source of truth for work-item status rules. Active statuses may move
// freely between each other (the manual Change Status panel depends on this);
// leaving a final state requires an explicit reopen/restore transition.
const ACTIVE_STATUSES: readonly WorkItemStatus[] = [
  'Captured',
  'Controlled',
  'InProgress',
  'Waiting',
  'FollowUpDue',
  'Escalated',
  'DecisionNeeded',
  'Paused',
]

function fromActive(from: WorkItemStatus): readonly WorkItemStatus[] {
  return [...ACTIVE_STATUSES.filter((s) => s !== from), 'Completed', 'NotFit', 'Archived']
}

export const WORK_ITEM_TRANSITIONS: TransitionMap<WorkItemStatus> = {
  Captured: fromActive('Captured'),
  Controlled: fromActive('Controlled'),
  InProgress: fromActive('InProgress'),
  Waiting: fromActive('Waiting'),
  FollowUpDue: fromActive('FollowUpDue'),
  Escalated: fromActive('Escalated'),
  DecisionNeeded: fromActive('DecisionNeeded'),
  Paused: fromActive('Paused'),
  Completed: ['InProgress', 'Archived'],
  NotFit: ['Captured', 'Archived'],
  Archived: ['Captured'],
}

export function canTransition<S extends string>(map: TransitionMap<S>, from: S, to: S): boolean {
  return (map[from] ?? []).includes(to)
}

export function allowedTransitions<S extends string>(map: TransitionMap<S>, from: S): readonly S[] {
  return map[from] ?? []
}

// The current status plus its allowed transitions — what a status picker
// should offer, so the UI never hardcodes its own copy of this list.
export function optionsFor<S extends string>(map: TransitionMap<S>, from: S): readonly S[] {
  return [from, ...allowedTransitions(map, from)]
}
