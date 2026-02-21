// ============================================================
// FineGuard — Outlook Email & Calendar Integration
// ============================================================
//
// Sends compliance notifications, deadline reminders, and
// creates calendar events for filing deadlines via Graph API.
// ============================================================

import { FineGuardGraphClient } from "../graph/client.js";
import type {
  AzureADConfig,
  ComplianceEvent,
  OutlookEmail,
  CalendarEvent,
  RiskLevel,
} from "../types/index.js";

const APP_BASE = process.env["FINEGUARD_APP_URL"] ?? "https://app.fineguard.io";

// ── HTML escape helper (prevents XSS in email bodies) ───────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── Outlook Notification Service ────────────────────────────

export class OutlookNotificationService {
  private graph: FineGuardGraphClient;
  private senderUserId: string;

  constructor(config: AzureADConfig, senderUserId: string) {
    this.graph = new FineGuardGraphClient(config);
    this.senderUserId = senderUserId;
  }

  // ── Compliance Alert Email ────────────────────────────────

  async sendComplianceAlert(
    event: ComplianceEvent,
    recipients: string[]
  ): Promise<void> {
    const email: OutlookEmail = {
      to: recipients.map((addr) => ({
        emailAddress: { address: addr },
      })),
      subject: `[FineGuard ${event.riskLevel}] ${event.title}`,
      bodyType: "html",
      body: this.buildAlertEmailBody(event),
      importance: event.riskLevel === "Critical" ? "high" : "normal",
    };

    await this.graph.sendEmail(this.senderUserId, email);
  }

  // ── Filing Deadline Reminder Email ────────────────────────

  async sendDeadlineReminder(
    event: ComplianceEvent,
    recipients: string[]
  ): Promise<void> {
    const email: OutlookEmail = {
      to: recipients.map((addr) => ({
        emailAddress: { address: addr },
      })),
      subject: `[FineGuard Reminder] ${event.title} — Due ${event.dueDate ?? "soon"}`,
      bodyType: "html",
      body: this.buildReminderEmailBody(event),
      importance: event.riskLevel === "Critical" || event.riskLevel === "High" ? "high" : "normal",
    };

    await this.graph.sendEmail(this.senderUserId, email);
  }

  // ── Calendar Event for Deadline ───────────────────────────

  async createDeadlineCalendarEvent(
    event: ComplianceEvent,
    userId: string
  ): Promise<void> {
    if (!event.dueDate) {
      throw new Error("Cannot create calendar event without a dueDate");
    }

    const dueDate = new Date(event.dueDate);
    if (isNaN(dueDate.getTime())) {
      throw new Error(`Invalid dueDate format: "${event.dueDate}"`);
    }

    const calEvent: CalendarEvent = {
      subject: `[FineGuard] ${event.title}`,
      body: {
        contentType: "html",
        content: `
          <p><strong>Compliance Filing Deadline</strong></p>
          <p>${escapeHtml(event.description)}</p>
          <p>
            <strong>Firm:</strong> ${escapeHtml(event.firmName)}<br/>
            <strong>Risk Level:</strong> ${escapeHtml(event.riskLevel)}<br/>
            <strong>Type:</strong> ${escapeHtml(event.eventType.replace(/_/g, " "))}
          </p>
          <p><a href="${APP_BASE}/events/${encodeURIComponent(event.eventId)}">View in FineGuard</a></p>
        `,
      },
      start: {
        dateTime: dueDate.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(dueDate.getTime() + 60 * 60 * 1000).toISOString(),
        timeZone: "UTC",
      },
      isReminderOn: true,
      reminderMinutesBeforeStart:
        event.riskLevel === "Critical" ? 1440 : 60, // 24h for critical, 1h otherwise
      attendees: event.assignedTo
        ? [
            {
              emailAddress: { address: event.assignedTo },
              type: "required",
            },
          ]
        : [],
    };

    await this.graph.createCalendarEvent(userId, calEvent);
  }

  // ── Recurring Compliance Check Calendar Series ────────────

  async createRecurringComplianceCheck(
    userId: string,
    title: string,
    startDate: string,
    intervalWeeks: number
  ): Promise<void> {
    const parsed = new Date(startDate);
    if (isNaN(parsed.getTime())) {
      throw new Error(`Invalid startDate format: "${startDate}"`);
    }

    const calEvent: CalendarEvent = {
      subject: `[FineGuard] ${title}`,
      body: {
        contentType: "html",
        content: `<p>Recurring compliance review scheduled by FineGuard.</p>
                  <p><a href="${APP_BASE}/dashboard">Open Dashboard</a></p>`,
      },
      start: {
        dateTime: parsed.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(parsed.getTime() + 30 * 60 * 1000).toISOString(),
        timeZone: "UTC",
      },
      isReminderOn: true,
      reminderMinutesBeforeStart: 60,
      recurrence: {
        pattern: {
          type: "weekly",
          interval: intervalWeeks,
          daysOfWeek: ["monday"],
        },
        range: {
          type: "noEnd",
          startDate: parsed.toISOString().split("T")[0],
        },
      },
    };

    await this.graph.createCalendarEvent(userId, calEvent);
  }

  // ── Email Body Builders ───────────────────────────────────

  private buildAlertEmailBody(event: ComplianceEvent): string {
    const riskColor = this.riskColor(event.riskLevel);
    const title = escapeHtml(event.title);
    const description = escapeHtml(event.description);
    const firmName = escapeHtml(event.firmName);
    const eventType = escapeHtml(event.eventType.replace(/_/g, " "));
    const dueDate = event.dueDate ? escapeHtml(event.dueDate) : null;
    const assignedTo = event.assignedTo ? escapeHtml(event.assignedTo) : null;
    const eventUrl = `${APP_BASE}/events/${encodeURIComponent(event.eventId)}`;
    const prefsUrl = `${APP_BASE}/settings/notifications`;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">🛡️ FineGuard Compliance Alert</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
          <div style="background: ${riskColor}15; border-left: 4px solid ${riskColor}; padding: 12px 16px; margin-bottom: 20px;">
            <strong style="color: ${riskColor};">${escapeHtml(event.riskLevel)} Risk</strong>
          </div>

          <h2 style="margin: 0 0 12px 0;">${title}</h2>
          <p style="color: #475569;">${description}</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">Firm</td><td style="padding: 8px 0; font-weight: 600;">${firmName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Event Type</td><td style="padding: 8px 0;">${eventType}</td></tr>
            ${dueDate ? `<tr><td style="padding: 8px 0; color: #64748b;">Due Date</td><td style="padding: 8px 0; font-weight: 600;">${dueDate}</td></tr>` : ""}
            ${assignedTo ? `<tr><td style="padding: 8px 0; color: #64748b;">Assigned To</td><td style="padding: 8px 0;">${assignedTo}</td></tr>` : ""}
          </table>

          <a href="${eventUrl}"
             style="display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            View in FineGuard →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            This is an automated notification from FineGuard Compliance Cloud.
            <a href="${prefsUrl}" style="color: #1e40af;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    `;
  }

  private buildReminderEmailBody(event: ComplianceEvent): string {
    const title = escapeHtml(event.title);
    const description = escapeHtml(event.description);
    const dueDate = event.dueDate ? escapeHtml(event.dueDate) : "Date not specified";
    const eventUrl = `${APP_BASE}/events/${encodeURIComponent(event.eventId)}`;
    const prefsUrl = `${APP_BASE}/settings/notifications`;

    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ca8a04; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">⏰ Filing Deadline Reminder</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 8px 0;">${title}</h2>
          <p style="color: #475569; margin: 0 0 16px 0;">${description}</p>
          <p style="font-size: 18px; font-weight: 700; color: #1e40af;">
            Due: ${dueDate}
          </p>

          <a href="${eventUrl}"
             style="display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Take Action →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            FineGuard Compliance Cloud · <a href="${prefsUrl}" style="color: #1e40af;">Manage preferences</a>
          </p>
        </div>
      </div>
    `;
  }

  private riskColor(level: RiskLevel): string {
    const map: Record<RiskLevel, string> = {
      Critical: "#dc2626",
      High: "#ea580c",
      Medium: "#ca8a04",
      Low: "#16a34a",
    };
    return map[level];
  }
}
