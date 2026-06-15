import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { transcribeAudio, TranscriptionConfigError } from '@/lib/voice/transcription'
import { parseTranscript } from '@/lib/voice/parser'

export const runtime = 'nodejs'
export const maxDuration = 60 // Whisper round-trips can exceed the default timeout.

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // Scope to the creator: an intake can only be transcribed by its owner.
  const intake = await db.voiceIntake.findFirst({ where: { id, createdBy: session.person } })
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
    await db.voiceIntake.update({ where: { id }, data: { status: 'FAILED' } }).catch(() => {})
    // Never leak server configuration details to the client.
    if (err instanceof TranscriptionConfigError) {
      return NextResponse.json(
        { error: 'Voice transcription requires a Groq API key. Add GROQ_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy. Get a free key at console.groq.com' },
        { status: 503 },
      )
    }
    return NextResponse.json({ error: 'Could not transcribe audio. Please try again.' }, { status: 502 })
  }
}
