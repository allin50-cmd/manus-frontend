import type { DraftRecord } from './types'
import { WORK_ITEM_TYPES, PRIORITIES, TYPE_LABELS, OWNERS } from '../work-item-enums'

function wordRegex(phrase: string): RegExp {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i')
}

// Spoken month names → zero-padded number
const MONTHS: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
}

function parseDate(text: string): string | undefined {
  const today = new Date()

  // ISO: "due 2026-06-15"
  const isoM = text.match(/(?:due|by|before|deadline)\s+(\d{4})-(\d{2})-(\d{2})/i)
  if (isoM) {
    const d = new Date(`${isoM[1]}-${isoM[2]}-${isoM[3]}T00:00:00Z`)
    if (!isNaN(d.getTime())) return `${isoM[1]}-${isoM[2]}-${isoM[3]}`
  }

  // UK: "due 15/06/2026" or "15-06-26"
  const ukM = text.match(/(?:due|by|before|deadline)\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/i)
  if (ukM) {
    const day   = ukM[1].padStart(2, '0')
    const month = ukM[2].padStart(2, '0')
    const year  = ukM[3].length === 2 ? `20${ukM[3]}` : ukM[3]
    const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
    if (
      !isNaN(d.getTime()) &&
      d.getUTCDate() === Number(day) &&
      d.getUTCMonth() + 1 === Number(month)
    ) return `${year}-${month}-${day}`
  }

  // Spoken: "due 15th June 2026" / "by June 15" / "by 15 June"
  const spokenM = text.match(
    /(?:due|by|before|deadline)\s+(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)(?:\s+(\d{4}))?/i,
  ) ?? text.match(
    /(?:due|by|before|deadline)\s+(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i,
  )
  if (spokenM) {
    let day: string, monthName: string, year: string
    if (/^\d/.test(spokenM[1])) {
      // "15th June 2026"
      day = spokenM[1].padStart(2, '0')
      monthName = spokenM[2].toLowerCase()
      year = spokenM[3] ?? String(today.getFullYear())
    } else {
      // "June 15 2026"
      monthName = spokenM[1].toLowerCase()
      day = spokenM[2].padStart(2, '0')
      year = spokenM[3] ?? String(today.getFullYear())
    }
    const month = MONTHS[monthName]
    if (month) {
      const d = new Date(`${year}-${month}-${day}T00:00:00Z`)
      if (!isNaN(d.getTime()) && d.getUTCDate() === Number(day)) {
        return `${year}-${month}-${day}`
      }
    }
  }

  // Relative: "end of month", "end of week", "next week", "next Monday"
  const rel = text.toLowerCase()
  if (/\bend of (?:this )?month\b/.test(rel)) {
    const eom = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return eom.toISOString().slice(0, 10)
  }
  if (/\bend of (?:this )?week\b/.test(rel)) {
    const eow = new Date(today)
    eow.setDate(today.getDate() + (5 - today.getDay()))
    return eow.toISOString().slice(0, 10)
  }
  if (/\bnext week\b/.test(rel)) {
    const nw = new Date(today)
    nw.setDate(today.getDate() + 7)
    return nw.toISOString().slice(0, 10)
  }
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  for (let i = 0; i < dayNames.length; i++) {
    if (new RegExp(`\\bnext\\s+${dayNames[i]}\\b`).test(rel)) {
      const diff = (i - today.getDay() + 7) % 7 || 7
      const nd = new Date(today)
      nd.setDate(today.getDate() + diff)
      return nd.toISOString().slice(0, 10)
    }
  }

  return undefined
}

function extractTitle(text: string): string {
  // Explicit title markers
  const explicitM = text.match(/(?:title(?:\s+is)?|called|it(?:'s|\s+is)\s+(?:about|for)?)\s*[:\-]?\s*(.+?)(?:[.!?]|$)/i)
  if (explicitM) return explicitM[1].trim().slice(0, 120)

  // Strip common dictation preambles
  const stripped = text
    .replace(/^(?:ok|okay|so|right|um|uh|hey|hi|hello)[,\s]+/gi, '')
    .replace(/^(?:add|create|log|record|make|capture)\s+(?:a\s+)?(?:new\s+)?(?:work\s+item|task|note|item)(?:\s+(?:for|about|regarding|to))?\s*/gi, '')
    .trim()

  // Take up to first sentence boundary
  const sentence = stripped.match(/^(.{10,120}?)(?:[.!?](?:\s|$)|$)/)?.[1] ?? stripped
  return sentence.trim().slice(0, 120)
}

function extractOwner(text: string): string | undefined {
  // Explicit patterns: "assign to Dagon", "for George", "owner is Michelle", "assigned to Chris"
  const ownerPattern = new RegExp(
    `(?:assign(?:ed)?\\s+to|owner\\s+is|for|owned\\s+by|give\\s+to|send\\s+to)\\s+(${OWNERS.join('|')})`,
    'i',
  )
  const m = text.match(ownerPattern)
  if (m) return m[1]

  // Owner name mentioned standalone with possessive or as subject
  for (const o of OWNERS) {
    if (new RegExp(`\\b${o}'s\\b|\\b${o}\\s+should|\\b${o}\\s+needs\\s+to|\\b${o}\\s+will`, 'i').test(text)) {
      return o
    }
  }

  return undefined
}

function extractNextAction(text: string): string | undefined {
  const m = text.match(
    /(?:next\s+(?:action|step|task)\s+is|need\s+to|should|must|action\s+is|follow\s+up\s+(?:by\s+)?(?:is\s+)?(?:to\s+)?)\s+(.{5,200}?)(?:[.!?]|$)/i,
  )
  return m ? m[1].trim().slice(0, 200) : undefined
}

export function parseTranscript(transcript: string): DraftRecord {
  if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
    return { title: '', type: 'InternalTask', owner: 'George' }
  }

  const text = transcript.trim()
  const lower = text.toLowerCase()

  const draft: DraftRecord = {
    title: extractTitle(text),
    type: 'InternalTask',
    owner: 'George',
  }

  // Type: match the human label (e.g. "compliance alert") first, then enum token
  for (const t of WORK_ITEM_TYPES) {
    const label = TYPE_LABELS[t] ?? t
    if (wordRegex(label).test(text) || wordRegex(t).test(text)) {
      draft.type = t
      break
    }
  }

  // Priority: word-boundary match
  for (const p of PRIORITIES) {
    if (wordRegex(p).test(text)) {
      draft.priority = p
      break
    }
  }

  // Owner
  const owner = extractOwner(text)
  if (owner) draft.owner = owner

  // Company: explicit "company/client" cue + capitalised name
  const companyM = text.match(
    /(?:company|client|organisation|organization)\s+(?:is\s+|called\s+|named\s+)?([A-Z][A-Za-z0-9&'.\-]+(?:\s+[A-Z][A-Za-z0-9&'.\-]+){0,3})/,
  )
  if (companyM) draft.company = companyM[1].trim()

  // Due date
  const dueDate = parseDate(lower)
  if (dueDate) draft.dueDate = dueDate

  // Next action
  const nextAction = extractNextAction(text)
  if (nextAction) draft.nextAction = nextAction

  // Notes: explicit "note(s): ..." or "context: ..."
  const noteM = text.match(/(?:notes?|context|background|details?)[:\s]+(.+)/i)
  if (noteM) draft.notes = noteM[1].slice(0, 500).trim()

  return draft
}
