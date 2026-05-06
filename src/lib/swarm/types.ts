export interface RufloMessaging {
  send(targetAgentId: string, message: Record<string, unknown>): Promise<void>;
  broadcast(channel: string, message: Record<string, unknown>): Promise<void>;
  subscribe(channel: string, handler: (msg: Record<string, unknown>, fromAgentId: string) => void): void;
  getPeers(): string[];
  getAgentId(): string;
}

export interface RaftLogEntry {
  term: number;
  index: number;
  command: unknown;
}

export type RaftState = 'Follower' | 'Candidate' | 'Leader';

export interface AgentSnapshot {
  agentId: string;
  phi: number;
  phiStatus: 'green' | 'yellow' | 'orange' | 'red';
  raftState: RaftState;
  term: number;
  confidence: number;
  taskCount: number;
}

export interface SwarmSnapshot {
  agents: AgentSnapshot[];
  leaderId: string | null;
  swarmConfidence: number;
  tick: number;
}
