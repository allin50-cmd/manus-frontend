import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/server/services/companiesHouse'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const companyNumber = body?.companyNumber

    if (!companyNumber || typeof companyNumber !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Company number is required' },
        { status: 400 }
      )
    }

    if (!companiesHouseService.validateCompanyNumber(companyNumber)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid company number format' },
        { status: 400 }
      )
    }

    const formattedNumber = companiesHouseService.formatCompanyNumber(companyNumber)
    const compliance = await companiesHouseService.getComplianceStatus(formattedNumber)

    return NextResponse.json({
      ok: true,
      company: {
        number: compliance.companyNumber,
        name: compliance.companyName,
      },
      compliance: {
        status: compliance.status,
        riskLevel: compliance.riskLevel,
        accounts: compliance.accountsStatus,
        confirmationStatement: compliance.confirmationStatementStatus,
        overdueFilings: compliance.overdueFilings,
        upcomingDeadlines: compliance.upcomingDeadlines,
        penalties: compliance.penalties ?? [],
      },
    })
  } catch (error) {
    console.error('Error in /api/check:', error)

    const message = error instanceof Error ? error.message : 'Failed to retrieve compliance data'

    if (message.includes('Company not found')) {
      return NextResponse.json(
        { ok: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    if (message.includes('COMPANIES_HOUSE_API_KEY')) {
      return NextResponse.json(
        { ok: false, error: 'Companies House API is not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { ok: false, error: 'Failed to retrieve compliance data' },
      { status: 500 }
    )
  }
}
