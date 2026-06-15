// CRM pipeline utilities — stage labels, ordering, and computed metrics.

export const STAGE_LABELS: Record<string, string> = {
  // Software Integration Partnership
  SIP_Identified: 'Identified',
  SIP_Contacted: 'Contacted',
  SIP_IntroCall: 'Intro Call Done',
  SIP_Evaluating: 'Evaluating',
  SIP_Negotiating: 'Negotiating',
  SIP_Agreed: 'Agreed',
  SIP_Live: 'Live',
  SIP_Paused: 'Paused',
  SIP_Declined: 'Declined',
  // Construction Lead
  CL_NewEnquiry: 'New Enquiry',
  CL_Qualified: 'Qualified',
  CL_Quoting: 'Quoting',
  CL_QuoteSent: 'Quote Sent',
  CL_Negotiating: 'Negotiating',
  CL_Won: 'Won',
  CL_Lost: 'Lost',
  CL_OnHold: 'On Hold',
  // Planning Lead
  PL_Identified: 'Identified',
  PL_Research: 'Research',
  PL_Outreach: 'Outreach',
  PL_ApplicationPrep: 'Application Prep',
  PL_Submitted: 'Submitted',
  PL_UnderReview: 'Under Review',
  PL_Approved: 'Approved',
  PL_Refused: 'Refused',
  PL_OnHold: 'On Hold',
}

export function stageLabel(stage: string): string {
  return STAGE_LABELS[stage] ?? stage
}

const SIP_STAGES = [
  'SIP_Identified',
  'SIP_Contacted',
  'SIP_IntroCall',
  'SIP_Evaluating',
  'SIP_Negotiating',
  'SIP_Agreed',
  'SIP_Live',
  'SIP_Paused',
  'SIP_Declined',
]

const CL_STAGES = [
  'CL_NewEnquiry',
  'CL_Qualified',
  'CL_Quoting',
  'CL_QuoteSent',
  'CL_Negotiating',
  'CL_Won',
  'CL_Lost',
  'CL_OnHold',
]

const PL_STAGES = [
  'PL_Identified',
  'PL_Research',
  'PL_Outreach',
  'PL_ApplicationPrep',
  'PL_Submitted',
  'PL_UnderReview',
  'PL_Approved',
  'PL_Refused',
  'PL_OnHold',
]

export function stagesForType(type: 'Partnership' | 'ConstructionLead' | 'PlanningLead'): string[] {
  if (type === 'Partnership') return SIP_STAGES
  if (type === 'ConstructionLead') return CL_STAGES
  if (type === 'PlanningLead') return PL_STAGES
  return []
}

export function isStagValidForType(stage: string, type: string): boolean {
  if (type === 'Partnership') return SIP_STAGES.includes(stage)
  if (type === 'ConstructionLead') return CL_STAGES.includes(stage)
  if (type === 'PlanningLead') return PL_STAGES.includes(stage)
  return false
}

export function daysSinceLastTouch(logs: { occurredAt: Date }[]): number | null {
  if (logs.length === 0) return null
  const latest = logs.reduce((a, b) =>
    new Date(a.occurredAt) > new Date(b.occurredAt) ? a : b,
  )
  const ms = Date.now() - new Date(latest.occurredAt).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function nextFollowUpDate(
  logs: { followUpDate: Date | null; followUpDone: boolean }[],
): Date | null {
  const pending = logs
    .filter((l) => l.followUpDate && !l.followUpDone)
    .map((l) => new Date(l.followUpDate!))
    .sort((a, b) => a.getTime() - b.getTime())
  return pending[0] ?? null
}
