export const workItemStatuses = [
  'todo',
  'in_progress',
  'blocked',
  'done',
] as const

export const workItemPriorities = [
  'low',
  'medium',
  'high',
  'urgent',
] as const

export type WorkItemStatus = typeof workItemStatuses[number]
export type WorkItemPriority = typeof workItemPriorities[number]
