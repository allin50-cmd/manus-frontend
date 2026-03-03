/**
 * FineGuard - Mock Accounting API
 *
 * Simulates an internal cloud accounting system (e.g. Xero, QuickBooks)
 * that FineGuard connects to via its data ingestion layer.
 * Returns deterministic test data keyed by period and company number.
 */

import type { AccountingPeriodRecord, Transaction, AccountingPeriod } from './types.js';

// ============================================================================
// MOCK TRANSACTION GENERATOR
// ============================================================================

function buildTransaction(
  id: string,
  date: string,
  type: Transaction['type'],
  netAmount: number,
  vatRate: number,
  invoiceRef: string,
  description: string,
  vatCode: Transaction['vatCode'] = 'standard',
): Transaction {
  return {
    id,
    date,
    type,
    netAmount,
    vatAmount: Math.round(netAmount * vatRate),
    vatRate,
    vatCode,
    invoiceRef,
    description,
  };
}

// ============================================================================
// PERIOD RECORD STORE (Keyed by periodKey)
// ============================================================================

const MOCK_PERIODS: Record<string, AccountingPeriodRecord> = {
  // Standard quarter – fully reconciled (will PASS zero-variance checks)
  '24AA': {
    periodKey: '24AA',
    periodStart: '2024-01-01',
    periodEnd: '2024-03-31',
    transactions: [
      buildTransaction('TXN-001', '2024-01-15', 'sale', 10000_00, 0.20, 'INV-2024-001', 'Software licence Q1', 'standard'),
      buildTransaction('TXN-002', '2024-01-22', 'sale', 5000_00, 0.20, 'INV-2024-002', 'Consulting services Jan', 'standard'),
      buildTransaction('TXN-003', '2024-02-10', 'sale', 2000_00, 0.00, 'INV-2024-003', 'Exported services (zero-rated)', 'zero'),
      buildTransaction('TXN-004', '2024-02-28', 'purchase', 3000_00, 0.20, 'BILL-2024-001', 'Office supplies', 'standard'),
      buildTransaction('TXN-005', '2024-03-15', 'purchase', 1500_00, 0.20, 'BILL-2024-002', 'Cloud hosting Q1', 'standard'),
      buildTransaction('TXN-006', '2024-03-28', 'sale', 8000_00, 0.20, 'INV-2024-004', 'Retainer fee Mar', 'standard'),
    ],
    // Computed totals
    totalOutputTax: Math.round((10000_00 + 5000_00 + 8000_00) * 0.20), // £4,600.00
    totalInputTax: Math.round((3000_00 + 1500_00) * 0.20),            // £900.00
    netVatPayable: Math.round((10000_00 + 5000_00 + 8000_00) * 0.20) - Math.round((3000_00 + 1500_00) * 0.20), // £3,700.00
    zeroRatedTurnover: 2000_00,
    exemptSupplies: 0,
    totalSales: 10000_00 + 5000_00 + 2000_00 + 8000_00,
    totalPurchases: 3000_00 + 1500_00,
  },

  // Quarter with a gap (missing TXN – will FAIL ERR_V_002)
  '24AB': {
    periodKey: '24AB',
    periodStart: '2024-04-01',
    periodEnd: '2024-06-30',
    transactions: [
      buildTransaction('TXN-010', '2024-04-05', 'sale', 12000_00, 0.20, 'INV-2024-010', 'April retainer', 'standard'),
      // Intentional gap: INV-2024-011 (£5,000) exists in source system but not brought across
      buildTransaction('TXN-012', '2024-05-20', 'sale', 7500_00, 0.20, 'INV-2024-012', 'May project delivery', 'standard'),
      buildTransaction('TXN-013', '2024-05-31', 'purchase', 2000_00, 0.20, 'BILL-2024-010', 'Travel Q2', 'standard'),
      buildTransaction('TXN-014', '2024-06-15', 'purchase', 500_00, 0.20, 'BILL-2024-011', 'Stationery', 'standard'),
    ],
    // NOTE: These totals EXCLUDE the missing £5,000 sale → creates mismatch with HMRC draft
    totalOutputTax: Math.round((12000_00 + 7500_00) * 0.20), // £3,900 (missing TXN-011 £1,000 VAT)
    totalInputTax: Math.round((2000_00 + 500_00) * 0.20),    // £500
    netVatPayable: Math.round((12000_00 + 7500_00) * 0.20) - Math.round((2000_00 + 500_00) * 0.20),
    zeroRatedTurnover: 0,
    exemptSupplies: 0,
    totalSales: 12000_00 + 7500_00,
    totalPurchases: 2000_00 + 500_00,
  },
};

// ============================================================================
// MOCK CT ACCOUNTING PERIODS
// ============================================================================

const MOCK_CT_PERIODS: Record<string, AccountingPeriod> = {
  // Standard 12-month period (no split needed)
  'CT-12M': {
    companyNumber: '12345678',
    companyName: 'Acme Digital Ltd',
    periodStart: '2023-01-01',
    periodEnd: '2023-12-31',
    taxableProfit: 250000_00, // £250,000
    capitalAllowances: 15000_00,
    adjustments: 0,
  },

  // Long period – 18 months (REQUIRES split into two CT600s)
  'CT-18M': {
    companyNumber: '12345678',
    companyName: 'Acme Digital Ltd',
    periodStart: '2022-07-01',
    periodEnd: '2024-01-31', // 18 months + 31 days
    taxableProfit: 375000_00, // £375,000 over the full period
    capitalAllowances: 22500_00,
    adjustments: -5000_00,
  },

  // Long period – 14 months (marginal case)
  'CT-14M': {
    companyNumber: '87654321',
    companyName: 'StartUp Ventures Ltd',
    periodStart: '2023-03-01',
    periodEnd: '2024-04-30', // 14 months exactly
    taxableProfit: 180000_00,
    capitalAllowances: 8000_00,
    adjustments: 0,
  },
};

// ============================================================================
// COMPLIANCE SCORE MOCK DATA
// ============================================================================

export interface MockComplianceData {
  companyNumber: string;
  timeliness: number;
  accuracy: number;
  completeness: number;
  risk: number;
  previousScore?: number;
}

const MOCK_COMPLIANCE_DATA: Record<string, MockComplianceData> = {
  '12345678': {
    companyNumber: '12345678',
    timeliness: 88, // Filed on time for 88% of periods
    accuracy: 95,   // 95% accuracy (minor rounding issues)
    completeness: 100,
    risk: 15,       // Low risk (inverts to 85 for scoring)
    previousScore: 87.3,
  },
  '87654321': {
    companyNumber: '87654321',
    timeliness: 60,  // Two late filings in 12 months
    accuracy: 70,    // Several amended returns
    completeness: 85,
    risk: 45,        // Medium risk
    previousScore: 72.1,
  },
  'DEFAULT': {
    companyNumber: 'DEFAULT',
    timeliness: 75,
    accuracy: 80,
    completeness: 90,
    risk: 25,
    previousScore: 78.5,
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Retrieves accounting period data for a given VAT period key.
 * Simulates calling an internal accounting API.
 */
export async function getAccountingPeriod(periodKey: string): Promise<AccountingPeriodRecord | null> {
  // Simulate async API call latency
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_PERIODS[periodKey] ?? null;
}

/**
 * Retrieves all accounting periods for sequential integrity checks.
 */
export async function getAllPeriodKeys(): Promise<string[]> {
  await new Promise(resolve => setTimeout(resolve, 20));
  return Object.keys(MOCK_PERIODS).sort();
}

/**
 * Retrieves Corporation Tax accounting period data.
 */
export async function getCTPeriod(periodRef: string): Promise<AccountingPeriod | null> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return MOCK_CT_PERIODS[periodRef] ?? null;
}

/**
 * Retrieves compliance scoring data for a company.
 */
export async function getComplianceData(companyNumber: string): Promise<MockComplianceData> {
  await new Promise(resolve => setTimeout(resolve, 30));
  return MOCK_COMPLIANCE_DATA[companyNumber] ?? MOCK_COMPLIANCE_DATA['DEFAULT'];
}
