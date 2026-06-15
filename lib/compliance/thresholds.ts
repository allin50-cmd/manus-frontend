export const FILING_THRESHOLDS: Record<string, number> = {
  ANNUAL_ACCOUNTS: 60,
  CONFIRMATION_STATEMENT: 30,
  VAT_RETURN: 14,
  CORPORATION_TAX_RETURN: 30,
  PAYE_RTI: 7,
  CONTRACT_RENEWAL: 60,
  DEFAULT: 14,
}

export function getThreshold(category: string): number {
  return FILING_THRESHOLDS[category] ?? FILING_THRESHOLDS.DEFAULT
}

export const FILING_CATEGORY_LABELS: Record<string, string> = {
  CONFIRMATION_STATEMENT: 'Confirmation Statement',
  ANNUAL_ACCOUNTS: 'Annual Accounts',
  VAT_RETURN: 'VAT Return',
  CORPORATION_TAX_RETURN: 'Corporation Tax Return',
  PAYE_RTI: 'PAYE RTI',
  COMPANIES_HOUSE_CHANGE: 'Companies House Change',
  INSURANCE_RENEWAL: 'Insurance Renewal',
  CONTRACT_RENEWAL: 'Contract Renewal',
  REGULATORY_REPORT: 'Regulatory Report',
  OTHER: 'Other',
}
