export const WORK_ITEM_TYPES = [
  'filing',
  'alert',
  'task',
  'call',
  'message',
  'document',
  'invoice',
  'quote',
  'other',
] as const

export const TYPE_LABELS: Record<string, string> = {
  filing: 'Filing',
  alert: 'Alert',
  task: 'Task',
  call: 'Call',
  message: 'Message',
  document: 'Document',
  invoice: 'Invoice',
  quote: 'Quote',
  other: 'Other',
}

export const STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const
export const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
export const OWNERS = ['George', 'Team', 'Unassigned'] as const

export const workItemStatuses = STATUSES
export const workItemPriorities = PRIORITIES

export type WorkItemType = typeof WORK_ITEM_TYPES[number]
export type WorkItemStatus = typeof STATUSES[number]
export type WorkItemPriority = typeof PRIORITIES[number]
export type WorkItemOwner = typeof OWNERS[number]

export function isValidType(value: unknown): value is WorkItemType {
  return typeof value === 'string' && WORK_ITEM_TYPES.includes(value as WorkItemType)
}

export function isValidPriority(value: unknown): value is WorkItemPriority {
  return typeof value === 'string' && PRIORITIES.includes(value as WorkItemPriority)
}
