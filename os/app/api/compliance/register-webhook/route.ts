import type { NextRequest } from 'next/server';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { registerWebhook, registerWebhookSchema } from '@/lib/verticals/compliance/webhook';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  try {
    assertVerticalEnabled(ctx, 'compliance');
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const body = await req.json().catch(() => null);
  const parsed = registerWebhookSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid request', 400, { issues: parsed.error.issues });

  try {
    const result = await registerWebhook(ctx, parsed.data);
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook registration failed';
    return fail(message, 400);
  }
}
