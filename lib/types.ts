// Enum types matching prisma/schema.prisma definitions.
// These exist so routes can import typed enums without depending on the generated
// Prisma client (which requires prisma generate to have run successfully).

export type WorkItemType =
  | 'Partnership'
  | 'ConstructionLead'
  | 'PlanningLead'
  | 'ComplianceAlert'
  | 'DocumentRecord'
  | 'MediaBrief'
  | 'InternalTask'
  | 'Operations'
  | 'TechTask'
  | 'Other'

export const WorkItemType = {
  Partnership: 'Partnership',
  ConstructionLead: 'ConstructionLead',
  PlanningLead: 'PlanningLead',
  ComplianceAlert: 'ComplianceAlert',
  DocumentRecord: 'DocumentRecord',
  MediaBrief: 'MediaBrief',
  InternalTask: 'InternalTask',
  Operations: 'Operations',
  TechTask: 'TechTask',
  Other: 'Other',
} as const

export type WorkItemStatus =
  | 'Captured'
  | 'Controlled'
  | 'InProgress'
  | 'Waiting'
  | 'FollowUpDue'
  | 'Escalated'
  | 'DecisionNeeded'
  | 'Completed'
  | 'Paused'
  | 'NotFit'
  | 'Archived'

export const WorkItemStatus = {
  Captured: 'Captured',
  Controlled: 'Controlled',
  InProgress: 'InProgress',
  Waiting: 'Waiting',
  FollowUpDue: 'FollowUpDue',
  Escalated: 'Escalated',
  DecisionNeeded: 'DecisionNeeded',
  Completed: 'Completed',
  Paused: 'Paused',
  NotFit: 'NotFit',
  Archived: 'Archived',
} as const

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent'

export const Priority = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  Urgent: 'Urgent',
} as const

export type ActionType =
  | 'LogNote'
  | 'CreateFollowUp'
  | 'ChangeStatus'
  | 'DraftMessage'
  | 'EscalateToGeorge'
  | 'GenerateDocument'
  | 'MarkComplete'
  | 'Archive'
  | 'Other'

export const ActionType = {
  LogNote: 'LogNote',
  CreateFollowUp: 'CreateFollowUp',
  ChangeStatus: 'ChangeStatus',
  DraftMessage: 'DraftMessage',
  EscalateToGeorge: 'EscalateToGeorge',
  GenerateDocument: 'GenerateDocument',
  MarkComplete: 'MarkComplete',
  Archive: 'Archive',
  Other: 'Other',
} as const

export type ActionStatus = 'Open' | 'Done' | 'Cancelled' | 'Blocked'

export type EventType =
  | 'Created'
  | 'NoteAdded'
  | 'StatusChanged'
  | 'ActionCreated'
  | 'ActionCompleted'
  | 'DecisionRequested'
  | 'DecisionMade'
  | 'FollowUpSet'
  | 'Archived'

export type DecisionStatus =
  | 'Open'
  | 'Approved'
  | 'Rejected'
  | 'MoreInfoNeeded'
  | 'Paused'

export const DecisionStatus = {
  Open: 'Open',
  Approved: 'Approved',
  Rejected: 'Rejected',
  MoreInfoNeeded: 'MoreInfoNeeded',
  Paused: 'Paused',
} as const

export type RecipientRole =
  | 'Director'
  | 'Accountant'
  | 'CompanySecretary'
  | 'Admin'
  | 'ComplianceManager'
  | 'ExternalAdviser'
  | 'Custom'

export const RecipientRole = {
  Director: 'Director',
  Accountant: 'Accountant',
  CompanySecretary: 'CompanySecretary',
  Admin: 'Admin',
  ComplianceManager: 'ComplianceManager',
  ExternalAdviser: 'ExternalAdviser',
  Custom: 'Custom',
} as const

export type DeliveryChannel = 'Email' | 'Dashboard' | 'Sms' | 'WhatsApp'

export const DeliveryChannel = {
  Email: 'Email',
  Dashboard: 'Dashboard',
  Sms: 'Sms',
  WhatsApp: 'WhatsApp',
} as const

// Minimal WorkItem interface covering the fields used across the codebase.
// Matches the Prisma WorkItem model shape.
export interface WorkItem {
  id: string
  title: string
  company: string | null
  type: WorkItemType
  status: WorkItemStatus
  priority: Priority
  notes: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  assignedTo: string | null
  dueDate: Date | null
  createdAt: Date
  updatedAt: Date
}
