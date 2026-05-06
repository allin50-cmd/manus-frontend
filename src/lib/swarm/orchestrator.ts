import { BusAdapter, AgentBus } from './bus';
import { PhiAccrualDetector } from './phiAccrual';
import { RaftNode } from './raft';
import { SyntheticSensor, computeConfidence } from './confidence';
import type { AgentSnapshot, SwarmSnapshot } from './types';

const HB_INTERVAL = 800;

class SwarmAgent {
  readonly id: string;
  readonly phi: PhiAccrualDetector;
  readonly raft: RaftNode;
  readonly sensor: SyntheticSensor;
  taskCount = 0;
  confidence = 1;

  private hbTimer: ReturnType<typeof setInterval> | null = null;

  constructor(id: string, bus: AgentBus, index: number) {
    this.id = id;
    this.phi = new PhiAccrualDetector();
    this.sensor = new SyntheticSensor(index * 0.1);

    const adapter = new BusAdapter(bus, id);

    adapter.subscribe('heartbeat', (msg, from) => {
      this.phi.record(from, msg.ts as number);
    });

    this.raft = new RaftNode(id, adapter, (_entry) => { this.taskCount++; });

    this.hbTimer = setInterval(() => {
      const hb = { type: 'heartbeat', agentId: id, ts: Date.now() };
      adapter.getPeers().forEach((p) => adapter.send(p, hb));
    }, HB_INTERVAL);
  }

  snapshot(peers: string[]): AgentSnapshot {
    const now = Date.now();
    const peerPhis = peers.map((p) => this.phi.phi(p, now));
    const commReliability = peers.length === 0 ? 1
      : peerPhis.filter((v) => v < 1).length / peers.length;

    const inputs = this.sensor.tick(commReliability);
    this.confidence = computeConfidence(inputs);

    const maxPhi = peerPhis.length ? Math.max(...peerPhis) : 0;
    return {
      agentId: this.id,
      phi: Math.round(maxPhi * 100) / 100,
      phiStatus: this.phi.status(maxPhi),
      raftState: this.raft.state,
      term: this.raft.currentTerm,
      confidence: Math.round(this.confidence * 100) / 100,
      taskCount: this.taskCount,
    };
  }

  destroy() {
    if (this.hbTimer) clearInterval(this.hbTimer);
    this.raft.destroy();
  }
}

export class SwarmOrchestrator {
  private agents: SwarmAgent[] = [];
  private bus = new AgentBus();
  private tickCount = 0;

  readonly AGENT_IDS = ['alpha', 'beta', 'gamma'];

  constructor() {
    this.AGENT_IDS.forEach((id, i) => {
      this.bus.register(id);
      this.agents.push(new SwarmAgent(id, this.bus, i));
    });
  }

  snapshot(): SwarmSnapshot {
    this.tickCount++;
    const snaps = this.agents.map((a) =>
      a.snapshot(this.AGENT_IDS.filter((id) => id !== a.id)),
    );
    const leader = snaps.find((s) => s.raftState === 'Leader');
    const swarmConfidence = Math.round(
      (snaps.reduce((sum, s) => sum + s.confidence, 0) / snaps.length) * 100,
    ) / 100;
    return { agents: snaps, leaderId: leader?.agentId ?? null, swarmConfidence, tick: this.tickCount };
  }

  // Kill an agent to demonstrate failure detection
  killAgent(agentId: string) {
    const idx = this.agents.findIndex((a) => a.id === agentId);
    if (idx === -1) return;
    this.agents[idx].destroy();
    this.bus.unregister(agentId);
    this.agents.splice(idx, 1);
  }

  // Revive a previously killed agent
  reviveAgent(agentId: string) {
    if (this.agents.find((a) => a.id === agentId)) return;
    const idx = this.AGENT_IDS.indexOf(agentId);
    if (idx === -1) return;
    this.bus.register(agentId);
    this.agents.push(new SwarmAgent(agentId, this.bus, idx));
  }

  destroy() {
    this.agents.forEach((a) => a.destroy());
  }
}
