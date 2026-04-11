/**
 * Tests for /api/connect/webhook (Stripe V2 thin events)
 *
 * Verifies that each V2 Connect event produces the correct SQL UPDATE
 * and that the thin-event retrieval pattern is exercised.
 *
 * Strategy:
 *   - Mock @/lib/stripe/connect-client so parseEventNotification and
 *     v2.core.events.retrieve are no-ops returning controlled data.
 *   - Mock postgres to capture SQL without a real DB.
 *   - Mock v2.core.accounts.retrieve for the requirements handler.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Hoisted mocks ─────────────────────────────────────────────────────────────

const { mockEnd, mockSql } = vi.hoisted(() => {
  const mockEnd = vi.fn().mockResolvedValue(undefined);
  const mockSql = vi.fn().mockResolvedValue([]) as ReturnType<typeof vi.fn> & { end: typeof mockEnd };
  mockSql.end = mockEnd;
  return { mockEnd, mockSql };
});

const { mockParseEventNotification, mockEventsRetrieve, mockAccountsRetrieve } = vi.hoisted(() => {
  const mockParseEventNotification = vi.fn();
  const mockEventsRetrieve = vi.fn();
  const mockAccountsRetrieve = vi.fn();
  return { mockParseEventNotification, mockEventsRetrieve, mockAccountsRetrieve };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/stripe/connect-client', () => ({
  stripeClient: {
    parseEventNotification: mockParseEventNotification,
    v2: {
      core: {
        events: { retrieve: mockEventsRetrieve },
        accounts: { retrieve: mockAccountsRetrieve },
      },
    },
  },
  connectWebhookSecret: 'whsec_connect_test',
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => mockSql),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { POST } from '../../app/api/connect/webhook/route';

// Provide a stub DATABASE_URL so getDb() passes its env-var check.
// The actual postgres() call is mocked above and never touches a real DB.
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(): NextRequest {
  return new Request('http://localhost/api/connect/webhook', {
    method: 'POST',
    body: '{}',
    headers: { 'stripe-signature': 'test-sig', 'content-type': 'text/plain' },
  }) as unknown as NextRequest;
}

function sqlString(callIndex = 0): string {
  const parts = mockSql.mock.calls[callIndex]?.[0] as string[] | undefined;
  return parts?.join('') ?? '';
}

function sqlValues(callIndex = 0): unknown[] {
  return mockSql.mock.calls[callIndex]?.slice(1) ?? [];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/api/connect/webhook (V2 thin events)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockResolvedValue([]);
    mockEnd.mockResolvedValue(undefined);
    // Default thin-event parse returns a minimal ID
    mockParseEventNotification.mockReturnValue({ id: 'evt_thin_001', type: '' });
  });

  // ── Thin-event retrieval ────────────────────────────────────────────────────

  it('always fetches the full event from Stripe after parsing the thin event', async () => {
    mockEventsRetrieve.mockResolvedValue({
      id: 'evt_thin_001',
      type: 'unknown.event',
      related_object: { id: 'acct_test' },
      data: { object: {} },
    });

    await POST(makeRequest());

    expect(mockParseEventNotification).toHaveBeenCalledTimes(1);
    expect(mockEventsRetrieve).toHaveBeenCalledWith('evt_thin_001');
  });

  // ── merchant capability_status_updated ─────────────────────────────────────

  describe('v2.core.account[configuration.merchant].capability_status_updated', () => {
    it('persists card_payments_status when capability is card_payments', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_merchant',
        type: 'v2.core.account[configuration.merchant].capability_status_updated',
        related_object: { id: 'acct_merchant_test' },
        data: {
          object: {
            capability: 'card_payments',
            status: 'active',
          },
        },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('card_payments_status');
      expect(q).toContain('stripe_account_id');

      const vals = sqlValues();
      expect(vals).toContain('active');
      expect(vals).toContain('acct_merchant_test');
    });

    it('does NOT write to DB for non-card_payments capabilities', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_other_cap',
        type: 'v2.core.account[configuration.merchant].capability_status_updated',
        related_object: { id: 'acct_test' },
        data: {
          object: {
            capability: 'transfers',  // not card_payments
            status: 'active',
          },
        },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('persists "restricted" status (logs warning but does not error)', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_restricted',
        type: 'v2.core.account[configuration.merchant].capability_status_updated',
        related_object: { id: 'acct_restricted' },
        data: {
          object: { capability: 'card_payments', status: 'restricted' },
        },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(sqlValues()).toContain('restricted');
    });
  });

  // ── customer capability_status_updated ─────────────────────────────────────

  describe('v2.core.account[configuration.customer].capability_status_updated', () => {
    it('persists customer_capability_status for any capability', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_customer_cap',
        type: 'v2.core.account[configuration.customer].capability_status_updated',
        related_object: { id: 'acct_customer_test' },
        data: {
          object: { capability: 'bank_transfers', status: 'inactive' },
        },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('customer_capability_status');

      const vals = sqlValues();
      expect(vals).toContain('inactive');
      expect(vals).toContain('acct_customer_test');
    });
  });

  // ── requirements updated ────────────────────────────────────────────────────

  describe('v2.core.account[requirements].updated', () => {
    it('fetches live requirements from Stripe (no DB write on requirements event)', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_req',
        type: 'v2.core.account[requirements].updated',
        related_object: { id: 'acct_req_test' },
        data: { object: {} },
      });
      mockAccountsRetrieve.mockResolvedValue({
        requirements: { summary: { minimum_deadline: { status: 'none' } } },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      // Requirements handler fetches live Stripe data
      expect(mockAccountsRetrieve).toHaveBeenCalledWith(
        'acct_req_test',
        expect.objectContaining({ include: expect.arrayContaining(['requirements']) }),
      );
      // No DB write for requirements updates (we log warnings only)
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('does not crash when Stripe account retrieve fails', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_req_fail',
        type: 'v2.core.account[requirements].updated',
        related_object: { id: 'acct_req_fail' },
        data: { object: {} },
      });
      // Simulate Stripe API error on account retrieve
      mockAccountsRetrieve.mockRejectedValue(new Error('Stripe account not found'));

      const res = await POST(makeRequest());

      // Handler catches the error and continues — should still return 200
      expect(res.status).toBe(200);
    });
  });

  // ── Unknown event type ──────────────────────────────────────────────────────

  describe('unknown event type', () => {
    it('returns 200 without DB writes for unhandled events', async () => {
      mockEventsRetrieve.mockResolvedValue({
        id: 'evt_unhandled',
        type: 'v2.some.new.event.type',
        related_object: { id: 'acct_test' },
        data: { object: {} },
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(200);
      expect(mockSql).not.toHaveBeenCalled();
    });
  });

  // ── Signature verification ──────────────────────────────────────────────────

  describe('signature verification', () => {
    it('returns 400 when parseEventNotification throws (invalid signature)', async () => {
      mockParseEventNotification.mockImplementation(() => {
        throw new Error('Webhook signature verification failed');
      });

      const res = await POST(makeRequest());

      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });

    it('returns 500 when v2.core.events.retrieve fails', async () => {
      mockEventsRetrieve.mockRejectedValue(new Error('Stripe API error'));

      const res = await POST(makeRequest());

      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.error).toBe('Failed to retrieve event');
    });
  });
});
