import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getBriefingItems } from '@/lib/queries/briefing'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const items = await getBriefingItems()
    return NextResponse.json(
      { items },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
