// ============================================================
// FineGuard — Digest Alert Scheduler
// ============================================================
//
// Sends daily/weekly digest alerts to users based on their
// preferences. Uses polling with 5-minute intervals to check
// if any digests are due.
// ============================================================

import { db } from '../db/index';
import { alertLogs, alertPreferences, users } from '../db/schema';
import { eq, gte, and, desc } from 'drizzle-orm';
import { buildComplianceAlert, formatAlertForEmail, formatAlertForTeams, type AlertTriggerType } from './alerts';
import { sendComplianceAlertViaOutlook, sendComplianceAlertViaTeams } from './m365';

interface PendingDigest {
  userId: string;
  userEmail: string;
  digestFrequency: 'daily' | 'weekly' | 'never';
  enabledChannels: string;
  minRiskThreshold: string;
  lastSentAt: Date | null;
}

// Track when digests were last sent per user (in-memory cache)
const lastDigestSentTime: Record<string, number> = {};

// Check interval: 5 minutes
const CHECK_INTERVAL_MS = 5 * 60 * 1000;

// Digest frequencies in milliseconds
const DIGEST_INTERVALS: Record<string, number> = {
  'daily': 24 * 60 * 60 * 1000,
  'weekly': 7 * 24 * 60 * 60 * 1000,
};

/**
 * Initialize the digest scheduler. Call this once at app startup.
 */
export function startDigestScheduler() {
  console.log('[DigestScheduler] Starting digest alert scheduler...');

  setInterval(async () => {
    try {
      await processDigestAlerts();
    } catch (error) {
      console.error('[DigestScheduler] Error processing digests:', error);
    }
  }, CHECK_INTERVAL_MS);

  console.log('[DigestScheduler] Digest scheduler running (checks every 5 minutes)');
}

/**
 * Process all pending digest alerts.
 */
async function processDigestAlerts() {
  try {
    // Fetch all users with digest alerts enabled
    const digestUsers = await db
      .select()
      .from(alertPreferences)
      .where((prefs) => {
        // Only users who want digests (not 'never')
        return prefs.digestFrequency !== 'never';
      });

    if (digestUsers.length === 0) {
      return;
    }

    const now = Date.now();

    // Process each user's digest
    for (const userPrefs of digestUsers) {
      const isDue = isDigestDue(userPrefs.userId, userPrefs.digestFrequency, now);
      if (!isDue) {
        continue;
      }

      // Get user email
      const userRecord = await db
        .select()
        .from(users)
        .where(eq(users.id, userPrefs.userId))
        .limit(1);

      if (!userRecord[0]) {
        continue;
      }

      // Fetch recent alerts for this user
      const recentAlerts = await db
        .select()
        .from(alertLogs)
        .where(
          and(
            eq(alertLogs.clientId, userPrefs.userId),
            gte(alertLogs.sentAt, new Date(now - DIGEST_INTERVALS[userPrefs.digestFrequency as keyof typeof DIGEST_INTERVALS] || 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(alertLogs.sentAt));

      if (recentAlerts.length === 0) {
        // Update last sent time even if no alerts
        lastDigestSentTime[userPrefs.userId] = now;
        continue;
      }

      // Send digest
      await sendDigestToUser(
        userPrefs.userId,
        userRecord[0].email,
        recentAlerts,
        userPrefs.enabledChannels,
        userPrefs.digestFrequency as AlertTriggerType
      );

      // Mark as sent
      lastDigestSentTime[userPrefs.userId] = now;
    }
  } catch (error) {
    console.error('[DigestScheduler] Error in processDigestAlerts:', error);
  }
}

/**
 * Check if a digest is due for a user based on frequency.
 */
function isDigestDue(userId: string, frequency: string, now: number): boolean {
  if (frequency === 'never') {
    return false;
  }

  const lastSent = lastDigestSentTime[userId] || 0;
  const interval = DIGEST_INTERVALS[frequency as keyof typeof DIGEST_INTERVALS] || 24 * 60 * 60 * 1000;

  return now - lastSent >= interval;
}

/**
 * Send a digest of alerts to a user.
 */
async function sendDigestToUser(
  userId: string,
  userEmail: string,
  alerts: typeof alertLogs.$inferSelect[],
  enabledChannels: string,
  frequency: AlertTriggerType
): Promise<void> {
  try {
    const digestContent = formatDigestAlerts(alerts);

    // Send via Outlook if enabled
    if (enabledChannels.includes('outlook')) {
      const { subject, htmlBody } = formatDigestForEmail(digestContent, frequency);
      const result = await sendComplianceAlertViaOutlook([userEmail], subject, htmlBody);
      if (!result.success) {
        console.error(`[DigestScheduler] Failed to send Outlook digest to ${userEmail}:`, result.message);
      }
    }

    // Teams digest would require team/channel ID which we don't have in this context
    // In a production setup, you'd store team/channel preferences per user
    if (enabledChannels.includes('teams')) {
      console.warn(`[DigestScheduler] Teams digest support requires user channel preferences (not yet implemented)`);
    }

    console.log(`[DigestScheduler] Sent ${frequency} digest to ${userEmail} with ${alerts.length} alerts`);
  } catch (error) {
    console.error('[DigestScheduler] Error sending digest:', error);
  }
}

/**
 * Format multiple alerts into digest summary.
 */
function formatDigestAlerts(
  alerts: typeof alertLogs.$inferSelect[]
): {
  totalAlerts: number;
  criticalAlerts: Array<typeof alertLogs.$inferSelect>;
  highAlerts: Array<typeof alertLogs.$inferSelect>;
  mediumAlerts: Array<typeof alertLogs.$inferSelect>;
} {
  return {
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.riskLevel === 'Critical'),
    highAlerts: alerts.filter((a) => a.riskLevel === 'High'),
    mediumAlerts: alerts.filter((a) => a.riskLevel === 'Medium'),
  };
}

/**
 * Format digest alerts as an HTML email.
 */
function formatDigestForEmail(
  digest: ReturnType<typeof formatDigestAlerts>,
  frequency: string
): {
  subject: string;
  htmlBody: string;
} {
  const frequencyText = frequency === 'daily' ? 'Daily' : 'Weekly';

  const alertRows = [
    ...digest.criticalAlerts.map((a) => createAlertRow(a, 'Critical')),
    ...digest.highAlerts.map((a) => createAlertRow(a, 'High')),
    ...digest.mediumAlerts.map((a) => createAlertRow(a, 'Medium')),
  ].join('');

  return {
    subject: `[FineGuard] ${frequencyText} Compliance Alert Digest — ${digest.totalAlerts} alerts`,
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5A4BFF 0%, #6B5BFF 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🛡️ FineGuard ${frequencyText} Digest</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">You have ${digest.totalAlerts} compliance alerts</p>
        </div>

        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px; background: #f8fafc;">
          <!-- Summary Stats -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px;">
            <div style="background: #dc2626; color: white; padding: 16px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${digest.criticalAlerts.length}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Critical</p>
            </div>
            <div style="background: #ea580c; color: white; padding: 16px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${digest.highAlerts.length}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">High</p>
            </div>
            <div style="background: #ca8a04; color: white; padding: 16px; border-radius: 8px; text-align: center;">
              <p style="margin: 0; font-size: 24px; font-weight: bold;">${digest.mediumAlerts.length}</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Medium</p>
            </div>
          </div>

          <!-- Alert List -->
          <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #0f172a;">Alerts</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #e2e8f0;">
                <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600; font-size: 12px;">Company</th>
                <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600; font-size: 12px;">Issue</th>
                <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600; font-size: 12px;">Risk</th>
                <th style="padding: 12px 16px; text-align: left; color: #64748b; font-weight: 600; font-size: 12px;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${alertRows}
            </tbody>
          </table>

          <!-- CTA Button -->
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://app.fineguard.io/dashboard"
               style="display: inline-block; background: #5A4BFF; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View Full Dashboard
            </a>
          </div>

          <!-- Footer -->
          <p style="margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            You're receiving this because you have compliance alerts enabled. Adjust your preferences in the FineGuard dashboard.
          </p>
        </div>
      </div>
    `,
  };
}

/**
 * Create an HTML table row for a single alert.
 */
function createAlertRow(
  alert: typeof alertLogs.$inferSelect,
  riskLevel: string
): string {
  const riskColors: Record<string, string> = {
    Critical: '#dc2626',
    High: '#ea580c',
    Medium: '#ca8a04',
  };

  const riskColor = riskColors[riskLevel] || '#64748b';
  const date = alert.sentAt ? new Date(alert.sentAt).toLocaleDateString() : 'N/A';

  return `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 12px 16px; color: #0f172a; font-size: 13px;">${escapeHtml(alert.companyName)}</td>
      <td style="padding: 12px 16px; color: #0f172a; font-size: 13px;">${escapeHtml(alert.alertType)}</td>
      <td style="padding: 12px 16px; font-size: 13px;">
        <span style="display: inline-block; background: ${riskColor}1a; color: ${riskColor}; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">
          ${riskLevel}
        </span>
      </td>
      <td style="padding: 12px 16px; color: #64748b; font-size: 13px;">${date}</td>
    </tr>
  `;
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
