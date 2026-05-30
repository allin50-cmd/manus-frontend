export type PIESystemMode = 'healthy' | 'degraded' | 'critical' | 'failsafe';

export interface PIEFeatures {
  errorRate: number;
  queueDepth: number;
  avgConfidence: number;
  tenantConcentration: number;
}

export interface PIESystemState {
  mode: PIESystemMode;
  confidence: number;
  ruleName: string;
  computedAt: string;
}

const CONCURRENCY: Record<PIESystemMode, number> = {
  healthy: 20, degraded: 10, critical: 3, failsafe: 1,
};

class PIEStateEngine {
  private history: PIESystemMode[] = [];
  private current: PIESystemState = {
    mode: 'healthy', confidence: 1.0,
    ruleName: 'all-clear', computedAt: new Date().toISOString(),
  };

  evaluate(f: PIEFeatures): PIESystemMode {
    const h = this.history;
    let mode: PIESystemMode;
    let ruleName: string;

    if (f.errorRate > 0.2)
      { mode = 'failsafe'; ruleName = 'extreme-error-rate'; }
    else if (h.slice(-5).every(m => m !== 'healthy') && h.length >= 5 && f.errorRate > 0.08)
      { mode = 'failsafe'; ruleName = 'sustained-high-errors'; }
    else if (f.queueDepth > 0.9 && f.errorRate > 0.15)
      { mode = 'failsafe'; ruleName = 'dual-transport-failure'; }
    else if (f.errorRate > 0.1)
      { mode = 'critical'; ruleName = 'high-error-rate'; }
    else if (f.queueDepth > 0.7 && f.errorRate > 0.05)
      { mode = 'critical'; ruleName = 'deep-queue-with-errors'; }
    else if (f.avgConfidence < 0.5 && f.errorRate > 0.03)
      { mode = 'critical'; ruleName = 'low-ultai-confidence'; }
    else if (f.errorRate > 0.03)
      { mode = 'degraded'; ruleName = 'moderate-error-rate'; }
    else if (f.queueDepth > 0.5)
      { mode = 'degraded'; ruleName = 'high-queue-depth'; }
    else if (f.tenantConcentration > 0.9 && f.errorRate > 0.01)
      { mode = 'degraded'; ruleName = 'tenant-concentration-risk'; }
    else if (new Set(h.slice(-10)).size >= 3 && f.errorRate > 0.01)
      { mode = 'degraded'; ruleName = 'mode-instability'; }
    else
      { mode = 'healthy'; ruleName = 'all-clear'; }

    this.history.push(mode);
    if (this.history.length > 50) this.history.shift();

    const confidenceMap: Record<PIESystemMode, number> = { healthy: 1.0, degraded: 0.75, critical: 0.5, failsafe: 0.25 };
    this.current = { mode, confidence: confidenceMap[mode], ruleName, computedAt: new Date().toISOString() };
    return mode;
  }

  getState(): PIESystemState { return this.current; }
  getHistory(): PIESystemMode[] { return [...this.history]; }
  getConcurrency(): number { return CONCURRENCY[this.current.mode]; }
}

export { PIEStateEngine };
export const pieState = new PIEStateEngine();
