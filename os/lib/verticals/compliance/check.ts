import { createHash } from 'node:crypto';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { emit } from '@/lib/events';
import type { TenantContext } from '@/lib/auth';
import {
  getCompanyProfile,
  getFilingHistory,
  isValidCompanyNumber,
  normaliseCompanyNumber,
} from './companiesHouse';
import { scoreCompliance, type ComplianceScore } from './scoring';
import { deliverComplianceAlerts } from './deliver';

export const checkCompanySchema = z.object({
  companyNumber: z.string().min(1),
  name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});

export type CheckCompanyInput = z.infer<typeof checkCompanySchema>;

export async function checkCompany(
  ctx: TenantContext,
  input: CheckCompanyInput,
): Promise<ComplianceScore> {
  if (!isValidCompanyNumber(input.companyNumber)) {
    throw new Error(`Invalid UK company number: ${input.companyNumber}`);
  }

  const companyNumber = normaliseCompanyNumber(input.companyNumber);
  const profile = await getCompanyProfile(companyNumber);
  if (!profile) throw new Error(`Company ${companyNumber} not found`);

  const filings = await getFilingHistory(companyNumber, 10);
  const score = scoreCompliance(profile, filings);

  await upsertComplianceLead(ctx.tenant.id, input, score);
  await emit(
    'compliance.check.completed',
    {
      companyNumber: score.companyNumber,
      riskScore: score.riskScore,
      riskLevel: score.riskLevel,
      predictedPenalty: score.predictedPenalty,
      deadlineCount: score.upcomingDeadlines.length,
    },
    ctx.tenant.id,
  );

  if (score.riskLevel !== 'Low') {
    void deliverComplianceAlerts(ctx.tenant.id, score).catch((err) => {
      console.error('[compliance.deliver] webhook fan-out failed', err);
    });
  }

  return score;
}

async function upsertComplianceLead(
  tenantId: string,
  input: CheckCompanyInput,
  score: ComplianceScore,
): Promise<void> {
  const idempotencyKey = createHash('sha256')
    .update(`${tenantId}:compliance:${score.companyNumber}`)
    .digest('hex');

  await prisma.lead.upsert({
    where: { idempotencyKey },
    create: {
      tenantId,
      vertical: 'compliance',
      idempotencyKey,
      name: input.name ?? score.companyName,
      email: input.email ?? `no-contact+${score.companyNumber}@compliance.local`,
      phone: input.phone,
      companyNumber: score.companyNumber,
      complianceRiskScore: score.riskScore,
      riskLevel: score.riskLevel,
      score: score.riskScore,
      stage: 'new',
    },
    update: {
      complianceRiskScore: score.riskScore,
      riskLevel: score.riskLevel,
      score: score.riskScore,
    },
  });
}
