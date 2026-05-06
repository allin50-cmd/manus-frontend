import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { PhiAccrualDetector } from './phiAccrual';
import { AgentBus, BusAdapter } from './bus';
import { computeConfidence, SyntheticSensor } from './confidence';
import { SwarmOrchestrator } from './orchestrator';
import { cacheWrite, cacheRead, formatCacheAge } from '../offlineCache';

// ─── Phi Accrual ────────────────────────────────────────────────────────────

describe('PhiAccrualDetector', () => {
  it('returns 0 with insufficient history', () => {
    const d = new PhiAccrualDetector();
    d.record('peer', 1000);
    expect(d.phi('peer', 1100)).toBe(0);
  });

  it('rises as time since last heartbeat grows', () => {
    const d = new PhiAccrualDetector();
    let t = 0;
    for (let i = 0; i < 10; i++) { t += 500; d.record('peer', t); }
    const phiSoon = d.phi('peer', t + 300);
    const phiLate = d.phi('peer', t + 5000);
    expect(phiLate).toBeGreaterThan(phiSoon);
  });

  it('returns green status for low phi', () => {
    const d = new PhiAccrualDetector();
    expect(d.status(0.5)).toBe('green');
  });

  it('returns red status for high phi', () => {
    const d = new PhiAccrualDetector();
    expect(d.status(10)).toBe('red');
  });

  it('status boundaries: yellow at 1, orange at 4', () => {
    const d = new PhiAccrualDetector();
    expect(d.status(0.9)).toBe('green');
    expect(d.status(1.5)).toBe('yellow');
    expect(d.status(5)).toBe('orange');
    expect(d.status(9)).toBe('red');
  });
});

// ─── AgentBus ────────────────────────────────────────────────────────────────

describe('AgentBus', () => {
  it('delivers a message to the correct agent', () => {
    const bus = new AgentBus();
    bus.register('a'); bus.register('b');
    const received: string[] = [];
    bus.subscribe('b', 'ping', (msg) => received.push(msg.data as string));
    bus.send('b', 'a', { type: 'ping', data: 'hello' });
    expect(received).toEqual(['hello']);
  });

  it('does not deliver to sender', () => {
    const bus = new AgentBus();
    bus.register('a'); bus.register('b');
    const received: string[] = [];
    bus.subscribe('a', 'ping', (msg) => received.push(msg.data as string));
    bus.broadcast('a', 'ping', { data: 'hi' });
    expect(received).toHaveLength(0);
  });

  it('BusAdapter getPeers excludes self', () => {
    const bus = new AgentBus();
    ['x', 'y', 'z'].forEach((id) => bus.register(id));
    const adapter = new BusAdapter(bus, 'x');
    expect(adapter.getPeers()).toEqual(['y', 'z']);
  });

  it('silently drops messages to unregistered agents', () => {
    const bus = new AgentBus();
    bus.register('a');
    expect(() => bus.send('ghost', 'a', { type: 'ping' })).not.toThrow();
  });
});

// ─── Confidence ──────────────────────────────────────────────────────────────

describe('computeConfidence', () => {
  it('returns 1.0 for perfect inputs', () => {
    expect(computeConfidence({ batteryHealth: 1, commReliability: 1, taskProgressRate: 1, sensorFidelity: 1 })).toBe(1);
  });

  it('returns 0.0 for zero inputs', () => {
    expect(computeConfidence({ batteryHealth: 0, commReliability: 0, taskProgressRate: 0, sensorFidelity: 0 })).toBe(0);
  });

  it('weights battery + comms at 0.6 combined', () => {
    const score = computeConfidence({ batteryHealth: 1, commReliability: 1, taskProgressRate: 0, sensorFidelity: 0 });
    expect(score).toBeCloseTo(0.6, 5);
  });

  it('clamps to [0, 1]', () => {
    const score = computeConfidence({ batteryHealth: 2, commReliability: 2, taskProgressRate: 2, sensorFidelity: 2 });
    expect(score).toBe(1);
  });
});

describe('SyntheticSensor', () => {
  it('tick returns values within [0,1]', () => {
    const s = new SyntheticSensor(0.5);
    for (let i = 0; i < 20; i++) {
      const inp = s.tick(0.9);
      expect(inp.batteryHealth).toBeGreaterThanOrEqual(0);
      expect(inp.batteryHealth).toBeLessThanOrEqual(1);
      expect(inp.sensorFidelity).toBeGreaterThanOrEqual(0.5);
    }
  });
});

// ─── offlineCache ─────────────────────────────────────────────────────────────

describe('offlineCache', () => {
  beforeEach(() => localStorage.clear());

  it('write then read returns the same data', () => {
    cacheWrite('test-key', { value: 42 });
    const entry = cacheRead<{ value: number }>('test-key');
    expect(entry?.data.value).toBe(42);
  });

  it('read returns null for missing key', () => {
    expect(cacheRead('no-such-key')).toBeNull();
  });

  it('ageMs is close to 0 immediately after write', () => {
    cacheWrite('age-key', 'x');
    const entry = cacheRead('age-key');
    expect(entry?.ageMs).toBeLessThan(100);
  });

  it('formatCacheAge: just now under 1 min', () => {
    expect(formatCacheAge(30_000)).toBe('just now');
  });

  it('formatCacheAge: minutes', () => {
    expect(formatCacheAge(5 * 60_000)).toBe('5m ago');
  });

  it('formatCacheAge: hours', () => {
    expect(formatCacheAge(3 * 60 * 60_000)).toBe('3h ago');
  });

  it('formatCacheAge: days', () => {
    expect(formatCacheAge(2 * 24 * 60 * 60_000)).toBe('2d ago');
  });

  it('survives JSON round-trip for complex objects', () => {
    const obj = { cases: [{ id: 1, title: 'Smith v Jones', status: 'open' }] };
    cacheWrite('complex', obj);
    const entry = cacheRead<typeof obj>('complex');
    expect(entry?.data.cases[0].title).toBe('Smith v Jones');
  });
});

// ─── SwarmOrchestrator ───────────────────────────────────────────────────────

describe('SwarmOrchestrator', () => {
  let orch: SwarmOrchestrator;

  beforeEach(() => { orch = new SwarmOrchestrator(); });
  afterEach(() => { orch.destroy(); });

  it('starts with 3 named agents', () => {
    const snap = orch.snapshot();
    expect(snap.agents).toHaveLength(3);
    expect(snap.agents.map((a) => a.agentId)).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('snapshot increments tick', () => {
    const t1 = orch.snapshot().tick;
    const t2 = orch.snapshot().tick;
    expect(t2).toBe(t1 + 1);
  });

  it('swarmConfidence is between 0 and 1', () => {
    const { swarmConfidence } = orch.snapshot();
    expect(swarmConfidence).toBeGreaterThanOrEqual(0);
    expect(swarmConfidence).toBeLessThanOrEqual(1);
  });

  it('each agent confidence is between 0 and 1', () => {
    const { agents } = orch.snapshot();
    agents.forEach((a) => {
      expect(a.confidence).toBeGreaterThanOrEqual(0);
      expect(a.confidence).toBeLessThanOrEqual(1);
    });
  });

  it('kill removes agent from snapshot', () => {
    orch.killAgent('beta');
    const snap = orch.snapshot();
    expect(snap.agents.find((a) => a.agentId === 'beta')).toBeUndefined();
    expect(snap.agents).toHaveLength(2);
  });

  it('revive restores agent', () => {
    orch.killAgent('gamma');
    orch.reviveAgent('gamma');
    const snap = orch.snapshot();
    expect(snap.agents.find((a) => a.agentId === 'gamma')).toBeDefined();
    expect(snap.agents).toHaveLength(3);
  });

  it('double-kill is a no-op', () => {
    orch.killAgent('alpha');
    expect(() => orch.killAgent('alpha')).not.toThrow();
    expect(orch.snapshot().agents).toHaveLength(2);
  });

  it('reviving a live agent is a no-op', () => {
    expect(() => orch.reviveAgent('alpha')).not.toThrow();
    expect(orch.snapshot().agents).toHaveLength(3);
  });

  it('all agents have valid phiStatus', () => {
    const valid = new Set(['green', 'yellow', 'orange', 'red']);
    orch.snapshot().agents.forEach((a) => {
      expect(valid.has(a.phiStatus)).toBe(true);
    });
  });

  it('all agents have valid raftState', () => {
    const valid = new Set(['Follower', 'Candidate', 'Leader']);
    orch.snapshot().agents.forEach((a) => {
      expect(valid.has(a.raftState)).toBe(true);
    });
  });
});
