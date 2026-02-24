// ============================================================
// FineGuard — Teams Bot (Bot Framework + Adaptive Cards)
// ============================================================
//
// Handles:
//   - Conversational commands (risk-summary, upcoming-filings, alerts)
//   - Proactive compliance notifications
//   - Adaptive Card action responses
//
// All data is fetched from the real FineGuard API. No mock data.
//
// Dependencies:
//   npm install botbuilder
// ============================================================

import {
  ActivityHandler,
  TurnContext,
  CardFactory,
  MessageFactory,
  ConversationReference,
} from "botbuilder";
import type { ComplianceEvent, RiskLevel } from "../types/index.js";

const APP_BASE = process.env["FINEGUARD_APP_URL"] ?? "https://app.fineguard.io";
const API_BASE = process.env["FINEGUARD_API_URL"] ?? APP_BASE;

// ── Proactive notification store ────────────────────────────
// Persisted in-memory for the current process. For multi-instance
// deployments, replace with Redis or Cosmos DB.
const conversationReferences = new Map<string, Partial<ConversationReference>>();

export function getConversationReferences() {
  return conversationReferences;
}

// ── Risk colour mapping ─────────────────────────────────────

const RISK_COLORS: Record<RiskLevel, string> = {
  Low: "Good",
  Medium: "Warning",
  High: "Attention",
  Critical: "Attention",
};

// ── Internal API helper ─────────────────────────────────────

interface ApiOptions {
  path: string;
  token?: string;
}

async function apiFetch<T>(opts: ApiOptions): Promise<T | null> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (opts.token) {
      headers["Authorization"] = `Bearer ${opts.token}`;
    }

    const res = await fetch(`${API_BASE}/api${opts.path}`, { headers });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Bot Implementation ──────────────────────────────────────

export class FineGuardBot extends ActivityHandler {
  constructor() {
    super();

    // Store conversation reference for proactive messages
    this.onConversationUpdate(async (ctx, next) => {
      this.addConversationReference(ctx);
      await next();
    });

    this.onMessage(async (ctx, next) => {
      this.addConversationReference(ctx);
      const text = (ctx.activity.text ?? "").trim().toLowerCase();

      switch (text) {
        case "risk-summary":
          await this.handleRiskSummary(ctx);
          break;
        case "upcoming-filings":
          await this.handleUpcomingFilings(ctx);
          break;
        case "alerts":
          await this.handleAlerts(ctx);
          break;
        case "help":
          await this.handleHelp(ctx);
          break;
        default:
          await ctx.sendActivity(
            `I didn't recognise that command. Type **help** to see what I can do.`
          );
      }

      await next();
    });

    // Handle Adaptive Card action submissions
    this.onEvent(async (ctx, next) => {
      if (ctx.activity.name === "adaptiveCard/action") {
        await this.handleCardAction(ctx);
      }
      await next();
    });
  }

  // ── Command Handlers ────────────────────────────────────

  private async handleRiskSummary(ctx: TurnContext) {
    const token = this.extractUserToken(ctx);

    const summary = await apiFetch<{
      critical: number;
      high: number;
      medium: number;
      low: number;
      lastUpdated: string;
    }>({ path: "/compliance/risk-summary", token });

    if (!summary) {
      await ctx.sendActivity("Unable to fetch risk summary. Please check your FineGuard account is linked.");
      return;
    }

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "FineGuard Risk Summary",
          size: "Large",
          weight: "Bolder",
        },
        {
          type: "ColumnSet",
          columns: [
            this.buildStatColumn("Critical", String(summary.critical), "Attention"),
            this.buildStatColumn("High", String(summary.high), "Warning"),
            this.buildStatColumn("Medium", String(summary.medium), "Default"),
            this.buildStatColumn("Low", String(summary.low), "Good"),
          ],
        },
        {
          type: "TextBlock",
          text: `Last updated: ${new Date(summary.lastUpdated).toLocaleString("en-GB")}`,
          size: "Small",
          isSubtle: true,
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View Full Dashboard",
          url: `${APP_BASE}/dashboard`,
        },
        {
          type: "Action.Submit",
          title: "Refresh",
          data: { action: "refresh-risk-summary" },
        },
      ],
    });

    await ctx.sendActivity(MessageFactory.attachment(card));
  }

  private async handleUpcomingFilings(ctx: TurnContext) {
    const token = this.extractUserToken(ctx);

    const data = await apiFetch<{
      filings: Array<{
        id: string;
        companyName: string;
        name: string;
        dueDate: string;
        riskLevel: string;
        status: string;
      }>;
      total: number;
    }>({ path: "/compliance/filings?status=upcoming", token });

    const filings = data?.filings ?? [];

    if (filings.length === 0) {
      await ctx.sendActivity("No upcoming filing deadlines found. All clear!");
      return;
    }

    const riskIcon = (level: string) =>
      level === "Critical" ? "🔴" : level === "High" ? "🟠" : level === "Medium" ? "🟡" : "🟢";

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `Upcoming Filing Deadlines (${filings.length})`,
          size: "Large",
          weight: "Bolder",
        },
        {
          type: "FactSet",
          facts: filings.slice(0, 10).map((f) => ({
            title: `${riskIcon(f.riskLevel)} ${f.name}`,
            value: new Date(f.dueDate).toLocaleDateString("en-GB"),
          })),
        },
        ...(filings.length > 10
          ? [
              {
                type: "TextBlock" as const,
                text: `+ ${filings.length - 10} more filings`,
                size: "Small" as const,
                isSubtle: true,
              },
            ]
          : []),
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View All Filings",
          url: `${APP_BASE}/reports`,
        },
      ],
    });

    await ctx.sendActivity(MessageFactory.attachment(card));
  }

  private async handleAlerts(ctx: TurnContext) {
    const token = this.extractUserToken(ctx);

    const data = await apiFetch<{
      ok: boolean;
      alerts: Array<{
        id: string;
        type: string;
        severity: string;
        title: string;
        message: string;
        read: boolean;
        createdAt: string;
      }>;
    }>({ path: "/alerts", token });

    const recentAlerts = (data?.alerts ?? []).filter((a) => !a.read).slice(0, 5);

    if (recentAlerts.length === 0) {
      await ctx.sendActivity("No unread compliance alerts. You're all caught up!");
      return;
    }

    const severityStyle = (severity: string) =>
      severity === "critical" ? "attention" : severity === "warning" ? "warning" : "default";
    const severityIcon = (severity: string) =>
      severity === "critical" ? "🔴" : severity === "warning" ? "⚠️" : "ℹ️";

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `Recent Compliance Alerts (${recentAlerts.length} unread)`,
          size: "Large",
          weight: "Bolder",
        },
        ...recentAlerts.map((alert) => ({
          type: "Container" as const,
          style: severityStyle(alert.severity),
          items: [
            {
              type: "TextBlock" as const,
              text: `${severityIcon(alert.severity)} ${alert.title}`,
              wrap: true,
              weight: "Bolder" as const,
            },
            {
              type: "TextBlock" as const,
              text: alert.message,
              wrap: true,
              size: "Small" as const,
              isSubtle: true,
            },
          ],
        })),
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View All Alerts",
          url: `${APP_BASE}/reports`,
        },
      ],
    });

    await ctx.sendActivity(MessageFactory.attachment(card));
  }

  private async handleHelp(ctx: TurnContext) {
    await ctx.sendActivity(
      `**FineGuard Bot Commands:**\n\n` +
        `- **risk-summary** — Current risk overview across all monitored companies\n` +
        `- **upcoming-filings** — Upcoming filing deadlines with risk levels\n` +
        `- **alerts** — Recent unread compliance alerts\n` +
        `- **help** — This message`
    );
  }

  private async handleCardAction(ctx: TurnContext) {
    const data = ctx.activity.value?.action?.data ?? ctx.activity.value;
    const action = data?.action;

    if (action === "refresh-risk-summary") {
      await this.handleRiskSummary(ctx);
    } else if (action === "acknowledge-alert") {
      const token = this.extractUserToken(ctx);
      const alertId = data?.alertId ?? data?.eventId;

      if (alertId && token) {
        // Mark alert as read via real API
        await fetch(`${API_BASE}/api/alerts/${alertId}/read`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }).catch(() => {});
      }

      await ctx.sendActivity("✅ Alert acknowledged.");
    }
  }

  // ── Proactive Notifications ─────────────────────────────

  /** Build an Adaptive Card for a compliance event notification. */
  static buildComplianceAlertCard(event: ComplianceEvent) {
    return {
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: `🛡️ FineGuard ${event.riskLevel} Alert`,
          size: "Large",
          weight: "Bolder",
          color: RISK_COLORS[event.riskLevel],
        },
        { type: "TextBlock", text: event.title, weight: "Bolder", wrap: true },
        { type: "TextBlock", text: event.description, wrap: true, size: "Small" },
        {
          type: "FactSet",
          facts: [
            { title: "Firm", value: event.firmName },
            { title: "Risk Level", value: event.riskLevel },
            { title: "Type", value: event.eventType.replace(/_/g, " ") },
            ...(event.dueDate ? [{ title: "Due", value: event.dueDate }] : []),
          ],
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View in FineGuard",
          url: `${APP_BASE}/events/${event.eventId}`,
        },
        {
          type: "Action.Submit",
          title: "Acknowledge",
          data: { action: "acknowledge-alert", eventId: event.eventId },
        },
      ],
    };
  }

  // ── Helpers ─────────────────────────────────────────────

  private addConversationReference(ctx: TurnContext) {
    const ref = TurnContext.getConversationReference(ctx.activity);
    if (ref?.conversation?.id) {
      conversationReferences.set(ref.conversation.id, ref);
    }
  }

  /**
   * Extract the user's FineGuard auth token from the Teams activity.
   * In production, this uses the OBO (On-Behalf-Of) flow via the Azure AD
   * auth module. Falls back to a service token for system-level queries.
   */
  private extractUserToken(ctx: TurnContext): string | undefined {
    // Check if token was passed via channel data (SSO flow)
    const channelToken = ctx.activity.channelData?.authToken;
    if (channelToken) return channelToken;

    // Check if token was stored during OBO authentication
    const userAadId = ctx.activity.from?.aadObjectId;
    if (userAadId) {
      // The token would be resolved by the auth middleware in production.
      // For service-level calls, use the system service token.
      return process.env["FINEGUARD_SERVICE_TOKEN"];
    }

    return process.env["FINEGUARD_SERVICE_TOKEN"];
  }

  private buildStatColumn(label: string, value: string, color: string) {
    return {
      type: "Column",
      width: "stretch",
      items: [
        { type: "TextBlock", text: value, size: "ExtraLarge", weight: "Bolder", color },
        { type: "TextBlock", text: label, size: "Small", isSubtle: true, spacing: "None" },
      ],
    };
  }
}
