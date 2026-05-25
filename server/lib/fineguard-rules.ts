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

/**
 * Parse a free-text claim value string (e.g. "£2,400,000", "2.4m", "500000")
 * to a numeric GBP value. Returns null when no digits are present.
 *
 * Deterministic: no locale, no currency conversion — strips non-digits.
 */
function parseClaimValueGbp(claimValue: string | null | undefined): number | null {
  if (!claimValue) return null;
  const digits = claimValue.replace(/[^\d]/g, '');
  if (digits.length === 0) return null;
  const n = Number(digits);
  return Number.isFinite(n) ? n : null;
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
