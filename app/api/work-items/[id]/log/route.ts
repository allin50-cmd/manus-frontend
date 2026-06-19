import { NextRequest, NextResponse } from 'next/server'
import { getDb, workItems, actions, activityLogs } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const rows = await db.select().from(workItems).where(eq(workItems.id, params.id)).limit(1)
  const item = rows[0]
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { text } = await req.json()
  if (!text?.trim()) return NextResponse.json({ error: 'Note text required' }, { status: 400 })

  const [[log], [action]] = await Promise.all([
    db.insert(activityLogs).values({
      workItemId: item.id,
      person: session.person,
      eventType: 'NoteAdded',
      summary: text.trim(),
    }).returning(),
    db.insert(actions).values({
      workItemId: item.id,
      actionType: 'LogNote',
      label: `Note: ${text.trim().slice(0, 80)}`,
      status: 'Done',
      assignedTo: session.person,
      completedAt: new Date(),
    }).returning(),
  ])

  return NextResponse.json({ log, action }, { status: 201 })
}
