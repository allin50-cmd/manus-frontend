/**
 * E2E integration test: checkout.session.completed → billing active → monitoring active
 *
 * Does NOT mock activateComplianceMonitoring — exercises the full call chain
 * from handleStripeWebhookEvent through to the repo layer.
 *
 * Proves:
 * 1. Webhook is claimed before side effects fire
 * 2. upsertMonitoredCompany is called with billingStatus='active'
 * 3. insertAlerts is called with the correct alert types
 * 4. The event is marked processed on success
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../server/db', () => ({
  db: { insert: vi.fn(), update: vi.fn() },
}));

vi.mock('../../server/db/schema', () => ({
  stripeWebhookEvents: {
    id: 'id', eventId: 'event_id', type: 'type', status: 'status',
  },
}));

vi.mock('../../types/stripe', () => ({
  parseFineGuardMetadata: vi.fn().mockReturnValue({
    company_number: '12345678',
    company_name: 'Acme Ltd',
    alert_types: 'accounts_filing,confirmation_statement',
    source: 'check_page',
  }),
  isValidFineGuardMetadata: vi.fn().mockReturnValue(true),
}));

vi.mock('../../server/repositories/monitoredCompanies.repo', () => ({
  upsertMonitoredCompany: vi.fn().mockResolvedValue(undefined),
  findByStripeCustomerId: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../server/repositories/complianceAlerts.repo', () => ({
  insertAlerts: vi.fn().mockResolvedValue(undefined),
  reactivateAlertsForCompany: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { handleStripeWebhookEvent } from '../../server/services/billing/stripe-webhook.service';
import { upsertMonitoredCompany } from '../../server/repositories/monitoredCompanies.repo';
import { insertAlerts } from '../../server/repositories/complianceAlerts.repo';
import { db } from '../../server/db';

const mockDb = vi.mocked(db);
const mockUpsert = vi.mocked(upsertMonitoredCompany);
const mockInsertAlerts = vi.mocked(insertAlerts);

// ── Helpers ───────────────────────────────────────────────────────────────────

function mockDbForSuccess() {
  // claimEvent: INSERT returns one row (claimed)
  mockDb.insert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      onConflictDoNothing: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{ id: 'swe-row-id' }]),
      }),
    }),
  });
  // markEventProcessed: UPDATE resolves
  mockDb.update = vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([]),
    }),
  });
}

function makeCheckoutEvent(id = 'evt_e2e_001') {
  return {
    id,
    type: 'checkout.session.completed',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_e2e_001',
        object: 'checkout.session',
        customer: 'cus_e2e',
        subscription: 'sub_e2e',
        client_reference_id: '12345678',
        metadata: {
          company_number: '12345678',
          company_name: 'Acme Ltd',
          alert_types: 'accounts_filing,confirmation_statement',
          source: 'check_page',
        },
      },
    },
  } as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('checkout → billing active → monitoring active (e2e)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbForSuccess();
  });

  it('full path: checkout event activates billing and monitoring', async () => {
    const result = await handleStripeWebhookEvent(makeCheckoutEvent());

    // Webhook was claimed and processed
    expect(result.processed).toBe(true);
    expect(result.deduplicated).toBe(false);

    // Billing activated — company upserted with billingStatus=active
    expect(mockUpsert).toHaveBeenCalledOnce();
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        companyNumber: '12345678',
        billingStatus: 'active',
      }),
    );

    // Alert rows created for both requested types
    expect(mockInsertAlerts).toHaveBeenCalledOnce();
    expect(mockInsertAlerts).toHaveBeenCalledWith(
      '12345678',
      expect.arrayContaining(['accounts_filing', 'confirmation_statement']),
      expect.anything(),
    );
  });

  it('duplicate event is a safe no-op (billing and monitoring not re-triggered)', async () => {
    // Second call: INSERT returns 0 rows = already claimed
    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    const result = await handleStripeWebhookEvent(makeCheckoutEvent('evt_e2e_dup'));

    expect(result.deduplicated).toBe(true);
    expect(result.processed).toBe(false);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('webhook is persisted before any side effects execute', async () => {
    const order: string[] = [];

    mockDb.insert = vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoNothing: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(async () => {
            order.push('claim');
            return [{ id: 'swe-row-id' }];
          }),
        }),
      }),
    });
    mockUpsert.mockImplementation(async () => { order.push('upsert'); });

    await handleStripeWebhookEvent(makeCheckoutEvent('evt_e2e_order'));

    expect(order[0]).toBe('claim');
    expect(order).toContain('upsert');
  });
});
