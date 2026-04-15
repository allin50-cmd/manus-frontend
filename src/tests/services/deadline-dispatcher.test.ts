/**
 * Tests for the deadline-dispatcher service.
 *
 * Verifies window activation logic, deduplication behaviour, Zapier firing,
 * and the shape of the full JSON CompanyDispatchResult.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks (must be hoisted before imports) ────────────────────────────────────

vi.mock('@/lib/webhooks/fire-hook', () => ({
  fireWebhooks: vi.fn(),
}));

vi.mock('@/server/repositories/dispatchedNotifications.repo', () => ({
  insertDispatchIfNew: vi.fn(),
}));

vi.mock('@/lib/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import {
  activatedWindows,
  dispatchAlertsForCompany,
  ALERT_WINDOWS,
  type DeadlineInfo,
} from '../../services/deadline-dispatcher';
import { fireWebhooks } from '../../lib/webhooks/fire-hook';
import { insertDispatchIfNew } from '../../server/repositories/dispatchedNotifications.repo';

const mockFireZapierHooks = vi.mocked(fireWebhooks);
const mockInsertDispatchIfNew = vi.mocked(insertDispatchIfNew);

const COMPANY = '12345678';
const NAME = 'Test Company Ltd';
const DUE_DATE = '2026-06-30';

// ── activatedWindows ──────────────────────────────────────────────────────────

describe('activatedWindows()', () => {
  it('returns no windows when deadline is far in future (> 60 days)', () => {
    expect(activatedWindows(90)).toHaveLength(0);
    expect(activatedWindows(61)).toHaveLength(0);
  });

  it('returns [60] when exactly at 60-day threshold', () => {
    expect(activatedWindows(60)).toEqual([60]);
  });

  it('returns [60, 30] when daysLeft=30', () => {
    expect(activatedWindows(30)).toEqual([60, 30]);
  });

  it('returns [60, 30, 14] when daysLeft=14', () => {
    expect(activatedWindows(14)).toEqual([60, 30, 14]);
  });

  it('returns all four windows when daysLeft=7', () => {
    expect(activatedWindows(7)).toEqual([60, 30, 14, 7]);
  });

  it('returns all four windows when daysLeft=0 (due today)', () => {
    expect(activatedWindows(0)).toEqual([60, 30, 14, 7]);
  });

  it('returns all four windows when overdue (daysLeft < 0)', () => {
    expect(activatedWindows(-5)).toEqual([60, 30, 14, 7]);
  });

  it('ALERT_WINDOWS constant has four entries in descending order', () => {
    expect(ALERT_WINDOWS).toEqual([60, 30, 14, 7]);
  });
});

// ── dispatchAlertsForCompany ──────────────────────────────────────────────────

describe('dispatchAlertsForCompany()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all new (not yet dispatched)
    mockInsertDispatchIfNew.mockResolvedValue(true);
    // Default: one registered hook, delivered successfully
    mockFireZapierHooks.mockResolvedValue({ total: 1, delivered: 1, failed: 0 });
  });

  it('fires no notifications when deadline is > 60 days away', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 90 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockFireZapierHooks).not.toHaveBeenCalled();
    expect(result.fired).toBe(0);
    expect(result.notifications).toHaveLength(0);
  });

  it('fires the 60-day window once when daysLeft=60', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 60 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockInsertDispatchIfNew).toHaveBeenCalledOnce();
    expect(mockInsertDispatchIfNew).toHaveBeenCalledWith(
      `${COMPANY}:accounts_filing:${DUE_DATE}:w60`,
      { companyNumber: COMPANY, alertType: 'accounts_filing', dueDate: DUE_DATE, windowDays: 60 },
    );
    expect(mockFireZapierHooks).toHaveBeenCalledOnce();
    expect(result.fired).toBe(1);
    expect(result.notifications[0].urgency).toBe('low');
  });

  it('fires three windows when daysLeft=14 (60, 30, 14 all crossed)', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'confirmation_statement', dueDate: DUE_DATE, daysLeft: 14 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockFireZapierHooks).toHaveBeenCalledTimes(3);
    expect(result.fired).toBe(3);
    // Urgency escalates
    const urgencies = result.notifications.map((n) => n.urgency);
    expect(urgencies).toEqual(['low', 'medium', 'urgent']);
  });

  it('fires all four windows when overdue', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: -3 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockFireZapierHooks).toHaveBeenCalledTimes(4);
    expect(result.fired).toBe(4);
  });

  it('skips (does not re-fire) already-dispatched windows', async () => {
    // All windows already in DB
    mockInsertDispatchIfNew.mockResolvedValue(false);

    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 7 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockFireZapierHooks).not.toHaveBeenCalled();
    expect(result.fired).toBe(0);
    expect(result.skipped).toBe(4);
    expect(result.notifications.every((n) => !n.fired)).toBe(true);
  });

  it('fires only new windows when some are already dispatched', async () => {
    // 60 and 30 already dispatched; 14 and 7 are new
    mockInsertDispatchIfNew
      .mockResolvedValueOnce(false) // w60
      .mockResolvedValueOnce(false) // w30
      .mockResolvedValueOnce(true)  // w14
      .mockResolvedValueOnce(true); // w7

    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 5 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(mockFireZapierHooks).toHaveBeenCalledTimes(2);
    expect(result.fired).toBe(2);
    expect(result.skipped).toBe(2);
  });

  it('includes correct payload fields in the Zapier call', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 30 },
    ];
    await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    // Two windows active (60 and 30): check the w30 call
    const calls = mockFireZapierHooks.mock.calls;
    const w30Call = calls.find(([, payload]) => (payload as { windowDays: number }).windowDays === 30);

    expect(w30Call).toBeDefined();
    const [event, payload] = w30Call!;
    expect(event).toBe('compliance.alert');
    const p = payload as Record<string, unknown>;
    expect(p.companyNumber).toBe(COMPANY);
    expect(p.companyName).toBe(NAME);
    expect(p.alertType).toBe('accounts_filing');
    expect(p.dueDate).toBe(DUE_DATE);
    expect(p.daysRemaining).toBe(30);
    expect(p.urgency).toBe('medium');
    expect(p.overdue).toBe(false);
    expect(typeof p.message).toBe('string');
    expect(typeof p.firedAt).toBe('string');
  });

  it('marks overdue=true in payload when daysLeft < 0', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'confirmation_statement', dueDate: DUE_DATE, daysLeft: -1 },
    ];
    await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    const [, payload] = mockFireZapierHooks.mock.calls[0];
    expect((payload as Record<string, unknown>).overdue).toBe(true);
  });

  it('records hook delivery counts in notification result', async () => {
    mockFireZapierHooks.mockResolvedValue({ total: 3, delivered: 2, failed: 1 });
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 60 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(result.notifications[0].hooksDelivered).toBe(2);
    expect(result.notifications[0].hooksFailed).toBe(1);
  });

  it('records error and does not count as fired when dispatch throws', async () => {
    mockInsertDispatchIfNew.mockRejectedValue(new Error('DB connection lost'));

    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 7 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(result.errors).toBeGreaterThan(0);
    expect(result.fired).toBe(0);
    const errored = result.notifications.find((n) => n.error);
    expect(errored?.error).toContain('DB connection lost');
  });

  it('processes multiple deadlines independently', async () => {
    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: '2026-05-01', daysLeft: 60 },
      { alertType: 'confirmation_statement', dueDate: '2026-06-15', daysLeft: 91 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    // accounts (daysLeft=60) → 1 window; confirmation_statement (daysLeft=91) → 0
    expect(result.deadlinesChecked).toBe(2);
    expect(result.fired).toBe(1);
    expect(result.notifications).toHaveLength(1);
  });

  it('returns correct summary counts', async () => {
    mockInsertDispatchIfNew
      .mockResolvedValueOnce(true)   // w60 → new
      .mockResolvedValueOnce(false); // w30 → duplicate

    const deadlines: DeadlineInfo[] = [
      { alertType: 'accounts_filing', dueDate: DUE_DATE, daysLeft: 30 },
    ];
    const result = await dispatchAlertsForCompany(COMPANY, NAME, deadlines);

    expect(result.fired).toBe(1);
    expect(result.skipped).toBe(1);
    expect(result.errors).toBe(0);
  });
});
