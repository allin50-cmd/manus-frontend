/**
 * E2E integration test: checkout.session.completed → billing active → monitoring active
 *
 * Does NOT mock activateComplianceMonitoring — exercises the full call chain
 * from handleStripeWebhookEvent through to the repo/service layer.
 *
 * Proves:
 * 1. Webhook is claimed before side effects fire
 * 2. upsertMonitoredCompany is called with billingStatus='active'
 * 3. insertAlerts is called with the correct alert types
 * 4. insertObligation is called once per requested obligation type
 * 5. startObligationWorkflow is called once per obligation with matching IDs
 * 6. The event is marked processed on success
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

vi.mock('../../repositories/company.repository', () => ({
  findCompanyByNumber: vi.fn().mockResolvedValue(null), // triggers insert path
  insertMonitoredCompany: vi.fn().mockResolvedValue({ id: 'temporal-company-id' }),
}));

vi.mock('../../repositories/obligation.repository', () => ({
  insertObligation: vi.fn()
    .mockResolvedValueOnce({ id: 'obligation-id-1' })
    .mockResolvedValueOnce({ id: 'obligation-id-2' }),
}));

vi.mock('../../domain/services/workflow-start.service', () => ({
  startObligationWorkflow: vi.fn().mockResolvedValue({ workflowId: 'wf-id', alreadyRunning: false }),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { handleStripeWebhookEvent } from '../../server/services/billing/stripe-webhook.service';
import { upsertMonitoredCompany } from '../../server/repositories/monitoredCompanies.repo';
import { insertAlerts } from '../../server/repositories/complianceAlerts.repo';
import { insertObligation } from '../../repositories/obligation.repository';
import { startObligationWorkflow } from '../../domain/services/workflow-start.service';
import { db } from '../../server/db';

const mockDb = vi.mocked(db);
const mockUpsert = vi.mocked(upsertMonitoredCompany);
const mockInsertAlerts = vi.mocked(insertAlerts);
const mockInsertObligation = vi.mocked(insertObligation);
const mockStartWorkflow = vi.mocked(startObligationWorkflow);

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
    // Reset obligation insert mock to return sequential IDs on each test run
    mockInsertObligation
      .mockResolvedValueOnce({ id: 'obligation-id-1' })
      .mockResolvedValueOnce({ id: 'obligation-id-2' });
  });

  it('full path: checkout event activates billing and starts two workflows', async () => {
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

  it('monitoring active: one obligation + workflow per alert type', async () => {
    await handleStripeWebhookEvent(makeCheckoutEvent());

    // One obligation per type (accounts_filing + confirmation_statement)
    expect(mockInsertObligation).toHaveBeenCalledTimes(2);
    const obligationTypes = mockInsertObligation.mock.calls.map((c) => c[0].obligationType);
    expect(obligationTypes).toContain('accounts_filing');
    expect(obligationTypes).toContain('confirmation_statement');

    // One workflow per obligation
    expect(mockStartWorkflow).toHaveBeenCalledTimes(2);
    const workflowObligationIds = mockStartWorkflow.mock.calls.map((c) => c[0].obligationId);
    expect(workflowObligationIds).toContain('obligation-id-1');
    expect(workflowObligationIds).toContain('obligation-id-2');
  });

  it('workflows carry companyNumber for billing gate in createAlert', async () => {
    await handleStripeWebhookEvent(makeCheckoutEvent());

    mockStartWorkflow.mock.calls.forEach(([input]) => {
      expect(input.companyNumber).toBe('12345678');
    });
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
    expect(mockInsertObligation).not.toHaveBeenCalled();
    expect(mockStartWorkflow).not.toHaveBeenCalled();
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
