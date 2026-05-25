import { randomUUID } from 'crypto';

const isProd = process.env.NODE_ENV === 'production';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  event: string;
  correlationId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export function generateCorrelationId(): string {
  return randomUUID();
}

export function log(entry: LogEntry): void {
  const { level, ...rest } = entry;
  if (isProd) {
    // Machine-readable JSON — one line per event for log aggregators
    process.stdout.write(JSON.stringify({ ...rest, ts: new Date().toISOString() }) + '\n');
  } else {
    const { event, correlationId, durationMs, ...fields } = rest;
    const cid = correlationId ? ` [${correlationId.slice(0, 8)}]` : '';
    const dur = durationMs !== undefined ? ` (${durationMs}ms)` : '';
    const extra = Object.keys(fields).length
      ? ' ' + JSON.stringify(fields, null, 0)
      : '';
    const line = `${event}${cid}${dur}${extra}`;
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
  }
}
