import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  autoScroll?: boolean;
  className?: string;
  maxHeight?: string;
}

const levelColour: Record<LogEntry['level'], string> = {
  info:    'text-blue-400',
  warn:    'text-amber-400',
  error:   'text-red-400',
  success: 'text-green-400',
};

export function LogViewer({ logs, autoScroll = true, className, maxHeight = '20rem' }: LogViewerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  return (
    <div
      className={cn(
        'overflow-y-auto rounded-xl bg-gray-950 p-4 font-mono text-xs leading-relaxed',
        className,
      )}
      style={{ maxHeight }}
    >
      {logs.length === 0 && (
        <p className="text-gray-500">No log output yet.</p>
      )}
      {logs.map((entry, i) => (
        <div key={i} className="flex gap-3">
          <span className="shrink-0 text-gray-500">{entry.timestamp}</span>
          <span className={cn('shrink-0 w-14 uppercase font-semibold', levelColour[entry.level])}>
            {entry.level}
          </span>
          <span className="text-gray-200 break-all">{entry.message}</span>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
