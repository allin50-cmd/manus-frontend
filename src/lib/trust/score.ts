import type { Company } from '@/types/company';

export type TrustLevel = 'verified' | 'caution' | 'high-risk' | 'unverified';

export interface TrustScore {
  level: TrustLevel;
  label: string;
  tagline: string;
}

const INACTIVE_STATUSES = new Set(['dissolved', 'liquidation', 'receivership', 'administration']);

/**
 * Derives a FineGuard trust level from a Company's live compliance data.
 *
 * verified   — active company, fully compliant, no overdue filings
 * caution    — active but a deadline is approaching or there is a minor risk
 * high-risk  — overdue filings present or risk level is high
 * unverified — company is not active (dissolved, in liquidation, etc.)
 */
export function computeTrustScore(company: Company): TrustScore {
  const { status, compliance } = company;

  if (INACTIVE_STATUSES.has(status.toLowerCase())) {
    return { level: 'unverified', label: 'Not Active', tagline: 'Company is no longer trading' };
  }

  if (
    compliance.status === 'overdue' ||
    compliance.riskLevel === 'high' ||
    compliance.overdueFilings.length > 0
  ) {
    return {
      level: 'high-risk',
      label: 'Compliance Risk',
      tagline: 'Active filing issues — not recommended',
    };
  }

  if (compliance.status === 'warning' || compliance.riskLevel === 'medium') {
    return {
      level: 'caution',
      label: 'Caution',
      tagline: 'Deadlines approaching — monitor closely',
    };
  }

  // Active + compliant = verified
  return {
    level: 'verified',
    label: 'FineGuard Verified',
    tagline: 'Safe to do business',
  };
}
