import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/events';
import type { TenantContext } from '@/lib/auth';
import { scoreRevenueAudit, type SizeTier } from './scoring';

export const submitSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  system: z.enum(['MLC', 'Opus2', 'BarBooks', 'Other']).optional(),
  sizeTier: z.enum(['1-10', '10-30', '30-70', '70+']),
  painPoints: z.array(z.string()).default([]),
  idempotencyKey: z.string().optional(),
});

export type SubmitInput = z.infer<typeof submitSchema>;

function deriveIdempotencyKey(tenantId: string, input: SubmitInput): string {
  if (input.idempotencyKey) return `${tenantId}:${input.idempotencyKey}`;
  const seed = `${tenantId}|${input.email}|${input.sizeTier}|${input.painPoints.sort().join(',')}`;
  return createHash('sha256').update(seed).digest('hex');
}

export async function submitRevenueAudit(ctx: TenantContext, input: SubmitInput) {
  const idempotencyKey = deriveIdempotencyKey(ctx.tenant.id, input);

  const existing = await prisma.lead.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return {
      leadId: existing.id,
      deduplicated: true,
      result: {
        estimatedLeak: {
          low: existing.estimatedLeakLow ?? 0,
          high: existing.estimatedLeakHigh ?? 0,
        },
        riskLevel: existing.riskLevel ?? 'Low',
        score: existing.score ?? 0,
      },
    };
  }

  const result = scoreRevenueAudit({
    system: input.system,
    sizeTier: input.sizeTier as SizeTier,
    painPoints: input.painPoints,
  });

  const lead = await prisma.lead.create({
    data: {
      tenantId: ctx.tenant.id,
      vertical: 'revenue',
      idempotencyKey,
      name: input.name,
      email: input.email,
      phone: input.phone,
      system: input.system,
      sizeTier: input.sizeTier,
      painPoints: input.painPoints,
      riskLevel: result.riskLevel,
      estimatedLeakLow: result.estimatedLeak.low,
      estimatedLeakHigh: result.estimatedLeak.high,
      score: result.score,
      stage: 'new',
    },
  });

  await emit('revenue.lead.created', { result }, ctx.tenant.id, lead.id);

  if (process.env.CRM_WEBHOOK_URL) {
    void queueCrmWebhook(process.env.CRM_WEBHOOK_URL, {
      tenantId: ctx.tenant.id,
      leadId: lead.id,
      vertical: 'revenue',
      input,
      result,
    });
  }

  return {
    leadId: lead.id,
    deduplicated: false,
    result,
  };
}

async function queueCrmWebhook(url: string, payload: unknown): Promise<void> {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error('[crm-webhook] failed', err);
  }
}
