// ============================================================
// FineGuard M365 Integration — TypeScript Interfaces
// ============================================================

// ── Azure AD / Auth ─────────────────────────────────────────

export interface AzureADConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresOn: Date;
  tokenType: "Bearer";
}

// ── Multi-Tenant ────────────────────────────────────────────

export interface Tenant {
  id: string;
  firmId: string;
  firmName: string;
  tenantId: string; // Azure AD tenant ID
  subscriptionTier: "starter" | "professional" | "enterprise";
  isActive: boolean;
  createdAt: string;
}

// ── Compliance / Risk ───────────────────────────────────────

export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface ComplianceEvent {
  eventId: string;
  eventType:
    | "filing_due"
    | "risk_alert"
    | "audit_finding"
    | "policy_breach"
    | "deadline_reminder";
  firmId: string;
  firmName: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  dueDate?: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ── Webhook ─────────────────────────────────────────────────

export interface WebhookPayload {
  eventType: string;
  firmId: string;
  firmName?: string;
  riskLevel?: RiskLevel;
  title?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookHeaders {
  "x-fineguard-secret": string;
  "x-fineguard-event": string;
  "content-type": "application/json";
}

// ── Teams ───────────────────────────────────────────────────

export interface TeamsMessage {
  channelId: string;
  teamId: string;
  subject?: string;
  body: string;
  importance?: "low" | "normal" | "high" | "urgent";
  mentions?: TeamsMention[];
}

export interface TeamsMention {
  id: number;
  mentionText: string;
  mentioned: { user: { id: string; displayName: string } };
}

export interface TeamsAdaptiveCard {
  type: "AdaptiveCard";
  version: "1.4";
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

export interface AdaptiveCardElement {
  type: string;
  text?: string;
  size?: string;
  weight?: string;
  color?: string;
  wrap?: boolean;
  items?: AdaptiveCardElement[];
  columns?: AdaptiveCardColumn[];
  facts?: { title: string; value: string }[];
  style?: string;
  bleed?: boolean;
  separator?: boolean;
  spacing?: string;
}

export interface AdaptiveCardColumn {
  type: "Column";
  width: string;
  items: AdaptiveCardElement[];
}

export interface AdaptiveCardAction {
  type: string;
  title: string;
  url?: string;
  data?: Record<string, unknown>;
}

// ── Outlook ─────────────────────────────────────────────────

export interface OutlookEmail {
  to: EmailRecipient[];
  cc?: EmailRecipient[];
  subject: string;
  body: string;
  bodyType: "html" | "text";
  importance?: "low" | "normal" | "high";
  attachments?: EmailAttachment[];
}

export interface EmailRecipient {
  emailAddress: { address: string; name?: string };
}

export interface EmailAttachment {
  name: string;
  contentType: string;
  contentBytes: string; // Base64
}

export interface CalendarEvent {
  subject: string;
  body: { contentType: "html" | "text"; content: string };
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  location?: { displayName: string };
  attendees?: CalendarAttendee[];
  isReminderOn?: boolean;
  reminderMinutesBeforeStart?: number;
  recurrence?: CalendarRecurrence;
}

export interface CalendarAttendee {
  emailAddress: { address: string; name?: string };
  type: "required" | "optional";
}

export interface CalendarRecurrence {
  pattern: {
    type: "daily" | "weekly" | "absoluteMonthly" | "relativeMonthly" | "absoluteYearly";
    interval: number;
    daysOfWeek?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[];
    dayOfMonth?: number;
    month?: number;
  };
  range: {
    type: "endDate" | "numbered" | "noEnd";
    startDate: string;
    endDate?: string;
    numberOfOccurrences?: number;
  };
}

// ── SharePoint ──────────────────────────────────────────────

export interface SharePointListItem {
  fields: Record<string, unknown>;
  listId: string;
  siteId: string;
}

// ── Power Automate ──────────────────────────────────────────

export interface PowerAutomatePayload {
  eventType: string;
  firmId: string;
  firmName: string;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  dueDate?: string;
  assignedTo?: string;
  timestamp: string;
}

// ── Planner ─────────────────────────────────────────────────

export interface PlannerTask {
  planId: string;
  bucketId: string;
  title: string;
  dueDateTime?: string;
  assignments?: Record<string, { orderHint: string }>;
  appliedCategories?: Record<string, boolean>;
  percentComplete?: number;
}

// ── Azure Function ──────────────────────────────────────────

export interface AzureFunctionResponse {
  status: number;
  body: {
    success: boolean;
    message: string;
    eventId?: string;
    retryCount?: number;
  };
}
