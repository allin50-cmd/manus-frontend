import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const workItemId = req.nextUrl.searchParams.get('workItemId')
  const where = workItemId ? { workItemId } : {}

  const deliveries = await db.alertDelivery.findMany({
    where,
    include: { recipient: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(deliveries)
}
