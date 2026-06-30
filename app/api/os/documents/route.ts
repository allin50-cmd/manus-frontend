import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getDb, osDocuments } from '@/lib/db'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  const companyId = req.nextUrl.searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  }

  try {
    const documents = await db.select().from(osDocuments).where(eq(osDocuments.companyId, companyId))
    return NextResponse.json(documents)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  await requireAuth()
  const db = getDb()
  let body: { companyId: string; fileName: string; fileType: string; fileSize?: number; storageUrl: string; category?: string; tags?: string[]; uploadedBy: string }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyId, fileName, fileType, fileSize, storageUrl, category, tags, uploadedBy } = body

  if (!companyId?.trim()) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
  if (!fileName?.trim()) return NextResponse.json({ error: 'fileName is required' }, { status: 400 })
  if (!fileType?.trim()) return NextResponse.json({ error: 'fileType is required' }, { status: 400 })
  if (!storageUrl?.trim()) return NextResponse.json({ error: 'storageUrl is required' }, { status: 400 })
  if (!uploadedBy?.trim()) return NextResponse.json({ error: 'uploadedBy is required' }, { status: 400 })

  try {
    const document = await db.insert(osDocuments).values({
      companyId,
      fileName,
      fileType,
      fileSize: fileSize || null,
      storageUrl,
      category: category || null,
      tags: tags || [],
      uploadedBy,
    }).returning()

    return NextResponse.json(document[0], { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 })
  }
}
