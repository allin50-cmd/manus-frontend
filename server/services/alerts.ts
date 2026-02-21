// ============================================================
// FineGuard — Compliance Alert Service
// ============================================================
//
// Generates, formats, and dispatches compliance alerts via
// Microsoft 365 (Outlook + Teams) to clients and advisors.
// ============================================================

import type { ComplianceEvent, RiskLevel } from '../../integrations/m365/types/index.js';

// ── Alert Types ─────────────────────────────────────────────

export type AlertChannel = 'outlook' | 'teams' | 'both';
export type AlertTriggerType = 'automatic' | 'digest' | 'manual' | 'threshold';

export interface ComplianceAlert {
  id: string;
  clientId: string;
  advisorId?: string;
  companyId: string;
  companyName: string;
  issueType: string;
  title: string;
  description: string;
  riskLevel: RiskLevel;
  deadline?: string;
  daysUntilDeadline?: number;
  estimatedPenalty?: number;
  recommendedActions: string[];
  triggerType: AlertTriggerType;
  channel: AlertChannel;
  recipients: {
    client: string[];
    advisor?: string[];
  };
  createdAt: string;
  sentAt?: string;
}

export interface AlertPreference {
  clientId: string;
  advisorId: string;
  digestFrequency: 'daily' | 'weekly' | 'never';
  minRiskThreshold: RiskLevel;
  enabledChannels: AlertChannel[];
  includeAttachments: boolean;
}

// ── Alert Payload Builder ───────────────────────────────────

export function buildComplianceAlert(
  complianceEvent: ComplianceEvent,
  clientId: string,
  companyName: string,
  advisorId?: string
): ComplianceAlert {
  const daysUntilDeadline = complianceEvent.dueDate
    ? Math.ceil((new Date(complianceEvent.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : undefined;

  // Calculate estimated penalty based on issue type and days overdue
  let estimatedPenalty: number | undefined;
  if (daysUntilDeadline && daysUntilDeadline < 0) {
    const daysOverdue = Math.abs(daysUntilDeadline);
    estimatedPenalty = calculatePenalty(complianceEvent.eventType, daysOverdue);
  }

  // Generate recommended actions based on event type
  const recommendedActions = getRecommendedActions(complianceEvent.eventType);

  return {
    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    clientId,
    advisorId,
    companyId: complianceEvent.firmId,
    companyName,
    issueType: complianceEvent.eventType.replace(/_/g, ' '),
    title: complianceEvent.title,
    description: complianceEvent.description,
    riskLevel: complianceEvent.riskLevel,
    deadline: complianceEvent.dueDate,
    daysUntilDeadline,
    estimatedPenalty,
    recommendedActions,
    triggerType: 'automatic',
    channel: 'both',
    recipients: {
      client: [],
      advisor: advisorId ? [] : undefined,
    },
    createdAt: new Date().toISOString(),
  };
}

// ── Helper: Calculate Estimated Penalty ────────────────────

function calculatePenalty(eventType: string, daysOverdue: number): number {
  // Simplified penalty calculation
  // In production, integrate with HMRC/Companies House penalty schedules
  const basePenalty: Record<string, number> = {
    filing_due: 500, // Filing deadline
    confirmation_statement: 150,
    accounts_filing: 500,
    tax_return: 100,
  };

  const base = basePenalty[eventType] || 100;
  const penalty = base + Math.floor(daysOverdue / 7) * 50; // +£50 per week overdue
  return Math.min(penalty, base * 5); // Cap at 5x base
}

// ── Helper: Generate Recommended Actions ───────────────────

function getRecommendedActions(eventType: string): string[] {
  const actions: Record<string, string[]> = {
    filing_due: [
      'Contact your accountant immediately to prepare filing',
      'Gather all required financial documents',
      'Review the filing requirements on Companies House',
      'Submit filing before the deadline to avoid penalties',
    ],
    confirmation_statement: [
      'Log in to Companies House and complete confirmation statement',
      'Review company details for accuracy',
      'Submit within 14 days of anniversary date',
    ],
    director_change: [
      'Notify Companies House of director changes within 14 days',
      'Update company records and registers',
      'Inform insurance provider of changes',
    ],
    accounts_filing: [
      'Prepare statutory accounts with your accountant',
      'File on Companies House within 9 months of year-end',
      'Consider audit exemptions if eligible',
    ],
    tax_return: [
      'Gather all business income and expense records',
      'File Self Assessment or Corporation Tax return before deadline',
      'Arrange payment plan if needed',
    ],
  };

  return actions[eventType] || [
    'Review the compliance issue details',
    'Contact your advisor for guidance',
    'Take action before the deadline',
  ];
}

// ── Helper: Check Risk Threshold ─────────────────────────────

export function passesThreshold(riskLevel: RiskLevel, minThreshold: RiskLevel): boolean {
  const riskOrder: Record<RiskLevel, number> = {
    Low: 0,
    Medium: 1,
    High: 2,
    Critical: 3,
  };

  return riskOrder[riskLevel] >= riskOrder[minThreshold];
}

// ── Alert Formatter for Email ────────────────────────────────

export function formatAlertForEmail(alert: ComplianceAlert): {
  subject: string;
  htmlBody: string;
} {
  const riskColors: Record<RiskLevel, string> = {
    Low: '#16a34a',
    Medium: '#ca8a04',
    High: '#ea580c',
    Critical: '#dc2626',
  };

  const riskColor = riskColors[alert.riskLevel];

  const actionsList = alert.recommendedActions
    .map((action) => `<li style="margin: 8px 0; color: #475569;">${escapeHtml(action)}</li>`)
    .join('');

  return {
    subject: `[FineGuard Alert] ${alert.title} — ${alert.companyName}`,
    htmlBody: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #5A4BFF 0%, #6B5BFF 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🛡️ FineGuard Compliance Alert</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">${escapeHtml(alert.companyName)}</p>
        </div>

        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 12px 12px; background: #f8fafc;">
          <!-- Risk Level Badge -->
          <div style="background: ${riskColor}15; border-left: 4px solid ${riskColor}; padding: 12px 16px; margin-bottom: 20px; border-radius: 4px;">
            <strong style="color: ${riskColor}; font-size: 14px;">${alert.riskLevel} Risk</strong>
          </div>

          <!-- Issue Details -->
          <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #0f172a;">${escapeHtml(alert.title)}</h2>
          <p style="color: #475569; margin: 0 0 16px 0; line-height: 1.6;">${escapeHtml(alert.description)}</p>

          <!-- Key Information Table -->
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; color: #64748b; font-weight: 600; width: 40%;">Company</td>
              <td style="padding: 12px 16px; color: #0f172a; font-weight: 500;">${escapeHtml(alert.companyName)}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Issue Type</td>
              <td style="padding: 12px 16px; color: #0f172a;">${escapeHtml(alert.issueType)}</td>
            </tr>
            ${
              alert.deadline
                ? `<tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Deadline</td>
              <td style="padding: 12px 16px; color: #0f172a; font-weight: 500;">${escapeHtml(alert.deadline)}</td>
            </tr>`
                : ''
            }
            ${
              alert.daysUntilDeadline !== undefined
                ? `<tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Time Remaining</td>
              <td style="padding: 12px 16px; color: #0f172a; font-weight: 500;">${alert.daysUntilDeadline} days</td>
            </tr>`
                : ''
            }
            ${
              alert.estimatedPenalty
                ? `<tr>
              <td style="padding: 12px 16px; color: #64748b; font-weight: 600;">Estimated Penalty</td>
              <td style="padding: 12px 16px; color: #dc2626; font-weight: 600;">£${alert.estimatedPenalty.toLocaleString()}</td>
            </tr>`
                : ''
            }
          </table>

          <!-- Recommended Actions -->
          <h3 style="margin: 24px 0 12px 0; font-size: 16px; color: #0f172a; font-weight: 600;">Recommended Actions</h3>
          <ul style="margin: 0; padding-left: 0; list-style: none;">
            ${actionsList}
          </ul>

          <!-- CTA Button -->
          <div style="margin: 24px 0; text-align: center;">
            <a href="https://app.fineguard.io/dashboard"
               style="display: inline-block; background: #5A4BFF; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px;">
              View in FineGuard Dashboard
            </a>
          </div>

          <!-- Footer -->
          <p style="margin: 24px 0 0 0; padding-top: 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            This is an automated alert from FineGuard Compliance Cloud. Your advisor can configure alert settings in their dashboard.
          </p>
        </div>
      </div>
    `,
  };
}

// ── Alert Formatter for Teams Adaptive Card ──────────────────

export function formatAlertForTeams(alert: ComplianceAlert) {
  const riskColorMap: Record<RiskLevel, string> = {
    Low: 'Good',
    Medium: 'Warning',
    High: 'Attention',
    Critical: 'Attention',
  };

  return {
    type: 'AdaptiveCard',
    version: '1.4',
    body: [
      {
        type: 'TextBlock',
        text: `🛡️ FineGuard ${alert.riskLevel} Alert`,
        size: 'Large',
        weight: 'Bolder',
        color: riskColorMap[alert.riskLevel],
      },
      {
        type: 'TextBlock',
        text: alert.title,
        weight: 'Bolder',
        wrap: true,
        spacing: 'Small',
      },
      {
        type: 'TextBlock',
        text: `${alert.companyName}`,
        size: 'Small',
        isSubtle: true,
        wrap: true,
      },
      {
        type: 'TextBlock',
        text: alert.description,
        wrap: true,
        spacing: 'Medium',
      },
      {
        type: 'FactSet',
        facts: [
          { title: 'Issue', value: alert.issueType },
          ...(alert.daysUntilDeadline !== undefined
            ? [{ title: 'Days Until Deadline', value: `${alert.daysUntilDeadline} days` }]
            : []),
          ...(alert.estimatedPenalty
            ? [{ title: 'Est. Penalty', value: `£${alert.estimatedPenalty.toLocaleString()}` }]
            : []),
        ],
      },
      {
        type: 'TextBlock',
        text: 'Recommended Actions',
        weight: 'Bolder',
        spacing: 'Medium',
      },
      {
        type: 'Container',
        items: alert.recommendedActions.map((action) => ({
          type: 'TextBlock',
          text: `• ${action}`,
          wrap: true,
          spacing: 'Small',
          size: 'Small',
        })),
      },
    ],
    actions: [
      {
        type: 'Action.OpenUrl',
        title: 'View in FineGuard',
        url: 'https://app.fineguard.io/dashboard',
      },
    ],
  };
}

// ── HTML Escape Helper ───────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
