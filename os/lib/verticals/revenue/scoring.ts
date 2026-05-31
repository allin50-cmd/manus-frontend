export type SizeTier = '1-10' | '10-30' | '30-70' | '70+';
export type PainPoint = 'unbilled_work' | 'manual_admin' | 'slow_billing' | string;
export type BillingSystem = 'MLC' | 'Opus2' | 'BarBooks' | 'Other' | string;

export interface ScoringInput {
  system?: BillingSystem;
  sizeTier: SizeTier;
  painPoints: PainPoint[];
}

export interface ScoringResult {
  estimatedLeak: { low: number; high: number };
  riskLevel: 'Low' | 'Moderate' | 'High';
  confidence: number;
  drivers: string[];
  score: number;
}

const BASE_LEAKAGE: Record<SizeTier, [number, number]> = {
  '1-10': [1200, 4000],
  '10-30': [4200, 12000],
  '30-70': [12000, 35000],
  '70+': [30000, 80000],
};

const PAIN_MULTIPLIERS: Record<string, number> = {
  unbilled_work: 0.25,
  manual_admin: 0.15,
  slow_billing: 0.2,
};

const SYSTEM_MULTIPLIERS: Record<string, number> = {
  MLC: 1.1,
  Opus2: 1.0,
  BarBooks: 1.15,
  Other: 1.25,
};

const DEFAULT_SYSTEM_MULTIPLIER = 1.2;

export function scoreRevenueAudit(input: ScoringInput): ScoringResult {
  const base = BASE_LEAKAGE[input.sizeTier] ?? BASE_LEAKAGE['10-30'];
  const systemMult = SYSTEM_MULTIPLIERS[input.system ?? 'Other'] ?? DEFAULT_SYSTEM_MULTIPLIER;

  const painMult =
    1 +
    input.painPoints.reduce((sum, p) => sum + (PAIN_MULTIPLIERS[p] ?? 0), 0);

  const low = Math.round(base[0] * systemMult * painMult);
  const high = Math.round(base[1] * systemMult * painMult);

  const riskScore =
    input.painPoints.length * 15 +
    (input.painPoints.includes('unbilled_work') ? 25 : 0);

  const riskLevel: ScoringResult['riskLevel'] =
    riskScore >= 55 ? 'High' : riskScore >= 30 ? 'Moderate' : 'Low';

  const drivers: string[] = [];
  if (input.painPoints.includes('unbilled_work'))
    drivers.push('Unbilled work detected — primary leak driver');
  if (input.painPoints.includes('manual_admin'))
    drivers.push('Manual admin overhead inflating WIP');
  if (input.painPoints.includes('slow_billing'))
    drivers.push('Billing lag compounding cashflow risk');
  if (systemMult > 1.2) drivers.push(`Non-specialist system amplifies leakage (${input.system || 'unspecified'})`);
  if (drivers.length === 0) drivers.push('Structural leakage from baseline benchmarks');

  const confidence = Math.min(0.95, 0.6 + input.painPoints.length * 0.08);

  return {
    estimatedLeak: { low, high },
    riskLevel,
    confidence: Number(confidence.toFixed(2)),
    drivers,
    score: Math.min(100, riskScore),
  };
}
