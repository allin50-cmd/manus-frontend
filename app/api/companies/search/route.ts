import { NextRequest, NextResponse } from 'next/server'
import { companiesHouseService } from '@/lib/companiesHouse'

export const dynamic = 'force-dynamic'

interface CompanyResult {
  number: string
  name: string
  status: string
  nextDeadline: string
  nextDeadlineType: string
}

// Demo data used when COMPANIES_HOUSE_API_KEY is not configured, so the
// search page stays functional in dev and preview environments.
const MOCK_RESULTS: CompanyResult[] = [
  {
    number: '01234567',
    name: 'Acme Corporation Ltd',
    status: 'Active',
    nextDeadline: '2025-06-30',
    nextDeadlineType: 'Annual Return',
  },
  {
    number: '07654321',
    name: 'TechStart Holdings',
    status: 'Active',
    nextDeadline: '2025-07-15',
    nextDeadlineType: 'Confirmation Statement',
  },
  {
    number: '12345678',
    name: 'Global Industries plc',
    status: 'Active',
    nextDeadline: '2025-08-01',
    nextDeadlineType: 'Accounts Filing',
  },
]

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ source: 'none', results: [] })
  }

  // No live key → return filtered mock data so the UI works end-to-end.
  if (!companiesHouseService.hasApiKey()) {
    const lower = q.toLowerCase()
    const results = MOCK_RESULTS.filter(
      (r) => r.name.toLowerCase().includes(lower) || r.number.includes(q),
    )
    return NextResponse.json({ source: 'mock', results })
  }

  try {
    const hits = await companiesHouseService.searchCompanies(q)
    const results: CompanyResult[] = hits.map((h) => ({
      number: h.companyNumber,
      name: h.companyName,
      status: titleCase(h.companyStatus),
      nextDeadline: '',
      nextDeadlineType: '',
    }))
    return NextResponse.json({ source: 'companies-house', results })
  } catch (err) {
    return NextResponse.json(
      { source: 'error', results: [], error: (err as Error).message },
      { status: 502 },
    )
  }
}

function titleCase(value: string): string {
  return value
    .split(/[\s_-]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}
