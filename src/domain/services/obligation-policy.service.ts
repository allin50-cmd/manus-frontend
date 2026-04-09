import type { AlertUrgency, AlertChannel } from '../types/alert';

export interface AlertPolicy {
  shouldAlert: boolean;
  urgency: AlertUrgency;
  channels: AlertChannel[];
}

/**
 * Determine whether an alert should fire and with what urgency/channels
 * based on how many calendar days remain until the obligation due date.
 *
 * Returns null when no alert is needed (> 30 days remaining — dashboard only).
 */
export function getAlertPolicy(daysRemaining: number): AlertPolicy | null {
  if (daysRemaining > 30) {
    // Too early — no notification needed yet
    return null;
  }

  if (daysRemaining > 14) {
    // 14 < days <= 30: low urgency, email only
    return { shouldAlert: true, urgency: 'low', channels: ['email'] };
  }

  if (daysRemaining > 7) {
    // 7 < days <= 14: medium urgency, email only
    return { shouldAlert: true, urgency: 'medium', channels: ['email'] };
  }

  // days <= 7 (including overdue): urgent, email + SMS
  return { shouldAlert: true, urgency: 'urgent', channels: ['email', 'sms'] };
}

/**
 * Determine the check interval (Temporal duration string) based on
 * how many days remain until due date.
 *
 * > 30 days  → '14d'
 * 14–30 days → '7d'
 *  7–14 days → '3d'
 *  0–7 days  → '24h'
 *  overdue   → '24h'
 */
export function getCheckInterval(daysRemaining: number): string {
  if (daysRemaining > 30) return '14d';
  if (daysRemaining > 14) return '7d';
  if (daysRemaining > 7) return '3d';
  return '24h';
}
