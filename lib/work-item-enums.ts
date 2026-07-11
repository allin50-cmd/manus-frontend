export const WORK_ITEM_TYPES = [
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

export const TYPE_LABELS: Record<WorkItemType, string> = {
  Partnership: 'Partnership',
  ConstructionLead: 'Construction Lead',
  PlanningLead: 'Planning Lead',
  ComplianceAlert: 'Compliance Alert',
  DocumentRecord: 'Document Record',
  MediaBrief: 'Media Brief',
  InternalTask: 'Internal Task',
  Operations: 'Operations',
  TechTask: 'Tech Task',
  Other: 'Other',
}

export const TYPE_SYNONYMS: Record<WorkItemType, string[]> = {
  Partnership: ['partnership', 'partner opportunity'],
  ConstructionLead: ['construction lead', 'building lead'],
  PlanningLead: ['planning lead', 'planning application'],
  ComplianceAlert: ['compliance alert', 'compliance warning'],
  DocumentRecord: ['document record', 'document'],
  MediaBrief: ['media brief', 'marketing brief'],
  InternalTask: ['internal task', 'task', 'to do'],
  Operations: ['operations', 'operational item'],
  TechTask: ['tech task', 'technical task'],
  Other: ['other'],
}

export const WORK_ITEM_STATUSES = [
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

export const STATUSES = WORK_ITEM_STATUSES
export const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const
export const OWNERS = ['George', 'Dagon', 'Michelle', 'Chris', 'Charlie', 'Alissa', 'Team', 'Unassigned'] as const

export const workItemStatuses = WORK_ITEM_STATUSES
export const workItemPriorities = PRIORITIES

export type WorkItemType = typeof WORK_ITEM_TYPES[number]
export type WorkItemStatus = typeof WORK_ITEM_STATUSES[number]
export type WorkItemPriority = typeof PRIORITIES[number]
export type WorkItemOwner = typeof OWNERS[number]

export function isValidType(value: unknown): value is WorkItemType {
  return typeof value === 'string' && WORK_ITEM_TYPES.includes(value as WorkItemType)
}

export function isValidStatus(value: unknown): value is WorkItemStatus {
  return typeof value === 'string' && WORK_ITEM_STATUSES.includes(value as WorkItemStatus)
}

export function isValidPriority(value: unknown): value is WorkItemPriority {
  return typeof value === 'string' && PRIORITIES.includes(value as WorkItemPriority)
}
