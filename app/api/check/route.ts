import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/server/services/companiesHouse'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const raw = searchParams.get('company')

  if (!raw?.trim()) {
    return NextResponse.json({ error: 'Company number required' }, { status: 400 })
  }

  const formatted = companiesHouseService.formatCompanyNumber(raw.trim())

  if (!companiesHouseService.validateCompanyNumber(formatted)) {
    return NextResponse.json(
      { error: 'Please enter a valid UK company number (8 digits, e.g. 12345678)' },
      { status: 400 }
    )
  }

  try {
    const compliance = await companiesHouseService.getComplianceStatus(formatted)

    const accountsDays = compliance.accountsStatus.daysUntilDue
    const csDays = compliance.confirmationStatementStatus.daysUntilDue
    const soonestDays = [accountsDays, csDays].filter((d) => d < 999).reduce((a, b) => Math.min(a, b), 999)

    let status: 'green' | 'amber' | 'red'
    let headline: string
    let message: string
    let daysUntilAction: number | null = null

    if (compliance.status === 'overdue') {
      status = 'red'
      headline = 'Urgent Action Required'
      const items = compliance.overdueFilings.map((f) => f.description).join(' and ')
      message = `${items} ${compliance.overdueFilings.length === 1 ? 'is' : 'are'} overdue. Potential penalties may apply.`
    } else if (compliance.status === 'warning') {
      status = 'amber'
      headline = 'Action Required Soon'
      const next = compliance.upcomingDeadlines[0]
      daysUntilAction = next?.daysUntilDue ?? soonestDays
      message = `${daysUntilAction} days until ${next?.description ?? 'next required filing'}.`
    } else {
      status = 'green'
      headline = "You're OK"
      daysUntilAction = soonestDays < 999 ? soonestDays : null
      message = daysUntilAction
        ? `${daysUntilAction} days until next required action. No action required today.`
        : 'All filings are up to date. No action required.'
    }

    return NextResponse.json({
      companyNumber: compliance.companyNumber,
      companyName: compliance.companyName,
      status,
      headline,
      message,
      daysUntilAction,
    })
  } catch (error: any) {
    if (error.message === 'Company not found') {
      return NextResponse.json(
        { error: 'No company found with that number. Please check and try again.' },
        { status: 404 }
      )
    }
    console.error('[/api/check] Error:', error?.message)
    return NextResponse.json(
      { error: 'Unable to check company status right now. Please try again shortly.' },
      { status: 500 }
    )
  }
}
