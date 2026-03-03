/**
 * FineGuard - Compliance Score Calculator
 *
 * Implements the weighted compliance score formula:
 *
 *   Score = (Timeliness × 0.35) + (Accuracy × 0.40) + (Completeness × 0.15) + (Risk × 0.10)
 *
 * Where:
 *   - Timeliness   (0–100): % of returns filed on or before deadline
 *   - Accuracy     (0–100): % of returns accepted first time without amendment
 *   - Completeness (0–100): % of required data fields populated (no gaps/missing records)
 *   - Risk         (0–100): Inverse risk score — higher raw risk = LOWER contribution
 *                            Applied as (100 − riskScore) × 0.10
 *
 * IMPORTANT: Risk is treated as an INVERSE component.
 * A company with risk=100 (maximum risk) contributes 0 to the score from this factor.
 * A company with risk=0 (no risk) contributes the full 10 points.
 */

import type { ComplianceScoreInput, ComplianceScoreResult } from './types.js';

// ============================================================================
// WEIGHTS (must sum to 1.0)
// ============================================================================

const WEIGHTS = {
  timeliness: 0.35,
  accuracy: 0.40,
  completeness: 0.15,
  risk: 0.10, // Applied as inverse: (100 - riskScore) × 0.10
} as const;

// ============================================================================
// GRADE THRESHOLDS
// ============================================================================

function scoreToGrade(score: number): ComplianceScoreResult['grade'] {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
}

// ============================================================================
// TREND ANALYSIS
// ============================================================================

function determineTrend(
  currentScore: number,
  previousScore: number | undefined,
): ComplianceScoreResult['trend'] {
  if (previousScore === undefined) return 'stable';
  const delta = currentScore - previousScore;
  if (delta >= 2) return 'improving';
  if (delta <= -2) return 'declining';
  return 'stable';
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function validateInput(input: ComplianceScoreInput): void {
  const fields: (keyof ComplianceScoreInput)[] = ['timeliness', 'accuracy', 'completeness', 'risk'];
  for (const field of fields) {
    const val = input[field];
    if (typeof val !== 'number' || isNaN(val)) {
      throw new Error(`ComplianceScoreInput: '${field}' must be a number (got ${val})`);
    }
    if (val < 0 || val > 100) {
      throw new Error(`ComplianceScoreInput: '${field}' must be between 0 and 100 (got ${val})`);
    }
  }
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

/**
 * Calculates the weighted compliance score using HMRC-aligned metrics.
 *
 * Formula:
 *   Score = (T × 0.35) + (A × 0.40) + (C × 0.15) + ((100 − R) × 0.10)
 *
 * All inputs are clamped to [0, 100]. The result is rounded to 1 decimal place.
 *
 * @param input          The four compliance metric inputs (0-100 each)
 * @param previousScore  Optional previous score for trend analysis
 * @returns              Full ComplianceScoreResult with breakdown and grade
 */
export function calculateComplianceScore(
  input: ComplianceScoreInput,
  previousScore?: number,
): ComplianceScoreResult {
  validateInput(input);

  // Clamp all inputs to guard against out-of-range data
  const t = clamp(input.timeliness);
  const a = clamp(input.accuracy);
  const c = clamp(input.completeness);
  const r = clamp(input.risk);

  // Apply weighted formula
  // Risk is INVERTED: a high-risk company should score lower
  const timelinessWeighted = t * WEIGHTS.timeliness;
  const accuracyWeighted = a * WEIGHTS.accuracy;
  const completenessWeighted = c * WEIGHTS.completeness;
  const riskWeighted = (100 - r) * WEIGHTS.risk; // Inverse risk contribution

  const rawScore = timelinessWeighted + accuracyWeighted + completenessWeighted + riskWeighted;

  // Round to 1 decimal place (consistent with display requirements)
  const score = Math.round(rawScore * 10) / 10;

  return {
    score,
    grade: scoreToGrade(score),
    breakdown: {
      timeliness: t,
      accuracy: a,
      completeness: c,
      risk: r,
      timelinessWeighted: Math.round(timelinessWeighted * 10) / 10,
      accuracyWeighted: Math.round(accuracyWeighted * 10) / 10,
      completenessWeighted: Math.round(completenessWeighted * 10) / 10,
      riskWeighted: Math.round(riskWeighted * 10) / 10,
    },
    trend: determineTrend(score, previousScore),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculates what score improvement is needed to reach the next grade boundary.
 * Useful for the FineGuard dashboard "improvement suggestions" panel.
 */
export function getScoreGap(score: number): { targetGrade: string; pointsNeeded: number } | null {
  if (score >= 90) return null; // Already at max grade
  if (score >= 75) return { targetGrade: 'A', pointsNeeded: Math.ceil(90 - score) };
  if (score >= 60) return { targetGrade: 'B', pointsNeeded: Math.ceil(75 - score) };
  if (score >= 45) return { targetGrade: 'C', pointsNeeded: Math.ceil(60 - score) };
  return { targetGrade: 'D', pointsNeeded: Math.ceil(45 - score) };
}
