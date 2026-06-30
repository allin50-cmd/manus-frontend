import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osTasks } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const tasks = await db.select().from(osTasks).where(eq(osTasks.companyId, companyId))
    return NextResponse.json(tasks)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; title: string; description?: string; status?: string; priority?: string; assignedTo?: string; dueDate?: string; createdBy: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, title, description, status, priority, assignedTo, dueDate, createdBy } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!createdBy?.trim()) return NextResponse.json({ error: 'createdBy is required' }, { status: 400 })

  try {
    const validPriorities = ['Low', 'Medium', 'High', 'Urgent']
    const finalPriority = (priority && validPriorities.includes(priority)) ? priority : 'Medium'

    const task = await db.insert(osTasks).values({
      companyId,
      title,
      description: description || null,
      status: status || 'Open',
      priority: finalPriority as any,
      assignedTo: assignedTo || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdBy,
    }).returning()

    return NextResponse.json(task[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}
