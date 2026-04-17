import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/events';
import type { TenantContext } from '@/lib/auth';
import { safeString } from '@/lib/validators';

export const outcomeSchema = z.object({
  leadId: safeString({ min: 1, max: 30 }),
  status: z.enum(['won', 'lost', 'no_response', 'disqualified']),
  dealValue: z.number().int().nonnegative().optional(),
  notes: safeString({ max: 5000 }).optional(),
});

export type OutcomeInput = z.infer<typeof outcomeSchema>;

export interface OutcomeResult {
  leadId: string;
  status: OutcomeInput['status'];
  dealValue?: number;
  tenantStats: {
    wins: number;
    losses: number;
    winRate: number;
    avgDealValue: number;
  };
}

export async function recordOutcome(
  ctx: TenantContext,
  input: OutcomeInput,
): Promise<OutcomeResult> {
  const lead = await prisma.lead.findFirst({
    where: { id: input.leadId, tenantId: ctx.tenant.id },
  });
  if (!lead) throw new Error(`Lead ${input.leadId} not found for this tenant`);

  await prisma.leadOutcome.upsert({
    where: { leadId: lead.id },
    create: {
      leadId: lead.id,
      status: input.status,
      dealValue: input.dealValue,
      vertical: lead.vertical,
      notes: input.notes,
    },
    update: {
      status: input.status,
      dealValue: input.dealValue ?? null,
      notes: input.notes ?? null,
    },
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      stage:
        input.status === 'won'
          ? 'won'
          : input.status === 'lost'
            ? 'lost'
            : input.status === 'disqualified'
              ? 'disqualified'
              : 'no_response',
    },
  });

  await emit(
    'revenue.outcome.recorded',
    { leadId: lead.id, status: input.status, dealValue: input.dealValue ?? 0 },
    ctx.tenant.id,
    lead.id,
  );

  const stats = await tenantStats(ctx.tenant.id);
  return { leadId: lead.id, status: input.status, dealValue: input.dealValue, tenantStats: stats };
}

async function tenantStats(tenantId: string) {
  const outcomes = await prisma.leadOutcome.findMany({
    where: { lead: { tenantId, vertical: 'revenue' } },
    select: { status: true, dealValue: true },
  });

  const wins = outcomes.filter((o) => o.status === 'won').length;
  const losses = outcomes.filter((o) => o.status === 'lost').length;
  const decided = wins + losses;
  const winsWithValue = outcomes.filter((o) => o.status === 'won' && o.dealValue);
  const avgDealValue =
    winsWithValue.length > 0
      ? Math.round(
          winsWithValue.reduce((s, o) => s + (o.dealValue ?? 0), 0) / winsWithValue.length,
        )
      : 0;

  return {
    wins,
    losses,
    winRate: decided === 0 ? 0 : Number((wins / decided).toFixed(3)),
    avgDealValue,
  };
}
