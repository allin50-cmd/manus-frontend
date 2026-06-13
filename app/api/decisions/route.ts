import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const decisions = await db.decision.findMany({
      where: { status: { in: ['Open', 'MoreInfoNeeded', 'Paused'] } },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      include: {
        workItem: {
          select: { id: true, title: true, company: true },
        },
      },
    })

    return NextResponse.json(
      decisions.map((d) => ({
        id: d.id,
        question: d.question,
        options: d.options,
        recommendation: d.recommendation,
        decisionBy: d.decisionBy,
        dueDate: d.dueDate ? d.dueDate.toISOString() : null,
        status: d.status,
        workItem: {
          id: d.workItem.id,
          title: d.workItem.title,
          company: d.workItem.company,
        },
      }))
    )
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
