/**
 * Returns the number of whole days between now and the given date.
 * Negative values indicate the date is in the past (overdue).
 */
export function daysUntil(date: Date | string): number {
  const target = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  // Zero out time components to compare calendar days
  const targetDay = Date.UTC(
    target.getFullYear(),
    target.getMonth(),
    target.getDate(),
  );
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = targetDay - todayDay;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/** Format a Date as an ISO 8601 date string (YYYY-MM-DD) */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Map a remaining-day count to a Temporal duration string for workflow waits.
 *
 * > 30 days  → '14d'
 * 14–30 days → '7d'
 *  7–14 days → '3d'
 *  0–7 days  → '24h'
 * overdue    → '6h'
 */
export function toTemporalDuration(daysRemaining: number): string {
  if (daysRemaining > 30) return '14d';
  if (daysRemaining > 14) return '7d';
  if (daysRemaining > 7) return '3d';
  if (daysRemaining > 0) return '24h';
  return '6h';
}
