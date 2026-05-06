import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useEffect, useState } from 'react';

interface CrossTabMessage {
  type: 'sync-start' | 'sync-complete' | 'sync-error';
  timestamp: number;
  itemCount?: number;
  error?: string;
}

export function useCrossTabSync() {
  const { items } = useSyncQueue();
  const [otherTabSyncing, setOtherTabSyncing] = useState(false);
  const [lastOtherTabMessage, setLastOtherTabMessage] = useState<CrossTabMessage | null>(null);

  useEffect(() => {
    const channel = new BroadcastChannel('clerkos-sync');

    const handleMessage = (event: MessageEvent<CrossTabMessage>) => {
      const msg = event.data;
      setLastOtherTabMessage(msg);

      if (msg.type === 'sync-start') {
        setOtherTabSyncing(true);
      } else if (msg.type === 'sync-complete' || msg.type === 'sync-error') {
        setOtherTabSyncing(false);
      }
    };

    channel.addEventListener('message', handleMessage);

    // Broadcast sync events from this tab
    if (items.length > 0) {
      const hasPending = items.some((i) => !i.lastError);
      if (hasPending) {
        channel.postMessage({
          type: 'sync-start',
          timestamp: Date.now(),
          itemCount: items.length,
        } as CrossTabMessage);
      }
    }

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [items]);

  return { otherTabSyncing, lastOtherTabMessage };
}
