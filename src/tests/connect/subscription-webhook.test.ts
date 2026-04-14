/**
 * Tests for /api/connect/subscription-webhook
 *
 * Verifies that each Stripe subscription lifecycle event produces the correct
 * SQL UPDATE against connected_accounts and returns the correct HTTP status.
 *
 * Strategy:
 *   - Mock @/lib/stripe/connect-client so signature verification is a no-op.
 *   - Mock postgres so SQL calls are captured without a real DB.
 *   - For each event type, inspect the captured SQL string parts and
 *     interpolated values to confirm the right columns are written.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';

// ── Hoisted mocks (must be declared before vi.mock calls) ─────────────────────

const { mockEnd, mockSql } = vi.hoisted(() => {
  const mockEnd = vi.fn().mockResolvedValue(undefined);
  // mockSql acts as both the tagged-template function and carries .end()
  const mockSql = vi.fn().mockResolvedValue([]) as ReturnType<typeof vi.fn> & { end: typeof mockEnd };
  mockSql.end = mockEnd;
  return { mockEnd, mockSql };
});

const { mockConstructEvent } = vi.hoisted(() => {
  const mockConstructEvent = vi.fn();
  return { mockConstructEvent };
});

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('@/lib/stripe/connect-client', () => ({
  stripeClient: {
    webhooks: { constructEvent: mockConstructEvent },
  },
  subscriptionWebhookSecret: 'whsec_test_secret',
}));

vi.mock('postgres', () => ({
  default: vi.fn(() => mockSql),
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import { POST } from '../../app/api/connect/subscription-webhook/route';

// Provide a stub DATABASE_URL so getDb() passes its env-var check.
// The actual postgres() call is mocked above and never touches a real DB.
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: object): NextRequest {
  const raw = JSON.stringify(body);
  return new Request('http://localhost/api/connect/subscription-webhook', {
    method: 'POST',
    body: raw,
    headers: { 'stripe-signature': 'test-sig', 'content-type': 'text/plain' },
  }) as unknown as NextRequest;
}

/** Returns the SQL string built from all template-literal parts of a mockSql call. */
function sqlString(callIndex = 0): string {
  const parts = mockSql.mock.calls[callIndex]?.[0] as string[] | undefined;
  return parts?.join('') ?? '';
}

/** Returns the interpolated values from a mockSql call (positions 1…n). */
function sqlValues(callIndex = 0): unknown[] {
  return mockSql.mock.calls[callIndex]?.slice(1) ?? [];
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('/api/connect/subscription-webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSql.mockResolvedValue([]);
    mockEnd.mockResolvedValue(undefined);
  });

  // ── customer.subscription.updated ──────────────────────────────────────────

  describe('customer.subscription.updated', () => {
    it('persists subscription_id, subscription_status, and subscription_price_id', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_001',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_abc123',
            status: 'active',
            pause_collection: null,
            cancel_at_period_end: false,
            items: { data: [{ price: { id: 'price_pro_monthly' } }] },
            customer_account: 'acct_test',
          },
        },
      });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('subscription_id');
      expect(q).toContain('subscription_status');
      expect(q).toContain('subscription_price_id');

      const vals = sqlValues();
      expect(vals).toContain('sub_abc123');
      expect(vals).toContain('active');
      expect(vals).toContain('price_pro_monthly');
      expect(vals).toContain('acct_test');
    });

    it('maps pause_collection (non-null) to "paused" status, not "active"', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_002',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_paused',
            status: 'active', // Stripe still sends 'active' when paused
            pause_collection: { behavior: 'void', resumes_at: null },
            cancel_at_period_end: false,
            items: { data: [{ price: { id: 'price_test' } }] },
            customer_account: 'acct_test',
          },
        },
      });

      await POST(makeRequest({}));

      const vals = sqlValues();
      expect(vals).toContain('paused');
      expect(vals).not.toContain('active');
    });

    it('uses customer (cus_***) when customer_account is absent (V1 account)', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_003',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_v1',
            status: 'active',
            pause_collection: null,
            cancel_at_period_end: false,
            items: { data: [{ price: { id: 'price_test' } }] },
            customer: 'cus_fallback', // V1 — no customer_account
          },
        },
      });

      await POST(makeRequest({}));

      const vals = sqlValues();
      expect(vals).toContain('cus_fallback');
    });
  });

  // ── customer.subscription.deleted ──────────────────────────────────────────

  describe('customer.subscription.deleted', () => {
    it('sets status to "cancelled" and nulls price_id', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_del',
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_del',
            status: 'canceled',
            items: { data: [] },
            customer_account: 'acct_cancel_test',
          },
        },
      });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('cancelled');
      expect(q).toContain('NULL');
      expect(q).toContain('stripe_account_id');

      expect(sqlValues()).toContain('acct_cancel_test');
    });
  });

  // ── invoice.payment_succeeded ───────────────────────────────────────────────

  describe('invoice.payment_succeeded', () => {
    it('records last_payment_at = NOW()', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_paid',
        type: 'invoice.payment_succeeded',
        data: {
          object: {
            id: 'in_paid',
            amount_paid: 2999,
            customer_account: 'acct_paid',
          },
        },
      });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('last_payment_at');
      expect(q).toContain('NOW()');

      expect(sqlValues()).toContain('acct_paid');
    });
  });

  // ── invoice.payment_failed ──────────────────────────────────────────────────

  describe('invoice.payment_failed', () => {
    it('sets subscription_status to "past_due"', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_fail',
        type: 'invoice.payment_failed',
        data: {
          object: {
            id: 'in_fail',
            next_payment_attempt: Math.floor(Date.now() / 1000) + 86400,
            customer_account: 'acct_fail',
          },
        },
      });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).toHaveBeenCalledTimes(1);

      const q = sqlString();
      expect(q).toContain('subscription_status');
      expect(q).toContain('past_due');

      expect(sqlValues()).toContain('acct_fail');
    });
  });

  // ── Acknowledged / ignored event types ─────────────────────────────────────

  describe('acknowledged events', () => {
    it.each([
      'payment_method.attached',
      'payment_method.detached',
      'customer.updated',
      'customer.tax_id.created',
      'billing_portal.session.created',
    ])('%s returns 200 without any DB writes', async (type) => {
      mockConstructEvent.mockReturnValue({ id: 'evt_ack', type, data: { object: {} } });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).not.toHaveBeenCalled();
    });

    it('unknown event type returns 200 without DB writes', async () => {
      mockConstructEvent.mockReturnValue({
        id: 'evt_unknown',
        type: 'some.unknown.event.type',
        data: { object: {} },
      });

      const res = await POST(makeRequest({}));

      expect(res.status).toBe(200);
      expect(mockSql).not.toHaveBeenCalled();
    });
  });

  // ── Signature verification ──────────────────────────────────────────────────

  describe('signature verification', () => {
    it('returns 400 when Stripe throws on constructEvent (invalid signature)', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('No signatures found matching the expected signature');
      });

      const res = await POST(makeRequest({}));
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });
  });
});
