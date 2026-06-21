import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

type Deadline = {
  type: 'accounts' | 'confirmation-statement'
  description: string
  dueDate: string
  daysUntilDue: number
  overdue: boolean
  penaltyRisk?: number
}

type CompanyProfile = {
  company_number: string
  company_name: string
  company_status: string
  accounts?: {
    next_accounts?: {
      due_on?: string
      overdue?: boolean
    }
  }
  confirmation_statement?: {
    next_due?: string
    overdue?: boolean
  }
}

function validateCompanyNumber(companyNumber: string) {
  const cleaned = companyNumber.replace(/\s/g, '').toUpperCase()
  return /^([A-Z]{2}\d{6}|\d{8})$/.test(cleaned)
}

function formatCompanyNumber(companyNumber: string) {
  const cleaned = companyNumber.replace(/\s/g, '').toUpperCase()
  if (/^\d+$/.test(cleaned) && cleaned.length < 8) return cleaned.padStart(8, '0')
  return cleaned
}

function daysUntil(value?: string) {
  if (!value) return 999
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 999
  const now = new Date()
  return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function accountsPenalty(daysOverdue: number) {
  if (daysOverdue <= 30) return 150
  if (daysOverdue <= 90) return 375
  if (daysOverdue <= 180) return 750
  return 1500
}

function confirmationPenalty(daysOverdue: number) {
  if (daysOverdue <= 14) return 0
  if (daysOverdue <= 28) return 150
  if (daysOverdue <= 90) return 500
  return 1000
}

async function getCompanyProfile(companyNumber: string): Promise<CompanyProfile | null> {
  const apiKey = process.env.COMPANIES_HOUSE_API_KEY

  if (!apiKey) {
    throw new Error('COMPANIES_HOUSE_API_KEY environment variable is required')
  }

  const response = await fetch(`https://api.company-information.service.gov.uk/company/${companyNumber}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (response.status === 404) return null
  if (response.status === 401) throw new Error('Invalid Companies House API key')
  if (response.status === 429) throw new Error('Companies House API rate limit exceeded')
  if (!response.ok) throw new Error(`Companies House API error: ${response.status}`)

  return response.json()
}

async function runCheck(companyNumberInput: unknown) {
  if (!companyNumberInput || typeof companyNumberInput !== 'string') {
    return NextResponse.json({ ok: false, error: 'Company number is required' }, { status: 400 })
  }

  if (!validateCompanyNumber(companyNumberInput)) {
    return NextResponse.json({ ok: false, error: 'Invalid company number format' }, { status: 400 })
  }

  const companyNumber = formatCompanyNumber(companyNumberInput)
  const profile = await getCompanyProfile(companyNumber)

  if (!profile) {
    return NextResponse.json({ ok: false, error: 'Company not found' }, { status: 404 })
  }

  const overdueFilings: Deadline[] = []
  const upcomingDeadlines: Deadline[] = []
  const penalties: Array<{ estimated: number; description: string }> = []

  const accountsDue = profile.accounts?.next_accounts?.due_on
  const accountsDays = daysUntil(accountsDue)
  const accountsOverdue = Boolean(profile.accounts?.next_accounts?.overdue) || accountsDays < 0

  if (accountsDue) {
    const deadline: Deadline = {
      type: 'accounts',
      description: 'Annual Accounts',
      dueDate: accountsDue,
      daysUntilDue: accountsDays,
      overdue: accountsOverdue,
      penaltyRisk: accountsOverdue ? accountsPenalty(Math.abs(accountsDays)) : 0,
    }

    if (accountsOverdue) {
      overdueFilings.push(deadline)
      penalties.push({
        estimated: deadline.penaltyRisk ?? 0,
        description: `Late filing penalty for accounts (${Math.abs(accountsDays)} days overdue)`,
      })
    } else if (accountsDays <= 30) {
      upcomingDeadlines.push(deadline)
    }
  }

  const confirmationDue = profile.confirmation_statement?.next_due
  const confirmationDays = daysUntil(confirmationDue)
  const confirmationOverdue = Boolean(profile.confirmation_statement?.overdue) || confirmationDays < 0

  if (confirmationDue) {
    const deadline: Deadline = {
      type: 'confirmation-statement',
      description: 'Confirmation Statement',
      dueDate: confirmationDue,
      daysUntilDue: confirmationDays,
      overdue: confirmationOverdue,
      penaltyRisk: confirmationOverdue ? confirmationPenalty(Math.abs(confirmationDays)) : 0,
    }

    if (confirmationOverdue) {
      overdueFilings.push(deadline)
      penalties.push({
        estimated: deadline.penaltyRisk ?? 0,
        description: `Late filing penalty for confirmation statement (${Math.abs(confirmationDays)} days overdue)`,
      })
    } else if (confirmationDays <= 30) {
      upcomingDeadlines.push(deadline)
    }
  }

  let status: 'compliant' | 'warning' | 'overdue' = 'compliant'
  let riskLevel: 'none' | 'low' | 'medium' | 'high' = 'none'

  if (overdueFilings.length > 0) {
    const maxOverdueDays = Math.max(...overdueFilings.map((filing) => Math.abs(filing.daysUntilDue)))
    status = 'overdue'
    riskLevel = maxOverdueDays > 30 ? 'high' : 'medium'
  } else if (upcomingDeadlines.some((deadline) => deadline.daysUntilDue <= 7)) {
    status = 'warning'
    riskLevel = 'medium'
  } else if (upcomingDeadlines.some((deadline) => deadline.daysUntilDue <= 14)) {
    status = 'warning'
    riskLevel = 'low'
  }

  return NextResponse.json({
    ok: true,
    company: {
      number: profile.company_number,
      name: profile.company_name,
    },
    compliance: {
      status,
      riskLevel,
      accounts: {
        nextDue: accountsDue || 'N/A',
        overdue: accountsOverdue,
        daysUntilDue: accountsDue ? accountsDays : 999,
      },
      confirmationStatement: {
        nextDue: confirmationDue || 'N/A',
        overdue: confirmationOverdue,
        daysUntilDue: confirmationDue ? confirmationDays : 999,
      },
      overdueFilings,
      upcomingDeadlines,
      penalties,
    },
  })
}

function handleError(error: unknown) {
  console.error('Error in /api/check:', error)

  const message = error instanceof Error ? error.message : 'Failed to retrieve compliance data'

  if (message.includes('COMPANIES_HOUSE_API_KEY')) {
    return NextResponse.json({ ok: false, error: 'Companies House API is not configured' }, { status: 500 })
  }

  if (message.includes('Invalid Companies House API key')) {
    return NextResponse.json({ ok: false, error: 'Invalid Companies House API key' }, { status: 500 })
  }

  return NextResponse.json({ ok: false, error: 'Failed to retrieve compliance data' }, { status: 500 })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    return await runCheck(searchParams.get('companyNumber'))
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return await runCheck(body?.companyNumber)
  } catch (error) {
    return handleError(error)
  }
}
