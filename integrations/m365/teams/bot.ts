// ============================================================
// FineGuard — Teams Bot (Bot Framework + Adaptive Cards)
// ============================================================
//
// Handles:
//   • Conversational commands (risk-summary, upcoming-filings, alerts)
//   • Proactive compliance notifications
//   • Adaptive Card action responses
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

// ── Proactive notification store ────────────────────────────
// In production, persist to Redis / Cosmos DB.
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
            this.buildStatColumn("Critical", "3", "Attention"),
            this.buildStatColumn("High", "7", "Warning"),
            this.buildStatColumn("Medium", "12", "Default"),
            this.buildStatColumn("Low", "28", "Good"),
          ],
        },
        { type: "TextBlock", text: "Last updated: just now", size: "Small", isSubtle: true },
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
    // In production, fetch from FineGuard API
    const filings = [
      { name: "Annual Confirmation Statement", due: "2026-03-15", risk: "High" },
      { name: "CT600 Corporation Tax", due: "2026-03-31", risk: "Critical" },
      { name: "VAT Return Q1", due: "2026-04-07", risk: "Medium" },
    ];

    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Upcoming Filing Deadlines",
          size: "Large",
          weight: "Bolder",
        },
        {
          type: "FactSet",
          facts: filings.map((f) => ({
            title: `${f.risk === "Critical" ? "🔴" : f.risk === "High" ? "🟠" : "🟡"} ${f.name}`,
            value: f.due,
          })),
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View All Filings",
          url: `${APP_BASE}/filings`,
        },
      ],
    });

    await ctx.sendActivity(MessageFactory.attachment(card));
  }

  private async handleAlerts(ctx: TurnContext) {
    const card = CardFactory.adaptiveCard({
      type: "AdaptiveCard",
      version: "1.4",
      body: [
        {
          type: "TextBlock",
          text: "Recent Compliance Alerts",
          size: "Large",
          weight: "Bolder",
        },
        {
          type: "Container",
          style: "attention",
          items: [
            {
              type: "TextBlock",
              text: "⚠️ PSC register not updated — overdue by 14 days",
              wrap: true,
            },
          ],
        },
        {
          type: "Container",
          style: "warning",
          items: [
            {
              type: "TextBlock",
              text: "📋 AML policy review due in 7 days",
              wrap: true,
            },
          ],
        },
        {
          type: "Container",
          style: "default",
          items: [
            {
              type: "TextBlock",
              text: "✅ Q4 accounts filed successfully",
              wrap: true,
            },
          ],
        },
      ],
      actions: [
        {
          type: "Action.OpenUrl",
          title: "View All Alerts",
          url: `${APP_BASE}/alerts`,
        },
      ],
    });

    await ctx.sendActivity(MessageFactory.attachment(card));
  }

  private async handleHelp(ctx: TurnContext) {
    await ctx.sendActivity(
      `**FineGuard Bot Commands:**\n\n` +
        `• **risk-summary** — Current risk overview\n` +
        `• **upcoming-filings** — Upcoming filing deadlines\n` +
        `• **alerts** — Recent compliance alerts\n` +
        `• **help** — This message`
    );
  }

  private async handleCardAction(ctx: TurnContext) {
    const data = ctx.activity.value?.action?.data ?? ctx.activity.value;
    const action = data?.action;

    if (action === "refresh-risk-summary") {
      await this.handleRiskSummary(ctx);
    } else if (action === "acknowledge-alert") {
      await ctx.sendActivity(`✅ Alert acknowledged. Assigned to ${data.assignedTo ?? "you"}.`);
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
