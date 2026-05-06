import { useSwarm } from '@/contexts/SwarmContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';
import { useEffect } from 'react';

export function SystemMonitor() {
  const { snapshot } = useSwarm();
  const online = useOnlineStatus();
  const { items } = useSyncQueue();
  const { quality, latencyMs } = useNetworkQuality();

  useEffect(() => {
    const metrics = {
      timestamp: new Date().toISOString(),
      swarmConfidence: Math.round(snapshot.swarmConfidence * 100),
      networkQuality: quality,
      latencyMs,
      networkOnline: online,
      pendingSyncItems: items.length,
      activeAgents: snapshot.agents.filter((a) => a.phiStatus !== 'red').length,
      totalAgents: snapshot.agents.length,
      agentPhiValues: snapshot.agents.map((a) => ({
        id: a.agentId,
        phi: a.phi,
        status: a.phiStatus,
        confidence: Math.round(a.confidence * 100),
      })),
    };

    if (window.__SYSTEM_METRICS) {
      window.__SYSTEM_METRICS.push(metrics);
      if (window.__SYSTEM_METRICS.length > 100) {
        window.__SYSTEM_METRICS.shift();
      }
    } else {
      window.__SYSTEM_METRICS = [metrics];
    }
  }, [snapshot, online, items.length, quality, latencyMs]);

  return null;
}
