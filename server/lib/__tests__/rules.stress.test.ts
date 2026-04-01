// ============================================================================
// Rules Engine Stress Tests — boundary, edge, and volume cases
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  computeStatus,
  computeWorstStatus,
  computeAlertTriggers,
  alertThresholdMessage,
} from '../rules.js';

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

const TODAY = new Date('2024-06-15T00:00:00.000Z');

// ─── computeStatus boundary conditions ───────────────────────────────────────

describe('computeStatus — exact boundaries', () => {
  it('safe at 31 days', () => {
    expect(computeStatus(addDays(TODAY, 31), TODAY).status).toBe('safe');
  });

  it('due_soon at 30 days (boundary)', () => {
    expect(computeStatus(addDays(TODAY, 30), TODAY).status).toBe('due_soon');
  });

  it('due_soon at 8 days (boundary)', () => {
    expect(computeStatus(addDays(TODAY, 8), TODAY).status).toBe('due_soon');
  });

  it('urgent at 7 days (boundary)', () => {
    expect(computeStatus(addDays(TODAY, 7), TODAY).status).toBe('urgent');
  });

  it('urgent at 1 day', () => {
    expect(computeStatus(addDays(TODAY, 1), TODAY).status).toBe('urgent');
  });

  it('urgent at 0 days (due today)', () => {
    const r = computeStatus(TODAY, TODAY);
    expect(r.status).toBe('urgent');
    expect(r.daysUntil).toBe(0);
    expect(r.reason).toBe('Due today');
  });

  it('overdue at -1 day', () => {
    const r = computeStatus(addDays(TODAY, -1), TODAY);
    expect(r.status).toBe('overdue');
    expect(r.daysUntil).toBe(-1);
  });

  it('overdue at -365 days (far past)', () => {
    const r = computeStatus(addDays(TODAY, -365), TODAY);
    expect(r.status).toBe('overdue');
    expect(r.daysUntil).toBe(-365);
    expect(r.reason).toContain('365 days ago');
  });

  it('safe at +3650 days (10 years out)', () => {
    const r = computeStatus(addDays(TODAY, 3650), TODAY);
    expect(r.status).toBe('safe');
    expect(r.daysUntil).toBe(3650);
  });

  it('daysUntil is always an integer', () => {
    // Deadline at midnight vs noon should not produce fractional days
    const deadlineAtNoon = new Date('2024-07-15T12:00:00.000Z');
    const r = computeStatus(deadlineAtNoon, TODAY);
    expect(Number.isInteger(r.daysUntil)).toBe(true);
  });

  it('singular "day" in reason for 1 day remaining', () => {
    const r = computeStatus(addDays(TODAY, 1), TODAY);
    expect(r.reason).toBe('Due in 1 day');
  });

  it('plural "days" in reason for 2+ days', () => {
    const r = computeStatus(addDays(TODAY, 5), TODAY);
    expect(r.reason).toContain('days');
    expect(r.reason).not.toContain('1 day');
  });

  it('singular "day" in overdue reason for 1 day ago', () => {
    const r = computeStatus(addDays(TODAY, -1), TODAY);
    expect(r.reason).toBe('Deadline was 1 day ago');
  });

  it('plural "days" in overdue reason for 2+ days ago', () => {
    const r = computeStatus(addDays(TODAY, -2), TODAY);
    expect(r.reason).toContain('2 days ago');
  });

  it('label is always a non-empty string', () => {
    for (const offset of [-100, -1, 0, 1, 7, 8, 30, 31, 100]) {
      const r = computeStatus(addDays(TODAY, offset), TODAY);
      expect(typeof r.label).toBe('string');
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it('default today parameter uses current date', () => {
    // Should not throw and should return a valid status
    const r = computeStatus(new Date(Date.now() + 86400000 * 40));
    expect(['safe', 'due_soon', 'urgent', 'overdue']).toContain(r.status);
  });
});

// ─── computeWorstStatus ───────────────────────────────────────────────────────

describe('computeWorstStatus — aggregation logic', () => {
  it('single safe deadline → safe', () => {
    const r = computeWorstStatus([{ date: addDays(TODAY, 60), label: 'CS' }], TODAY);
    expect(r.status).toBe('safe');
    expect(r.deadlineLabel).toBe('CS');
  });

  it('empty array → safe with empty deadlineLabel', () => {
    const r = computeWorstStatus([], TODAY);
    expect(r.status).toBe('safe');
    expect(r.deadlineLabel).toBe('');
    expect(r.daysUntil).toBeNull();
  });

  it('overdue beats urgent beats due_soon beats safe', () => {
    const deadlines = [
      { date: addDays(TODAY, 60), label: 'Safe' },
      { date: addDays(TODAY, 20), label: 'DueSoon' },
      { date: addDays(TODAY, 5), label: 'Urgent' },
      { date: addDays(TODAY, -3), label: 'Overdue' },
    ];
    const r = computeWorstStatus(deadlines, TODAY);
    expect(r.status).toBe('overdue');
    expect(r.deadlineLabel).toBe('Overdue');
  });

  it('all safe → returns safe', () => {
    const deadlines = [
      { date: addDays(TODAY, 50), label: 'A' },
      { date: addDays(TODAY, 45), label: 'B' },
      { date: addDays(TODAY, 60), label: 'C' },
    ];
    const r = computeWorstStatus(deadlines, TODAY);
    expect(r.status).toBe('safe');
  });

  it('urgent wins over due_soon (no overdue present)', () => {
    const r = computeWorstStatus(
      [
        { date: addDays(TODAY, 25), label: 'DueSoon' },
        { date: addDays(TODAY, 3), label: 'Urgent' },
      ],
      TODAY
    );
    expect(r.status).toBe('urgent');
    expect(r.deadlineLabel).toBe('Urgent');
  });

  it('single overdue deadline', () => {
    const r = computeWorstStatus([{ date: addDays(TODAY, -10), label: 'Late' }], TODAY);
    expect(r.status).toBe('overdue');
    expect(r.deadlineLabel).toBe('Late');
  });

  it('large number of deadlines (100) with one urgent', () => {
    const deadlines = Array.from({ length: 99 }, (_, i) => ({
      date: addDays(TODAY, 50 + i),
      label: `safe-${i}`,
    }));
    deadlines.push({ date: addDays(TODAY, 3), label: 'urgent-one' });

    const r = computeWorstStatus(deadlines, TODAY);
    expect(r.status).toBe('urgent');
    expect(r.deadlineLabel).toBe('urgent-one');
  });
});

// ─── computeAlertTriggers ─────────────────────────────────────────────────────

describe('computeAlertTriggers — threshold windows', () => {
  it('returns exactly 4 thresholds (30, 7, 1, 0)', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 30), TODAY);
    expect(triggers).toHaveLength(4);
    const thresholds = triggers.map((t) => t.threshold).sort((a, b) => b - a);
    expect(thresholds).toEqual([30, 7, 1, 0]);
  });

  it('no thresholds trigger at 45 days', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 45), TODAY);
    expect(triggers.every((t) => !t.shouldTrigger)).toBe(true);
  });

  it('only 30-day triggers at exactly 30 days', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 30), TODAY);
    const active = triggers.filter((t) => t.shouldTrigger);
    expect(active).toHaveLength(1);
    expect(active[0].threshold).toBe(30);
  });

  it('30-day fires at range start (28 days)', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 28), TODAY);
    const t30 = triggers.find((t) => t.threshold === 30);
    expect(t30?.shouldTrigger).toBe(true);
  });

  it('30-day does NOT fire at 27 days', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 27), TODAY);
    const t30 = triggers.find((t) => t.threshold === 30);
    expect(t30?.shouldTrigger).toBe(false);
  });

  it('7-day fires at range start (5 days)', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 5), TODAY);
    const t7 = triggers.find((t) => t.threshold === 7);
    expect(t7?.shouldTrigger).toBe(true);
  });

  it('7-day does NOT fire at 4 days', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 4), TODAY);
    const t7 = triggers.find((t) => t.threshold === 7);
    expect(t7?.shouldTrigger).toBe(false);
  });

  it('1-day fires at 0 days (due today)', () => {
    const triggers = computeAlertTriggers(TODAY, TODAY);
    const t1 = triggers.find((t) => t.threshold === 1);
    expect(t1?.shouldTrigger).toBe(true);
  });

  it('overdue fires at -1', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, -1), TODAY);
    const t0 = triggers.find((t) => t.threshold === 0);
    expect(t0?.shouldTrigger).toBe(true);
  });

  it('overdue fires far in the past (-1000 days)', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, -1000), TODAY);
    const t0 = triggers.find((t) => t.threshold === 0);
    expect(t0?.shouldTrigger).toBe(true);
  });

  it('gap between 27 days and 28 days: neither 30 nor 7 should fire at 27', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 27), TODAY);
    expect(triggers.every((t) => !t.shouldTrigger)).toBe(true);
  });

  it('gap between 4 days and 5 days: neither 7 nor 1 fires at 4 days', () => {
    const triggers = computeAlertTriggers(addDays(TODAY, 4), TODAY);
    expect(triggers.every((t) => !t.shouldTrigger)).toBe(true);
  });

  it('all triggers have a non-empty label', () => {
    const triggers = computeAlertTriggers(TODAY, TODAY);
    triggers.forEach((t) => {
      expect(typeof t.label).toBe('string');
      expect(t.label.length).toBeGreaterThan(0);
    });
  });
});

// ─── alertThresholdMessage ────────────────────────────────────────────────────

describe('alertThresholdMessage — message content', () => {
  it('30-day message contains "30 days"', () => {
    const msg = alertThresholdMessage(30, 'Confirmation statement');
    expect(msg).toContain('30 days');
  });

  it('30-day message contains the deadline type', () => {
    const msg = alertThresholdMessage(30, 'Annual accounts');
    expect(msg).toContain('Annual accounts');
  });

  it('7-day message contains "7 days"', () => {
    const msg = alertThresholdMessage(7, 'Confirmation statement');
    expect(msg).toContain('7 days');
  });

  it('1-day message contains "tomorrow"', () => {
    const msg = alertThresholdMessage(1, 'Annual accounts');
    expect(msg.toLowerCase()).toContain('tomorrow');
  });

  it('overdue (0) message contains "overdue"', () => {
    const msg = alertThresholdMessage(0, 'Annual accounts');
    expect(msg.toLowerCase()).toContain('overdue');
  });

  it('all messages include the deadline type', () => {
    const type = 'Test Deadline';
    for (const threshold of [30, 7, 1, 0] as const) {
      const msg = alertThresholdMessage(threshold, type);
      expect(msg).toContain(type);
    }
  });

  it('all messages are non-empty strings', () => {
    for (const threshold of [30, 7, 1, 0] as const) {
      const msg = alertThresholdMessage(threshold, 'X');
      expect(typeof msg).toBe('string');
      expect(msg.length).toBeGreaterThan(0);
    }
  });
});

// ─── Cross-function consistency ───────────────────────────────────────────────

describe('cross-function consistency', () => {
  it('computeStatus overdue aligns with computeAlertTriggers overdue trigger', () => {
    const deadline = addDays(TODAY, -5);
    const status = computeStatus(deadline, TODAY);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const overdueTrigger = triggers.find((t) => t.threshold === 0);

    expect(status.status).toBe('overdue');
    expect(overdueTrigger?.shouldTrigger).toBe(true);
  });

  it('computeStatus urgent (1d) aligns with 1-day alert trigger', () => {
    const deadline = addDays(TODAY, 1);
    const status = computeStatus(deadline, TODAY);
    const triggers = computeAlertTriggers(deadline, TODAY);
    const t1 = triggers.find((t) => t.threshold === 1);

    expect(status.status).toBe('urgent');
    expect(t1?.shouldTrigger).toBe(true);
  });

  it('computeWorstStatus with single deadline matches computeStatus', () => {
    const deadline = addDays(TODAY, 20);
    const single = computeStatus(deadline, TODAY);
    const worst = computeWorstStatus([{ date: deadline, label: 'L' }], TODAY);

    expect(worst.status).toBe(single.status);
    expect(worst.daysUntil).toBe(single.daysUntil);
  });
});
