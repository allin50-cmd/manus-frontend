import { NextRequest, NextResponse } from 'next/server'
import { getDb, osTasks } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [task] = await db
    .update(osTasks)
    .set({
      status: 'Open',
      updatedAt: new Date(),
    })
    .where(eq(osTasks.id, params.id))
    .returning()

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 })
  }

  return NextResponse.json(task)
}
