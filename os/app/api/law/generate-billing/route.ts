import type { NextRequest } from 'next/server';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { generateBillingAction, generateBillingSchema } from '@/lib/verticals/law/actions';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  try {
    assertVerticalEnabled(ctx, 'law');
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const body = await req.json().catch(() => null);
  const parsed = generateBillingSchema.safeParse(body);
  if (!parsed.success) return fail('Invalid request', 400, { issues: parsed.error.issues });

  const result = await generateBillingAction(ctx, parsed.data);
  return ok(result);
}
