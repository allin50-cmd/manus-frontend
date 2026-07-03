import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const workItemId = req.nextUrl.searchParams.get('workItemId')
  const limitParam = req.nextUrl.searchParams.get('limit')
  const parsedLimit = limitParam !== null ? parseInt(limitParam, 10) : NaN
  const take = Number.isNaN(parsedLimit) ? 200 : Math.min(Math.max(parsedLimit, 0), 500)
  const where = workItemId ? { workItemId } : {}

  let deliveries
  try {
    deliveries = await db.alertDelivery.findMany({
      where,
      include: {
        recipient: { select: { name: true, role: true } },
        workItem: { select: { id: true, title: true, company: true, priority: true } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json(deliveries)
}
