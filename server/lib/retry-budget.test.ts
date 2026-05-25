import { describe, it, expect, beforeEach } from 'vitest';
import {
  consumeRetryBudget,
  configureRetryBudget,
  getRetryBudgetState,
  __resetRetryBudgetsForTests,
} from './retry-budget';

beforeEach(() => {
  __resetRetryBudgetsForTests();
});

describe('retry-budget: basic counting', () => {
  it('allows retries below the budget', () => {
    configureRetryBudget('dep-a', { maxRetries: 3, windowMs: 60_000 });
    expect(consumeRetryBudget('dep-a', 1_000)).toBe(true);
    expect(consumeRetryBudget('dep-a', 2_000)).toBe(true);
    expect(consumeRetryBudget('dep-a', 3_000)).toBe(true);
    const state = getRetryBudgetState('dep-a', 3_000);
    expect(state.attemptsInWindow).toBe(3);
    expect(state.exhausted).toBe(true);
  });

  it('denies retries once budget is exhausted', () => {
    configureRetryBudget('dep-b', { maxRetries: 2, windowMs: 60_000 });
    consumeRetryBudget('dep-b', 1_000);
    consumeRetryBudget('dep-b', 2_000);
    const allowed = consumeRetryBudget('dep-b', 3_000);
    expect(allowed).toBe(false);
  });

  it('uses default budget (maxRetries=10) when not configured', () => {
    for (let i = 0; i < 10; i++) {
      expect(consumeRetryBudget('dep-default', i * 100)).toBe(true);
    }
    const state = getRetryBudgetState('dep-default', 1_000);
    expect(state.exhausted).toBe(true);
    expect(consumeRetryBudget('dep-default', 1_100)).toBe(false);
  });

  it('isolates budgets per dependency', () => {
    configureRetryBudget('dep-c', { maxRetries: 1, windowMs: 60_000 });
    configureRetryBudget('dep-d', { maxRetries: 5, windowMs: 60_000 });
    consumeRetryBudget('dep-c', 1_000);
    expect(consumeRetryBudget('dep-c', 2_000)).toBe(false);
    expect(consumeRetryBudget('dep-d', 2_000)).toBe(true);
  });
});

describe('retry-budget: sliding window reset', () => {
  it('prunes old attempts outside the window', () => {
    configureRetryBudget('dep-e', { maxRetries: 3, windowMs: 10_000 });
    consumeRetryBudget('dep-e', 1_000);
    consumeRetryBudget('dep-e', 2_000);
    // At t=20_000, both earlier attempts are outside the 10s window
    expect(consumeRetryBudget('dep-e', 20_000)).toBe(true);
    const state = getRetryBudgetState('dep-e', 20_000);
    expect(state.attemptsInWindow).toBe(1);
    expect(state.exhausted).toBe(false);
  });
});

describe('retry-budget: observability', () => {
  it('reports correct state', () => {
    configureRetryBudget('dep-f', { maxRetries: 5, windowMs: 30_000 });
    consumeRetryBudget('dep-f', 1_000);
    consumeRetryBudget('dep-f', 2_000);
    const state = getRetryBudgetState('dep-f', 2_000);
    expect(state.attemptsInWindow).toBe(2);
    expect(state.maxRetries).toBe(5);
    expect(state.windowMs).toBe(30_000);
    expect(state.exhausted).toBe(false);
  });
});
