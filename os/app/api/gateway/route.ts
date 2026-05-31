import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { resolveTenantFromRequest, assertVerticalEnabled, type TenantContext } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { handleRevenueAction } from '@/lib/verticals/revenue/actions';
import { handleLawAction } from '@/lib/verticals/law/actions';
import { handleComplianceAction } from '@/lib/verticals/compliance/actions';

const gatewaySchema = z.object({
  vertical: z.enum(['revenue', 'law', 'compliance']),
  action: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
});

export async function POST(req: NextRequest) {
  const ctx = await resolveTenantFromRequest(req);
  if (!ctx) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail('Invalid JSON body');
  }

  const parsed = gatewaySchema.safeParse(body);
  if (!parsed.success) {
    return fail('Invalid request', 400, { issues: parsed.error.issues });
  }

  const { vertical, action, payload } = parsed.data;

  try {
    assertVerticalEnabled(ctx, vertical);
  } catch (res) {
    if (res instanceof Response) return res;
    throw res;
  }

  const result = await dispatch(ctx, vertical, action, payload);
  return ok({ result, policyUsed: { vertical, action } });
}

async function dispatch(
  ctx: TenantContext,
  vertical: string,
  action: string,
  payload: Record<string, unknown>,
) {
  switch (vertical) {
    case 'revenue':
      return handleRevenueAction(ctx, action, payload);
    case 'law':
      return handleLawAction(ctx, action, payload);
    case 'compliance':
      return handleComplianceAction(ctx, action, payload);
    default:
      throw new Error(`Unknown vertical: ${vertical}`);
  }
}
