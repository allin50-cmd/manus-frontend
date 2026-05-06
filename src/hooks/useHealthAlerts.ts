import { useSwarm } from '@/contexts/SwarmContext';
import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface AlertState {
  confidenceWarned: boolean;
  agentWarnings: Set<string>;
  offlineWarned: boolean;
  syncErrors: Map<string, number>;
}

export function useHealthAlerts() {
  const { snapshot } = useSwarm();
  const online = useOnlineStatus();
  const { items } = useSyncQueue();
  const stateRef = useRef<AlertState>({
    confidenceWarned: false,
    agentWarnings: new Set(),
    offlineWarned: false,
    syncErrors: new Map(),
  });

  useEffect(() => {
    const state = stateRef.current;

    // Swarm confidence warning
    const pct = Math.round(snapshot.swarmConfidence * 100);
    if (pct < 50 && !state.confidenceWarned) {
      toast.warning('Swarm confidence low — some operations may be slower', {
        duration: 5000,
        icon: '⚠️',
      });
      state.confidenceWarned = true;
    } else if (pct >= 70 && state.confidenceWarned) {
      toast.success('Swarm confidence recovered', {
        duration: 3000,
        icon: '✅',
      });
      state.confidenceWarned = false;
    }

    // Agent health monitoring
    snapshot.agents.forEach((agent) => {
      const wasWarned = state.agentWarnings.has(agent.agentId);
      const isUnhealthy = agent.phiStatus === 'orange' || agent.phiStatus === 'red';

      if (isUnhealthy && !wasWarned) {
        toast.warning(`Agent ${agent.agentId} degraded (φ=${agent.phi.toFixed(1)})`, {
          duration: 4000,
          icon: '⚠️',
        });
        state.agentWarnings.add(agent.agentId);
      } else if (!isUnhealthy && wasWarned) {
        toast.success(`Agent ${agent.agentId} recovered`, {
          duration: 3000,
          icon: '✅',
        });
        state.agentWarnings.delete(agent.agentId);
      }
    });

    // Network status change
    if (!online && !state.offlineWarned) {
      toast.error('You are offline — changes will queue for sync', {
        duration: 5000,
        icon: '📡',
      });
      state.offlineWarned = true;
    } else if (online && state.offlineWarned) {
      toast.success('Back online — syncing queued changes', {
        duration: 4000,
        icon: '✅',
      });
      state.offlineWarned = false;
    }

    // Sync error tracking
    items.forEach((item) => {
      if (item.lastError) {
        const errorCount = state.syncErrors.get(item.id) ?? 0;
        if (errorCount === 0) {
          toast.error(`Failed to sync ${item.entityType}: ${item.lastError}`, {
            duration: 5000,
            icon: '❌',
          });
        }
        state.syncErrors.set(item.id, errorCount + 1);
      } else if (state.syncErrors.has(item.id)) {
        state.syncErrors.delete(item.id);
      }
    });
  }, [snapshot, online, items]);
}
