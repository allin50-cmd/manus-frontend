export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/compliance-analysis
 *
 * Returns an AI-generated compliance analysis for a UK company number.
 * Requires: x-api-key: MONITORING_API_KEY
 *
 * Body: { companyNumber: string, context?: string }
 * Response: { analysis, riskScore, recommendations, generatedAt }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireApiKey } from '@/lib/utils/require-api-key';
import { config } from '@/config';
import { companiesHouseService } from '@/server/services/companiesHouse';
import { mapComplianceResponse } from '@/lib/companies-house/mapper';
import { fullComplianceAnalysis } from '@/lib/ai/compliance-analysis';

const bodySchema = z.object({
  companyNumber: z.string().min(1).max(20),
  context: z.string().max(500).optional(),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authError = requireApiKey(req);
  if (authError) return authError;

  if (!config.ai.apiKey) {
    return NextResponse.json(
      { error: 'AI analysis unavailable — ANTHROPIC_API_KEY is not configured' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const { companyNumber, context } = parsed.data;
  const formatted = companiesHouseService.formatCompanyNumber(companyNumber);

  let company;
  try {
    const profile = await companiesHouseService.getCompanyProfile(formatted);
    if (!profile) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    const compliance = await companiesHouseService.getComplianceStatus(formatted, profile);
    company = mapComplianceResponse({
      company: {
        number: profile.companyNumber,
        name: profile.companyName,
        status: profile.companyStatus,
        type: profile.type,
        incorporationDate: profile.dateOfCreation,
      },
      compliance: {
        status: compliance.status,
        riskLevel: compliance.riskLevel,
        accounts: compliance.accountsStatus,
        confirmationStatement: compliance.confirmationStatementStatus,
        overdueFilings: compliance.overdueFilings.map((f) => ({
          type: f.type,
          description: f.description,
          dueDate: f.dueDate,
          daysUntilDue: f.daysUntilDue,
          penaltyRisk: f.penaltyRisk ?? 0,
          daysOverdue: Math.abs(f.daysUntilDue),
        })),
        penalties: compliance.penalties,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch company data: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  const result = await fullComplianceAnalysis(company, context);
  if (!result) {
    return NextResponse.json(
      { error: 'AI analysis failed — check server logs for details' },
      { status: 502 },
    );
  }

  return NextResponse.json(result);
}
