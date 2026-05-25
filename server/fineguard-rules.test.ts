import { describe, it, expect } from 'vitest';
import { evaluateFineGuardActivation, shouldActivateFineGuard } from './lib/fineguard-rules';
import type { IntakeForm } from './db/schema';

// Pure-function tests — no DB, no I/O. Cover the deterministic rule matrix
// behind PIE → FineGuard auto-activation.

function makeIntake(overrides: Partial<IntakeForm> = {}): IntakeForm {
  return {
    id: '00000000-0000-0000-0000-000000000001',
    matterRef: 'MAT-1',
    clientName: 'Test Applicant',
    clientEmail: null,
    clientPhone: null,
    matterType: 'planning',
    urgency: 'medium',
    description: null,
    claimValue: null,
    sourceRef: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe('evaluateFineGuardActivation: PIE-origin gate', () => {
  it('does NOT activate for non-PIE intake even with high urgency', () => {
    const result = evaluateFineGuardActivation(makeIntake({ sourceRef: null, urgency: 'high' }));
    expect(result.activate).toBe(false);
    expect(result.reasons.pieOriginated).toBe(false);
    expect(result.reasons.highUrgency).toBe(true);
  });

  it('does NOT activate for non-PIE intake even with high value', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: null, claimValue: '£5,000,000' }),
    );
    expect(result.activate).toBe(false);
  });

  it('does NOT activate when sourceRef has a different prefix', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'MANUAL:foo', urgency: 'critical' }),
    );
    expect(result.activate).toBe(false);
    expect(result.reasons.pieOriginated).toBe(false);
  });
});

describe('evaluateFineGuardActivation: urgency rule', () => {
  it('activates for PIE intake with urgency=high', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'high' }),
    );
    expect(result.activate).toBe(true);
    expect(result.reasons).toEqual({ pieOriginated: true, highUrgency: true, highValue: false });
  });

  it('activates for PIE intake with urgency=critical', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'critical' }),
    );
    expect(result.activate).toBe(true);
    expect(result.reasons.highUrgency).toBe(true);
  });

  it('does NOT activate for PIE intake with urgency=low and no high value', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low' }),
    );
    expect(result.activate).toBe(false);
    expect(result.reasons.pieOriginated).toBe(true);
    expect(result.reasons.highUrgency).toBe(false);
  });

  it('does NOT activate for PIE intake with urgency=medium and no high value', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'medium' }),
    );
    expect(result.activate).toBe(false);
  });
});

describe('evaluateFineGuardActivation: value rule', () => {
  it('activates for PIE intake with claimValue ≥ £1M and low urgency', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low', claimValue: '£2,400,000' }),
    );
    expect(result.activate).toBe(true);
    expect(result.reasons.highValue).toBe(true);
  });

  it('activates exactly at the £1M threshold', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low', claimValue: '£1,000,000' }),
    );
    expect(result.activate).toBe(true);
  });

  it('does NOT activate just below the £1M threshold', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low', claimValue: '£999,999' }),
    );
    expect(result.activate).toBe(false);
    expect(result.reasons.highValue).toBe(false);
  });

  it('handles claimValue with no digits as not high-value', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low', claimValue: 'TBD' }),
    );
    expect(result.activate).toBe(false);
    expect(result.reasons.highValue).toBe(false);
  });

  it('handles null claimValue', () => {
    const result = evaluateFineGuardActivation(
      makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'low', claimValue: null }),
    );
    expect(result.activate).toBe(false);
    expect(result.reasons.highValue).toBe(false);
  });
});

describe('evaluateFineGuardActivation: determinism', () => {
  it('produces identical results for identical inputs', () => {
    const intake = makeIntake({
      sourceRef: 'PIE:24/AP/1234',
      urgency: 'high',
      claimValue: '£2,400,000',
    });
    const a = evaluateFineGuardActivation(intake);
    const b = evaluateFineGuardActivation(intake);
    expect(a).toEqual(b);
  });
});

describe('shouldActivateFineGuard', () => {
  it('returns true when activation rules are satisfied', () => {
    expect(
      shouldActivateFineGuard(makeIntake({ sourceRef: 'PIE:24/AP/1234', urgency: 'high' })),
    ).toBe(true);
  });

  it('returns false when activation rules are not satisfied', () => {
    expect(
      shouldActivateFineGuard(makeIntake({ sourceRef: null, urgency: 'high' })),
    ).toBe(false);
  });
});
