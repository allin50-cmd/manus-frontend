export const VALID_WORK_ITEM_STATUSES = [
  'Captured',
  'Controlled',
  'InProgress',
  'Waiting',
  'FollowUpDue',
  'Escalated',
  'DecisionNeeded',
  'Completed',
  'Paused',
  'NotFit',
  'Archived',
] as const

export const VALID_WORK_ITEM_TYPES = [
  'Partnership',
  'ConstructionLead',
  'PlanningLead',
  'ComplianceAlert',
  'DocumentRecord',
  'MediaBrief',
  'InternalTask',
  'Operations',
  'TechTask',
  'Other',
] as const

export const VALID_PRIORITIES = [
  'Low',
  'Medium',
  'High',
  'Urgent',
] as const

export const isValidWorkItemStatus = (value: unknown) =>
  typeof value === 'string' && VALID_WORK_ITEM_STATUSES.includes(value as any)

export const isValidWorkItemType = (value: unknown) =>
  typeof value === 'string' && VALID_WORK_ITEM_TYPES.includes(value as any)

export const isValidPriority = (value: unknown) =>
  typeof value === 'string' && VALID_PRIORITIES.includes(value as any)
