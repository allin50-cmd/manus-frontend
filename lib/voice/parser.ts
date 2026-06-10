import type { VoiceDraft } from './types'

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
}

function titleCase(value: string): string {
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function nextWeekday(dayName: string): string | undefined {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  const target = days[dayName.toLowerCase()]
  if (target === undefined) return undefined

  const date = new Date()
  const diff = (target + 7 - date.getDay()) % 7 || 7
  date.setDate(date.getDate() + diff)
  date.setHours(12, 0, 0, 0)
  return date.toISOString().slice(0, 10)
}

function parseBudget(text: string): number | undefined {
  const numeric = text.match(/(?:£|gbp\s*)?([0-9][0-9,]*(?:\.[0-9]+)?)\s*(k|thousand)?/i)
  if (numeric) {
    const base = Number(numeric[1].replace(/,/g, ''))
    if (Number.isFinite(base)) return numeric[2] ? base * 1000 : base
  }

  const lower = text.toLowerCase()
  const thousandMatch = lower.match(/((?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[-\s](?:one|two|three|four|five|six|seven|eight|nine))?)\s+thousand/)
  if (!thousandMatch) return undefined

  const parts = thousandMatch[1].split(/[-\s]+/)
  const total = parts.reduce((sum, part) => sum + (NUMBER_WORDS[part] ?? 0), 0)
  return total > 0 ? total * 1000 : undefined
}

export function parseTranscriptToDraft(transcript: string): VoiceDraft {
  const text = transcript.trim()
  const lower = text.toLowerCase()

  const contactMatch = text.match(/(?:new lead,?\s*)?([A-Z][a-z]+)(?:\s+from\s+|,)/)
  const locationMatch = text.match(/\bfrom\s+([A-Za-z][A-Za-z\s-]+?)(?:,|\s+wants|\s+needs|\s+is|$)/i)
  const projectMatch = text.match(/\bwants\s+(?:a|an|the)?\s*([^,.]+?)(?:,|\s+budget|\s+call|$)/i)
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
  const phoneMatch = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)
  const followUpMatch = lower.match(/next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/)

  const draft: VoiceDraft = {
    contact_name: contactMatch ? titleCase(contactMatch[1]) : undefined,
    location: locationMatch ? titleCase(locationMatch[1]) : undefined,
    project_type: projectMatch ? projectMatch[1].trim().toLowerCase() : undefined,
    budget: parseBudget(text),
    urgency: lower.includes('urgent') ? 'Urgent' : undefined,
    next_action: lower.includes('call') ? 'Call' : undefined,
    follow_up_date: followUpMatch ? nextWeekday(followUpMatch[1]) : undefined,
    email: emailMatch?.[0],
    phone: phoneMatch?.[0]?.trim(),
    notes: text,
  }

  if (draft.location && !draft.company) {
    draft.company = `${draft.contact_name ?? 'Lead'} - ${draft.location}`
  }

  return draft
}

export function draftNeedsReview(draft: VoiceDraft): boolean {
  return !draft.contact_name || !draft.project_type || !draft.next_action
}
