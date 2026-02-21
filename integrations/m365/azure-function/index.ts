// ============================================================
// FineGuard — Azure Function: Webhook Receiver & Forwarder
// ============================================================
//
// Receives POST webhooks from FineGuard, validates the secret
// token and payload structure, then forwards to Power Automate
// with exponential-backoff retry (up to 3 attempts).
//
// Deployment:
//   Azure Functions Node.js v4 runtime (TypeScript)
// ============================================================

import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import type { WebhookPayload } from "../types/index.js";

// ── Configuration ───────────────────────────────────────────

const WEBHOOK_SECRET = process.env["FINEGUARD_WEBHOOK_SECRET"] ?? "";
const POWER_AUTOMATE_URL = process.env["POWER_AUTOMATE_TRIGGER_URL"] ?? "";
const MAX_RETRIES = 3;         // total attempts (0, 1, 2)
const BASE_DELAY_MS = 1_000;   // 1 s, 2 s, 4 s (capped at 16 s)
const MAX_DELAY_MS = 16_000;
const FETCH_TIMEOUT_MS = 10_000;

// ── Payload Validation ──────────────────────────────────────

function validatePayload(body: unknown): body is WebhookPayload {
  if (typeof body !== "object" || body === null) return false;
  const obj = body as Record<string, unknown>;
  return (
    typeof obj["eventType"] === "string" &&
    obj["eventType"].length > 0 &&
    typeof obj["firmId"] === "string" &&
    obj["firmId"].length > 0
  );
}

// ── Fetch with manual timeout (Node.js < 17 safe) ──────────

async function fetchWithTimeout(
  url: string,
  init: RequestInit
): Promise<Response> {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(tid);
  }
}

// ── Retry Helper ────────────────────────────────────────────

async function forwardWithRetry(
  payload: WebhookPayload,
  context: InvocationContext
): Promise<{ ok: boolean; status: number; retryCount: number }> {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      context.log(`Forward attempt ${attempt + 1}/${MAX_RETRIES} to Power Automate`);

      const res = await fetchWithTimeout(POWER_AUTOMATE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        context.log(`Forward succeeded on attempt ${attempt + 1} (HTTP ${res.status})`);
        return { ok: true, status: res.status, retryCount: attempt };
      }

      // Non-retryable client errors (4xx except 429 Too Many Requests)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        context.log(`[WARN] Non-retryable error from Power Automate: HTTP ${res.status}`);
        return { ok: false, status: res.status, retryCount: attempt };
      }

      context.log(`[WARN] Retryable error from Power Automate: HTTP ${res.status}, attempt ${attempt + 1}`);
    } catch (err) {
      context.log(`[WARN] Network error on attempt ${attempt + 1}: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Exponential backoff before next attempt (skip after last)
    if (attempt < MAX_RETRIES - 1) {
      const delay = Math.min(MAX_DELAY_MS, BASE_DELAY_MS * Math.pow(2, attempt));
      context.log(`Waiting ${delay}ms before retry…`);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  context.log("[ERROR] All retry attempts exhausted — forwarding failed");
  return { ok: false, status: 502, retryCount: MAX_RETRIES };
}

// ── Main Handler ────────────────────────────────────────────

async function fineGuardWebhook(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const requestId = crypto.randomUUID();
  context.log(`[${requestId}] Incoming webhook: ${request.method} ${request.url}`);

  // ── 1. Method check ─────────────────────────────────────
  if (request.method !== "POST") {
    context.log(`[WARN][${requestId}] Rejected: Method ${request.method} not allowed`);
    return {
      status: 405,
      jsonBody: { success: false, message: "Method not allowed" },
    };
  }

  // ── 2. Secret token validation ──────────────────────────
  if (!WEBHOOK_SECRET) {
    context.log(`[ERROR][${requestId}] FINEGUARD_WEBHOOK_SECRET is not configured`);
    return {
      status: 500,
      jsonBody: { success: false, message: "Server misconfigured" },
    };
  }

  const providedSecret = request.headers.get("x-fineguard-secret");
  if (!providedSecret || providedSecret !== WEBHOOK_SECRET) {
    context.log(`[WARN][${requestId}] Rejected: Invalid or missing secret token`);
    return {
      status: 401,
      jsonBody: { success: false, message: "Unauthorized — invalid secret" },
    };
  }

  // ── 3. Parse and validate payload ───────────────────────
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    context.log(`[WARN][${requestId}] Rejected: Malformed JSON body`);
    return {
      status: 400,
      jsonBody: { success: false, message: "Invalid JSON body" },
    };
  }

  if (!validatePayload(body)) {
    context.log(`[WARN][${requestId}] Rejected: Payload missing required fields (eventType, firmId)`);
    return {
      status: 422,
      jsonBody: {
        success: false,
        message: "Payload must include eventType (string) and firmId (string)",
      },
    };
  }

  context.log(`[${requestId}] Valid payload — eventType=${body.eventType}, firmId=${body.firmId}`);

  // ── 4. Forward to Power Automate with retry ─────────────
  if (!POWER_AUTOMATE_URL) {
    context.log(`[ERROR][${requestId}] POWER_AUTOMATE_TRIGGER_URL is not configured`);
    return {
      status: 500,
      jsonBody: { success: false, message: "Power Automate URL not configured" },
    };
  }

  const result = await forwardWithRetry(body, context);

  if (result.ok) {
    context.log(`[${requestId}] Successfully forwarded to Power Automate (retries: ${result.retryCount})`);
    return {
      status: 200,
      jsonBody: {
        success: true,
        message: "Event received and forwarded successfully",
        eventId: requestId,
        retryCount: result.retryCount,
      },
    };
  }

  context.log(`[ERROR][${requestId}] Failed to forward after ${result.retryCount} attempts (HTTP ${result.status})`);
  return {
    status: 502,
    jsonBody: {
      success: false,
      message: `Failed to forward to Power Automate after ${result.retryCount} attempts`,
      eventId: requestId,
      retryCount: result.retryCount,
    },
  };
}

// ── Register the Function ───────────────────────────────────

app.http("fineGuardWebhook", {
  methods: ["POST"],
  authLevel: "function",
  handler: fineGuardWebhook,
});

export default fineGuardWebhook;
