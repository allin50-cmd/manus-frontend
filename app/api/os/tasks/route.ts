import { NextRequest, NextResponse } from 'next/server'
import { getDb, osTasks } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const tasks = await db.select().from(osTasks).orderBy(desc(osTasks.createdAt))
  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.title) return NextResponse.json({ error: 'title is required' }, { status: 400 })

  const db = await getDb()
  const [task] = await db
    .insert(osTasks)
    .values({
      title: body.title,
      assignedTo: body.assignedTo || session.person,
      priority: body.priority || 'Medium',
      status: body.status || 'Open',
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
      linkedWorkItemId: body.linkedWorkItemId || null,
      notes: body.notes || null,
    })
    .returning()

  await trackEvent({ eventType: 'task_created', userId: session.person })
  return NextResponse.json(task, { status: 201 })
}
