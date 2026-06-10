import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { transcribeAudio } from '@/lib/voice/transcription'
import { parseTranscript } from '@/lib/voice/parser'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const intake = await db.voiceIntake.findUnique({ where: { id } })
  if (!intake) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!intake.audioData) return NextResponse.json({ error: 'No audio data' }, { status: 400 })

  try {
    const transcript = await transcribeAudio(intake.audioData as Buffer, intake.mimeType)
    const parsedJson = parseTranscript(transcript)

    const updated = await db.voiceIntake.update({
      where: { id },
      data: { transcript, parsedJson: parsedJson as object, status: 'TRANSCRIBED' },
    })

    return NextResponse.json({ transcript, parsedJson, id: updated.id })
  } catch (err) {
    await db.voiceIntake.update({ where: { id }, data: { status: 'FAILED' } })
    const msg = err instanceof Error ? err.message : 'Transcription failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
