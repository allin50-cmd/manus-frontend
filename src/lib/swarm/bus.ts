import type { RufloMessaging } from './types';

type Handler = (msg: Record<string, unknown>, fromId: string) => void;

export class AgentBus {
  private agents = new Map<string, Map<string, Handler[]>>();

  register(agentId: string) {
    this.agents.set(agentId, new Map());
  }

  unregister(agentId: string) {
    this.agents.delete(agentId);
  }

  send(targetId: string, fromId: string, message: Record<string, unknown>) {
    const channelMap = this.agents.get(targetId);
    if (!channelMap) return;
    const channel = (message.type as string) ?? '_default';
    (channelMap.get(channel) ?? []).forEach((h) => h(message, fromId));
  }

  broadcast(fromId: string, channel: string, message: Record<string, unknown>) {
    this.agents.forEach((_, id) => {
      if (id !== fromId) this.send(id, fromId, { ...message, type: channel });
    });
  }

  subscribe(agentId: string, channel: string, handler: Handler) {
    const channelMap = this.agents.get(agentId);
    if (!channelMap) return;
    channelMap.set(channel, [...(channelMap.get(channel) ?? []), handler]);
  }

  getPeers(agentId: string): string[] {
    return Array.from(this.agents.keys()).filter((id) => id !== agentId);
  }
}

export class BusAdapter implements RufloMessaging {
  constructor(private bus: AgentBus, private agentId: string) {}

  async send(targetAgentId: string, message: Record<string, unknown>): Promise<void> {
    this.bus.send(targetAgentId, this.agentId, message);
  }

  async broadcast(channel: string, message: Record<string, unknown>): Promise<void> {
    this.bus.broadcast(this.agentId, channel, message);
  }

  subscribe(channel: string, handler: (msg: Record<string, unknown>, fromAgentId: string) => void): void {
    this.bus.subscribe(this.agentId, channel, handler);
  }

  getPeers(): string[] {
    return this.bus.getPeers(this.agentId);
  }

  getAgentId(): string {
    return this.agentId;
  }
}
