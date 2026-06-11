import { describe, it, expect } from 'vitest'
import { parseTranscript } from '../voice/parser'
import { isValidType, isValidPriority } from '../work-item-enums'

describe('parseTranscript', () => {
  it('defaults type to InternalTask and owner to George', () => {
    const d = parseTranscript('Remember to send the report tomorrow')
    expect(d.type).toBe('InternalTask')
    expect(d.owner).toBe('George')
  })

  it('uses the (trimmed) transcript as the title, capped at 120 chars', () => {
    const long = 'a'.repeat(200)
    const d = parseTranscript(`   ${long}   `)
    expect(d.title.length).toBe(120)
    expect(d.title.startsWith('a')).toBe(true)
  })

  it('always emits a valid Prisma type enum value', () => {
    const d = parseTranscript('this is a partnership opportunity')
    expect(isValidType(d.type)).toBe(true)
    expect(d.type).toBe('Partnership')
  })

  it('matches a spoken multi-word type label ("compliance alert")', () => {
    const d = parseTranscript('Log a compliance alert for the annual return')
    expect(d.type).toBe('ComplianceAlert')
  })

  it('does NOT misclassify type from incidental words', () => {
    // "other" appears but not as a standalone type cue token boundary issue —
    // "the other team" contains the word "other"; ensure it is matched as a
    // word, which is intentional. Use a word that is a substring but not a word.
    const d = parseTranscript('Please notify another department')
    // "another" contains "other" as a substring but not as a whole word.
    expect(d.type).toBe('InternalTask')
  })

  it('does not set priority from words that merely contain Low/High', () => {
    expect(parseTranscript('follow up next week').priority).toBeUndefined()
    expect(parseTranscript('highlight the key risk').priority).toBeUndefined()
  })

  it('detects an explicit priority word', () => {
    const d = parseTranscript('This is High priority, deal with it')
    expect(d.priority).toBe('High')
    expect(isValidPriority(d.priority)).toBe(true)
  })

  it('parses a UK-format DD/MM/YYYY due date (not US M/D/Y)', () => {
    const d = parseTranscript('Get this done due 05/06/2026 please')
    expect(d.dueDate).toBe('2026-06-05')
  })

  it('parses an ISO due date', () => {
    const d = parseTranscript('finish by 2026-12-31')
    expect(d.dueDate).toBe('2026-12-31')
  })

  it('rejects an impossible date like 31/02', () => {
    const d = parseTranscript('due 31/02/2026')
    expect(d.dueDate).toBeUndefined()
  })

  it('expands a two-digit year', () => {
    const d = parseTranscript('due 1/2/26')
    expect(d.dueDate).toBe('2026-02-01')
  })

  it('does not capture a bogus company from the word "for"', () => {
    const d = parseTranscript('Schedule a call for tomorrow about the roof')
    expect(d.company).toBeUndefined()
  })

  it('captures a company only after an explicit cue and capitalised name', () => {
    const d = parseTranscript('New lead, company Acme Holdings, follow up soon')
    expect(d.company).toBe('Acme Holdings')
  })

  it('extracts notes after a "note:" cue', () => {
    const d = parseTranscript('Call the client. Notes: they prefer email contact')
    expect(d.notes).toBe('they prefer email contact')
  })

  it('handles an empty transcript without throwing', () => {
    const d = parseTranscript('')
    expect(d.title).toBe('')
    expect(d.type).toBe('InternalTask')
  })
})
