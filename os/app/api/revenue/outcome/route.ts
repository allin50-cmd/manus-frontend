import type { NextRequest } from 'next/server';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { recordOutcome, outcomeSchema } from '@/lib/verticals/revenue/outcome';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  try {
    assertVerticalEnabled(ctx, 'revenue');
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const body = await req.json().catch(() => null);
  const parsed = outcomeSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid request', 400, { issues: parsed.error.issues });

  try {
    const result = await recordOutcome(ctx, parsed.data);
    return ok(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to record outcome';
    const status = /not found/i.test(message) ? 404 : 400;
    return fail(message, status);
  }
}
