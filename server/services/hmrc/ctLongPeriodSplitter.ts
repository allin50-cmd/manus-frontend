/**
 * FineGuard - Corporation Tax Long-Period Splitter
 *
 * UK Tax Law Requirement (CTA 2009 s.9 / HMRC CT600 Guide):
 *   A single CT600 return CANNOT cover more than 12 months.
 *   If a company's accounting period (as reported by Companies House) exceeds
 *   12 months, HMRC requires TWO separate CT600 returns:
 *     1. The first 12 months (period 1)
 *     2. The remaining days (period 2)
 *
 * Pro-rata logic:
 *   - Profit is split in proportion to the number of days in each period.
 *   - Capital allowances are allocated to Period 1 only (HMRC guidance).
 *   - Corporation Tax rates applied are those in force for each period's end date.
 *
 * Filing deadlines:
 *   - Each CT600 return must be filed within 12 months of its period end.
 *   - Tax payment is due 9 months and 1 day after the period end.
 */

import type { AccountingPeriod, CT600Return, LongPeriodSplitResult } from './types.js';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Maximum days allowed in a single CT600 accounting period (365 days) */
const MAX_CT_PERIOD_DAYS = 365;

/** UK Corporation Tax rates (Financial Year basis) */
const CT_RATES: { fromYear: number; rate: number }[] = [
  { fromYear: 2023, rate: 0.25 }, // Main rate from 1 Apr 2023
  { fromYear: 2022, rate: 0.19 }, // Flat rate FY2022 and earlier
  { fromYear: 0,    rate: 0.19 }, // Fallback
];

// ============================================================================
// HELPERS
// ============================================================================

/** Calculate number of days between two dates (inclusive of start, exclusive of end) */
function daysBetween(start: Date, end: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((end.getTime() - start.getTime()) / msPerDay);
}

/** Add a specified number of days to a date and return a new Date */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/** Subtract one day from a date */
function subtractOneDay(date: Date): Date {
  return addDays(date, -1);
}

/** Format a Date as ISO 8601 date string (YYYY-MM-DD) */
function toISODate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/** Get the CT rate applicable for a given period end date */
function getCTRate(periodEnd: Date): number {
  const year = periodEnd.getUTCFullYear();
  // Find the highest applicable rate for the year
  const applicable = CT_RATES
    .filter(r => r.fromYear <= year)
    .sort((a, b) => b.fromYear - a.fromYear);
  return applicable[0]?.rate ?? 0.25;
}

/**
 * Calculate the Corporation Tax filing deadline:
 * 12 months after the accounting period end date.
 */
function filingDeadline(periodEnd: Date): string {
  const deadline = new Date(periodEnd);
  deadline.setUTCFullYear(deadline.getUTCFullYear() + 1);
  return toISODate(deadline);
}

/**
 * Calculate the Corporation Tax payment deadline:
 * 9 months and 1 day after the accounting period end date.
 */
function paymentDeadline(periodEnd: Date): string {
  const deadline = new Date(periodEnd);
  deadline.setUTCMonth(deadline.getUTCMonth() + 9);
  deadline.setUTCDate(deadline.getUTCDate() + 1);
  return toISODate(deadline);
}

/** Generate a human-readable CT600 return reference */
function generateReturnRef(companyNumber: string, periodEnd: string, splitIndex: 1 | 2): string {
  const datePart = periodEnd.replace(/-/g, '');
  return `CT600-${companyNumber}-${datePart}-P${splitIndex}`;
}

// ============================================================================
// CORE SPLITTER
// ============================================================================

/**
 * Build a CT600Return object for a given period slice.
 *
 * @param period       The original full accounting period
 * @param start        Start date of this CT600 slice
 * @param end          End date of this CT600 slice
 * @param totalDays    Total days across the original accounting period
 * @param splitIndex   1 for first return (≤12 months), 2 for remainder
 * @param isFirst12    Whether this slice receives the capital allowances
 */
function buildCT600(
  period: AccountingPeriod,
  start: Date,
  end: Date,
  totalDays: number,
  splitIndex: 1 | 2,
  isFirst12: boolean,
): CT600Return {
  const sliceDays = daysBetween(start, addDays(end, 1)); // Inclusive days

  // Pro-rata profit allocation (HMRC basis: proportional to days)
  const profitRatio = sliceDays / totalDays;
  const proRatedProfit = Math.round(period.taxableProfit * profitRatio);

  // Capital allowances allocated entirely to Period 1 per HMRC CT600 guidance
  const allocatedCapAllowances = isFirst12 ? period.capitalAllowances : 0;

  // Adjustments pro-rated like profit
  const proRatedAdjustments = Math.round(period.adjustments * profitRatio);

  const adjustedProfit = Math.max(0, proRatedProfit + proRatedAdjustments - allocatedCapAllowances);

  const rate = getCTRate(end);
  const taxDue = Math.round(adjustedProfit * rate);

  return {
    periodStart: toISODate(start),
    periodEnd: toISODate(end),
    periodLengthDays: sliceDays,
    taxableProfit: adjustedProfit,
    corporationTaxRate: rate,
    taxDue,
    capitalAllowances: allocatedCapAllowances,
    filingDeadline: filingDeadline(end),
    paymentDeadline: paymentDeadline(end),
    returnReference: generateReturnRef(period.companyNumber, toISODate(end), splitIndex),
    isLongPeriodSplit: true,
    splitIndex,
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Detects whether an accounting period exceeds 12 months and, if so,
 * programmatically splits it into two HMRC-compliant CT600 returns.
 *
 * Implements HMRC rule: s.10 CTA 2009 — no CT accounting period may exceed 12 months.
 *
 * @param period  The accounting period from Companies House / internal records
 * @returns       LongPeriodSplitResult containing 1 or 2 CT600 return objects
 */
export function splitCTLongPeriod(period: AccountingPeriod): LongPeriodSplitResult {
  const start = new Date(period.periodStart + 'T00:00:00Z');
  const end = new Date(period.periodEnd + 'T00:00:00Z');
  const totalDays = daysBetween(start, addDays(end, 1)); // Inclusive

  // Check if the period exceeds the maximum (365 days)
  if (totalDays <= MAX_CT_PERIOD_DAYS) {
    // No split required — build a single standard CT600
    const rate = getCTRate(end);
    const adjustedProfit = Math.max(0, period.taxableProfit + period.adjustments - period.capitalAllowances);
    const taxDue = Math.round(adjustedProfit * rate);

    const singleReturn: CT600Return = {
      periodStart: period.periodStart,
      periodEnd: period.periodEnd,
      periodLengthDays: totalDays,
      taxableProfit: adjustedProfit,
      corporationTaxRate: rate,
      taxDue,
      capitalAllowances: period.capitalAllowances,
      filingDeadline: filingDeadline(end),
      paymentDeadline: paymentDeadline(end),
      returnReference: generateReturnRef(period.companyNumber, period.periodEnd, 1),
      isLongPeriodSplit: false,
    };

    return {
      originalPeriod: period,
      requiresSplit: false,
      returns: [singleReturn],
    };
  }

  // SPLIT REQUIRED
  // Period 1: exactly the first 12 months (365 days)
  const period1End = subtractOneDay(addDays(start, MAX_CT_PERIOD_DAYS));
  // Period 2: the remainder (day 366 onwards to original period end)
  const period2Start = addDays(start, MAX_CT_PERIOD_DAYS);

  const ct600Period1 = buildCT600(period, start, period1End, totalDays, 1, true);
  const ct600Period2 = buildCT600(period, period2Start, end, totalDays, 2, false);

  return {
    originalPeriod: period,
    requiresSplit: true,
    returns: [ct600Period1, ct600Period2],
    splitReason: `Accounting period of ${totalDays} days exceeds the 365-day HMRC maximum. ` +
      `Split into CT600 Period 1 (${ct600Period1.periodLengthDays} days, ending ${ct600Period1.periodEnd}) ` +
      `and CT600 Period 2 (${ct600Period2.periodLengthDays} days, ending ${ct600Period2.periodEnd}).`,
  };
}
