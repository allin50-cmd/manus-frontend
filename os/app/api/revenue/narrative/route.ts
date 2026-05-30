import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { resolveTenantFromRequest, assertVerticalEnabled } from '@/lib/auth';
import { fail, ok, unauthorized } from '@/lib/http';
import { safeString } from '@/lib/validators';
import { generateRevenueNarrative } from '@/lib/verticals/revenue/narrative';

const bodySchema = z.object({
  lead: z.object({
    name: safeString(),
    system: safeString().optional(),
    sizeTier: safeString().optional(),
    painPoints: z.array(safeString()).optional(),
  }),
  result: z.object({
    estimatedLeak: z.object({ low: z.number(), high: z.number() }),
    riskLevel: z.enum(['Low', 'Moderate', 'High']),
    confidence: z.number(),
    drivers: z.array(z.string()),
    score: z.number(),
  }),
});

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
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return fail('Invalid request', 400, { issues: parsed.error.issues });

  const narrative = await generateRevenueNarrative(parsed.data);
  return ok({ narrative });
}
