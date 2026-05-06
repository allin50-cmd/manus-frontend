import { useEffect, useState, useCallback } from 'react';
import { getSyncQueueService, type SyncItem } from '@/lib/syncQueueService';

export function useSyncQueueService() {
  const [items, setItems] = useState<SyncItem[]>([]);
  const [stats, setStats] = useState({
    totalPending: 0,
    totalFailed: 0,
    totalSynced: 0,
  });

  const service = getSyncQueueService();

  // Refresh items list
  const refreshItems = useCallback(async () => {
    const allItems = await service.getAllItems();
    setItems(allItems);

    // Update stats
    const stats = {
      totalPending: allItems.filter(i => i.status === 'pending').length,
      totalFailed: allItems.filter(i => i.status === 'failed').length,
      totalSynced: allItems.filter(i => i.status === 'synced').length,
    };
    setStats(stats);
  }, [service]);

  // Initial load and listen for events
  useEffect(() => {
    refreshItems();

    const handleSyncSuccess = () => refreshItems();
    const handleSyncRetry = () => refreshItems();
    const handleSyncFailure = () => refreshItems();

    window.addEventListener('sync-success', handleSyncSuccess);
    window.addEventListener('sync-retry', handleSyncRetry);
    window.addEventListener('sync-failure', handleSyncFailure);

    // Refresh every 2 seconds
    const interval = setInterval(refreshItems, 2000);

    return () => {
      window.removeEventListener('sync-success', handleSyncSuccess);
      window.removeEventListener('sync-retry', handleSyncRetry);
      window.removeEventListener('sync-failure', handleSyncFailure);
      clearInterval(interval);
    };
  }, [refreshItems]);

  // Add item to queue
  const addItem = useCallback(
    async (
      entityType: SyncItem['entityType'],
      action: SyncItem['action'],
      data: Record<string, any>
    ) => {
      const item = await service.addItem(entityType, action, data);
      await refreshItems();
      return item;
    },
    [service, refreshItems]
  );

  // Remove item from queue
  const removeItem = useCallback(
    async (id: string) => {
      await service.deleteItem(id);
      await refreshItems();
    },
    [service, refreshItems]
  );

  // Clear all items
  const clearAll = useCallback(async () => {
    await service.clearAll();
    await refreshItems();
  }, [service, refreshItems]);

  return {
    items,
    stats,
    addItem,
    removeItem,
    clearAll,
    refreshItems,
  };
}
