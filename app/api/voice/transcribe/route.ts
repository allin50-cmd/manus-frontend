import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { draftNeedsReview, parseTranscriptToDraft } from '@/lib/voice/parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Payload = {
  transcript?: string
  audioUrl?: string | null
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = (await req.json()) as Payload
    const transcript = body.transcript?.trim() ?? ''
    const audioUrl = body.audioUrl ?? null

    if (!transcript) {
      return NextResponse.json({ error: 'Transcript is required for Voice Intake v0.1' }, { status: 400 })
    }

    const draft = parseTranscriptToDraft(transcript)
    const status = draftNeedsReview(draft) ? 'NEEDS_REVIEW' : 'PARSED'

    const rows = await db.$queryRawUnsafe<Array<{ voice_id: string }>>(
      `INSERT INTO voice_intake (created_by, audio_url, transcript, parsed_json, status)
       VALUES ($1, $2, $3, $4::jsonb, $5)
       RETURNING voice_id`,
      session.person,
      audioUrl,
      transcript,
      JSON.stringify(draft),
      status,
    )

    return NextResponse.json({ voice_id: rows[0]?.voice_id, transcript, draft, status }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice intake failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
