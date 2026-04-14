export const dynamic = 'force-dynamic';

/**
 * GET /api/discovery?q={companyNumber}
 *
 * Agent discovery layer — enriches a company number with:
 *   officers, PSC, charges, viability score, and AI-generated insights
 *   on who to do business with, how to engage, and whether the company
 *   is a viable counterpart.
 *
 * Rate-limited to 10 req/min per IP (each call triggers 3 CH sub-requests).
 * Degrades gracefully when ANTHROPIC_API_KEY is absent (returns null insights).
 */

import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseService } from '@/server/services/companiesHouse';
import { mapComplianceResponse } from '@/lib/companies-house/mapper';
import { isRateLimited, getClientIp } from '@/lib/utils/rateLimiter';
import { computeViabilityScore } from '@/lib/viability/score';
import { generateDiscoveryInsights } from '@/lib/ai/agent-discovery';
import type { AgentDiscovery } from '@/types/discovery';

const DISCOVERY_RATE_LIMIT = 10;
const DISCOVERY_RATE_WINDOW_MS = 60_000;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const ip = getClientIp(req);
  if (isRateLimited(`discovery:${ip}`, DISCOVERY_RATE_LIMIT, DISCOVERY_RATE_WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many requests — please wait before searching again' },
      { status: 429, headers: { 'Retry-After': '60' } },
    );
  }

  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'q (company number) is required' }, { status: 400 });
  }

  const formatted = companiesHouseService.formatCompanyNumber(q);

  // ── Fetch all data in parallel ─────────────────────────────────────────────
  let profile;
  try {
    profile = await companiesHouseService.getCompanyProfile(formatted);
    if (!profile) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Companies House error: ${err instanceof Error ? err.message : err}` },
      { status: 502 },
    );
  }

  const [compliance, officers, psc, charges] = await Promise.all([
    companiesHouseService.getComplianceStatus(formatted, profile),
    companiesHouseService.getOfficers(formatted),
    companiesHouseService.getPersonsWithSignificantControl(formatted),
    companiesHouseService.getCharges(formatted),
  ]);

  const company = mapComplianceResponse({
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

  const sicCodes = profile.sicCodes ?? [];

  const viability = computeViabilityScore({
    company,
    sicCodes,
    hasInsolvencyHistory: profile.hasInsolvencyHistory,
    hasBeenLiquidated: profile.hasBeenLiquidated,
    officers,
    personsWithSignificantControl: psc,
    charges,
  });

  // AI insights — null if key absent or call fails (graceful degradation)
  const insights = await generateDiscoveryInsights({
    company,
    sicCodes,
    officers,
    personsWithSignificantControl: psc,
    charges,
    viability,
  });

  const result: AgentDiscovery = {
    companyNumber: profile.companyNumber,
    companyName: profile.companyName,
    sicCodes,
    hasInsolvencyHistory: profile.hasInsolvencyHistory,
    officers,
    personsWithSignificantControl: psc,
    charges,
    viability,
    insights,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
