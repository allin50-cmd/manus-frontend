import { NextRequest, NextResponse } from 'next/server';
import { companiesHouseService } from '@/server/services/companiesHouse';
import { mapComplianceResponse } from '@/lib/companies-house/mapper';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q) {
    return NextResponse.json({ error: 'q is required' }, { status: 400 });
  }

  try {
    const formatted = companiesHouseService.formatCompanyNumber(q);
    const isNumber = companiesHouseService.validateCompanyNumber(q);

    if (isNumber) {
      const profile = await companiesHouseService.getCompanyProfile(formatted);
      if (!profile) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }
      const compliance = await companiesHouseService.getComplianceStatus(formatted);
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
      return NextResponse.json({ company });
    }

    // Name search
    const results = await companiesHouseService.searchCompanies(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error('Companies House API error:', err);
    return NextResponse.json({ error: 'Failed to fetch company data' }, { status: 500 });
  }
}
