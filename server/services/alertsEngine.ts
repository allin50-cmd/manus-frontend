/**
 * FineGuard Alerts Engine
 *
 * Generates compliance alerts for companies and optionally sends
 * notifications via email, Slack webhook, and Microsoft Teams webhook.
 *
 * Inputs: Company deadline data from Companies House and internal database
 * Outputs: Alert records in the database + optional webhook notifications
 */

import { db } from '../db/index';
import { alerts } from '../db/schema';

export interface AlertPayload {
  companyId: string;
  firmId: string;
  alertType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
}

/**
 * Create an alert in the database
 */
export async function createAlert(payload: AlertPayload): Promise<void> {
  await db.insert(alerts).values({
    companyId: payload.companyId,
    firmId: payload.firmId,
    alertType: payload.alertType,
    severity: payload.severity,
    message: payload.message,
    resolved: false,
  });
}

/**
 * Send a Slack notification via webhook
 * @param webhookUrl - Slack Incoming Webhook URL
 * @param message - Message text
 */
export async function sendSlackNotification(webhookUrl: string, message: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🛡️ *FineGuard Alert*\n${message}`,
      }),
    });
    if (!response.ok) {
      console.error('Slack webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Slack notification:', error);
  }
}

/**
 * Send a Microsoft Teams notification via webhook
 * @param webhookUrl - Teams Incoming Webhook URL
 * @param message - Message text
 */
export async function sendTeamsNotification(webhookUrl: string, title: string, message: string): Promise<void> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        '@type': 'MessageCard',
        '@context': 'http://schema.org/extensions',
        themeColor: 'C9A64A',
        summary: title,
        sections: [{
          activityTitle: `🛡️ FineGuard Alert: ${title}`,
          activitySubtitle: message,
          facts: [{ name: 'System', value: 'FineGuard Pro Compliance Platform' }],
        }],
      }),
    });
    if (!response.ok) {
      console.error('Teams webhook failed:', response.status, await response.text());
    }
  } catch (error) {
    console.error('Failed to send Teams notification:', error);
  }
}

/**
 * Evaluate deadline data and generate alerts for a company
 *
 * @param companyId - UUID of the company
 * @param firmId - UUID of the firm
 * @param deadlineData - Object with deadline dates and statuses
 */
export async function evaluateCompanyAlerts(
  companyId: string,
  firmId: string,
  deadlineData: {
    accountsDaysUntilDue?: number;
    accountsOverdue?: boolean;
    confirmationDaysUntilDue?: number;
    confirmationOverdue?: boolean;
    strikeOffRisk?: boolean;
    directorChanges?: number;
  }
): Promise<AlertPayload[]> {
  const newAlerts: AlertPayload[] = [];

  const { accountsDaysUntilDue, accountsOverdue, confirmationDaysUntilDue, confirmationOverdue, strikeOffRisk, directorChanges } = deadlineData;

  // Accounts overdue
  if (accountsOverdue) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'accounts_overdue',
      severity: 'critical',
      message: `Annual accounts are overdue. Penalties are accruing. Immediate action required.`,
    });
  } else if (accountsDaysUntilDue !== undefined && accountsDaysUntilDue <= 30 && accountsDaysUntilDue >= 0) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'accounts_due_soon',
      severity: accountsDaysUntilDue <= 14 ? 'high' : 'medium',
      message: `Annual accounts due in ${accountsDaysUntilDue} days. File to avoid late filing penalties.`,
    });
  }

  // Confirmation statement overdue
  if (confirmationOverdue) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'confirmation_statement_overdue',
      severity: 'high',
      message: `Confirmation statement is overdue. Failure to file could result in prosecution and company strike-off.`,
    });
  } else if (confirmationDaysUntilDue !== undefined && confirmationDaysUntilDue <= 14 && confirmationDaysUntilDue >= 0) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'confirmation_statement_due_soon',
      severity: 'medium',
      message: `Confirmation statement due in ${confirmationDaysUntilDue} days.`,
    });
  }

  // Strike-off risk
  if (strikeOffRisk) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'strike_off_risk',
      severity: 'critical',
      message: `Strike-off notice detected. Urgent action required to prevent company dissolution.`,
    });
  }

  // Director changes
  if (directorChanges && directorChanges > 0) {
    newAlerts.push({
      companyId, firmId,
      alertType: 'director_change_detected',
      severity: 'low',
      message: `${directorChanges} director change${directorChanges > 1 ? 's' : ''} detected in recent Companies House filings. Please review.`,
    });
  }

  return newAlerts;
}

/**
 * Run the monitoring engine for a single company
 * Creates alerts and optionally sends webhook notifications
 */
export async function monitorCompany(
  companyId: string,
  firmId: string,
  deadlineData: Parameters<typeof evaluateCompanyAlerts>[2],
  webhooks?: { slack?: string; teams?: string }
): Promise<void> {
  const newAlerts = await evaluateCompanyAlerts(companyId, firmId, deadlineData);

  for (const alert of newAlerts) {
    await createAlert(alert);

    // Send webhooks if configured
    if (webhooks?.slack) {
      await sendSlackNotification(webhooks.slack, alert.message);
    }
    if (webhooks?.teams) {
      await sendTeamsNotification(webhooks.teams, alert.alertType.replace(/_/g, ' ').toUpperCase(), alert.message);
    }
  }
}
