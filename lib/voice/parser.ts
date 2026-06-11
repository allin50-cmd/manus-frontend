import type { DraftRecord } from './types'
import { WORK_ITEM_TYPES, PRIORITIES, TYPE_LABELS } from '../work-item-enums'

// Build word-boundary matchers from the canonical enum lists so a new enum
// value automatically becomes recognisable here. We match against the spoken
// label ("compliance alert") as well as the enum token ("ComplianceAlert").
function wordRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i')
}

export function parseTranscript(transcript: string): DraftRecord {
  const text = transcript.trim()
  const draft: DraftRecord = {
    title: text.slice(0, 120),
    type: 'InternalTask',
    owner: 'George',
  }

  // Type: match the human label (e.g. "compliance alert") with word boundaries.
  for (const t of WORK_ITEM_TYPES) {
    const label = TYPE_LABELS[t] ?? t
    if (wordRegex(label).test(text)) {
      draft.type = t
      break
    }
  }

  // Priority: word-boundary match so "follow"/"highlight" don't trip Low/High.
  for (const p of PRIORITIES) {
    if (wordRegex(p).test(text)) {
      draft.priority = p
      break
    }
  }

  // Company: require an explicit "company"/"client" cue and a capitalised name.
  const companyMatch = text.match(/(?:company|client)\s+(?:is\s+|called\s+|named\s+)?([A-Z][A-Za-z0-9&'-]+(?:\s+[A-Z][A-Za-z0-9&'-]+){0,3})/)
  if (companyMatch) draft.company = companyMatch[1].trim()

  // Due date: ISO (unambiguous) or DD/MM/YYYY (UK convention) — never US M/D/Y.
  const isoMatch = text.match(/(?:due|by|before)\s+(\d{4})-(\d{2})-(\d{2})/i)
  const ukMatch = text.match(/(?:due|by|before)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i)
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T00:00:00Z`)
    if (!isNaN(d.getTime())) draft.dueDate = d.toISOString().slice(0, 10)
  } else if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0')
    const month = ukMatch[2].padStart(2, '0')
    let year = ukMatch[3]
    if (year.length === 2) year = `20${year}`
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    // Guard against impossible dates (e.g. 31/02) that Date silently rolls over.
    if (
      !isNaN(d.getTime()) &&
      d.getUTCDate() === Number(day) &&
      d.getUTCMonth() + 1 === Number(month)
    ) {
      draft.dueDate = `${year}-${month}-${day}`
    }
  }

  const noteMatch = text.match(/note[s]?[:\s]+(.+)/i)
  if (noteMatch) draft.notes = noteMatch[1].slice(0, 500).trim()

  return draft
}
