/**
 * Webhook idempotency tests.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../server/db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../server/db/schema', () => ({
  stripeWebhookEvents: { id: 'id', eventId: 'event_id', type: 'type', status: 'status' },
}));

vi.mock('../../server/services/compliance/activation.service', () => ({
  activateComplianceMonitoring: vi.fn(),
  markBillingPastDue: vi.fn(),
  cancelComplianceMonitoring: vi.fn(),
  restoreBillingActive: vi.fn(),
}));

vi.mock('../../server/repositories/monitoredCompanies.repo', () => ({
  findByStripeCustomerId: vi.fn(),
}));

vi.mock('../../types/stripe', () => ({
  parseFineGuardMetadata: vi.fn().mockReturnValue({
    company_number: '12345678',
    company_name: 'Acme Ltd',
    alert_types: 'accounts_filing',
    source: 'check_page',
  }),
  isValidFineGuardMetadata: vi.fn().mockReturnValue(true),
}));

import { handleStripeWebhookEvent } from '../../server/services/billing/stripe-webhook.service';
import { activateComplianceMonitoring } from '../../server/services/compliance/activation.service';
import { db } from '../../server/db';

const mockActivate = vi.mocked(activateComplianceMonitoring);
const mockDb = vi.mocked(db);

// ── Mock builder helpers ──────────────────────────────────────────────────────

/** Mock db.insert().values().onConflictDoNothing().returning() */
function mockInsertReturning(rows: unknown[]) {
  mockDb.insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue(rows),
      }),
    }),
  });
}

/** Mock db.update().set().where() */
function mockUpdateWhere() {
  mockDb.update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
  });
}

// ── Event factory ─────────────────────────────────────────────────────────────

function makeCheckoutEvent(id = 'evt_test_001') {
  return {
    id,
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_001',
        object: 'checkout.session',
        customer: 'cus_test',
        subscription: 'sub_test',
        client_reference_id: '12345678',
        metadata: {
          company_number: '12345678',
          company_name: 'Acme Ltd',
          alert_types: 'accounts_filing',
          source: 'check_page',
        },
      },
    },
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('handleStripeWebhookEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateWhere();
  });

  it('claims and processes a new event', async () => {
    mockInsertReturning([{ id: 'row-id' }]); // INSERT succeeds = claimed
    mockActivate.mockResolvedValue(undefined);

    const result = await handleStripeWebhookEvent(makeCheckoutEvent('evt_new_001'));

    expect(result.processed).toBe(true);
    expect(result.deduplicated).toBe(false);
    expect(mockActivate).toHaveBeenCalledTimes(1);
  });

  it('deduplicates: second call for same event_id is a no-op', async () => {
    mockInsertReturning([]); // INSERT returns 0 rows = already claimed

    const result = await handleStripeWebhookEvent(makeCheckoutEvent('evt_dup_001'));

    expect(result.deduplicated).toBe(true);
    expect(result.processed).toBe(false);
    // Business logic must NOT have been called
    expect(mockActivate).not.toHaveBeenCalled();
  });

  it('marks permanent errors as processed so Stripe stops retrying', async () => {
    mockInsertReturning([{ id: 'row-id' }]);
    mockActivate.mockRejectedValue(
      new Error('Invalid Stripe checkout metadata: company_number too short'),
    );

    const result = await handleStripeWebhookEvent(makeCheckoutEvent('evt_perm_001'));

    expect(result.processed).toBe(true);
    expect(result.deduplicated).toBe(false);
    // No throw — permanent errors return 200
  });

  it('re-throws retryable errors so route returns 500 and Stripe retries', async () => {
    mockInsertReturning([{ id: 'row-id' }]);
    mockActivate.mockRejectedValue(new Error('Connection timeout'));

    await expect(
      handleStripeWebhookEvent(makeCheckoutEvent('evt_retry_001')),
    ).rejects.toThrow('Connection timeout');
  });

  it('persists event before executing business logic', async () => {
    // Verify INSERT is called before the activate mock resolves
    const callOrder: string[] = [];

    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(async () => {
            callOrder.push('insert');
            return [{ id: 'row-id' }];
          }),
        }),
      }),
    });

    mockActivate.mockImplementation(async () => {
      callOrder.push('activate');
    });

    await handleStripeWebhookEvent(makeCheckoutEvent('evt_order_001'));

    expect(callOrder[0]).toBe('insert');
    expect(callOrder[1]).toBe('activate');
  });
});
