import { createHmac, timingSafeEqual } from 'node:crypto';
import { listWebhooksForCompany } from './webhook';
import type { ComplianceScore } from './scoring';

export interface DeliveryResult {
  url: string;
  status: number | 'error';
  attempts: number;
  error?: string;
}

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

export async function deliverComplianceAlerts(
  tenantId: string,
  score: ComplianceScore,
): Promise<DeliveryResult[]> {
  const urls = await listWebhooksForCompany(tenantId, score.companyNumber);
  if (urls.length === 0) return [];

  const payload = JSON.stringify({
    type: 'compliance.alert',
    tenantId,
    at: new Date().toISOString(),
    score,
  });

  const results: DeliveryResult[] = [];
  for (const url of urls) {
    results.push(await deliverWithRetry(url, payload));
  }
  return results;
}

async function deliverWithRetry(url: string, payload: string): Promise<DeliveryResult> {
  let lastErr: string | undefined;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-uios-signature': signPayload(payload),
          'x-uios-delivery-attempt': String(attempt),
        },
        body: payload,
      });
      if (res.ok) return { url, status: res.status, attempts: attempt };
      if (res.status < 500 && res.status !== 429) {
        return { url, status: res.status, attempts: attempt, error: `HTTP ${res.status}` };
      }
      lastErr = `HTTP ${res.status}`;
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    if (attempt < MAX_ATTEMPTS) await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
  }
  return { url, status: 'error', attempts: MAX_ATTEMPTS, error: lastErr };
}

function signPayload(payload: string): string {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret) return '';
  return createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.WEBHOOK_SIGNING_SECRET;
  if (!secret) return false;
  const expected = createHmac('sha256', secret).update(payload).digest();
  const received = Buffer.from(signature, 'hex');
  return received.length === expected.length && timingSafeEqual(received, expected);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
