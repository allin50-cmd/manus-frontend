import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/lib/companiesHouse'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { number: string } },
) {
  const number = params.number?.trim()
  if (!number) {
    return NextResponse.json({ error: 'Company number is required' }, { status: 400 })
  }

  if (!companiesHouseService.hasApiKey()) {
    return NextResponse.json({
      source: 'mock',
      compliance: {
        companyNumber: number,
        companyName: 'Demo Company Ltd',
        status: 'compliant',
        riskLevel: 'low',
        accountsStatus: { nextDue: '2025-08-01', overdue: false, daysUntilDue: 43 },
        confirmationStatementStatus: { nextDue: '2025-07-15', overdue: false, daysUntilDue: 26 },
        overdueFilings: [],
        upcomingDeadlines: [],
      },
    })
  }

  try {
    const compliance = await companiesHouseService.getComplianceStatus(number)
    return NextResponse.json({ source: 'companies-house', compliance })
  } catch (err) {
    const message = (err as Error).message
    const status = message === 'Company not found' ? 404 : 502
    return NextResponse.json({ source: 'error', error: message }, { status })
  }
}
