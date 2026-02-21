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
      bodyType: "HTML",
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
      bodyType: "HTML",
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

    const calEvent: CalendarEvent = {
      subject: `[FineGuard] ${event.title}`,
      body: {
        contentType: "HTML",
        content: `
          <p><strong>Compliance Filing Deadline</strong></p>
          <p>${event.description}</p>
          <p>
            <strong>Firm:</strong> ${event.firmName}<br/>
            <strong>Risk Level:</strong> ${event.riskLevel}<br/>
            <strong>Type:</strong> ${event.eventType.replace(/_/g, " ")}
          </p>
          <p><a href="https://app.fineguard.io/events/${event.eventId}">View in FineGuard</a></p>
        `,
      },
      start: {
        dateTime: new Date(event.dueDate).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(
          new Date(event.dueDate).getTime() + 60 * 60 * 1000
        ).toISOString(),
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
    const calEvent: CalendarEvent = {
      subject: `[FineGuard] ${title}`,
      body: {
        contentType: "HTML",
        content: `<p>Recurring compliance review scheduled by FineGuard.</p>
                  <p><a href="https://app.fineguard.io/dashboard">Open Dashboard</a></p>`,
      },
      start: {
        dateTime: new Date(startDate).toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: new Date(
          new Date(startDate).getTime() + 30 * 60 * 1000
        ).toISOString(),
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
          startDate: startDate.split("T")[0],
        },
      },
    };

    await this.graph.createCalendarEvent(userId, calEvent);
  }

  // ── Email Body Builders ───────────────────────────────────

  private buildAlertEmailBody(event: ComplianceEvent): string {
    const riskColor = this.riskColor(event.riskLevel);
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">🛡️ FineGuard Compliance Alert</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
          <div style="background: ${riskColor}15; border-left: 4px solid ${riskColor}; padding: 12px 16px; margin-bottom: 20px;">
            <strong style="color: ${riskColor};">${event.riskLevel} Risk</strong>
          </div>

          <h2 style="margin: 0 0 12px 0;">${event.title}</h2>
          <p style="color: #475569;">${event.description}</p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr><td style="padding: 8px 0; color: #64748b;">Firm</td><td style="padding: 8px 0; font-weight: 600;">${event.firmName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Event Type</td><td style="padding: 8px 0;">${event.eventType.replace(/_/g, " ")}</td></tr>
            ${event.dueDate ? `<tr><td style="padding: 8px 0; color: #64748b;">Due Date</td><td style="padding: 8px 0; font-weight: 600;">${event.dueDate}</td></tr>` : ""}
            ${event.assignedTo ? `<tr><td style="padding: 8px 0; color: #64748b;">Assigned To</td><td style="padding: 8px 0;">${event.assignedTo}</td></tr>` : ""}
          </table>

          <a href="https://app.fineguard.io/events/${event.eventId}"
             style="display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
            View in FineGuard →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            This is an automated notification from FineGuard Compliance Cloud.
            <a href="https://app.fineguard.io/settings/notifications" style="color: #1e40af;">Manage notification preferences</a>
          </p>
        </div>
      </div>
    `;
  }

  private buildReminderEmailBody(event: ComplianceEvent): string {
    return `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ca8a04; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">⏰ Filing Deadline Reminder</h1>
        </div>
        <div style="border: 1px solid #e2e8f0; border-top: 0; padding: 24px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 8px 0;">${event.title}</h2>
          <p style="color: #475569; margin: 0 0 16px 0;">${event.description}</p>
          <p style="font-size: 18px; font-weight: 700; color: #1e40af;">
            Due: ${event.dueDate ?? "Date not specified"}
          </p>

          <a href="https://app.fineguard.io/events/${event.eventId}"
             style="display: inline-block; background: #1e40af; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">
            Take Action →
          </a>

          <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">
            FineGuard Compliance Cloud · <a href="https://app.fineguard.io/settings/notifications" style="color: #1e40af;">Manage preferences</a>
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
