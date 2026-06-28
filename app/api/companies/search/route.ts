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

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({ source: 'none', results: [] })
  }

  if (!companiesHouseService.hasApiKey()) {
    console.error('FINEGUARD OPS: COMPANIES_HOUSE_API_KEY is not configured. Company search is unavailable.')
    return NextResponse.json(
      { source: 'error', results: [], error: 'Company search service is temporarily unavailable' },
      { status: 503 },
    )
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
