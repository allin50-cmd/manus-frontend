import { NextRequest, NextResponse } from 'next/server'
import { getDb, osDocuments } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { desc } from 'drizzle-orm'
import { trackEvent } from '@/lib/ut-tracker'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = await getDb()
  const docs = await db.select().from(osDocuments).orderBy(desc(osDocuments.createdAt)).limit(100)
  return NextResponse.json(docs)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.filename) return NextResponse.json({ error: 'filename is required' }, { status: 400 })

  const db = await getDb()
  const [doc] = await db
    .insert(osDocuments)
    .values({
      filename: body.filename,
      mimeType: body.mimeType || null,
      fileSizeBytes: body.fileSizeBytes || null,
      storagePath: body.storagePath || null,
      source: body.source || 'Upload',
      status: body.status || 'PendingReview',
      linkedWorkItemId: body.linkedWorkItemId || null,
      linkedCompany: body.linkedCompany || null,
      uploadedBy: session.person,
    })
    .returning()

  await trackEvent({ eventType: 'document_uploaded', userId: session.person })
  return NextResponse.json(doc, { status: 201 })
}
