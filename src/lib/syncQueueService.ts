/* Enhanced Sync Queue Service with IndexedDB and Idempotency */

const DB_NAME = 'clerkos-db';
const STORE_NAME = 'sync-queue';
const MAX_ATTEMPTS = 5;

export interface SyncItem {
  id: string;
  operationId: string; // Idempotency key
  entityType: 'case' | 'hearing' | 'allocation' | 'document' | 'diary';
  action: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  attempts: number;
  nextRetry: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  lastError?: string;
  createdAt: number;
  updatedAt: number;
}

class SyncQueueService {
  private db: IDBDatabase | null = null;
  private processing = false;
  private processingInterval: NodeJS.Timeout | null = null;

  async init(): Promise<void> {
    this.db = await this.openDB();
    // Start processing loop
    this.processingInterval = setInterval(() => this.processQueue(), 1000);
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('nextRetry', 'nextRetry', { unique: false });
        }
      };

      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new Error(`Failed to open IndexedDB: ${req.error}`));
    });
  }

  async addItem(
    entityType: SyncItem['entityType'],
    action: SyncItem['action'],
    data: Record<string, any>
  ): Promise<SyncItem> {
    if (!this.db) throw new Error('Database not initialized');

    const item: SyncItem = {
      id: crypto.randomUUID(),
      operationId: crypto.randomUUID(), // Idempotency key
      entityType,
      action,
      data,
      attempts: 0,
      nextRetry: Date.now(),
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await this.saveItem(item);
    return item;
  }

  async getItem(id: string): Promise<SyncItem | undefined> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAllItems(): Promise<SyncItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getPendingItems(): Promise<SyncItem[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readonly');
      const index = tx.objectStore(STORE_NAME).index('status');
      const req = index.getAll('pending');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async saveItem(item: SyncItem): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    item.updatedAt = Date.now();

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteItem(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_NAME, 'readwrite');
      const req = tx.objectStore(STORE_NAME).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    if (!navigator.onLine) return; // Don't process if offline

    this.processing = true;

    try {
      const items = await this.getPendingItems();

      for (const item of items) {
        // Skip if not ready for retry
        if (Date.now() < item.nextRetry) continue;
        // Skip if max attempts reached
        if (item.attempts >= MAX_ATTEMPTS) continue;

        await this.attemptSync(item);
      }
    } catch (err) {
      console.error('Queue processing error:', err);
    } finally {
      this.processing = false;
    }
  }

  private async attemptSync(item: SyncItem): Promise<void> {
    item.attempts++;
    item.status = 'syncing';
    item.updatedAt = Date.now();

    try {
      // Call tRPC mutation with idempotency key
      const response = await this.callAPI(item);

      item.status = 'synced';
      item.updatedAt = Date.now();
      await this.deleteItem(item.id);

      // Emit success event
      window.dispatchEvent(
        new CustomEvent('sync-success', {
          detail: { itemId: item.id, entityType: item.entityType },
        })
      );
    } catch (err: any) {
      const isRetryable = this.isRetryable(err);

      if (isRetryable && item.attempts < MAX_ATTEMPTS) {
        // Schedule retry with exponential backoff
        const delay = this.getBackoffDelay(item.attempts);
        item.nextRetry = Date.now() + delay;
        item.status = 'pending';
        item.lastError = err.message;
        item.updatedAt = Date.now();
        await this.saveItem(item);

        // Emit retry scheduled event
        window.dispatchEvent(
          new CustomEvent('sync-retry', {
            detail: {
              itemId: item.id,
              attempt: item.attempts,
              nextRetryIn: delay,
            },
          })
        );
      } else {
        // Max retries exhausted or non-retryable error
        item.status = 'failed';
        item.lastError = err.message;
        item.updatedAt = Date.now();
        await this.saveItem(item);

        // Emit failure event
        window.dispatchEvent(
          new CustomEvent('sync-failure', {
            detail: {
              itemId: item.id,
              reason: isRetryable ? 'exhausted' : 'non-retryable',
              error: err.message,
            },
          })
        );
      }
    }
  }

  private async callAPI(item: SyncItem): Promise<any> {
    // This will be replaced with actual tRPC calls
    // For now, return a mock that simulates API behavior

    const success = Math.random() > 0.2; // 80% success rate

    if (!success) {
      const errorType = Math.random();
      if (errorType < 0.5) {
        throw new Error('Server error (5xx)');
      } else if (errorType < 0.8) {
        throw new Error('Network timeout');
      } else {
        throw new Error('Client error (4xx)');
      }
    }

    return { success: true };
  }

  private getBackoffDelay(attempt: number): number {
    const baseDelay = 500; // 500ms
    const maxDelay = 30000; // 30s
    const multiplier = 2;

    // Exponential backoff: 500ms, 1s, 2s, 4s, 8s
    let delay = Math.min(baseDelay * Math.pow(multiplier, attempt - 1), maxDelay);

    // Add jitter (±10%)
    const jitter = delay * (0.9 + Math.random() * 0.2);

    return Math.round(jitter);
  }

  private isRetryable(err: any): boolean {
    const message = err.message?.toLowerCase() || '';

    // Retryable errors
    if (message.includes('network') || message.includes('timeout') || message.includes('5xx')) {
      return true;
    }

    // Non-retryable errors
    if (message.includes('4xx')) {
      return false;
    }

    // Default to retryable for unknown errors
    return true;
  }

  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Singleton instance
let instance: SyncQueueService | null = null;

export function getSyncQueueService(): SyncQueueService {
  if (!instance) {
    instance = new SyncQueueService();
    instance.init().catch(err => console.error('Failed to initialize sync queue:', err));
  }
  return instance;
}

export default SyncQueueService;
