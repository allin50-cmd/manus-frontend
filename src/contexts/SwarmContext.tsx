import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { SwarmOrchestrator } from '@/lib/swarm/orchestrator';
import type { SwarmSnapshot } from '@/lib/swarm/types';

const EMPTY: SwarmSnapshot = { agents: [], leaderId: null, swarmConfidence: 0, tick: 0 };

interface SwarmCtx {
  snapshot: SwarmSnapshot;
  kill: (agentId: string) => void;
  revive: (agentId: string) => void;
  killedAgents: string[];
}

const Ctx = createContext<SwarmCtx>({ snapshot: EMPTY, kill: () => {}, revive: () => {}, killedAgents: [] });

export function SwarmProvider({ children }: { children: React.ReactNode }) {
  const orchRef = useRef<SwarmOrchestrator | null>(null);
  const [snapshot, setSnapshot] = useState<SwarmSnapshot>(EMPTY);
  const [killedAgents, setKilledAgents] = useState<string[]>([]);

  useEffect(() => {
    const orch = new SwarmOrchestrator();
    orchRef.current = orch;
    const timer = setInterval(() => setSnapshot(orch.snapshot()), 600);
    return () => {
      clearInterval(timer);
      orch.destroy();
    };
  }, []);

  const kill = (agentId: string) => {
    orchRef.current?.killAgent(agentId);
    setKilledAgents((prev) => [...new Set([...prev, agentId])]);
  };

  const revive = (agentId: string) => {
    orchRef.current?.reviveAgent(agentId);
    setKilledAgents((prev) => prev.filter((id) => id !== agentId));
  };

  return <Ctx.Provider value={{ snapshot, kill, revive, killedAgents }}>{children}</Ctx.Provider>;
}

export function useSwarm() {
  return useContext(Ctx);
}
