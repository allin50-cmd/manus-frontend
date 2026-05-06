import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { calculateBackoff } from '@/lib/backoffStrategy';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

export function useSyncRetry() {
  const { items, remove } = useSyncQueue();
  const online = useOnlineStatus();
  const { otherTabSyncing } = useCrossTabSync();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());

  const caseCreate = trpc.cases.create.useMutation();
  const hearingCreate = trpc.hearings.create.useMutation();
  const allocationCreate = trpc.allocations.create.useMutation();
  const documentCreate = trpc.documents.create.useMutation();
  const diaryCreate = trpc.diary.create.useMutation();

  useEffect(() => {
    if (!online || otherTabSyncing) return;

    for (const item of items) {
      if (item.lastError && !processingRef.current.has(item.id)) {
        const backoffMs = calculateBackoff(item.attempts);
        const timeout = setTimeout(async () => {
          processingRef.current.add(item.id);

          try {
            switch (item.entityType) {
              case 'case':
                await caseCreate.mutateAsync(
                  item.data as Parameters<typeof caseCreate.mutateAsync>[0],
                );
                break;
              case 'hearing':
                await hearingCreate.mutateAsync(
                  item.data as Parameters<typeof hearingCreate.mutateAsync>[0],
                );
                break;
              case 'allocation':
                await allocationCreate.mutateAsync(
                  item.data as Parameters<typeof allocationCreate.mutateAsync>[0],
                );
                break;
              case 'document':
                await documentCreate.mutateAsync(
                  item.data as Parameters<typeof documentCreate.mutateAsync>[0],
                );
                break;
              case 'diary':
                await diaryCreate.mutateAsync(
                  item.data as Parameters<typeof diaryCreate.mutateAsync>[0],
                );
                break;
            }
            remove(item.id);
            toast.success(`${item.entityType} synced successfully`, { icon: '✓' });
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`Failed to sync ${item.entityType}: ${message}`, { icon: '❌' });
          } finally {
            processingRef.current.delete(item.id);
          }
        }, backoffMs);

        timeoutsRef.current.set(item.id, timeout);
      }
    }

    return () => {
      for (const timeout of timeoutsRef.current.values()) {
        clearTimeout(timeout);
      }
      timeoutsRef.current.clear();
    };
  }, [
    items,
    online,
    otherTabSyncing,
    remove,
    caseCreate,
    hearingCreate,
    allocationCreate,
    documentCreate,
    diaryCreate,
  ]);
}
