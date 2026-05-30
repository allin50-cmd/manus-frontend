import type { NextRequest } from 'next/server';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { submitRevenueAudit, submitSchema } from '@/lib/verticals/revenue/submit';

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  try {
    assertVerticalEnabled(ctx, 'revenue');
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body');
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request', 400, { issues: parsed.error.issues });
  }

  const result = await submitRevenueAudit(ctx, parsed.data);
  return ok(result);
}
