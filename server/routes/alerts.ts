// ============================================================
// FineGuard — Alert API Routes
// ============================================================
//
// Handles compliance alert triggering, preferences, and logs.
// Integrates with M365 for Outlook + Teams delivery.
// ============================================================

import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { alertLogs, alertPreferences, users, monitoredCompanies } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { authenticateRequest } from '../middleware/auth';
import {
  buildComplianceAlert,
  formatAlertForEmail,
  formatAlertForTeams,
  passesThreshold,
  type AlertChannel,
  type AlertTriggerType,
} from '../services/alerts';
import { sendComplianceAlertViaOutlook, sendComplianceAlertViaTeams } from '../services/m365';

const router = Router();

// ── POST /alerts/trigger ────────────────────────────────────
// Send a compliance alert (real-time, manual, or threshold-based)

router.post('/alerts/trigger', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { companyId, companyName, issueType, title, description, riskLevel, deadline, triggerType, advisorId } =
      req.body;

    // Validate required fields
    if (!companyId || !companyName || !issueType || !title || !riskLevel) {
      return res.status(400).json({
        ok: false,
        error: 'Missing required fields: companyId, companyName, issueType, title, riskLevel',
      });
    }

    // Get alert preferences for this user
    const prefs = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, auth.userId))
      .limit(1);

    const userPrefs = prefs[0];

    // Check threshold filter
    if (!userPrefs || !passesThreshold(riskLevel as any, userPrefs.minRiskThreshold as any)) {
      return res.json({ ok: true, filtered: true, message: 'Alert filtered by threshold preference' });
    }

    // Get advisor info if provided
    let advisorEmail: string | undefined;
    if (advisorId) {
      const advisor = await db.select().from(users).where(eq(users.id, advisorId)).limit(1);
      advisorEmail = advisor[0]?.email;
    }

    // Build alert payload
    const alert = buildComplianceAlert(
      {
        eventId: `event_${Date.now()}`,
        eventType: issueType,
        firmId: companyId,
        firmName: companyName,
        riskLevel: riskLevel as any,
        title,
        description,
        dueDate: deadline,
        createdAt: new Date().toISOString(),
      },
      auth.userId,
      companyName,
      advisorId
    );

    alert.triggerType = (triggerType || 'manual') as AlertTriggerType;
    alert.channel = (userPrefs?.enabledChannels.split(',')[0] as AlertChannel) || 'outlook';

    // Set recipients
    alert.recipients.client = [auth.user?.email || ''].filter(Boolean);
    if (advisorEmail) {
      alert.recipients.advisor = [advisorEmail];
    }

    // Use channels from request body if provided, otherwise fall back to preferences
    const requestedChannels = req.body.channels as string[] | undefined;
    const enabledChannels = requestedChannels
      ? requestedChannels.join(',')
      : userPrefs?.enabledChannels || 'outlook';

    // Format and send alerts
    let sentCount = 0;
    const errors: string[] = [];

    if (enabledChannels.includes('outlook')) {
      const { subject, htmlBody } = formatAlertForEmail(alert);
      const allRecipients = [...(alert.recipients.client || []), ...(alert.recipients.advisor || [])];

      const result = await sendComplianceAlertViaOutlook(allRecipients, subject, htmlBody);
      if (result.success) {
        sentCount += allRecipients.length;
      } else {
        errors.push(`Outlook: ${result.message}`);
      }
    }

    if (enabledChannels.includes('teams')) {
      const teamsTeamId = process.env['TEAMS_TEAM_ID'];
      const teamsChannelId = process.env['TEAMS_CHANNEL_ID'];

      if (teamsTeamId && teamsChannelId) {
        const adaptiveCard = formatAlertForTeams(alert);
        const teamsResult = await sendComplianceAlertViaTeams(teamsTeamId, teamsChannelId, adaptiveCard);
        if (teamsResult.success) {
          sentCount += 1;
        } else {
          errors.push(`Teams: ${teamsResult.message}`);
        }
      } else {
        errors.push('Teams: TEAMS_TEAM_ID or TEAMS_CHANNEL_ID not configured');
      }
    }

    // Log the alert
    const [logEntry] = await db
      .insert(alertLogs)
      .values({
        clientId: auth.userId,
        advisorId: advisorId,
        companyId,
        companyName,
        alertType: issueType,
        title,
        description,
        riskLevel: riskLevel as any,
        channels: enabledChannels,
        triggerType: (triggerType || 'manual') as AlertTriggerType,
        recipientCount: sentCount,
        status: errors.length === 0 ? 'sent' : 'failed',
        metadata: JSON.stringify({
          deadline,
          estimatedPenalty: alert.estimatedPenalty,
          recommendations: alert.recommendedActions,
        }),
        failureReason: errors.length > 0 ? errors.join('; ') : undefined,
      })
      .returning();

    return res.json({
      ok: true,
      alertId: alert.id,
      logId: logEntry?.id,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error triggering alert:', error);
    res.status(500).json({ ok: false, error: 'Failed to send alert' });
  }
});

// ── GET /alerts/preferences ─────────────────────────────────
// Get user's alert delivery preferences

router.get('/alerts/preferences', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const prefs = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, auth.userId))
      .limit(1);

    const userPrefs = prefs[0];

    // Return defaults if no preferences exist
    const defaultPrefs = {
      digestFrequency: 'daily',
      minRiskThreshold: 'Medium',
      enabledChannels: 'outlook,teams',
      includeAttachments: true,
      includeRecommendations: true,
      enableAutomatic: true,
      enableThresholdAlerts: true,
    };

    return res.json({
      ok: true,
      preferences: userPrefs || defaultPrefs,
    });
  } catch (error) {
    console.error('Error fetching alert preferences:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch preferences' });
  }
});

// ── PUT /alerts/preferences ─────────────────────────────────
// Update alert delivery preferences

router.put('/alerts/preferences', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const {
      digestFrequency,
      minRiskThreshold,
      enabledChannels,
      includeAttachments,
      includeRecommendations,
      enableAutomatic,
      enableThresholdAlerts,
    } = req.body;

    const existing = await db
      .select()
      .from(alertPreferences)
      .where(eq(alertPreferences.userId, auth.userId))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(alertPreferences)
        .set({
          digestFrequency: digestFrequency || existing[0].digestFrequency,
          minRiskThreshold: minRiskThreshold || existing[0].minRiskThreshold,
          enabledChannels: enabledChannels || existing[0].enabledChannels,
          includeAttachments: includeAttachments !== undefined ? includeAttachments : existing[0].includeAttachments,
          includeRecommendations: includeRecommendations !== undefined ? includeRecommendations : existing[0].includeRecommendations,
          enableAutomatic: enableAutomatic !== undefined ? enableAutomatic : existing[0].enableAutomatic,
          enableThresholdAlerts: enableThresholdAlerts !== undefined ? enableThresholdAlerts : existing[0].enableThresholdAlerts,
          updatedAt: new Date(),
        })
        .where(eq(alertPreferences.userId, auth.userId))
        .returning();
    } else {
      result = await db
        .insert(alertPreferences)
        .values({
          userId: auth.userId,
          digestFrequency: digestFrequency || 'daily',
          minRiskThreshold: minRiskThreshold || 'Medium',
          enabledChannels: enabledChannels || 'outlook,teams',
          includeAttachments: includeAttachments !== undefined ? includeAttachments : true,
          includeRecommendations: includeRecommendations !== undefined ? includeRecommendations : true,
          enableAutomatic: enableAutomatic !== undefined ? enableAutomatic : true,
          enableThresholdAlerts: enableThresholdAlerts !== undefined ? enableThresholdAlerts : true,
        })
        .returning();
    }

    return res.json({ ok: true, preferences: result[0] });
  } catch (error) {
    console.error('Error updating alert preferences:', error);
    res.status(500).json({ ok: false, error: 'Failed to update preferences' });
  }
});

// ── GET /alerts/logs ────────────────────────────────────────
// Get alert sending history

router.get('/alerts/logs', async (req: Request, res: Response) => {
  try {
    const auth = await authenticateRequest(req);
    if (!auth) return res.status(401).json({ ok: false, error: 'Not authenticated' });

    const { limit = '20', offset = '0' } = req.query;
    const pageLimit = Math.min(parseInt(limit as string) || 20, 100);
    const pageOffset = parseInt(offset as string) || 0;

    const logs = await db
      .select()
      .from(alertLogs)
      .where(eq(alertLogs.clientId, auth.userId))
      .orderBy(desc(alertLogs.sentAt))
      .limit(pageLimit)
      .offset(pageOffset);

    return res.json({ ok: true, logs, count: logs.length });
  } catch (error) {
    console.error('Error fetching alert logs:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch alert logs' });
  }
});

export default router;
