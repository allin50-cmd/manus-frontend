import type { DraftRecord } from './types'

const VALID_TYPES = [
  'Partnership', 'ConstructionLead', 'PlanningLead', 'ComplianceAlert',
  'DocumentRecord', 'MediaBrief', 'InternalTask', 'Operations', 'TechTask', 'Other',
]
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

export function parseTranscript(transcript: string): DraftRecord {
  const draft: DraftRecord = {
    title: transcript.slice(0, 120).trim(),
    type: 'InternalTask',
    owner: 'George',
  }

  const lower = transcript.toLowerCase()

  for (const t of VALID_TYPES) {
    if (lower.includes(t.toLowerCase())) {
      draft.type = t
      break
    }
  }

  for (const p of VALID_PRIORITIES) {
    if (lower.includes(p.toLowerCase())) {
      draft.priority = p
      break
    }
  }

  const companyMatch = transcript.match(/(?:company|client|for)\s+([A-Z][A-Za-z0-9\s&'-]{1,40}?)(?:\.|,|$)/i)
  if (companyMatch) draft.company = companyMatch[1].trim()

  const dateMatch = transcript.match(/(?:due|by|before)\s+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}-\d{2}-\d{2})/i)
  if (dateMatch) {
    const d = new Date(dateMatch[1])
    if (!isNaN(d.getTime())) draft.dueDate = d.toISOString().slice(0, 10)
  }

  const noteMatch = transcript.match(/note[s]?[:\s]+(.+)/i)
  if (noteMatch) draft.notes = noteMatch[1].slice(0, 500).trim()

  return draft
}
