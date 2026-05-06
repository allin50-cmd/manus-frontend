import { useSyncQueue } from '@/contexts/SyncQueueContext';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useCrossTabSync } from '@/hooks/useCrossTabSync';
import { calculateBackoff } from '@/lib/backoffStrategy';
import { classifyError } from '@/lib/errorClassification';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

const MAX_SYNC_ATTEMPTS = 5;

export function useSyncRetry() {
  const { items, remove } = useSyncQueue();
  const online = useOnlineStatus();
  const { otherTabSyncing } = useCrossTabSync();
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const processingRef = useRef<Set<string>>(new Set());
  const exhaustedRef = useRef<Set<string>>(new Set());

  const caseCreate = trpc.cases.create.useMutation();
  const hearingCreate = trpc.hearings.create.useMutation();
  const allocationCreate = trpc.allocations.create.useMutation();
  const documentCreate = trpc.documents.create.useMutation();
  const diaryCreate = trpc.diary.create.useMutation();

  useEffect(() => {
    if (!online || otherTabSyncing) return;

    for (const item of items) {
      // Clear successful items
      if (!item.lastError) {
        exhaustedRef.current.delete(item.id);
        processingRef.current.delete(item.id);
        const timeout = timeoutsRef.current.get(item.id);
        if (timeout) {
          clearTimeout(timeout);
          timeoutsRef.current.delete(item.id);
        }
        continue;
      }

      // Skip already processing items
      if (processingRef.current.has(item.id)) continue;

      // Skip already exhausted items (only show toast once)
      if (item.attempts >= MAX_SYNC_ATTEMPTS && exhaustedRef.current.has(item.id)) continue;

      // Mark as exhausted and stop retrying
      if (item.attempts >= MAX_SYNC_ATTEMPTS) {
        exhaustedRef.current.add(item.id);
        toast.error(
          `${item.entityType} sync exhausted after ${MAX_SYNC_ATTEMPTS} attempts`,
          { icon: '❌', duration: 5000 },
        );
        continue;
      }

      const backoffMs = calculateBackoff(item.attempts, { maxAttempts: MAX_SYNC_ATTEMPTS });
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
          const classified = classifyError(error);
          if (!classified.isRetryable && item.attempts < MAX_SYNC_ATTEMPTS) {
            toast.error(`${item.entityType}: ${classified.message}`, { icon: '❌' });
          }
        } finally {
          processingRef.current.delete(item.id);
        }
      }, backoffMs);

      timeoutsRef.current.set(item.id, timeout);
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
