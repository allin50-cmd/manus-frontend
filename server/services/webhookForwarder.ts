// ============================================================
// FineGuard — Webhook Forwarder Service
// ============================================================
//
// Forwards compliance events from the FineGuard backend to the
// Azure Function webhook endpoint (which then forwards to Power
// Automate). Implements retry with exponential backoff.
// ============================================================

const WEBHOOK_URL = process.env['AZURE_FUNCTION_URL'] || '';
const WEBHOOK_SECRET = process.env['FINEGUARD_WEBHOOK_SECRET'] || '';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1_000;
const FETCH_TIMEOUT_MS = 10_000;

interface WebhookEvent {
  eventType: string;
  firmId: string;
  firmName?: string;
  riskLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  title?: string;
  description?: string;
  dueDate?: string;
  assignedTo?: string;
  metadata?: Record<string, unknown>;
}

interface ForwardResult {
  success: boolean;
  statusCode?: number;
  retryCount: number;
  error?: string;
}

/**
 * Check if webhook forwarding is configured.
 */
export function isWebhookConfigured(): boolean {
  return !!(WEBHOOK_URL && WEBHOOK_SECRET);
}

/**
 * Forward a compliance event to the Azure Function webhook endpoint.
 * Retries up to MAX_RETRIES times with exponential backoff.
 */
export async function forwardComplianceEvent(event: WebhookEvent): Promise<ForwardResult> {
  if (!WEBHOOK_URL) {
    return { success: false, retryCount: 0, error: 'AZURE_FUNCTION_URL not configured' };
  }
  if (!WEBHOOK_SECRET) {
    return { success: false, retryCount: 0, error: 'FINEGUARD_WEBHOOK_SECRET not configured' };
  }

  const payload = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fineguard-secret': WEBHOOK_SECRET,
          'x-fineguard-event': event.eventType,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        return { success: true, statusCode: res.status, retryCount: attempt };
      }

      // Non-retryable client errors (4xx except 429)
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        const body = await res.text().catch(() => '');
        return {
          success: false,
          statusCode: res.status,
          retryCount: attempt,
          error: `HTTP ${res.status}: ${body}`,
        };
      }

      console.warn(`[WebhookForwarder] Attempt ${attempt + 1}/${MAX_RETRIES} failed: HTTP ${res.status}`);
    } catch (err) {
      console.warn(
        `[WebhookForwarder] Attempt ${attempt + 1}/${MAX_RETRIES} error:`,
        err instanceof Error ? err.message : String(err)
      );
    }

    // Exponential backoff before next attempt
    if (attempt < MAX_RETRIES - 1) {
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    success: false,
    retryCount: MAX_RETRIES,
    error: `All ${MAX_RETRIES} retry attempts exhausted`,
  };
}
