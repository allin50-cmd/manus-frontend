export type PIESystemMode = 'healthy' | 'degraded' | 'critical' | 'failsafe';

export interface PIESystemState {
  mode: PIESystemMode;
  confidence: number;
  ruleName: string;
  computedAt: string;
}

class PIEStateEngine {
  private current: PIESystemState = {
    mode: 'healthy',
    confidence: 1.0,
    ruleName: 'all-clear',
    computedAt: new Date().toISOString(),
  };

  getState(): PIESystemState {
    return this.current;
  }

  setState(mode: PIESystemMode, ruleName: string) {
    this.current = { mode, confidence: mode === 'healthy' ? 1.0 : 0.5, ruleName, computedAt: new Date().toISOString() };
  }
}

export const pieState = new PIEStateEngine();
