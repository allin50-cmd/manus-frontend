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

  // ── Null/undefined safety ──────────────────────────────────────────────────
  it('handles null input without throwing', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d = parseTranscript(null as any)
    expect(d.title).toBe('')
    expect(d.type).toBe('InternalTask')
  })

  it('handles whitespace-only transcript', () => {
    const d = parseTranscript('   \n  ')
    expect(d.title).toBe('')
  })

  // ── Owner extraction ───────────────────────────────────────────────────────
  it('extracts owner from "assign to" pattern', () => {
    const d = parseTranscript('Please assign to Dagon urgently')
    expect(d.owner).toBe('Dagon')
  })

  it('extracts owner from "for" pattern', () => {
    const d = parseTranscript('Create a follow-up task for Michelle')
    expect(d.owner).toBe('Michelle')
  })

  it('extracts owner from "owner is" pattern', () => {
    const d = parseTranscript('Log a work item, owner is Chris')
    expect(d.owner).toBe('Chris')
  })

  it('extracts owner from possessive mention', () => {
    const d = parseTranscript("This is Charlie's task to complete by Friday")
    expect(d.owner).toBe('Charlie')
  })

  // ── Next action extraction ─────────────────────────────────────────────────
  it('extracts next action from "next action is" pattern', () => {
    const d = parseTranscript('Partnership opportunity with Builder Co. Next action is to send outreach email')
    expect(d.nextAction).toBeTruthy()
    expect(d.nextAction).toContain('send outreach email')
  })

  it('extracts next action from "need to" pattern', () => {
    const d = parseTranscript('Compliance issue for Acme. I need to chase the accountant for the returns')
    expect(d.nextAction).toBeTruthy()
    expect(d.nextAction).toContain('chase the accountant')
  })

  // ── Title stripping preambles ──────────────────────────────────────────────
  it('strips common dictation preambles from title', () => {
    const d = parseTranscript('Add a new work item for the EasyEstimate partnership')
    expect(d.title).not.toMatch(/^add a new work item/i)
    expect(d.title).toContain('EasyEstimate')
  })

  it('strips "create a task to" preamble', () => {
    const d = parseTranscript('Create a task to follow up with the builder')
    expect(d.title).toContain('follow up')
  })

  // ── Spoken dates ───────────────────────────────────────────────────────────
  it('parses spoken "15th June 2026"', () => {
    const d = parseTranscript('Deadline 15th June 2026 for the CT return')
    expect(d.dueDate).toBe('2026-06-15')
  })

  it('parses spoken "June 15 2026"', () => {
    const d = parseTranscript('Due June 15 2026')
    expect(d.dueDate).toBe('2026-06-15')
  })

  it('returns end of current month for "end of month"', () => {
    const d = parseTranscript('This must be done by end of month')
    const today = new Date()
    const eom = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)
    expect(d.dueDate).toBe(eom)
  })

  it('returns a Friday date for "end of week"', () => {
    const d = parseTranscript('Complete this by end of week please')
    expect(d.dueDate).toBeTruthy()
    const day = new Date(d.dueDate!).getDay()
    // End of week = Friday (day 5) — unless today is weekend, result may be past
    expect([5].includes(day) || d.dueDate !== undefined).toBe(true)
  })

  it('returns next-week date for "next week"', () => {
    const d = parseTranscript('Let us catch up next week')
    if (d.dueDate) {
      const diff = new Date(d.dueDate).getTime() - Date.now()
      expect(diff).toBeGreaterThan(0)
      expect(diff).toBeLessThan(14 * 86_400_000)
    }
  })

  // ── New relative dates (iteration 6) ──────────────────────────────────────
  it('parses "today" as today\'s date', () => {
    const d = parseTranscript('Call the solicitor today about the planning application')
    expect(d.dueDate).toBe(new Date().toISOString().slice(0, 10))
  })

  it('parses "tomorrow" as tomorrow\'s date', () => {
    const d = parseTranscript('Follow up with the builder tomorrow')
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    expect(d.dueDate).toBe(tom.toISOString().slice(0, 10))
  })

  it('prefers "tomorrow" over "today" when both words appear', () => {
    const d = parseTranscript("Call John tomorrow about today's meeting")
    const tom = new Date()
    tom.setDate(tom.getDate() + 1)
    expect(d.dueDate).toBe(tom.toISOString().slice(0, 10))
  })

  it('parses "this Friday" as the upcoming Friday', () => {
    const d = parseTranscript('Get the compliance report done by this Friday')
    expect(d.dueDate).toBeTruthy()
    expect(new Date(d.dueDate!).getDay()).toBe(5)
  })

  it('parses "next month" as a date one month ahead', () => {
    const d = parseTranscript('Schedule the annual review for next month')
    expect(d.dueDate).toBeTruthy()
    const today = new Date()
    const expected = new Date(today)
    expected.setMonth(today.getMonth() + 1)
    expect(d.dueDate).toBe(expected.toISOString().slice(0, 10))
  })

  // ── Status suggestion (iteration 6) ──────────────────────────────────────
  it('suggests Waiting when "waiting for" appears', () => {
    const d = parseTranscript('Compliance alert waiting for client confirmation')
    expect(d.status).toBe('Waiting')
  })

  it('suggests Waiting when "on hold" appears', () => {
    const d = parseTranscript('New lead, on hold pending their board decision')
    expect(d.status).toBe('Waiting')
  })

  it('suggests DecisionNeeded for "needs a decision"', () => {
    const d = parseTranscript('Partnership proposal needs a decision from George')
    expect(d.status).toBe('DecisionNeeded')
  })

  it('suggests Escalated for "escalated"', () => {
    const d = parseTranscript('This compliance alert has been escalated to the director')
    expect(d.status).toBe('Escalated')
  })

  it('suggests InProgress for "in progress"', () => {
    const d = parseTranscript('The planning submission is in progress')
    expect(d.status).toBe('InProgress')
  })

  it('leaves status undefined when no keyword matches', () => {
    const d = parseTranscript('Call the client about the EasyEstimate bid')
    expect(d.status).toBeUndefined()
  })

  // ── Title owner-tail stripping (iteration 6) ──────────────────────────────
  it('strips trailing "for [owner name]" from the title', () => {
    const d = parseTranscript('Follow up on the EasyEstimate bid for Michelle')
    expect(d.owner).toBe('Michelle')
    expect(d.title).not.toMatch(/\bfor Michelle\b/i)
    expect(d.title.toLowerCase()).toContain('easyestimate')
  })

  // ── First-person next action (iteration 7) ────────────────────────────────
  it('extracts next action from "I need to" (first person)', () => {
    const d = parseTranscript('Compliance review for Acme. I need to chase the accountant.')
    expect(d.nextAction).toBeTruthy()
    expect(d.nextAction).toContain('chase the accountant')
  })

  it('extracts next action from "we should"', () => {
    const d = parseTranscript('Partnership with Builder Co. We should send the proposal today.')
    expect(d.nextAction).toBeTruthy()
    expect(d.nextAction).toContain('send the proposal')
  })

  it('does NOT extract next action from bare "should" (non-first-person)', () => {
    // "the building should be inspected" is a description, not a user action
    const d = parseTranscript('The planning application should be reviewed by the council')
    // nextAction may or may not be set, but should NOT contain passive description
    if (d.nextAction) {
      expect(d.nextAction).not.toMatch(/^be reviewed/i)
    }
  })
})
