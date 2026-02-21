// ============================================================
// FineGuard — Microsoft Graph API Client
// ============================================================
//
// Unified client for Teams, Outlook, SharePoint, Power BI,
// and User Profile operations via Microsoft Graph v1.0.
//
// Dependencies:
//   npm install @azure/msal-node
// ============================================================

import type {
  AzureADConfig,
  TeamsMessage,
  OutlookEmail,
  CalendarEvent,
  SharePointListItem,
  PlannerTask,
} from "../types/index.js";
import { getAppToken, getDelegatedToken } from "./auth.js";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

// ── HTTP Helper ─────────────────────────────────────────────

async function graphRequest<T>(
  token: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${GRAPH_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Graph API ${method} ${path} failed (${res.status}): ${errorBody}`
    );
  }

  // 204 No Content
  if (res.status === 204) return {} as T;

  return res.json() as Promise<T>;
}

// ── FineGuard Graph Client ──────────────────────────────────

export class FineGuardGraphClient {
  private config: AzureADConfig;
  private tokenPromise: Promise<string> | null = null;

  constructor(config: AzureADConfig) {
    this.config = config;
  }

  /** Acquire an app-level access token (cached internally). */
  private async getToken(): Promise<string> {
    if (!this.tokenPromise) {
      this.tokenPromise = getAppToken(this.config).then((t) => {
        // Clear promise so next call re-evaluates cache
        setTimeout(() => {
          this.tokenPromise = null;
        }, 50 * 60 * 1000); // 50 min
        return t.accessToken;
      });
    }
    return this.tokenPromise;
  }

  // ── User Profile ────────────────────────────────────────

  /** Get the profile of a user by ID or UPN. */
  async getUserProfile(userIdOrUpn: string) {
    const token = await this.getToken();
    return graphRequest<{
      id: string;
      displayName: string;
      mail: string;
      jobTitle: string;
      department: string;
    }>(token, "GET", `/users/${encodeURIComponent(userIdOrUpn)}`);
  }

  /** List all users in the tenant (paginated). */
  async listUsers(top = 25) {
    const token = await this.getToken();
    return graphRequest<{ value: Array<{ id: string; displayName: string; mail: string }> }>(
      token,
      "GET",
      `/users?$top=${top}&$select=id,displayName,mail`
    );
  }

  // ── Teams ───────────────────────────────────────────────

  /** Post a message to a Teams channel. */
  async sendTeamsChannelMessage(msg: TeamsMessage) {
    const token = await this.getToken();
    return graphRequest(
      token,
      "POST",
      `/teams/${msg.teamId}/channels/${msg.channelId}/messages`,
      {
        subject: msg.subject,
        body: { contentType: "html", content: msg.body },
        importance: msg.importance ?? "normal",
      }
    );
  }

  /** Post an Adaptive Card to a Teams channel. */
  async sendTeamsAdaptiveCard(
    teamId: string,
    channelId: string,
    card: Record<string, unknown>
  ) {
    const token = await this.getToken();
    return graphRequest(
      token,
      "POST",
      `/teams/${teamId}/channels/${channelId}/messages`,
      {
        body: { contentType: "html", content: "" },
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: JSON.stringify(card),
          },
        ],
      }
    );
  }

  /** List channels in a team. */
  async listTeamChannels(teamId: string) {
    const token = await this.getToken();
    return graphRequest<{
      value: Array<{ id: string; displayName: string; description: string }>;
    }>(token, "GET", `/teams/${teamId}/channels`);
  }

  // ── Outlook — Email ─────────────────────────────────────

  /** Send an email via Microsoft Graph (app or delegated). */
  async sendEmail(fromUserId: string, email: OutlookEmail) {
    const token = await this.getToken();
    return graphRequest(
      token,
      "POST",
      `/users/${encodeURIComponent(fromUserId)}/sendMail`,
      {
        message: {
          subject: email.subject,
          body: { contentType: email.bodyType, content: email.body },
          toRecipients: email.to,
          ccRecipients: email.cc ?? [],
          importance: email.importance ?? "normal",
          attachments: email.attachments?.map((a) => ({
            "@odata.type": "#microsoft.graph.fileAttachment",
            name: a.name,
            contentType: a.contentType,
            contentBytes: a.contentBytes,
          })),
        },
      }
    );
  }

  // ── Outlook — Calendar ──────────────────────────────────

  /** Create a calendar event for a user. */
  async createCalendarEvent(userId: string, event: CalendarEvent) {
    const token = await this.getToken();
    return graphRequest(
      token,
      "POST",
      `/users/${encodeURIComponent(userId)}/events`,
      event
    );
  }

  /** List upcoming calendar events for a user. */
  async listCalendarEvents(userId: string, top = 10) {
    const token = await this.getToken();
    return graphRequest<{ value: Array<Record<string, unknown>> }>(
      token,
      "GET",
      `/users/${encodeURIComponent(userId)}/events?$top=${top}&$orderby=start/dateTime`
    );
  }

  // ── SharePoint ──────────────────────────────────────────

  /** Get items from a SharePoint list. */
  async getSharePointListItems(siteId: string, listId: string) {
    const token = await this.getToken();
    return graphRequest<{ value: Array<Record<string, unknown>> }>(
      token,
      "GET",
      `/sites/${siteId}/lists/${listId}/items?expand=fields`
    );
  }

  /** Create an item in a SharePoint list. */
  async createSharePointListItem(item: SharePointListItem) {
    const token = await this.getToken();
    return graphRequest(
      token,
      "POST",
      `/sites/${item.siteId}/lists/${item.listId}/items`,
      { fields: item.fields }
    );
  }

  /** Upload a file to SharePoint document library. */
  async uploadSharePointFile(
    siteId: string,
    driveId: string,
    folderPath: string,
    fileName: string,
    content: Buffer
  ) {
    const token = await this.getToken();
    const url = `${GRAPH_BASE}/sites/${siteId}/drives/${driveId}/root:/${folderPath}/${fileName}:/content`;

    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/octet-stream",
      },
      body: content,
    });

    if (!res.ok) {
      throw new Error(`SharePoint upload failed (${res.status}): ${await res.text()}`);
    }

    return res.json();
  }

  // ── Planner ─────────────────────────────────────────────

  /** Create a Planner task. */
  async createPlannerTask(task: PlannerTask) {
    const token = await this.getToken();
    return graphRequest(token, "POST", "/planner/tasks", task);
  }

  // ── Power BI (read-only examples) ───────────────────────

  /** List Power BI workspaces the app has access to. */
  async listPowerBIWorkspaces() {
    const token = await this.getToken();
    return graphRequest<{ value: Array<{ id: string; name: string }> }>(
      token,
      "GET",
      "/groups?$filter=resourceProvisioningOptions/Any(x:x eq 'Team')&$select=id,displayName"
    );
  }
}
