export interface SyncMetrics {
  totalAttempted: number;
  totalSuccessful: number;
  totalFailed: number;
  totalExhausted: number;
  successRate: number;
  averageAttemptsPerItem: number;
  errorCounts: Record<string, number>;
  totalTime: number;
}

export interface SyncEvent {
  timestamp: number;
  type: 'attempt' | 'success' | 'failure' | 'exhausted';
  entityType: string;
  errorType?: string;
  attempts: number;
}

class SyncAnalytics {
  private events: SyncEvent[] = [];
  private maxEvents = 500;

  recordAttempt(entityType: string, attempts: number) {
    this.addEvent('attempt', entityType, undefined, attempts);
  }

  recordSuccess(entityType: string, attempts: number) {
    this.addEvent('success', entityType, undefined, attempts);
  }

  recordFailure(entityType: string, errorType: string, attempts: number) {
    this.addEvent('failure', entityType, errorType, attempts);
  }

  recordExhausted(entityType: string, attempts: number) {
    this.addEvent('exhausted', entityType, undefined, attempts);
  }

  private addEvent(type: SyncEvent['type'], entityType: string, errorType?: string, attempts?: number) {
    const event: SyncEvent = {
      timestamp: Date.now(),
      type,
      entityType,
      errorType,
      attempts: attempts || 0,
    };

    this.events.push(event);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    this.persistEvents();
  }

  getMetrics(): SyncMetrics {
    const successes = this.events.filter((e) => e.type === 'success').length;
    const failures = this.events.filter((e) => e.type === 'failure').length;
    const exhausted = this.events.filter((e) => e.type === 'exhausted').length;
    const total = successes + failures + exhausted;

    const errorCounts: Record<string, number> = {};
    this.events
      .filter((e) => e.type === 'failure' && e.errorType)
      .forEach((e) => {
        errorCounts[e.errorType!] = (errorCounts[e.errorType!] || 0) + 1;
      });

    const totalAttempts = this.events.reduce((sum, e) => sum + e.attempts, 0);
    const avgAttempts = total > 0 ? totalAttempts / total : 0;

    const firstEvent = this.events[0];
    const lastEvent = this.events[this.events.length - 1];
    const totalTime = firstEvent && lastEvent ? lastEvent.timestamp - firstEvent.timestamp : 0;

    return {
      totalAttempted: this.events.filter((e) => e.type === 'attempt').length,
      totalSuccessful: successes,
      totalFailed: failures,
      totalExhausted: exhausted,
      successRate: total > 0 ? (successes / total) * 100 : 0,
      averageAttemptsPerItem: avgAttempts,
      errorCounts,
      totalTime,
    };
  }

  getEvents(): SyncEvent[] {
    return [...this.events];
  }

  clear() {
    this.events = [];
    try {
      localStorage.removeItem('clerkos:sync-analytics');
    } catch {
      // Silently fail
    }
  }

  private persistEvents() {
    try {
      localStorage.setItem('clerkos:sync-analytics', JSON.stringify(this.events.slice(-50)));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  private loadEvents() {
    try {
      const stored = localStorage.getItem('clerkos:sync-analytics');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch {
      // Silently fail
    }
  }
}

export const syncAnalytics = new SyncAnalytics();
