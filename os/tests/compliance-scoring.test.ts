import { describe, it, expect } from 'vitest';
import { scoreCompliance } from '@/lib/verticals/compliance/scoring';
import type { CompanyProfile, FilingHistoryItem } from '@/lib/verticals/compliance/companiesHouse';

function mkProfile(overrides: Partial<CompanyProfile> = {}): CompanyProfile {
  return {
    company_number: '12345678',
    company_name: 'Acme Ltd',
    company_status: 'active',
    ...overrides,
  };
}

function futureDate(daysAhead: number): string {
  return new Date(Date.now() + daysAhead * 86_400_000).toISOString().slice(0, 10);
}

describe('scoreCompliance', () => {
  it('scores 0 when no deadlines and clean history', () => {
    const result = scoreCompliance(mkProfile(), []);
    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe('Low');
    expect(result.predictedPenalty).toBe(0);
  });

  it('adds 50 + 25 when accounts are overdue', () => {
    const result = scoreCompliance(
      mkProfile({
        accounts: { next_accounts: { due_on: futureDate(-30), overdue: true } },
      }),
      [],
    );
    expect(result.riskScore).toBe(75);
    expect(result.riskLevel).toBe('High');
    expect(result.predictedPenalty).toBe(75 * 50);
  });

  it('adds 20 + 25 when accounts due in <7 days', () => {
    const result = scoreCompliance(
      mkProfile({
        accounts: { next_accounts: { due_on: futureDate(3), overdue: false } },
      }),
      [],
    );
    expect(result.riskScore).toBe(45);
    expect(result.riskLevel).toBe('Medium');
  });

  it('adds 50 + 15 when confirmation statement overdue', () => {
    const result = scoreCompliance(
      mkProfile({ confirmation_statement: { next_due: futureDate(-5), overdue: true } }),
      [],
    );
    expect(result.riskScore).toBe(65);
    expect(result.riskLevel).toBe('Medium');
  });

  it('adds 30 when filing history contains late filing', () => {
    const filings: FilingHistoryItem[] = [
      { date: '2024-01-01', type: 'AA', description: 'Accounts for year-end LATE', category: 'accounts' },
    ];
    const result = scoreCompliance(mkProfile(), filings);
    expect(result.riskScore).toBe(30);
  });

  it('caps score at 100 when multiple increments stack', () => {
    const result = scoreCompliance(
      mkProfile({
        accounts: { next_accounts: { due_on: futureDate(-10), overdue: true } },
        confirmation_statement: { next_due: futureDate(-3), overdue: true },
      }),
      [
        {
          date: '2024-01-01',
          type: 'AA',
          description: 'late accounts',
          category: 'accounts',
        },
      ],
    );
    expect(result.riskScore).toBe(100);
    expect(result.predictedPenalty).toBe(5000);
    expect(result.riskLevel).toBe('High');
  });

  it('returns upcoming deadlines sorted by provided source', () => {
    const result = scoreCompliance(
      mkProfile({
        accounts: { next_accounts: { due_on: futureDate(20), overdue: false } },
        confirmation_statement: { next_due: futureDate(40), overdue: false },
      }),
      [],
    );
    expect(result.upcomingDeadlines).toHaveLength(2);
    expect(result.upcomingDeadlines[0].type).toBe('accounts');
    expect(result.upcomingDeadlines[1].type).toBe('confirmation_statement');
  });
});
