import { describe, it, expect, beforeEach } from 'vitest';
import { PIEStateEngine, PIEFeatures } from '../pie/stateEngine.js';

const DEFAULT_FEATURES: PIEFeatures = {
  errorRate: 0,
  queueDepth: 0,
  avgConfidence: 1.0,
  tenantConcentration: 0,
  recentModeSwitches: 0,
};

function features(overrides: Partial<PIEFeatures>): PIEFeatures {
  return { ...DEFAULT_FEATURES, ...overrides };
}

describe('PIE state engine — all 11 rules', () => {
  let engine: PIEStateEngine;

  beforeEach(() => {
    engine = new PIEStateEngine();
  });

  it('rule 11 — all-clear → healthy', () => {
    const mode = engine.evaluate(features({}));
    expect(mode).toBe('healthy');
    expect(engine.getState().ruleName).toBe('all-clear');
  });

  it('rule 1 — extreme-error-rate (errorRate=0.25) → failsafe', () => {
    const mode = engine.evaluate(features({ errorRate: 0.25 }));
    expect(mode).toBe('failsafe');
    expect(engine.getState().ruleName).toBe('extreme-error-rate');
  });

  it('rule 2 — sustained-high-errors → failsafe', () => {
    // Pre-populate history with 5 non-healthy modes
    const primeEngine = new PIEStateEngine();
    // Prime with 5 degraded entries
    for (let i = 0; i < 5; i++) {
      primeEngine.evaluate(features({ errorRate: 0.05 })); // degraded via moderate-error-rate
    }
    const mode = primeEngine.evaluate(features({ errorRate: 0.09 }));
    expect(mode).toBe('failsafe');
    expect(primeEngine.getState().ruleName).toBe('sustained-high-errors');
  });

  it('rule 3 — dual-transport-failure (queueDepth=0.95, errorRate=0.2) → failsafe', () => {
    const mode = engine.evaluate(features({ queueDepth: 0.95, errorRate: 0.2 }));
    expect(mode).toBe('failsafe');
    expect(engine.getState().ruleName).toBe('dual-transport-failure');
  });

  it('rule 4 — high-error-rate (errorRate=0.15) → critical', () => {
    const mode = engine.evaluate(features({ errorRate: 0.15 }));
    expect(mode).toBe('critical');
    expect(engine.getState().ruleName).toBe('high-error-rate');
  });

  it('rule 5 — deep-queue-with-errors (queueDepth=0.8, errorRate=0.06) → critical', () => {
    const mode = engine.evaluate(features({ queueDepth: 0.8, errorRate: 0.06 }));
    expect(mode).toBe('critical');
    expect(engine.getState().ruleName).toBe('deep-queue-with-errors');
  });

  it('rule 6 — low-ultai-confidence (avgConfidence=0.3, errorRate=0.05) → critical', () => {
    const mode = engine.evaluate(features({ avgConfidence: 0.3, errorRate: 0.05 }));
    expect(mode).toBe('critical');
    expect(engine.getState().ruleName).toBe('low-ultai-confidence');
  });

  it('rule 7 — moderate-error-rate (errorRate=0.05) → degraded', () => {
    const mode = engine.evaluate(features({ errorRate: 0.05 }));
    expect(mode).toBe('degraded');
    expect(engine.getState().ruleName).toBe('moderate-error-rate');
  });

  it('rule 8 — high-queue-depth (queueDepth=0.6) → degraded', () => {
    const mode = engine.evaluate(features({ queueDepth: 0.6 }));
    expect(mode).toBe('degraded');
    expect(engine.getState().ruleName).toBe('high-queue-depth');
  });

  it('rule 9 — tenant-concentration-risk (tenantConcentration=0.95, errorRate=0.02) → degraded', () => {
    const mode = engine.evaluate(features({ tenantConcentration: 0.95, errorRate: 0.02 }));
    expect(mode).toBe('degraded');
    expect(engine.getState().ruleName).toBe('tenant-concentration-risk');
  });

  it('rule 10 — mode-instability → degraded', () => {
    const primeEngine = new PIEStateEngine();
    // Produce 3+ unique modes in last 10 entries:
    // healthy
    primeEngine.evaluate(features({}));
    // degraded (high-queue-depth)
    primeEngine.evaluate(features({ queueDepth: 0.6 }));
    // critical (high-error-rate)
    primeEngine.evaluate(features({ errorRate: 0.12 }));
    // healthy again (but now history has 3 unique modes in last 10)
    // Now trigger mode-instability: errorRate=0.02 (>0.01), no other rule fires
    // queueDepth=0, tenantConcentration=0, avgConfidence=1.0
    const mode = primeEngine.evaluate(features({ errorRate: 0.02 }));
    expect(mode).toBe('degraded');
    expect(primeEngine.getState().ruleName).toBe('mode-instability');
  });

  it('getState() returns confidence matching mode', () => {
    engine.evaluate(features({ errorRate: 0.25 }));
    const state = engine.getState();
    expect(state.mode).toBe('failsafe');
    expect(state.confidence).toBe(0.25);
    expect(typeof state.computedAt).toBe('string');
  });

  it('getHistory() grows with each evaluate call', () => {
    engine.evaluate(features({}));
    engine.evaluate(features({ errorRate: 0.05 }));
    expect(engine.getHistory()).toHaveLength(2);
  });

  it('getConcurrency() returns correct value per mode', () => {
    engine.evaluate(features({}));
    expect(engine.getConcurrency()).toBe(20);

    const e2 = new PIEStateEngine();
    e2.evaluate(features({ errorRate: 0.05 }));
    expect(e2.getConcurrency()).toBe(10);

    const e3 = new PIEStateEngine();
    e3.evaluate(features({ errorRate: 0.15 }));
    expect(e3.getConcurrency()).toBe(3);

    const e4 = new PIEStateEngine();
    e4.evaluate(features({ errorRate: 0.25 }));
    expect(e4.getConcurrency()).toBe(1);
  });
});
