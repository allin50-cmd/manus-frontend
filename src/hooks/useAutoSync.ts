import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

export function useAutoSync() {
  const { items, retryAll } = useSyncQueue();
  const online = useOnlineStatus();
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (online && items.length > 0 && !syncAttemptedRef.current) {
      syncAttemptedRef.current = true;
      retryAll().catch(() => {
        toast.error('Auto-sync failed — queue items remain', { icon: '❌' });
      });
      setTimeout(() => {
        syncAttemptedRef.current = false;
      }, 2000);
    }
  }, [online, items.length, retryAll]);
}
