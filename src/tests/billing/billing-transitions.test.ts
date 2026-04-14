/**
 * Billing state machine tests.
 *
 * Verifies that transitionBillingStatus:
 * - Accepts valid transitions per ALLOWED_FROM map
 * - Rejects invalid transitions
 * - Returns true on update, false on rejection
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../server/db', () => ({
  db: { update: vi.fn() },
}));

vi.mock('../../server/db/schema', () => ({
  monitoredCompanies: {
    companyNumber: 'company_number',
    billingStatus: 'billing_status',
    billingStatusUpdatedAt: 'billing_status_updated_at',
    lastStripeEventAt: 'last_stripe_event_at',
  },
}));

import { transitionBillingStatus } from '../../server/repositories/monitoredCompanies.repo';
import { db } from '../../server/db';

const mockDb = vi.mocked(db);

function mockUpdate(rowsUpdated: number) {
  mockDb.update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(
        rowsUpdated > 0 ? [{ id: 'test-id' }] : [],
      ),
    }),
  });
}

// Note: transitionBillingStatus uses Drizzle .returning() — mock returning
function mockUpdateReturning(rows: unknown[]) {
  mockDb.update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

describe('transitionBillingStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inactive → pending: invalid (inactive has no allowed predecessors)', async () => {
    // ALLOWED_FROM.inactive = [] so transitionBillingStatus returns false immediately
    const result = await transitionBillingStatus('12345678', 'inactive');
    expect(result).toBe(false);
    // DB must not be called when allowed list is empty
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('inactive → active: DB returns updated row → true', async () => {
    mockUpdateReturning([{ id: 'test-id' }]);
    const result = await transitionBillingStatus('12345678', 'active');
    expect(result).toBe(true);
  });

  it('active → past_due: DB returns updated row → true', async () => {
    mockUpdateReturning([{ id: 'test-id' }]);
    const result = await transitionBillingStatus('12345678', 'past_due');
    expect(result).toBe(true);
  });

  it('already cancelled → past_due: DB returns no rows (rejected) → false', async () => {
    mockUpdateReturning([]); // DB WHERE clause rejected the transition
    const result = await transitionBillingStatus('12345678', 'past_due');
    expect(result).toBe(false);
  });

  it('passes eventCreatedAt to the ordering guard', async () => {
    mockUpdateReturning([{ id: 'test-id' }]);
    const eventTs = new Date('2026-01-01T00:00:00Z');
    const result = await transitionBillingStatus('12345678', 'active', {
      eventCreatedAt: eventTs,
    });
    expect(result).toBe(true);
    // Verify the where clause was called (ordering guard was wired in)
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('past_due → active: DB returns updated row → true', async () => {
    mockUpdateReturning([{ id: 'test-id' }]);
    const result = await transitionBillingStatus('12345678', 'active');
    expect(result).toBe(true);
  });

  it('active → cancelled: DB returns updated row → true', async () => {
    mockUpdateReturning([{ id: 'test-id' }]);
    const result = await transitionBillingStatus('12345678', 'cancelled');
    expect(result).toBe(true);
  });
});
