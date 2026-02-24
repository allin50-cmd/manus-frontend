/**
 * Audit Buffer Service
 * Buffers audit events locally and flushes them to the VaultLine backend
 */
import type { AuditEvent, AuditEventType, AuditSeverity } from '@/types/audit';
import { generateId } from '@/lib/utils';

const QUEUE_KEY = 'vaultline-audit-queue';
const MAX_QUEUE_SIZE = 500;

function loadQueue(): AuditEvent[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: AuditEvent[]): void {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full — drop oldest entries
    const trimmed = queue.slice(-100);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(trimmed));
  }
}

/** Add an audit event to the local buffer */
export async function bufferEvent(
  type: AuditEventType,
  action: string,
  options: {
    severity?: AuditSeverity;
    resource?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    userId?: string;
    userName?: string;
  } = {}
): Promise<void> {
  const event: AuditEvent = {
    id: generateId('audit'),
    type,
    severity: options.severity ?? 'info',
    userId: options.userId ?? 'system',
    userName: options.userName ?? 'System',
    tenantId: 'default',
    resource: options.resource,
    resourceId: options.resourceId,
    action,
    status: 'success',
    metadata: options.metadata,
    timestamp: new Date().toISOString(),
  };

  const queue = loadQueue();
  queue.push(event);

  // Cap queue size
  if (queue.length > MAX_QUEUE_SIZE) {
    queue.splice(0, queue.length - MAX_QUEUE_SIZE);
  }

  saveQueue(queue);
}

/** Flush buffered events to the backend */
export async function flushQueue(
  uploadFn?: (events: AuditEvent[]) => Promise<void>
): Promise<{ flushed: number }> {
  const queue = loadQueue();
  if (!queue.length) return { flushed: 0 };

  if (uploadFn) {
    await uploadFn(queue);
  } else {
    // Default: POST to backend
    try {
      await fetch('/api/audit/flush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: queue }),
      });
    } catch {
      // Network unavailable — keep in queue
      return { flushed: 0 };
    }
  }

  const count = queue.length;
  localStorage.removeItem(QUEUE_KEY);
  return { flushed: count };
}

/** Get all buffered events (for display) */
export function getBufferedEvents(): AuditEvent[] {
  return loadQueue();
}

/** Get queue size */
export function getQueueSize(): number {
  return loadQueue().length;
}

/** Clear the queue without flushing */
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

// Auto-flush on page visibility change (user switches back to app)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && navigator.onLine) {
      flushQueue().catch(() => {});
    }
  });
}
