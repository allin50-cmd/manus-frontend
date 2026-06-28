import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { OWNERS } from '@/lib/work-item-enums'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PERSONS = OWNERS

export async function GET() {
  const now = new Date()

  let openActions: { assignedTo: string | null; status: string; dueDate: Date | null }[]
  try {
    openActions = await db.action.findMany({
      where: {
        assignedTo: { in: [...PERSONS] },
        status: { in: ['Open', 'Blocked'] },
      },
      select: {
        assignedTo: true,
        status: true,
        dueDate: true,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }

  const capacity = PERSONS.map((name) => {
    const mine = openActions.filter((a) => a.assignedTo === name)
    const openTasks = mine.filter((a) => a.status === 'Open').length
    const blockedTasks = mine.filter((a) => a.status === 'Blocked').length
    const overdueTasks = mine.filter((a) => a.dueDate !== null && a.dueDate < now).length
    return { name, openTasks, blockedTasks, overdueTasks }
  })

  return NextResponse.json({ capacity, asOf: now.toISOString() })
}
