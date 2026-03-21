// ============================================================================
// FineGuard Business Rules
// Deterministic, testable, isolated from UI and infrastructure
// ============================================================================

export type DeadlineStatus = 'safe' | 'due_soon' | 'urgent' | 'overdue' | 'handled';

export interface StatusResult {
  status: DeadlineStatus;
  label: string;
  reason: string;
  daysUntil: number | null;
}

// ─── Core Status Computation ──────────────────────────────────────────────────

/**
 * Compute deadline status based on days until due.
 *
 * Rules (deterministic):
 *   overdue  : daysUntil < 0
 *   urgent   : 0 <= daysUntil <= 7
 *   due_soon : 8 <= daysUntil <= 30
 *   safe     : daysUntil > 30
 */
export function computeStatus(deadlineDate: Date, today: Date = new Date()): StatusResult {
  const todayMidnight = startOfDay(today);
  const deadlineMidnight = startOfDay(deadlineDate);
  const daysUntil = diffDays(todayMidnight, deadlineMidnight);

  if (daysUntil < 0) {
    return {
      status: 'overdue',
      label: 'Overdue',
      reason: `Deadline was ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'} ago`,
      daysUntil,
    };
  }

  if (daysUntil <= 7) {
    return {
      status: 'urgent',
      label: 'Action needed now',
      reason: daysUntil === 0
        ? 'Due today'
        : `Due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`,
      daysUntil,
    };
  }

  if (daysUntil <= 30) {
    return {
      status: 'due_soon',
      label: 'Due soon',
      reason: `Due in ${daysUntil} days`,
      daysUntil,
    };
  }

  return {
    status: 'safe',
    label: 'No issues detected',
    reason: `Due in ${daysUntil} days`,
    daysUntil,
  };
}

/**
 * Given multiple deadlines, return the most urgent status.
 */
export function computeWorstStatus(
  deadlines: Array<{ date: Date; label: string }>,
  today: Date = new Date(),
): StatusResult & { deadlineLabel: string } {
  if (deadlines.length === 0) {
    return {
      status: 'safe',
      label: 'No issues detected',
      reason: 'No upcoming deadlines',
      daysUntil: null,
      deadlineLabel: '',
    };
  }

  const results = deadlines.map((d) => ({
    ...computeStatus(d.date, today),
    deadlineLabel: d.label,
  }));

  // Priority: overdue > urgent > due_soon > safe
  const priority: DeadlineStatus[] = ['overdue', 'urgent', 'due_soon', 'safe'];

  for (const p of priority) {
    const match = results.find((r) => r.status === p);
    if (match) return match;
  }

  return results[0];
}

// ─── Alert Threshold Computation ─────────────────────────────────────────────

export type AlertThreshold = 30 | 7 | 1 | 0;

export interface AlertTrigger {
  threshold: AlertThreshold;
  label: string;
  shouldTrigger: boolean;
}

/**
 * Return which alert thresholds should fire for a given deadline.
 *
 * Thresholds:
 *   30 days before (due_soon)
 *    7 days before (urgent)
 *    1 day before  (urgent)
 *    0 / overdue   (overdue)
 *
 * We only fire a threshold once (caller must check existingThresholds).
 */
export function computeAlertTriggers(
  deadlineDate: Date,
  today: Date = new Date(),
): AlertTrigger[] {
  const daysUntil = diffDays(startOfDay(today), startOfDay(deadlineDate));

  const THRESHOLDS: Array<{ threshold: AlertThreshold; label: string; range: [number, number] }> = [
    { threshold: 30, label: '30-day warning', range: [28, 30] },
    { threshold: 7, label: '7-day warning', range: [5, 7] },
    { threshold: 1, label: '1-day warning', range: [0, 1] },
    { threshold: 0, label: 'Overdue', range: [-Infinity, -1] },
  ];

  return THRESHOLDS.map(({ threshold, label, range }) => ({
    threshold,
    label,
    shouldTrigger: daysUntil >= range[0] && daysUntil <= range[1],
  }));
}

/**
 * Return a human-readable description of when an alert should trigger.
 */
export function alertThresholdMessage(threshold: AlertThreshold, deadlineType: string): string {
  switch (threshold) {
    case 30:
      return `${deadlineType} is due in approximately 30 days. Time to prepare.`;
    case 7:
      return `${deadlineType} is due in 7 days. File now to avoid penalties.`;
    case 1:
      return `${deadlineType} is due tomorrow. File immediately.`;
    case 0:
      return `${deadlineType} is overdue. File as soon as possible to minimise penalties.`;
  }
}

// ─── Status Label Mapping ─────────────────────────────────────────────────────

export const STATUS_UI: Record<
  DeadlineStatus,
  { label: string; colorClass: string; dotClass: string }
> = {
  safe: {
    label: 'No issues detected',
    colorClass: 'text-green-400',
    dotClass: 'bg-green-400',
  },
  due_soon: {
    label: 'Due soon',
    colorClass: 'text-amber-400',
    dotClass: 'bg-amber-400',
  },
  urgent: {
    label: 'Action needed now',
    colorClass: 'text-red-400',
    dotClass: 'bg-red-400',
  },
  overdue: {
    label: 'Overdue',
    colorClass: 'text-red-500',
    dotClass: 'bg-red-500',
  },
  handled: {
    label: 'Handled',
    colorClass: 'text-gray-400',
    dotClass: 'bg-gray-400',
  },
};

// ─── Utility Helpers ──────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function diffDays(from: Date, to: Date): number {
  const ms = to.getTime() - from.getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}
