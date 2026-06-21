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
    console.error('FINEGUARD OPS: COMPANIES_HOUSE_API_KEY is not configured. Company lookup is unavailable.')
    return NextResponse.json(
      { source: 'error', error: 'Company lookup service is temporarily unavailable' },
      { status: 503 },
    )
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
