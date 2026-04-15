import { daysUntil } from '@/lib/time';
import { fireZapierHooks } from '@/lib/zapier/fire-hook';
import { insertDispatchIfNew } from '@/server/repositories/dispatchedNotifications.repo';
import { log } from '@/lib/logger';
import { ALERT_LABELS } from '@/types/alerts';
import type { AlertType } from '@/types/alerts';

// ── Alert windows ─────────────────────────────────────────────────────────────

/**
 * The four notification windows (in days-before-deadline).
 * A window fires once when daysRemaining first falls at or below the threshold.
 */
export const ALERT_WINDOWS = [60, 30, 14, 7] as const;
export type AlertWindow = (typeof ALERT_WINDOWS)[number];

/** Map window → urgency label carried in the Zapier payload. */
const URGENCY: Record<AlertWindow, 'low' | 'medium' | 'urgent'> = {
  60: 'low',
  30: 'medium',
  14: 'urgent',
  7: 'urgent',
};

/**
 * Returns every ALERT_WINDOW threshold that the given `daysLeft` value has
 * crossed.  For example, daysLeft=12 has crossed the 60-, 30- and 14-day
 * thresholds — so the cron must fire (or skip if already dispatched) all three.
 *
 * This means even if the cron was offline for several days the correct set of
 * notifications will still be dispatched on the next run; deduplication in the
 * DB prevents double-firing.
 */
export function activatedWindows(daysLeft: number): AlertWindow[] {
  return ALERT_WINDOWS.filter((w) => daysLeft <= w);
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DeadlineInfo {
  alertType: AlertType;
  /** ISO date string YYYY-MM-DD */
  dueDate: string;
  /** Calendar days until due; negative = overdue */
  daysLeft: number;
}

export interface NotificationRecord {
  dedupeKey: string;
  alertType: AlertType;
  dueDate: string;
  daysLeft: number;
  windowDays: AlertWindow;
  urgency: 'low' | 'medium' | 'urgent';
  /** true = fired to Zapier; false = already dispatched (skipped) */
  fired: boolean;
  hooksDelivered: number;
  hooksFailed: number;
  error?: string;
}

export interface CompanyDispatchResult {
  companyNumber: string;
  companyName: string;
  deadlinesChecked: number;
  notifications: NotificationRecord[];
  fired: number;
  skipped: number;
  errors: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function humanDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildMessage(alertLabel: string, daysLeft: number, dueDate: string): string {
  const d = humanDate(dueDate);
  if (daysLeft < 0) {
    const n = Math.abs(daysLeft);
    return `${alertLabel} is overdue by ${n} day${n !== 1 ? 's' : ''} (was due ${d}). File immediately to limit penalties.`;
  }
  if (daysLeft === 0) {
    return `${alertLabel} is due today (${d}). File now to avoid a penalty.`;
  }
  return `${alertLabel} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} (${d}).`;
}

// ── Core dispatch ─────────────────────────────────────────────────────────────

/**
 * Dispatches deadline alert notifications for a single company.
 *
 * For each deadline, all crossed alert windows are checked.  If the
 * dispatch record for a window is not yet in the DB it fires the Zapier
 * `compliance.alert` event and records the dispatch.  If the record
 * already exists it is silently skipped (idempotent).
 *
 * Returns a detailed per-notification log suitable for inclusion in the
 * cron endpoint's full JSON response.
 */
export async function dispatchAlertsForCompany(
  companyNumber: string,
  companyName: string,
  deadlines: DeadlineInfo[],
): Promise<CompanyDispatchResult> {
  const notifications: NotificationRecord[] = [];

  for (const deadline of deadlines) {
    const { alertType, dueDate, daysLeft } = deadline;
    const alertLabel = ALERT_LABELS[alertType] ?? alertType;
    const windows = activatedWindows(daysLeft);

    for (const windowDays of windows) {
      const dedupeKey = `${companyNumber}:${alertType}:${dueDate}:w${windowDays}`;
      const urgency = URGENCY[windowDays];
      const record: NotificationRecord = {
        dedupeKey,
        alertType,
        dueDate,
        daysLeft,
        windowDays,
        urgency,
        fired: false,
        hooksDelivered: 0,
        hooksFailed: 0,
      };

      try {
        const isNew = await insertDispatchIfNew(dedupeKey, {
          companyNumber,
          alertType,
          dueDate,
          windowDays,
        });

        if (!isNew) {
          // Already dispatched in a previous run — skip
          notifications.push(record);
          continue;
        }

        const payload = {
          id: dedupeKey,
          companyNumber,
          companyName,
          alertType,
          alertLabel,
          dueDate,
          daysRemaining: daysLeft,
          urgency,
          windowDays,
          overdue: daysLeft < 0,
          message: buildMessage(alertLabel, daysLeft, dueDate),
          firedAt: new Date().toISOString(),
        };

        const hookResult = await fireZapierHooks('compliance.alert', payload);

        record.fired = true;
        record.hooksDelivered = hookResult.delivered;
        record.hooksFailed = hookResult.failed;

        log.info('[dispatcher] Alert dispatched', {
          companyNumber,
          alertType,
          dueDate,
          daysLeft,
          windowDays,
          hooksDelivered: hookResult.delivered,
        });
      } catch (err) {
        record.error = String(err);
        log.error('[dispatcher] Failed to dispatch alert', {
          companyNumber,
          alertType,
          dueDate,
          windowDays,
          err,
        });
      }

      notifications.push(record);
    }
  }

  return {
    companyNumber,
    companyName,
    deadlinesChecked: deadlines.length,
    notifications,
    fired: notifications.filter((n) => n.fired).length,
    skipped: notifications.filter((n) => !n.fired && !n.error).length,
    errors: notifications.filter((n) => Boolean(n.error)).length,
  };
}

// ── Convenience re-export for test mocking ───────────────────────────────────
export { daysUntil };
