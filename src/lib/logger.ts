/**
 * Minimal structured logger.
 *
 * Outputs newline-delimited JSON in production (NODE_ENV=production) and
 * human-readable console output otherwise.  Swap for pino/winston by
 * replacing this module — all callers use the same `log` interface.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

function emit(level: Level, message: string, fields?: Fields): void {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };

  if (process.env.NODE_ENV === 'production') {
    // NDJSON — log aggregators (Azure Monitor, Datadog, etc.) can parse this
    process.stdout.write(JSON.stringify(entry) + '\n');
  } else {
    const fn =
      level === 'error' ? console.error
      : level === 'warn' ? console.warn
      : console.log;
    fn(`[${level.toUpperCase()}] ${message}`, fields ?? '');
  }
}

export const log = {
  debug: (message: string, fields?: Fields) => emit('debug', message, fields),
  info:  (message: string, fields?: Fields) => emit('info',  message, fields),
  warn:  (message: string, fields?: Fields) => emit('warn',  message, fields),
  error: (message: string, fields?: Fields) => emit('error', message, fields),
};
