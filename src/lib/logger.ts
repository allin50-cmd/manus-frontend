/**
 * Minimal structured logger.
 *
 * Outputs newline-delimited JSON in production (NODE_ENV=production) and
 * human-readable console output otherwise.  Swap for pino/winston by
 * replacing this module — all callers use the same `log` interface.
 *
 * Use log.withContext(fields) to bind correlation fields (companyNumber,
 * tenantId, stripeEventId, workflowId) to every log line in a handler/service
 * without passing them manually on each call.
 */

type Level = 'debug' | 'info' | 'warn' | 'error';
type Fields = Record<string, unknown>;

export interface BoundLogger {
  debug(message: string, fields?: Fields): void;
  info(message: string, fields?: Fields): void;
  warn(message: string, fields?: Fields): void;
  error(message: string, fields?: Fields): void;
}

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

  /**
   * Returns a logger with the given fields merged into every log line.
   * Caller fields (passed per-call) override context fields on collision.
   *
   * @example
   * const elog = log.withContext({ stripeEventId: event.id, eventType: event.type });
   * elog.info('processing event'); // → includes stripeEventId + eventType automatically
   */
  withContext(context: Fields): BoundLogger {
    return {
      debug: (msg, fields) => emit('debug', msg, { ...context, ...fields }),
      info:  (msg, fields) => emit('info',  msg, { ...context, ...fields }),
      warn:  (msg, fields) => emit('warn',  msg, { ...context, ...fields }),
      error: (msg, fields) => emit('error', msg, { ...context, ...fields }),
    };
  },
};
