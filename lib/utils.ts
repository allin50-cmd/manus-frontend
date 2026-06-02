export function formatUKDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatUKDate(date: Date | string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function isOverdue(date: Date | string | null | undefined): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export function statusLabel(s: string): string {
  const map: Record<string, string> = {
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
  return map[s] ?? s
}

export function typeLabel(t: string): string {
  const map: Record<string, string> = {
    Partnership: 'Partnership',
    ConstructionLead: 'Construction Lead',
    PlanningLead: 'Planning Lead',
    ComplianceAlert: 'Compliance Alert',
    DocumentRecord: 'Document Record',
    MediaBrief: 'Media Brief',
    InternalTask: 'Internal Task',
    Other: 'Other',
  }
  return map[t] ?? t
}
