import { NextResponse } from 'next/server'
import { getDb, osDocuments } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const [doc] = await db
    .select()
    .from(osDocuments)
    .where(eq(osDocuments.id, params.id))

  if (!doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json(doc)
}
