// ============================================================================
// Rules Unit Tests
// Run with: npm test
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  computeStatus,
  computeWorstStatus,
  computeAlertTriggers,
  alertThresholdMessage,
} from '../rules.js';

// Helper: date N days from a reference date
function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

describe('computeStatus', () => {
  const TODAY = new Date('2024-06-15');

  it('returns safe when >30 days remain', () => {
    const deadline = addDays(TODAY, 45);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('safe');
    expect(result.daysUntil).toBe(45);
  });

  it('returns due_soon at exactly 30 days', () => {
    const deadline = addDays(TODAY, 30);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('due_soon');
  });

  it('returns due_soon at 22 days', () => {
    const deadline = addDays(TODAY, 22);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('due_soon');
  });

  it('returns urgent at exactly 7 days', () => {
    const deadline = addDays(TODAY, 7);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('urgent');
  });

  it('returns urgent at 3 days', () => {
    const deadline = addDays(TODAY, 3);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('urgent');
    expect(result.daysUntil).toBe(3);
  });

  it('returns urgent at 0 days (due today)', () => {
    const result = computeStatus(TODAY, TODAY);
    expect(result.status).toBe('urgent');
    expect(result.reason).toBe('Due today');
  });

  it('returns overdue at -1 days', () => {
    const deadline = addDays(TODAY, -1);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('overdue');
    expect(result.daysUntil).toBe(-1);
  });

  it('returns overdue at -30 days', () => {
    const deadline = addDays(TODAY, -30);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('overdue');
    expect(result.label).toBe('Overdue');
  });

  it('includes correct reason for 1 day remaining', () => {
    const deadline = addDays(TODAY, 1);
    const result = computeStatus(deadline, TODAY);
    expect(result.status).toBe('urgent');
    expect(result.reason).toContain('1 day');
  });

  it('includes correct reason for plural days overdue', () => {
    const deadline = addDays(TODAY, -5);
    const result = computeStatus(deadline, TODAY);
    expect(result.reason).toContain('5 days ago');
  });
});

describe('computeWorstStatus', () => {
  const TODAY = new Date('2024-06-15');

  it('returns safe when no deadlines', () => {
    const result = computeWorstStatus([], TODAY);
    expect(result.status).toBe('safe');
  });

  it('returns worst of two deadlines', () => {
    const result = computeWorstStatus(
      [
        { date: addDays(TODAY, 45), label: 'CS' },
        { date: addDays(TODAY, 5), label: 'Accounts' },
      ],
      TODAY,
    );
    expect(result.status).toBe('urgent');
    expect(result.deadlineLabel).toBe('Accounts');
  });

  it('picks overdue over urgent', () => {
    const result = computeWorstStatus(
      [
        { date: addDays(TODAY, 3), label: 'Accounts' },
        { date: addDays(TODAY, -10), label: 'CS' },
      ],
      TODAY,
    );
    expect(result.status).toBe('overdue');
    expect(result.deadlineLabel).toBe('CS');
  });
});

describe('computeAlertTriggers', () => {
  const TODAY = new Date('2024-06-15');

  it('triggers 30-day threshold at 30 days', () => {
    const deadline = addDays(TODAY, 30);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t30 = triggers.find((t) => t.threshold === 30);
    expect(t30?.shouldTrigger).toBe(true);
  });

  it('triggers 30-day threshold at 28 days (range is 28-30)', () => {
    const deadline = addDays(TODAY, 28);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t30 = triggers.find((t) => t.threshold === 30);
    expect(t30?.shouldTrigger).toBe(true);
  });

  it('does NOT trigger 30-day threshold at 31 days', () => {
    const deadline = addDays(TODAY, 31);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t30 = triggers.find((t) => t.threshold === 30);
    expect(t30?.shouldTrigger).toBe(false);
  });

  it('triggers 7-day threshold at 7 days', () => {
    const deadline = addDays(TODAY, 7);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t7 = triggers.find((t) => t.threshold === 7);
    expect(t7?.shouldTrigger).toBe(true);
  });

  it('triggers 1-day threshold at 1 day', () => {
    const deadline = addDays(TODAY, 1);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t1 = triggers.find((t) => t.threshold === 1);
    expect(t1?.shouldTrigger).toBe(true);
  });

  it('triggers 1-day threshold at 0 days (due today)', () => {
    const triggers = computeAlertTriggers(TODAY, TODAY);
    const t1 = triggers.find((t) => t.threshold === 1);
    expect(t1?.shouldTrigger).toBe(true);
  });

  it('triggers overdue threshold at -1 days', () => {
    const deadline = addDays(TODAY, -1);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t0 = triggers.find((t) => t.threshold === 0);
    expect(t0?.shouldTrigger).toBe(true);
  });

  it('does not trigger 7-day at 45 days out', () => {
    const deadline = addDays(TODAY, 45);
    const triggers = computeAlertTriggers(deadline, TODAY);
    expect(triggers.every((t) => !t.shouldTrigger)).toBe(true);
  });
});

describe('alertThresholdMessage', () => {
  it('returns 30-day message', () => {
    const msg = alertThresholdMessage(30, 'Confirmation statement');
    expect(msg).toContain('30 days');
    expect(msg).toContain('Confirmation statement');
  });

  it('returns overdue message', () => {
    const msg = alertThresholdMessage(0, 'Annual accounts');
    expect(msg.toLowerCase()).toContain('overdue');
  });

  it('returns 1-day urgent message', () => {
    const msg = alertThresholdMessage(1, 'Confirmation statement');
    expect(msg).toContain('tomorrow');
  });
});
