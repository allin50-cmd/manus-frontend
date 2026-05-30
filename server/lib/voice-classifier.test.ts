import { describe, it, expect } from 'vitest';
import { classifyVoiceIntake } from './voice-classifier';

// Fixed reference time for deadline tests: 2026-06-01
const NOW = new Date('2026-06-01T00:00:00.000Z');

// ─── CRITICAL ─────────────────────────────────────────────────────────────────

describe('classifyVoiceIntake: CRITICAL', () => {
  it.each([
    ['dissolution', 'The company is facing dissolution proceedings'],
    ['dissolving', 'They are dissolving the company next week'],
    ['struck off', 'Notice that the company has been struck off'],
    ['wound up', 'The firm is being wound up'],
    ['fraud', 'There is suspected fraud by the director'],
    ['insolvency', 'The company has entered insolvency'],
    ['liquidation', 'Compulsory liquidation has started'],
    ['administration', 'The company entered administration yesterday'],
    ['HMRC enforcement', 'HMRC enforcement action has been issued'],
    ['court order', 'There is a court order against the directors'],
    ['director dispute', 'There is a serious director dispute underway'],
    ['legal threat', 'We have received a legal threat from HMRC'],
  ])('classifies "%s" as CRITICAL', (_label, text) => {
    const result = classifyVoiceIntake(text, null, NOW);
    expect(result.urgency).toBe('CRITICAL');
    expect(result.humanReviewRequired).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });
});

// ─── HIGH ─────────────────────────────────────────────────────────────────────

describe('classifyVoiceIntake: HIGH', () => {
  it.each([
    ['strike-off warning', 'Client received a strike-off warning from Companies House'],
    ['missing accounts', 'Missing accounts for the last two years'],
    ['missing confirmation statement', 'The missing confirmation statement is overdue'],
    ['overdue filing', 'There are overdue filing obligations'],
    ['late filing penalty', 'A late filing penalty has been issued'],
    ['penalty', 'A penalty notice has been received'],
    ['enforcement notice', 'An enforcement notice has been issued'],
  ])('classifies "%s" as HIGH', (_label, text) => {
    const result = classifyVoiceIntake(text, null, NOW);
    expect(result.urgency).toBe('HIGH');
    expect(result.humanReviewRequired).toBe(true);
  });

  it('classifies deadline within 7 days (explicit deadlineDate) as HIGH', () => {
    // 3 days from NOW
    const result = classifyVoiceIntake('Filing needs to be submitted soon', '04/06/2026', NOW);
    expect(result.urgency).toBe('HIGH');
    expect(result.humanReviewRequired).toBe(true);
    expect(result.reasons).toContain('deadline_within_7_days');
  });

  it('classifies deadline within 7 days (date in text) as HIGH', () => {
    const result = classifyVoiceIntake('The deadline is 05/06/2026 for the accounts', null, NOW);
    expect(result.urgency).toBe('HIGH');
    expect(result.reasons).toContain('deadline_within_7_days');
  });

  it('does NOT classify deadline beyond 7 days as HIGH via deadline alone', () => {
    // 30 days from NOW — no other HIGH signals
    const result = classifyVoiceIntake('Filing is due', '01/07/2026', NOW);
    expect(result.urgency).not.toBe('HIGH');
  });

  it('classifies deadline = exactly today as HIGH', () => {
    const result = classifyVoiceIntake('Accounts due', '01/06/2026', NOW);
    expect(result.urgency).toBe('HIGH');
  });

  it('classifies deadline = day 7 (boundary) as HIGH', () => {
    const result = classifyVoiceIntake('Accounts due', '08/06/2026', NOW);
    expect(result.urgency).toBe('HIGH');
  });
});

// ─── MEDIUM ───────────────────────────────────────────────────────────────────

describe('classifyVoiceIntake: MEDIUM', () => {
  it.each([
    ['upcoming filing', 'There is an upcoming filing due next month'],
    ['filing is due', 'The confirmation statement filing is due'],
    ['unsure', 'Client is unsure about their compliance status'],
    ['not sure', 'I am not sure if the accounts have been filed'],
    ['follow-up', 'Need to follow-up with the client'],
    ['unclear', 'The situation is unclear at this point'],
    ['pending', 'The filing is pending'],
    ['need to check', 'We need to check the filing history'],
    ['need to confirm', 'We need to confirm the details'],
  ])('classifies "%s" as MEDIUM', (_label, text) => {
    const result = classifyVoiceIntake(text, null, NOW);
    expect(result.urgency).toBe('MEDIUM');
    expect(result.humanReviewRequired).toBe(false);
  });
});

// ─── LOW ──────────────────────────────────────────────────────────────────────

describe('classifyVoiceIntake: LOW', () => {
  it.each([
    ['general enquiry', 'I would like to ask about your compliance services'],
    ['no signals', 'The director wants to speak to someone about their company'],
    ['empty reason', 'General call'],
  ])('classifies "%s" as LOW', (_label, text) => {
    const result = classifyVoiceIntake(text, null, NOW);
    expect(result.urgency).toBe('LOW');
    expect(result.humanReviewRequired).toBe(false);
    expect(result.reasons).toContain('no_risk_signals');
  });
});

// ─── Priority ordering ────────────────────────────────────────────────────────

describe('classifyVoiceIntake: priority ordering', () => {
  it('CRITICAL takes precedence over HIGH patterns in same text', () => {
    const result = classifyVoiceIntake('dissolution with overdue filing and penalty', null, NOW);
    expect(result.urgency).toBe('CRITICAL');
  });

  it('HIGH takes precedence over MEDIUM patterns in same text', () => {
    const result = classifyVoiceIntake('overdue filing and I am unsure', null, NOW);
    expect(result.urgency).toBe('HIGH');
  });

  it('MEDIUM takes precedence over LOW (no signals) in same text', () => {
    const result = classifyVoiceIntake('general enquiry but pending', null, NOW);
    expect(result.urgency).toBe('MEDIUM');
  });
});
