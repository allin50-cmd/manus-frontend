import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/lib/companiesHouse'

export const dynamic = 'force-dynamic'

// Recognise UK company number formats (8 digits, or 2-letter prefix + 6 digits)
function looksLikeCompanyNumber(s: string): boolean {
  return /^\d{6,8}$/.test(s) || /^[A-Z]{2}\d{6}$/.test(s.toUpperCase())
}

type ComplianceData = {
  status: string
  riskLevel: string
  overdueFilings: unknown[]
  accountsStatus: { nextDue: string; overdue: boolean; daysUntilDue: number }
  confirmationStatementStatus: { nextDue: string; overdue: boolean; daysUntilDue: number }
}

function deriveStatus(c: ComplianceData): 'green' | 'amber' | 'red' {
  if (
    c.status === 'overdue' ||
    c.riskLevel === 'high' ||
    c.overdueFilings.length > 0 ||
    c.accountsStatus.overdue ||
    c.confirmationStatementStatus.overdue
  )
    return 'red'

  const soonestDays = Math.min(
    c.accountsStatus.daysUntilDue,
    c.confirmationStatementStatus.daysUntilDue,
  )
  if (c.status === 'warning' || c.riskLevel === 'medium' || soonestDays <= 30) return 'amber'

  return 'green'
}

function fmt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildResult(
  companyNumber: string,
  companyName: string,
  c: ComplianceData,
): object {
  const status = deriveStatus(c)

  const accounts = c.accountsStatus
  const cs = c.confirmationStatementStatus

  if (status === 'red') {
    const type = accounts.overdue ? 'annual accounts' : 'confirmation statement'
    return {
      companyNumber,
      companyName,
      status,
      headline: `${type.charAt(0).toUpperCase() + type.slice(1)} overdue`,
      message: `Your ${type} is overdue. File immediately to avoid escalating Companies House penalties of up to £1,500.`,
      daysUntilAction: 0,
    }
  }

  const soonestDays = Math.min(accounts.daysUntilDue, cs.daysUntilDue)
  const soonestDate = accounts.daysUntilDue <= cs.daysUntilDue ? accounts.nextDue : cs.nextDue
  const soonestType =
    accounts.daysUntilDue <= cs.daysUntilDue ? 'Annual accounts' : 'Confirmation statement'

  if (status === 'amber') {
    return {
      companyNumber,
      companyName,
      status,
      headline: `${soonestType} due in ${soonestDays} days`,
      message: `${soonestType} must be filed by ${fmt(soonestDate)}. FineGuard will alert you well in advance of this deadline.`,
      daysUntilAction: soonestDays,
    }
  }

  // green
  return {
    companyNumber,
    companyName,
    status,
    headline: 'Your company is compliant',
    message: `Everything is up to date. Next ${soonestType.toLowerCase()} is due ${fmt(soonestDate)} — ${soonestDays} days away. FineGuard will alert you well in advance.`,
    daysUntilAction: soonestDays,
  }
}

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get('company')?.trim() ?? ''

  if (!company) {
    return NextResponse.json({ error: 'company parameter is required' }, { status: 400 })
  }

  const isNumber = looksLikeCompanyNumber(company)

  if (!companiesHouseService.hasApiKey()) {
    console.error('FINEGUARD OPS: COMPANIES_HOUSE_API_KEY is not configured. Company lookup is unavailable.')
    return NextResponse.json(
      { error: 'Company lookup service is temporarily unavailable. Please contact hello@fineguard.co.uk' },
      { status: 503 },
    )
  }

  // ── Live path ──────────────────────────────────────────────────────────
  try {
    if (isNumber) {
      const compliance = await companiesHouseService.getComplianceStatus(company)
      return NextResponse.json(
        buildResult(compliance.companyNumber, compliance.companyName, compliance),
      )
    }

    // Name search
    const hits = await companiesHouseService.searchCompanies(company, 10)
    if (hits.length === 0) {
      return NextResponse.json(
        { error: 'No companies found matching that name. Try a different search or enter your company number directly.' },
        { status: 404 },
      )
    }
    if (hits.length === 1) {
      const compliance = await companiesHouseService.getComplianceStatus(hits[0].companyNumber)
      return NextResponse.json(
        buildResult(compliance.companyNumber, compliance.companyName, compliance),
      )
    }
    return NextResponse.json({
      multipleResults: true,
      companies: hits.map((h) => ({ number: h.companyNumber, name: h.companyName })),
    })
  } catch (err) {
    const message = (err as Error).message
    const status = message === 'Company not found' ? 404 : 502
    return NextResponse.json({ error: message }, { status })
  }
}
