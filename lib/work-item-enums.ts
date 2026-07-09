export const STATUSES = [
  'todo',
  'in_progress',
  'blocked',
  'done',
] as const

export const PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
] as const

export const OWNERS = [
  'George',
  'Team',
  'Unassigned',
] as const

export const workItemStatuses = STATUSES
export const workItemPriorities = PRIORITIES

export type WorkItemStatus = typeof STATUSES[number]
export type WorkItemPriority = typeof PRIORITIES[number]
export type WorkItemOwner = typeof OWNERS[number]
