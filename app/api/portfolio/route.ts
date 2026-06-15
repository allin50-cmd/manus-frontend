import { NextRequest, NextResponse } from 'next/server'
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

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { name?: unknown }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Company name is required' }, { status: 400 })

  try {
    const company = await db.company.upsert({
      where: { name },
      create: { name },
      update: {},
    })
    return NextResponse.json(company, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not create company' }, { status: 503 })
  }
}
