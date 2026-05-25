import type { IntakeForm } from '../db/schema';

/**
 * FineGuard activation evaluation result.
 *
 * `activate` is the decision; `reasons` are the individual rule flags that
 * fed into it, used for audit metadata so operators can understand *why*
 * an intake was (or wasn't) enrolled.
 */
export interface FineGuardEvaluation {
  activate: boolean;
  reasons: {
    /** Intake came from Accuracy PIE (sourceRef starts with "PIE:") */
    pieOriginated: boolean;
    /** Urgency is 'high' or 'critical' */
    highUrgency: boolean;
    /** claimValue parses to ≥ £1,000,000 */
    highValue: boolean;
  };
}

const HIGH_VALUE_THRESHOLD_GBP = 1_000_000;

const SUFFIX_MULTIPLIERS: ReadonlyArray<[RegExp, number]> = [
  [/bn\b/i, 1_000_000_000],
  [/\bm\b/i, 1_000_000],
  [/\bk\b/i, 1_000],
];

/**
 * Parse a free-text claim value string to a numeric GBP value.
 *
 * Supported shapes (deterministic — no locale, no currency conversion):
 *   "£2,400,000"            → 2_400_000
 *   "2400000"               → 2_400_000
 *   "£1,500.50"             → 1_500.5         (decimals preserved)
 *   "2.4m" / "£2.4m"        → 2_400_000       (case-insensitive suffix)
 *   "500k" / "£500k"        → 500_000
 *   "1.5bn"                 → 1_500_000_000
 *   "£1,000 - £5,000,000"   → 1_000           (range: lower bound wins, conservative)
 *
 * Returns null when no numeric content is present.
 *
 * Conservative choices:
 *   - Ranges resolve to the LOWER bound so we never falsely fire highValue.
 *   - Trailing junk after a number is ignored ("£500k development cost" → 500_000).
 *   - Mixed case suffixes ("M", "K", "BN") all recognised.
 */
function parseClaimValueGbp(claimValue: string | null | undefined): number | null {
  if (!claimValue) return null;

  // Take the LOWER bound on ranges — "£1,000 - £5,000,000" → "£1,000".
  // Splitter matches " - ", " – " (en-dash with spaces), " to ", or "—".
  const lowerBoundFragment = claimValue
    .split(/\s+(?:-|–|—|to)\s+/i)[0]
    .trim();

  // Find the first numeric token (digits with optional commas + optional decimal).
  const numericMatch = lowerBoundFragment.match(/[\d,]+(?:\.\d+)?/);
  if (!numericMatch) return null;

  const numericRaw = numericMatch[0].replace(/,/g, '');
  const base = Number(numericRaw);
  if (!Number.isFinite(base)) return null;

  // Look for a shorthand suffix in the fragment AFTER the numeric token.
  const after = lowerBoundFragment.slice(
    numericMatch.index! + numericMatch[0].length,
  );
  for (const [pattern, multiplier] of SUFFIX_MULTIPLIERS) {
    if (pattern.test(after)) return base * multiplier;
  }
  return base;
}

/**
 * Evaluate whether an intake should trigger FineGuard monitoring enrollment.
 *
 * Pure, deterministic, no side effects, no external dependencies. Uses only
 * fields already present on the intake row:
 *   - sourceRef        (PIE origin gate)
 *   - urgency          (high/critical = elevated risk)
 *   - claimValue       (high-value matters get monitoring)
 *
 * Activation rule: PIE-originated AND (highUrgency OR highValue).
 *
 * Non-PIE intakes never auto-activate via this path — those go through
 * the Stripe checkout flow which has explicit user consent.
 */
export function evaluateFineGuardActivation(intake: IntakeForm): FineGuardEvaluation {
  const pieOriginated = (intake.sourceRef ?? '').startsWith('PIE:');
  const highUrgency = intake.urgency === 'high' || intake.urgency === 'critical';
  const parsedValue = parseClaimValueGbp(intake.claimValue);
  const highValue = parsedValue !== null && parsedValue >= HIGH_VALUE_THRESHOLD_GBP;

  return {
    activate: pieOriginated && (highUrgency || highValue),
    reasons: { pieOriginated, highUrgency, highValue },
  };
}

/** Boolean form of {@link evaluateFineGuardActivation} for guard usage. */
export function shouldActivateFineGuard(intake: IntakeForm): boolean {
  return evaluateFineGuardActivation(intake).activate;
}
