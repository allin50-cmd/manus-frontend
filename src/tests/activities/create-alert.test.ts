/**
 * Tests for the createAlert activity.
 *
 * Verifies deduplication logic by mocking insertAlertIfNew.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the alert repository before importing the activity
vi.mock('../../repositories/alert.repository', () => ({
  insertAlertIfNew: vi.fn(),
}));

// Mock the ids lib (dedupeKey)
vi.mock('../../lib/ids', () => ({
  dedupeKey: (parts: string[]) => parts.join(':'),
  newId: () => '00000000-0000-0000-0000-000000000000',
  workflowId: (id: string) => `obligation:${id}`,
}));

import { createAlert } from '../../temporal/activities/create-alert';
import { insertAlertIfNew } from '../../repositories/alert.repository';

const mockInsertAlertIfNew = vi.mocked(insertAlertIfNew);

const baseInput = {
  obligationId: '11111111-1111-1111-1111-111111111111',
  tenantId: '22222222-2222-2222-2222-222222222222',
  urgency: 'urgent' as const,
  channel: 'email' as const,
  dueDate: '2026-04-30',
};

describe('createAlert activity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an alert on the first call', async () => {
    mockInsertAlertIfNew.mockResolvedValueOnce({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });

    await createAlert(baseInput);

    expect(mockInsertAlertIfNew).toHaveBeenCalledOnce();

    const callArg = mockInsertAlertIfNew.mock.calls[0][0];
    expect(callArg.obligationId).toBe(baseInput.obligationId);
    expect(callArg.tenantId).toBe(baseInput.tenantId);
    expect(callArg.urgency).toBe('urgent');
    expect(callArg.channel).toBe('email');
    expect(callArg.dueDate).toBe('2026-04-30');
    // Verify dedupeKey format
    expect(callArg.dedupeKey).toBe(
      `${baseInput.obligationId}:urgent:email:2026-04-30`,
    );
  });

  it('deduplicates on a second call with the same key', async () => {
    // First call: returns an id (inserted)
    mockInsertAlertIfNew.mockResolvedValueOnce({
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    });
    // Second call: returns null (deduplicated)
    mockInsertAlertIfNew.mockResolvedValueOnce(null);

    await createAlert(baseInput);
    await createAlert(baseInput);

    expect(mockInsertAlertIfNew).toHaveBeenCalledTimes(2);

    // Both calls should have the same dedupeKey
    const key1 = mockInsertAlertIfNew.mock.calls[0][0].dedupeKey;
    const key2 = mockInsertAlertIfNew.mock.calls[1][0].dedupeKey;
    expect(key1).toBe(key2);
  });

  it('does not throw when deduplicated', async () => {
    mockInsertAlertIfNew.mockResolvedValueOnce(null);

    // Should resolve without error even when deduplicated
    await expect(createAlert(baseInput)).resolves.toBeUndefined();
  });

  it('builds the correct dedupeKey from all parts', async () => {
    mockInsertAlertIfNew.mockResolvedValueOnce({ id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' });

    const input = {
      ...baseInput,
      urgency: 'low' as const,
      channel: 'sms' as const,
      dueDate: '2026-12-31',
    };
    await createAlert(input);

    const callArg = mockInsertAlertIfNew.mock.calls[0][0];
    expect(callArg.dedupeKey).toBe(
      `${input.obligationId}:low:sms:2026-12-31`,
    );
  });
});
