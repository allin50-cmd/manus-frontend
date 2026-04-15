/**
 * Tests for POST /api/monitoring/activate
 *
 * Verifies that the route creates a monitored company and two obligations,
 * and returns the expected response shape.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock all dependencies ────────────────────────────────────────────────────

vi.mock('../../repositories/company.repository', () => ({
  findCompanyByNumber: vi.fn(),
  insertMonitoredCompany: vi.fn(),
  findCompanyById: vi.fn(),
}));

vi.mock('../../repositories/obligation.repository', () => ({
  insertObligation: vi.fn(),
}));

// ── Import mocks and route handler ───────────────────────────────────────────

import {
  findCompanyByNumber,
  insertMonitoredCompany,
  findCompanyById,
} from '../../repositories/company.repository';
import { insertObligation } from '../../repositories/obligation.repository';
import { POST } from '../../app/api/monitoring/activate/route';
import { NextRequest } from 'next/server';

const mockFindCompanyByNumber = vi.mocked(findCompanyByNumber);
const mockInsertMonitoredCompany = vi.mocked(insertMonitoredCompany);
const mockFindCompanyById = vi.mocked(findCompanyById);
const mockInsertObligation = vi.mocked(insertObligation);

// ── Helpers ──────────────────────────────────────────────────────────────────

const TEST_API_KEY = 'test-monitoring-key';

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/monitoring/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': TEST_API_KEY },
    body: JSON.stringify(body),
  });
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/monitoring/activate', () => {
  const tenantId = '00000000-0000-0000-0000-000000000001';
  const companyId = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  const validBody = {
    tenantId,
    companyNumber: '12345678',
    companyName: 'Acme Ltd',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.MONITORING_API_KEY = TEST_API_KEY;

    // Default: company doesn't exist yet
    mockFindCompanyByNumber.mockResolvedValue(null);

    // insertMonitoredCompany returns the new id
    mockInsertMonitoredCompany.mockResolvedValue({ id: companyId });

    // findCompanyById returns full company object
    mockFindCompanyById.mockResolvedValue({
      id: companyId,
      tenantId,
      companyNumber: '12345678',
      companyName: 'Acme Ltd',
      stripeSessionId: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      activatedAt: null,
      createdAt: new Date(),
    });

    // insertObligation returns incremental ids
    mockInsertObligation
      .mockResolvedValueOnce({ id: 'ob000001-0000-0000-0000-000000000001' })
      .mockResolvedValueOnce({ id: 'ob000002-0000-0000-0000-000000000002' });
  });

  it('creates a monitored company and two obligations', async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);

    const json = await res.json();

    expect(json.monitoredCompanyId).toBe(companyId);
    expect(json.obligations).toHaveLength(2);

    const types = json.obligations.map((o: { type: string }) => o.type);
    expect(types).toContain('accounts_filing');
    expect(types).toContain('confirmation_statement');
  });

  it('returns the correct response shape', async () => {
    const req = makeRequest(validBody);
    const res = await POST(req);
    const json = await res.json();

    // Each obligation must have id and type
    for (const obligation of json.obligations) {
      expect(obligation).toHaveProperty('id');
      expect(obligation).toHaveProperty('type');
    }
  });

  it('returns 422 for missing required fields', async () => {
    const req = makeRequest({ tenantId });
    const res = await POST(req);
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toBe('Validation failed');
  });

  it('returns 422 for invalid tenantId (not a UUID)', async () => {
    const req = makeRequest({ ...validBody, tenantId: 'not-a-uuid' });
    const res = await POST(req);
    expect(res.status).toBe(422);
  });

  it('reuses existing company if found', async () => {
    // Company already exists
    mockFindCompanyByNumber.mockResolvedValue({
      id: companyId,
      tenantId,
      companyNumber: '12345678',
      companyName: 'Acme Ltd',
      stripeSessionId: null,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      activatedAt: null,
      createdAt: new Date(),
    });

    const req = makeRequest(validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    // insertMonitoredCompany should NOT have been called
    expect(mockInsertMonitoredCompany).not.toHaveBeenCalled();
  });

  it('creates exactly two obligations (one per obligation type)', async () => {
    const req = makeRequest(validBody);
    await POST(req);

    expect(mockInsertObligation).toHaveBeenCalledTimes(2);

    const calls = mockInsertObligation.mock.calls;
    const calledTypes = calls.map((c) => c[0].obligationType);
    expect(calledTypes).toContain('accounts_filing');
    expect(calledTypes).toContain('confirmation_statement');
  });
});
