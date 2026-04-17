import { describe, it, expect } from 'vitest';
import { scoreRevenueAudit } from '@/lib/verticals/revenue/scoring';

describe('scoreRevenueAudit', () => {
  it('produces higher leakage for larger size tiers', () => {
    const small = scoreRevenueAudit({ sizeTier: '1-10', painPoints: [] });
    const large = scoreRevenueAudit({ sizeTier: '70+', painPoints: [] });
    expect(large.estimatedLeak.low).toBeGreaterThan(small.estimatedLeak.low);
    expect(large.estimatedLeak.high).toBeGreaterThan(small.estimatedLeak.high);
  });

  it('scales leakage with pain points', () => {
    const none = scoreRevenueAudit({ sizeTier: '10-30', painPoints: [] });
    const many = scoreRevenueAudit({
      sizeTier: '10-30',
      painPoints: ['unbilled_work', 'manual_admin', 'slow_billing'],
    });
    expect(many.estimatedLeak.high).toBeGreaterThan(none.estimatedLeak.high);
  });

  it('classifies risk as High when unbilled work + multiple pains', () => {
    const result = scoreRevenueAudit({
      sizeTier: '30-70',
      painPoints: ['unbilled_work', 'manual_admin', 'slow_billing'],
    });
    expect(result.riskLevel).toBe('High');
    expect(result.score).toBeGreaterThanOrEqual(55);
  });

  it('classifies risk as Low with no pain points', () => {
    const result = scoreRevenueAudit({ sizeTier: '10-30', painPoints: [] });
    expect(result.riskLevel).toBe('Low');
    expect(result.score).toBe(0);
  });

  it('applies higher multiplier for non-specialist systems', () => {
    const specialist = scoreRevenueAudit({
      system: 'Opus2',
      sizeTier: '10-30',
      painPoints: ['unbilled_work'],
    });
    const other = scoreRevenueAudit({
      system: 'Other',
      sizeTier: '10-30',
      painPoints: ['unbilled_work'],
    });
    expect(other.estimatedLeak.low).toBeGreaterThan(specialist.estimatedLeak.low);
  });

  it('confidence rises with more pain points but caps at 0.95', () => {
    const one = scoreRevenueAudit({ sizeTier: '10-30', painPoints: ['unbilled_work'] });
    const manyAll = scoreRevenueAudit({
      sizeTier: '10-30',
      painPoints: ['unbilled_work', 'manual_admin', 'slow_billing', 'x', 'y', 'z', 'q'],
    });
    expect(manyAll.confidence).toBeGreaterThan(one.confidence);
    expect(manyAll.confidence).toBeLessThanOrEqual(0.95);
  });

  it('always produces at least one driver', () => {
    const result = scoreRevenueAudit({ sizeTier: '10-30', painPoints: [] });
    expect(result.drivers.length).toBeGreaterThanOrEqual(1);
  });

  it('caps score at 100', () => {
    const result = scoreRevenueAudit({
      sizeTier: '70+',
      painPoints: ['unbilled_work', 'a', 'b', 'c', 'd', 'e', 'f', 'g'],
    });
    expect(result.score).toBeLessThanOrEqual(100);
  });
});
