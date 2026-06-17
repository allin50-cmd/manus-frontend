// Canonical work-item enum values, the single source of truth shared by API
// validation and all UI. Keep in sync with the Prisma enums WorkItemType /
// WorkItemStatus / Priority. Each array is defined once and exported under both
// the VALID_* and legacy names so there are no duplicated constants.

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

// Legacy aliases (same arrays, no duplication).
export const WORK_ITEM_STATUSES = VALID_WORK_ITEM_STATUSES
export const WORK_ITEM_TYPES = VALID_WORK_ITEM_TYPES
export const PRIORITIES = VALID_PRIORITIES

export const TYPE_LABELS: Record<string, string> = {
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

export const STATUS_LABELS: Record<string, string> = {
  Captured: 'Captured',
  Controlled: 'Controlled',
  InProgress: 'In Progress',
  Waiting: 'Waiting',
  FollowUpDue: 'Follow-Up Due',
  Escalated: 'Escalated',
  DecisionNeeded: 'Decision Needed',
  Completed: 'Completed',
  Paused: 'Paused',
  NotFit: 'Not Fit',
  Archived: 'Archived',
}

export const OWNERS = ['Dagon', 'George', 'Alissa', 'Michelle', 'Chris', 'Charlie'] as const

export const isValidWorkItemStatus = (value: unknown): value is (typeof VALID_WORK_ITEM_STATUSES)[number] =>
  typeof value === 'string' && (VALID_WORK_ITEM_STATUSES as readonly string[]).includes(value)

export const isValidWorkItemType = (value: unknown): value is (typeof VALID_WORK_ITEM_TYPES)[number] =>
  typeof value === 'string' && (VALID_WORK_ITEM_TYPES as readonly string[]).includes(value)

export const isValidPriority = (value: unknown): value is (typeof VALID_PRIORITIES)[number] =>
  typeof value === 'string' && (VALID_PRIORITIES as readonly string[]).includes(value)

// Legacy validator aliases.
export const isValidStatus = isValidWorkItemStatus
export const isValidType = isValidWorkItemType

