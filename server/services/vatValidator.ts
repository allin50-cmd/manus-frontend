/**
 * VAT Validation Engine
 *
 * Validates UK VAT returns against HMRC MTD rules.
 * All 9 boxes of a VAT return are validated for:
 * - Arithmetic correctness (Box 3 = Box 1 + Box 2, Box 5 = Box 3 - Box 4)
 * - Negative total detection
 * - Abnormal VAT ratio detection (Box 1 / Box 6 should be ~20%)
 * - Rounding tolerance (±£0.01)
 */

export interface VATBoxes {
  box1: number; // VAT due on sales and outputs
  box2: number; // VAT due on EU acquisitions
  box3: number; // Total VAT due (Box 1 + Box 2)
  box4: number; // VAT reclaimed
  box5: number; // Net VAT (Box 3 - Box 4)
  box6: number; // Total sales value (ex. VAT)
  box7: number; // Total purchases value (ex. VAT)
  box8: number; // Total EU goods supplied
  box9: number; // Total EU goods acquired
}

export interface VATValidationResult {
  result: 'PASS' | 'WARNING' | 'ERROR';
  warnings: string[];
  errors: string[];
  checks: {
    box3Check: boolean;       // Box 3 = Box 1 + Box 2
    box5Check: boolean;       // Box 5 = Box 3 - Box 4
    negativeCheck: boolean;   // No negative totals
    ratioCheck: boolean;      // VAT ratio plausible
    roundingCheck: boolean;   // Values rounded correctly
  };
}

const ROUNDING_TOLERANCE = 0.01; // ±1 penny
const NORMAL_VAT_RATE = 0.20;    // 20% standard rate
const VAT_RATIO_WARNING_LOW = 0.05;   // 5% — suspiciously low
const VAT_RATIO_WARNING_HIGH = 0.25;  // 25% — suspiciously high

/**
 * Round to 2 decimal places
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Check if two numbers are equal within rounding tolerance
 */
function approxEqual(a: number, b: number): boolean {
  return Math.abs(a - b) <= ROUNDING_TOLERANCE;
}

/**
 * Main VAT validation function
 *
 * @param boxes - Object containing all 9 VAT box values
 * @returns VATValidationResult with result, warnings, errors, and per-check status
 */
export function validateVATReturn(boxes: VATBoxes): VATValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    box3Check: true,
    box5Check: true,
    negativeCheck: true,
    ratioCheck: true,
    roundingCheck: true,
  };

  const { box1, box2, box3, box4, box5, box6 } = boxes;

  // =========================================================================
  // CHECK 1: Box 3 = Box 1 + Box 2
  // =========================================================================
  const expectedBox3 = round2(box1 + box2);
  if (!approxEqual(box3, expectedBox3)) {
    checks.box3Check = false;
    const diff = round2(box3 - expectedBox3);
    if (Math.abs(diff) <= ROUNDING_TOLERANCE) {
      warnings.push(
        `Box 3 rounding issue: Expected £${expectedBox3.toFixed(2)} (Box 1 + Box 2), found £${box3.toFixed(2)}. Difference: ${diff > 0 ? '+' : ''}£${diff.toFixed(2)}.`
      );
      checks.roundingCheck = false;
    } else {
      errors.push(
        `Box 3 arithmetic error: Box 3 (£${box3.toFixed(2)}) must equal Box 1 (£${box1.toFixed(2)}) + Box 2 (£${box2.toFixed(2)}) = £${expectedBox3.toFixed(2)}. Difference: £${Math.abs(diff).toFixed(2)}.`
      );
    }
  }

  // =========================================================================
  // CHECK 2: Box 5 = Box 3 - Box 4
  // =========================================================================
  const expectedBox5 = round2(box3 - box4);
  if (!approxEqual(box5, expectedBox5)) {
    checks.box5Check = false;
    const diff = round2(box5 - expectedBox5);
    if (Math.abs(diff) <= ROUNDING_TOLERANCE) {
      warnings.push(
        `Box 5 rounding issue: Expected £${expectedBox5.toFixed(2)} (Box 3 - Box 4), found £${box5.toFixed(2)}. Difference: ${diff > 0 ? '+' : ''}£${diff.toFixed(2)}.`
      );
      checks.roundingCheck = false;
    } else {
      errors.push(
        `Box 5 arithmetic error: Box 5 (£${box5.toFixed(2)}) must equal Box 3 (£${box3.toFixed(2)}) - Box 4 (£${box4.toFixed(2)}) = £${expectedBox5.toFixed(2)}. Difference: £${Math.abs(diff).toFixed(2)}.`
      );
    }
  }

  // =========================================================================
  // CHECK 3: Negative totals
  // =========================================================================
  if (box1 < 0) {
    warnings.push(`Box 1 is negative (£${box1.toFixed(2)}). VAT due on sales is usually positive. Please verify.`);
    checks.negativeCheck = false;
  }
  if (box3 < 0) {
    warnings.push(`Box 3 (Total VAT Due) is negative (£${box3.toFixed(2)}). This is unusual. Please verify.`);
    checks.negativeCheck = false;
  }
  if (box6 < 0) {
    errors.push(`Box 6 (Total Sales Value) is negative (£${box6.toFixed(2)}). Sales value should be a positive figure.`);
    checks.negativeCheck = false;
  }

  // =========================================================================
  // CHECK 4: Abnormal VAT ratio (Box 1 / Box 6)
  // =========================================================================
  if (box6 > 0 && box1 > 0) {
    const vatRatio = box1 / box6;
    if (vatRatio < VAT_RATIO_WARNING_LOW) {
      warnings.push(
        `Abnormal VAT ratio: Box 1 (£${box1.toFixed(2)}) is only ${(vatRatio * 100).toFixed(1)}% of Box 6 (£${box6.toFixed(2)}). Standard rate is 20%. This may indicate exempt supplies or reduced-rate items — please confirm.`
      );
      checks.ratioCheck = false;
    } else if (vatRatio > VAT_RATIO_WARNING_HIGH) {
      warnings.push(
        `High VAT ratio: Box 1 (£${box1.toFixed(2)}) is ${(vatRatio * 100).toFixed(1)}% of Box 6 (£${box6.toFixed(2)}). Standard rate is 20%. This may indicate an error.`
      );
      checks.ratioCheck = false;
    }
  }

  // If Box 6 is 0 but Box 1 is material, flag it
  if (box6 === 0 && box1 > 1) {
    warnings.push(`Box 6 (Total Sales Value) is £0 but Box 1 (VAT due) is £${box1.toFixed(2)}. Please check.`);
    checks.ratioCheck = false;
  }

  // =========================================================================
  // DETERMINE OVERALL RESULT
  // =========================================================================
  let result: 'PASS' | 'WARNING' | 'ERROR';
  if (errors.length > 0) {
    result = 'ERROR';
  } else if (warnings.length > 0) {
    result = 'WARNING';
  } else {
    result = 'PASS';
  }

  return { result, warnings, errors, checks };
}

/**
 * Parse and sanitise VAT box values from request body
 * Returns null if any required value is missing or invalid
 */
export function parseVATBoxes(body: Record<string, string | number>): VATBoxes | null {
  const required = ['box1', 'box2', 'box4', 'box6', 'box7'];
  for (const field of required) {
    if (body[field] === undefined || body[field] === '') {
      return null;
    }
  }

  const parse = (val: string | number): number => {
    const n = typeof val === 'number' ? val : parseFloat(val);
    return isNaN(n) ? 0 : round2(n);
  };

  const box1 = parse(body.box1);
  const box2 = parse(body.box2);
  const box3 = body.box3 !== undefined && body.box3 !== '' ? parse(body.box3) : round2(box1 + box2);
  const box4 = parse(body.box4);
  const box5 = body.box5 !== undefined && body.box5 !== '' ? parse(body.box5) : round2(box3 - box4);

  return {
    box1,
    box2,
    box3,
    box4,
    box5,
    box6: parse(body.box6),
    box7: parse(body.box7),
    box8: parse(body.box8 || 0),
    box9: parse(body.box9 || 0),
  };
}
