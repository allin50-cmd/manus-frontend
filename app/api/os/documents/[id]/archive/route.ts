import { NextRequest, NextResponse } from 'next/server'
import { getDb, osDocuments } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()

  const [doc] = await db
    .update(osDocuments)
    .set({
      status: 'Archived',
      updatedAt: new Date(),
    })
    .where(eq(osDocuments.id, params.id))
    .returning()

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json(doc)
}
