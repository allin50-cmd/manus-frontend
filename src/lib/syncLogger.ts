export enum SyncLogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface SyncLogEntry {
  timestamp: number;
  level: SyncLogLevel;
  message: string;
  itemId?: string;
  entityType?: string;
  attempt?: number;
  metadata?: Record<string, unknown>;
}

class SyncLogger {
  private logs: SyncLogEntry[] = [];
  private maxLogs = 100;
  private enableConsole = process.env.NODE_ENV === 'development';

  log(
    message: string,
    level: SyncLogLevel = SyncLogLevel.INFO,
    options?: {
      itemId?: string;
      entityType?: string;
      attempt?: number;
      metadata?: Record<string, unknown>;
    },
  ) {
    const entry: SyncLogEntry = {
      timestamp: Date.now(),
      level,
      message,
      itemId: options?.itemId,
      entityType: options?.entityType,
      attempt: options?.attempt,
      metadata: options?.metadata,
    };

    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    if (this.enableConsole) {
      const prefix = `[Sync:${level.toUpperCase()}]`;
      const logFn =
        level === SyncLogLevel.ERROR
          ? console.error
          : level === SyncLogLevel.WARN
            ? console.warn
            : level === SyncLogLevel.DEBUG
              ? console.debug
              : console.log;
      logFn(prefix, message, options);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('clerkos:sync-logs', JSON.stringify(this.logs.slice(-20)));
    } catch {
      // Silently fail if localStorage is full
    }
  }

  debug(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log(message, SyncLogLevel.DEBUG, options);
  }

  info(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log(message, SyncLogLevel.INFO, options);
  }

  warn(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log(message, SyncLogLevel.WARN, options);
  }

  error(message: string, options?: Parameters<typeof this.log>[2]) {
    this.log(message, SyncLogLevel.ERROR, options);
  }

  getLogs(): SyncLogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    try {
      localStorage.removeItem('clerkos:sync-logs');
    } catch {
      // Silently fail
    }
  }
}

export const syncLogger = new SyncLogger();
