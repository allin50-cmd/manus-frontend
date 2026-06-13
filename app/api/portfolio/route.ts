import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import type { WorkItemStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nonFinal = { notIn: ['Completed', 'Archived', 'NotFit'] as WorkItemStatus[] }
  const today = new Date(); today.setHours(0, 0, 0, 0)

  try {
    const companies = await db.company.findMany({
      orderBy: { name: 'asc' },
      include: { contacts: { select: { id: true, isActive: true } } },
    })

    const result = await Promise.all(
      companies.map(async (c) => {
        const [workItems, overdue] = await Promise.all([
          db.workItem.count({ where: { company: c.name, status: nonFinal } }),
          db.workItem.count({ where: { company: c.name, status: nonFinal, dueDate: { lt: today } } }),
        ])
        return {
          id: c.id,
          name: c.name,
          contacts: c.contacts.filter((ct) => ct.isActive).length,
          workItems,
          overdue,
        }
      })
    )

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 })
  }
}
