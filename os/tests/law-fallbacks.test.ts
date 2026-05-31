import { describe, it, expect, beforeEach } from 'vitest';
import { extractFromDocument } from '@/lib/verticals/law/extraction';
import { generateBilling } from '@/lib/verticals/law/billing';

beforeEach(() => {
  delete process.env.OPENAI_API_KEY;
});

describe('law extraction deterministic fallback', () => {
  it('extracts dates, parties, and task-like sentences', async () => {
    const text = `
      Claimant: Acme Ltd.
      Defendant: Globex PLC.
      Counsel must file the witness statement by 14 June 2025.
      Please serve the particulars of claim on the respondent.
      Personal data processing under GDPR is in scope.
      Without prejudice negotiations commenced 2025-01-10.
    `;
    const result = await extractFromDocument(text, 'brief', 300);

    expect(result.tasks.length).toBeGreaterThan(0);
    expect(result.parties.join(' ')).toMatch(/Acme Ltd/);
    expect(result.parties.join(' ')).toMatch(/Globex PLC/);
    expect(result.deadlines.length).toBeGreaterThanOrEqual(1);
    expect(result.complianceFlags.map((f) => f.type)).toEqual(
      expect.arrayContaining(['gdpr', 'privilege']),
    );
    expect(result.billingEntries.length).toBe(1);
    expect(result.billingEntries[0].value).toBeGreaterThan(0);
  });

  it('returns empty billing for empty text', async () => {
    const result = await extractFromDocument('', 'email', 250);
    expect(result.billingEntries).toEqual([]);
    expect(result.tasks).toEqual([]);
  });
});

describe('law billing deterministic fallback', () => {
  it('parses explicit hours from notes', async () => {
    const result = await generateBilling({
      text: 'Reviewed disclosure bundle 2h\nDrafted witness statement 1.5 hrs',
      ratePerHour: 300,
    });
    expect(result.source).toBe('deterministic');
    expect(result.entries).toHaveLength(2);
    expect(result.entries[0].hours).toBe(2);
    expect(result.entries[1].hours).toBe(1.5);
    expect(result.totalHours).toBeCloseTo(3.5, 2);
    expect(result.totalValue).toBe(2 * 300 + 1.5 * 300);
  });

  it('estimates hours when not explicit', async () => {
    const text = 'Attendance upon client to review disclosure bundle and prepare briefing note.';
    const result = await generateBilling({ text, ratePerHour: 250 });
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].hours).toBeGreaterThan(0);
    expect(result.entries[0].value).toBeGreaterThan(0);
  });
});
