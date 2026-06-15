import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { ActionStatus } from '@prisma/client'

export const runtime = 'nodejs'

const VALID_STATUSES: ActionStatus[] = ['Open', 'Done', 'Cancelled', 'Blocked']

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  // Parse status filter — default Open,Blocked
  const statusParam = searchParams.get('status') ?? 'Open,Blocked'
  let statuses: ActionStatus[]
  if (statusParam === 'all') {
    statuses = VALID_STATUSES
  } else {
    const requested = statusParam.split(',').map((s) => s.trim()) as ActionStatus[]
    statuses = requested.filter((s) => VALID_STATUSES.includes(s))
    if (statuses.length === 0) statuses = ['Open', 'Blocked']
  }

  // Parse dueBefore filter
  const dueBeforeParam = searchParams.get('dueBefore')
  let dueBefore: Date | undefined
  if (dueBeforeParam) {
    const d = new Date(dueBeforeParam)
    if (!isNaN(d.getTime())) dueBefore = d
  }

  // Parse person override (for team drill-down)
  const personParam = searchParams.get('person')
  const assignedTo = personParam ?? session.person

  const where: Record<string, unknown> = {
    assignedTo,
    status: { in: statuses },
  }
  if (dueBefore) {
    where.dueDate = { lt: dueBefore }
  }

  let tasks
  try {
    tasks = await db.action.findMany({
      where,
      include: {
        workItem: {
          select: {
            id: true,
            title: true,
            company: true,
            status: true,
            priority: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'asc' },
      ],
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  return NextResponse.json({ tasks, total: tasks.length })
}
