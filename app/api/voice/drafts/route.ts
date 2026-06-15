import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const drafts = await db.voiceIntake.findMany({
    where: {
      createdBy: session.person,
      status: { in: ['UPLOADED', 'TRANSCRIBED', 'NEEDS_REVIEW'] },
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      createdAt: true,
      status: true,
      transcript: true,
      parsedJson: true,
      mimeType: true,
      transcriptConfidence: true,
      qualityFlags: true,
      // audioData is NOT selected — do not return raw bytes to client
    },
  })

  return NextResponse.json({ drafts })
}
