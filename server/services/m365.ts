// ============================================================
// FineGuard — M365 Integration Service (Server-Side Wrapper)
// ============================================================
//
// Wraps the M365 integration modules with graceful fallbacks
// when Azure AD credentials are not configured. Exposes a
// unified API surface for the Express routes.
// ============================================================

import type { AzureADConfig } from '../../integrations/m365/types/index.js';

// ── Configuration ───────────────────────────────────────────

export interface M365Status {
  configured: boolean;
  tenantId: string | null;
  clientId: string | null;
  services: {
    graphApi: boolean;
    teamsBot: boolean;
    outlookNotifications: boolean;
    webhookForwarding: boolean;
  };
}

/**
 * Load Azure AD config from environment, returning null if not configured.
 * Unlike the integration module's loadAzureADConfig which throws,
 * this returns null gracefully for unconfigured environments.
 */
export function loadM365Config(): AzureADConfig | null {
  const tenantId = process.env['AZURE_TENANT_ID'];
  const clientId = process.env['AZURE_CLIENT_ID'];
  const clientSecret = process.env['AZURE_CLIENT_SECRET'];

  if (!tenantId || !clientId || !clientSecret) {
    return null;
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    redirectUri: process.env['AZURE_REDIRECT_URI'] ?? 'http://localhost:3000/auth/callback',
    scopes: (process.env['AZURE_SCOPES'] ?? 'https://graph.microsoft.com/.default').split(','),
  };
}

/**
 * Get the current M365 integration status: which services are available
 * based on configured environment variables.
 */
export function getM365Status(): M365Status {
  const config = loadM365Config();
  const hasWebhookSecret = !!process.env['FINEGUARD_WEBHOOK_SECRET'];
  const hasAzureFunctionUrl = !!(process.env['AZURE_FUNCTION_URL'] || process.env['POWER_AUTOMATE_TRIGGER_URL']);

  return {
    configured: config !== null,
    tenantId: config?.tenantId ? `${config.tenantId.slice(0, 8)}...` : null,
    clientId: config?.clientId ? `${config.clientId.slice(0, 8)}...` : null,
    services: {
      graphApi: config !== null,
      teamsBot: config !== null,
      outlookNotifications: config !== null,
      webhookForwarding: hasWebhookSecret && hasAzureFunctionUrl,
    },
  };
}

// ── Graph Client (lazy-loaded) ──────────────────────────────

let graphClientInstance: any = null;

export async function getGraphClient() {
  const config = loadM365Config();
  if (!config) {
    throw new Error('M365 not configured — set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  }

  if (!graphClientInstance) {
    const { FineGuardGraphClient } = await import('../../integrations/m365/graph/client.js');
    graphClientInstance = new FineGuardGraphClient(config);
  }

  return graphClientInstance;
}

// ── Outlook Notification Service (lazy-loaded) ──────────────

let outlookServiceInstance: any = null;

export async function getOutlookService() {
  const config = loadM365Config();
  if (!config) {
    throw new Error('M365 not configured — set AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET');
  }

  const senderUserId = process.env['OUTLOOK_SENDER_USER_ID'] ?? '';
  if (!senderUserId) {
    throw new Error('OUTLOOK_SENDER_USER_ID not configured');
  }

  if (!outlookServiceInstance) {
    const { OutlookNotificationService } = await import('../../integrations/m365/outlook/notifications.js');
    outlookServiceInstance = new OutlookNotificationService(config, senderUserId);
  }

  return outlookServiceInstance;
}

// ── Teams Bot (lazy-loaded) ─────────────────────────────────

let botInstance: any = null;

export async function getTeamsBot() {
  if (!botInstance) {
    const { FineGuardBot } = await import('../../integrations/m365/teams/bot.js');
    botInstance = new FineGuardBot();
  }
  return botInstance;
}

// ── Test notification helper ────────────────────────────────

export async function sendTestNotification(channel: 'teams' | 'outlook', target: string): Promise<{ success: boolean; message: string }> {
  const config = loadM365Config();
  if (!config) {
    return { success: false, message: 'M365 not configured. Set Azure AD environment variables.' };
  }

  try {
    if (channel === 'outlook') {
      const outlook = await getOutlookService();
      await outlook.sendComplianceAlert(
        {
          eventId: 'test-' + Date.now(),
          eventType: 'risk_alert',
          firmId: 'test',
          firmName: 'Test Firm',
          riskLevel: 'Medium',
          title: 'FineGuard Test Notification',
          description: 'This is a test notification to verify your M365 integration is working correctly.',
          createdAt: new Date().toISOString(),
        },
        [target]
      );
      return { success: true, message: `Test email sent to ${target}` };
    }

    if (channel === 'teams') {
      // Teams test would require a channel — return instructions
      return { success: false, message: 'Teams notifications require a configured Teams channel. Use the Teams bot within Teams to test.' };
    }

    return { success: false, message: `Unknown channel: ${channel}` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Unknown error' };
  }
}

// ── Compliance Alert Delivery Methods ───────────────────────

export async function sendComplianceAlertViaOutlook(
  recipients: string[],
  subject: string,
  htmlBody: string
): Promise<{ success: boolean; message: string }> {
  const config = loadM365Config();
  if (!config) {
    return { success: false, message: 'M365 not configured' };
  }

  try {
    const graph = await getGraphClient();

    // Send via Outlook sendMail
    for (const recipient of recipients) {
      await graph.sendEmail(process.env['OUTLOOK_SENDER_USER_ID'] || '', {
        to: [{ emailAddress: { address: recipient } }],
        subject,
        body: htmlBody,
        bodyType: 'html',
        importance: 'high',
      });
    }

    return { success: true, message: `Alert sent to ${recipients.length} recipient(s)` };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to send via Outlook' };
  }
}

export async function sendComplianceAlertViaTeams(
  teamId: string,
  channelId: string,
  adaptiveCard: unknown
): Promise<{ success: boolean; message: string }> {
  const config = loadM365Config();
  if (!config) {
    return { success: false, message: 'M365 not configured' };
  }

  try {
    const graph = await getGraphClient();

    // Send via Teams
    await graph.sendTeamsAdaptiveCard(teamId, channelId, adaptiveCard as any);

    return { success: true, message: 'Alert sent to Teams channel' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Failed to send via Teams' };
  }
}
