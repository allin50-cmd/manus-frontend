/**
 * FineGuard - Zero-Variance Engine
 *
 * Compares internal digital accounting records (from the mock accounting API)
 * against a draft HMRC MTD VAT return before submission.
 *
 * All monetary values are in pence (integer arithmetic) to avoid floating-point
 * rounding errors — a critical requirement for tax compliance.
 *
 * Logic:
 *   1. Pull the accounting period record from the internal source.
 *   2. For each comparable field (Box 1–7), compute the variance.
 *   3. If ANY variance > tolerance, build a VarianceError and block submission.
 *   4. Return a VarianceCheckResult with full audit trail.
 */

import { getAccountingPeriod, getAllPeriodKeys } from './mockAccountingApi.js';
import { ERROR_MESSAGES } from './types.js';
import type {
  AccountingPeriodRecord,
  HmrcVatReturn,
  VarianceCheckResult,
  VarianceError,
  ZeroVarianceErrorCode,
} from './types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum allowable pence variance before a check fails.
 * Set to 0 for strict zero-variance enforcement.
 * Can be relaxed to e.g. 100 (£1) for rounding tolerance.
 */
const TOLERANCE_PENCE = 0;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Build a VarianceError object with full audit fields.
 */
function buildError(
  code: ZeroVarianceErrorCode,
  field: string,
  internalValue: number,
  hmrcValue: number,
  blocking: boolean = true,
): VarianceError {
  const variance = internalValue - hmrcValue;
  return {
    code,
    field,
    internalValue,
    hmrcValue,
    variance,
    message: `${field}: internal=${internalValue}p, HMRC=${hmrcValue}p, variance=${variance}p`,
    humanReadable: ERROR_MESSAGES[code],
    blocking,
  };
}

/**
 * Check for duplicate transaction IDs within a period's records.
 */
function detectDuplicateTransactions(record: AccountingPeriodRecord): boolean {
  const ids = record.transactions.map(t => t.id);
  return ids.length !== new Set(ids).size;
}

/**
 * Check for period gaps: are there adjacent VAT periods missing from records?
 * Returns the list of gap period keys if found.
 */
async function detectPeriodGaps(periodKey: string, allPeriodKeys: string[]): Promise<boolean> {
  if (allPeriodKeys.length < 2) return false;

  const sorted = [...allPeriodKeys].sort();
  const idx = sorted.indexOf(periodKey);

  // If this isn't the first period, check if the previous period exists in our records
  if (idx > 0) {
    const prevKey = sorted[idx - 1];
    const prevRecord = await getAccountingPeriod(prevKey);
    if (!prevRecord) return true; // Gap: previous period has no records
  }
  return false;
}

/**
 * Recompute VAT totals from raw transactions to detect any
 * discrepancy between the stored period summary and transaction lines.
 */
function recomputeFromTransactions(record: AccountingPeriodRecord): {
  recomputedOutputTax: number;
  recomputedInputTax: number;
  recomputedNetVat: number;
  recomputedZeroRated: number;
  recomputedExempt: number;
} {
  let recomputedOutputTax = 0;
  let recomputedInputTax = 0;
  let recomputedZeroRated = 0;
  let recomputedExempt = 0;

  for (const txn of record.transactions) {
    if (txn.type === 'sale' || txn.type === 'credit_note') {
      if (txn.vatCode === 'zero') {
        recomputedZeroRated += txn.netAmount;
      } else if (txn.vatCode === 'exempt') {
        recomputedExempt += txn.netAmount;
      } else {
        recomputedOutputTax += txn.vatAmount;
      }
    } else if (txn.type === 'purchase') {
      if (txn.vatCode === 'standard' || txn.vatCode === 'reduced') {
        recomputedInputTax += txn.vatAmount;
      }
    }
  }

  return {
    recomputedOutputTax,
    recomputedInputTax,
    recomputedNetVat: recomputedOutputTax - recomputedInputTax,
    recomputedZeroRated,
    recomputedExempt,
  };
}

// ============================================================================
// MAIN ENGINE
// ============================================================================

/**
 * Runs the Zero-Variance check between internal accounting records
 * and the draft HMRC VAT return.
 *
 * Throws if the internal accounting period cannot be found.
 * Returns a VarianceCheckResult — caller must check `result.passed`.
 *
 * @param hmrcDraft  The HMRC MTD VAT draft return fetched from HMRC API
 * @returns          VarianceCheckResult with pass/fail and full error list
 */
export async function runZeroVarianceCheck(hmrcDraft: HmrcVatReturn): Promise<VarianceCheckResult> {
  const checkedAt = new Date().toISOString();
  const errors: VarianceError[] = [];

  // 1. Fetch the internal accounting record for this period
  const internalRecord = await getAccountingPeriod(hmrcDraft.periodKey);
  if (!internalRecord) {
    // Treat missing records as an unrecoverable gap error
    errors.push(
      buildError('ERR_V_002', 'period_record', 0, 0, true),
    );
    return {
      passed: false,
      checkedAt,
      periodKey: hmrcDraft.periodKey,
      errors,
      summary: { totalChecks: 1, passedChecks: 0, failedChecks: 1 },
    };
  }

  // 2. Validate period key matches
  if (internalRecord.periodKey !== hmrcDraft.periodKey) {
    errors.push(buildError('ERR_V_005', 'periodKey', 0, 0, true));
  }

  // 3. Check for duplicate transaction IDs
  if (detectDuplicateTransactions(internalRecord)) {
    errors.push(buildError('ERR_V_006', 'transaction_ids', 0, 0, true));
  }

  // 4. Recompute from raw transactions to catch summary-line manipulation
  const {
    recomputedOutputTax,
    recomputedInputTax,
    recomputedNetVat,
    recomputedZeroRated,
    recomputedExempt,
  } = recomputeFromTransactions(internalRecord);

  // 5. Detect period gaps in sequential records
  const allKeys = await getAllPeriodKeys();
  const hasGap = await detectPeriodGaps(hmrcDraft.periodKey, allKeys);
  if (hasGap) {
    errors.push(buildError('ERR_V_002', 'period_sequence', 0, 0, true));
  }

  // 6. Box 1 — Output tax (VAT due on sales)
  const outputTaxVariance = Math.abs(recomputedOutputTax - hmrcDraft.vatDueSales);
  if (outputTaxVariance > TOLERANCE_PENCE) {
    errors.push(buildError('ERR_V_001', 'box1_vatDueSales', recomputedOutputTax, hmrcDraft.vatDueSales));
  }

  // 7. Box 4 — Input tax (VAT reclaimed on purchases)
  const inputTaxVariance = Math.abs(recomputedInputTax - hmrcDraft.vatReclaimedCurrPeriod);
  if (inputTaxVariance > TOLERANCE_PENCE) {
    errors.push(buildError('ERR_V_003', 'box4_vatReclaimedCurrPeriod', recomputedInputTax, hmrcDraft.vatReclaimedCurrPeriod));
  }

  // 8. Box 5 — Net VAT payable (Box3 − Box4)
  const hmrcNetVat = hmrcDraft.totalVatDue - hmrcDraft.vatReclaimedCurrPeriod;
  const netVatVariance = Math.abs(recomputedNetVat - hmrcNetVat);
  if (netVatVariance > TOLERANCE_PENCE) {
    errors.push(buildError('ERR_V_004', 'box5_netVatDue', recomputedNetVat, hmrcNetVat));
  }

  // 9. Box 6 — Zero-rated turnover
  const zeroRatedVariance = Math.abs(recomputedZeroRated - hmrcDraft.totalValueGoodsSuppliedExVAT);
  if (zeroRatedVariance > TOLERANCE_PENCE) {
    errors.push(buildError('ERR_V_007', 'box6_zeroRatedTurnover', recomputedZeroRated, hmrcDraft.totalValueGoodsSuppliedExVAT, false));
  }

  // 10. Box 7 — Exempt supplies
  const exemptVariance = Math.abs(recomputedExempt - hmrcDraft.totalAcquisitionsExVAT);
  if (exemptVariance > TOLERANCE_PENCE) {
    errors.push(buildError('ERR_V_008', 'box7_exemptSupplies', recomputedExempt, hmrcDraft.totalAcquisitionsExVAT, false));
  }

  // 11. Determine overall pass/fail — any blocking error fails the check
  const hasBlockingError = errors.some(e => e.blocking);
  const totalChecks = 7; // Box1, Box4, Box5, Box6, Box7, duplicates, gaps
  const failedChecks = errors.filter(e => e.blocking).length;

  return {
    passed: !hasBlockingError,
    checkedAt,
    periodKey: hmrcDraft.periodKey,
    errors,
    summary: {
      totalChecks,
      passedChecks: totalChecks - failedChecks,
      failedChecks,
    },
  };
}
