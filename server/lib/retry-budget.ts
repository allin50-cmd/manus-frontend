/**
 * Per-dependency retry budget to prevent distributed retry storms.
 *
 * Tracks retry attempts in a rolling time window. When a dependency
 * exceeds its budget, all further retries are suppressed and the circuit
 * is opened immediately.
 *
 * Purely in-memory — per cold-start lifetime, same as the circuit breaker.
 */

import { log } from './logger';
import { recordFailure, configureDependency } from './circuit-breaker';

export interface RetryBudgetConfig {
  /** Maximum retry attempts allowed per dependency within windowMs. */
  maxRetries: number;
  /** Rolling window for counting retries (ms). */
  windowMs: number;
}

const DEFAULT_BUDGET: RetryBudgetConfig = {
  maxRetries: 10,
  windowMs: 60_000,
};

interface BudgetState {
  attempts: number[];
  exhaustedAt: number;
}

const budgets = new Map<string, RetryBudgetConfig>();
const states = new Map<string, BudgetState>();

/** Override the default retry budget for a specific dependency. */
export function configureRetryBudget(dependency: string, config: Partial<RetryBudgetConfig>): void {
  budgets.set(dependency, { ...DEFAULT_BUDGET, ...config });
}

function getConfig(dependency: string): RetryBudgetConfig {
  return budgets.get(dependency) ?? DEFAULT_BUDGET;
}

function getOrCreateState(dependency: string): BudgetState {
  let s = states.get(dependency);
  if (!s) {
    s = { attempts: [], exhaustedAt: 0 };
    states.set(dependency, s);
  }
  return s;
}

/**
 * Record a retry attempt and check if the budget is exhausted.
 *
 * @returns true if execution should proceed, false if budget exhausted
 */
export function consumeRetryBudget(dependency: string, now: number = Date.now()): boolean {
  const config = getConfig(dependency);
  const state = getOrCreateState(dependency);

  // Prune attempts outside the window
  state.attempts = state.attempts.filter(t => now - t <= config.windowMs);

  if (state.attempts.length >= config.maxRetries) {
    if (state.exhaustedAt === 0) {
      state.exhaustedAt = now;
      // Immediately open the circuit breaker
      configureDependency(dependency, { failureThreshold: 1 });
      recordFailure(dependency, now);
      log({
        level: 'warn',
        event: 'retry_budget.exhausted',
        dependency,
        windowMs: config.windowMs,
        maxRetries: config.maxRetries,
        attemptCount: state.attempts.length,
      });
    }
    return false;
  }

  state.attempts.push(now);
  state.exhaustedAt = 0;
  return true;
}

/** Get retry budget state for a dependency (for observability). */
export function getRetryBudgetState(
  dependency: string,
  now: number = Date.now(),
): { attemptsInWindow: number; maxRetries: number; windowMs: number; exhausted: boolean } {
  const config = getConfig(dependency);
  const state = getOrCreateState(dependency);
  const attemptsInWindow = state.attempts.filter(t => now - t <= config.windowMs).length;
  return {
    attemptsInWindow,
    maxRetries: config.maxRetries,
    windowMs: config.windowMs,
    exhausted: attemptsInWindow >= config.maxRetries,
  };
}

/** Reset all retry budget state — test helper only. */
export function __resetRetryBudgetsForTests(): void {
  budgets.clear();
  states.clear();
}
