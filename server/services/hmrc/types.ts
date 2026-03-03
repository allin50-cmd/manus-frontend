/**
 * FineGuard HMRC Integration - Shared Types
 *
 * Core type definitions for the FineGuard compliance engine,
 * covering MTD VAT, Corporation Tax, and Self-Assessment modules.
 */

// ============================================================================
// ERROR CODES
// ============================================================================

export type ZeroVarianceErrorCode =
  | 'ERR_V_001' // Output tax mismatch
  | 'ERR_V_002' // Transaction gap detected (missing records)
  | 'ERR_V_003' // Input tax (reclaims) mismatch
  | 'ERR_V_004' // Net VAT payable mismatch
  | 'ERR_V_005' // Period mismatch (return period does not match records)
  | 'ERR_V_006' // Duplicate transaction IDs detected
  | 'ERR_V_007' // Zero-rated turnover variance
  | 'ERR_V_008' // Exempt supplies variance
  | 'ERR_CT_001' // CT600 period exceeds 12 months
  | 'ERR_CT_002' // Profit figure mismatch
  | 'ERR_CT_003' // Capital allowances discrepancy
  | 'ERR_SA_001' // Self-Assessment income mismatch
  | 'ERR_DUP_001'; // Duplicate submission detected (idempotency block)

export const ERROR_MESSAGES: Record<ZeroVarianceErrorCode, string> = {
  ERR_V_001:
    'Output tax variance detected. Your VAT records show a different amount of tax collected from customers than declared on this return. Please review Box 1 of your VAT return against your sales ledger.',
  ERR_V_002:
    'Transaction gap identified. One or more transactions in your accounting records are missing from this return period. This may indicate missing invoices or an incorrect period selection. Please reconcile your records before submitting.',
  ERR_V_003:
    'Input tax reclaims mismatch. The VAT you are reclaiming on purchases does not match your accounting records. Please verify all supplier invoices are correctly recorded in Box 4.',
  ERR_V_004:
    'Net VAT payable discrepancy. The net amount due (Box 5) does not match the calculated difference between your output and input tax. Submission has been blocked to protect you from an incorrect payment.',
  ERR_V_005:
    'Return period mismatch. The dates on this HMRC draft return do not align with your internal accounting period. Please ensure you are submitting for the correct quarter.',
  ERR_V_006:
    'Duplicate transaction references detected. One or more transaction IDs appear more than once in your records, which may indicate double-counting. Please review and remove duplicates before proceeding.',
  ERR_V_007:
    'Zero-rated turnover variance. The zero-rated supplies figure declared does not match your records. Please check Box 6 against your zero-rated sales journal.',
  ERR_V_008:
    'Exempt supplies variance. The exempt supplies figure does not reconcile with your internal records. Please review your VAT exempt sales before submission.',
  ERR_CT_001:
    'Corporation Tax period exceeds 12 months. HMRC requires that no single CT600 return covers more than 12 months. This period has been automatically split into two compliant returns for your review.',
  ERR_CT_002:
    'Profit figure mismatch. The taxable profit declared on the CT600 does not match the profit extracted from your accounting records. Please verify your financial statements.',
  ERR_CT_003:
    'Capital allowances discrepancy. The capital allowances claimed do not match the asset register in your accounting records. Please review your fixed asset schedule.',
  ERR_SA_001:
    'Self-Assessment income mismatch. The total income declared does not reconcile with your accounting records. Please review all income sources before submission.',
  ERR_DUP_001:
    'Duplicate submission blocked. A filing with an identical idempotency key has already been received by HMRC. This is a safety measure to prevent double-filing during network timeouts. No action is required.',
};

// ============================================================================
// ACCOUNTING / TRANSACTION RECORDS
// ============================================================================

export interface Transaction {
  id: string;
  date: string; // ISO 8601
  type: 'sale' | 'purchase' | 'adjustment' | 'credit_note';
  netAmount: number; // In pence (GBP)
  vatAmount: number; // In pence
  vatRate: number; // 0.20, 0.05, 0.00
  vatCode: 'standard' | 'reduced' | 'zero' | 'exempt' | 'outside_scope';
  supplierId?: string;
  customerId?: string;
  invoiceRef: string;
  description: string;
}

export interface AccountingPeriodRecord {
  periodKey: string; // e.g. "24AA" - matches HMRC period key format
  periodStart: string; // ISO 8601 date
  periodEnd: string; // ISO 8601 date
  transactions: Transaction[];
  totalOutputTax: number; // Box 1 (pence)
  totalInputTax: number; // Box 4 (pence)
  netVatPayable: number; // Box 5 (pence) = Box1 - Box4
  zeroRatedTurnover: number; // Box 6 (pence)
  exemptSupplies: number; // Box 7 (pence)
  totalSales: number; // Box 6 (pence) - total value of sales
  totalPurchases: number; // Box 7 (pence) - total value of purchases
}

// ============================================================================
// HMRC MTD VAT RETURN
// ============================================================================

export interface HmrcVatReturn {
  periodKey: string;
  vatDueSales: number; // Box 1 (pence)
  vatDueAcquisitions: number; // Box 2
  totalVatDue: number; // Box 3 = Box1 + Box2
  vatReclaimedCurrPeriod: number; // Box 4
  netVatDue: number; // Box 5 = Box3 - Box4
  totalValueSalesExVAT: number; // Box 6
  totalValuePurchasesExVAT: number; // Box 7
  totalValueGoodsSuppliedExVAT: number; // Box 8
  totalAcquisitionsExVAT: number; // Box 9
  finalised: boolean;
}

// ============================================================================
// ZERO-VARIANCE ENGINE
// ============================================================================

export interface VarianceCheckResult {
  passed: boolean;
  checkedAt: string; // ISO 8601
  periodKey: string;
  errors: VarianceError[];
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

export interface VarianceError {
  code: ZeroVarianceErrorCode;
  field: string;
  internalValue: number;
  hmrcValue: number;
  variance: number; // Difference in pence
  message: string;
  humanReadable: string;
  blocking: boolean;
}

// ============================================================================
// COMPLIANCE SCORE
// ============================================================================

export interface ComplianceScoreInput {
  timeliness: number; // 0-100
  accuracy: number; // 0-100
  completeness: number; // 0-100
  risk: number; // 0-100 (higher = MORE risk = LOWER score contribution)
}

export interface ComplianceScoreResult {
  score: number; // 0-100 weighted composite
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: ComplianceScoreInput & {
    timelinessWeighted: number;
    accuracyWeighted: number;
    completenessWeighted: number;
    riskWeighted: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  calculatedAt: string;
}

// ============================================================================
// CORPORATION TAX (CT600)
// ============================================================================

export interface AccountingPeriod {
  companyNumber: string;
  companyName: string;
  periodStart: string; // ISO 8601 date
  periodEnd: string; // ISO 8601 date
  taxableProfit: number; // In pence
  capitalAllowances: number; // In pence
  adjustments: number; // In pence
}

export interface CT600Return {
  periodStart: string;
  periodEnd: string;
  periodLengthDays: number;
  taxableProfit: number; // Pro-rated (pence)
  corporationTaxRate: number; // e.g. 0.25
  taxDue: number; // In pence
  capitalAllowances: number; // Pro-rated (pence)
  filingDeadline: string; // ISO 8601 date (9 months + 1 day after period end)
  paymentDeadline: string; // ISO 8601 date (9 months + 1 day after period end)
  returnReference: string;
  isLongPeriodSplit: boolean;
  splitIndex?: 1 | 2; // 1 = first 12 months, 2 = remainder
}

export interface LongPeriodSplitResult {
  originalPeriod: AccountingPeriod;
  requiresSplit: boolean;
  returns: CT600Return[];
  splitReason?: string;
}

// ============================================================================
// HMRC IDEMPOTENCY
// ============================================================================

export interface IdempotencyRecord {
  key: string; // UUID v4
  endpoint: string;
  payload: Record<string, unknown>;
  status: 'pending' | 'submitted' | 'failed' | 'duplicate_blocked';
  hmrcCorrelationId?: string;
  submittedAt?: string;
  createdAt: string;
  expiresAt: string; // 24 hours after creation
}

export interface SubmissionResult {
  success: boolean;
  idempotencyKey: string;
  isDuplicate: boolean;
  hmrcCorrelationId?: string;
  processingDate?: string;
  paymentIndicator?: 'DEBIT' | 'CREDIT' | 'NONE';
  formBundleNumber?: string;
  message: string;
  errorCode?: ZeroVarianceErrorCode;
}

// ============================================================================
// COMPLIANCE HEALTH PANEL
// ============================================================================

export type ModuleStatus = 'compliant' | 'warning' | 'action_required' | 'overdue' | 'not_configured';

export interface ModuleHealth {
  moduleId: 'mtd_vat' | 'corporation_tax' | 'self_assessment' | 'companies_house';
  displayName: string;
  status: ModuleStatus;
  score: number; // 0-100
  nextDeadline?: {
    description: string;
    dueDate: string;
    daysUntilDue: number;
  };
  lastAction?: {
    description: string;
    date: string;
  };
  alerts: Array<{
    severity: 'info' | 'warning' | 'critical';
    message: string;
    errorCode?: string;
  }>;
  lastChecked: string;
}

export interface ComplianceHealthPanel {
  companyNumber: string;
  companyName: string;
  overallScore: number;
  overallStatus: ModuleStatus;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  modules: ModuleHealth[];
  estimatedPenaltyExposure: number; // In pence
  generatedAt: string;
  nextReviewDate: string;
}
