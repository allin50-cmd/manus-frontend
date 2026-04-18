export type PlanId = 'free' | 'pro' | 'enterprise';

export type PlanLimits = {
  id: PlanId;
  label: string;
  priceGBP: number;
  companies: number;
  sms: boolean;
  fineEstimator: boolean;
  fineReimbursement: boolean;
};

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  free: {
    id: 'free',
    label: 'Free',
    priceGBP: 0,
    companies: 1,
    sms: false,
    fineEstimator: false,
    fineReimbursement: false,
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    priceGBP: 10,
    companies: 10,
    sms: true,
    fineEstimator: true,
    fineReimbursement: false,
  },
  enterprise: {
    id: 'enterprise',
    label: 'Enterprise',
    priceGBP: 0,
    companies: Number.POSITIVE_INFINITY,
    sms: true,
    fineEstimator: true,
    fineReimbursement: true,
  },
};

export function getPlan(plan: string | null | undefined): PlanLimits {
  const key = (plan ?? 'free').toLowerCase() as PlanId;
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.free;
}

export function canAddCompany(plan: string | null | undefined, currentCount: number): boolean {
  return currentCount < getPlan(plan).companies;
}
