import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeAlertIfRequired, toAlertSeverity } from './fineguard-alerts';

// ─── DB mock ──────────────────────────────────────────────────────────────────
// Module-level state the mock closure reads on every call.
// Tests mutate these before each assertion.

let _rows: Array<{ id: string }> = [];
let _shouldThrow = false;

vi.mock('../db/index', () => ({
  db: {
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: async () => {
            if (_shouldThrow) throw new Error('DB connection failed');
            return _rows;
          },
        }),
      }),
    }),
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const BASE_INPUT = {
  tenantId: '00000000-0000-0000-0000-000000000001',
  complianceRunId: '11111111-1111-1111-1111-111111111111',
  alertType: 'overdue_filings',
  severity: 'high' as const,
  title: 'Compliance alert: Test Corp',
  message: 'Overdue filings detected for 12345678',
};

const CORRELATION = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('writeAlertIfRequired', () => {
  beforeEach(() => {
    _rows = [{ id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }];
    _shouldThrow = false;
  });

  it('returns null and does not touch the DB when alertRequired is false', async () => {
    // If the DB were touched _shouldThrow would cause the mock to throw,
    // turning a wrong-path execution into a test failure.
    _shouldThrow = true;
    const result = await writeAlertIfRequired(false, BASE_INPUT, CORRELATION);
    expect(result).toBeNull();
  });

  it('returns inserted with the new row id when alertRequired is true', async () => {
    const result = await writeAlertIfRequired(true, BASE_INPUT, CORRELATION);
    expect(result).toEqual({
      ok: true,
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      action: 'inserted',
    });
  });

  it('returns duplicate when the DB returns no rows (idempotent retry)', async () => {
    // Simulates onConflictDoNothing matching an existing (complianceRunId, alertType)
    // row — i.e., the scheduler was retried with the same correlation ID.
    _rows = [];
    const result = await writeAlertIfRequired(true, BASE_INPUT, CORRELATION);
    expect(result).toEqual({ ok: true, id: '', action: 'duplicate' });
  });

  it('returns failedSafe without throwing when the DB errors', async () => {
    _shouldThrow = true;
    const result = await writeAlertIfRequired(true, BASE_INPUT, CORRELATION);
    expect(result).toEqual({
      ok: false,
      failedSafe: true,
      correlationId: CORRELATION,
      error: 'DB connection failed',
    });
  });
});

describe('toAlertSeverity', () => {
  it.each([
    ['none', 'low'],
    ['low', 'low'],
    ['medium', 'medium'],
    ['high', 'high'],
    ['critical', 'critical'],
    ['unknown', 'low'],
  ])('maps riskLevel %s → severity %s', (input, expected) => {
    expect(toAlertSeverity(input)).toBe(expected);
  });
});
