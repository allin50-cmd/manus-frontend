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
