import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { toFile } from 'openai/uploads'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { draftNeedsReview, parseTranscriptToDraft } from '@/lib/voice/parser'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type JsonPayload = {
  transcript?: string
  audioUrl?: string | null
}

async function transcribeAudio(audio: File): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured')
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const buffer = Buffer.from(await audio.arrayBuffer())
  const file = await toFile(buffer, 'recording.webm', { type: audio.type || 'audio/webm' })

  const transcription = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
  })

  const transcript = transcription.text?.trim()
  if (!transcript) throw new Error('Transcription returned no text')
  return transcript
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    let transcript = ''
    let audioUrl: string | null = null

    const contentType = req.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const form = await req.formData()
      const audio = form.get('audio')
      const manualTranscript = form.get('transcript')
      const suppliedAudioUrl = form.get('audioUrl')

      if (typeof suppliedAudioUrl === 'string' && suppliedAudioUrl.trim()) {
        audioUrl = suppliedAudioUrl.trim()
      }

      if (typeof manualTranscript === 'string' && manualTranscript.trim()) {
        transcript = manualTranscript.trim()
      } else if (audio instanceof File && audio.size > 0) {
        transcript = await transcribeAudio(audio)
      }
    } else {
      const body = (await req.json()) as JsonPayload
      transcript = body.transcript?.trim() ?? ''
      audioUrl = body.audioUrl ?? null
    }

    if (!transcript) {
      return NextResponse.json({ error: 'Provide a transcript or an audio file.' }, { status: 400 })
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

    return NextResponse.json({ voice_id: rows[0]?.voice_id, voiceId: rows[0]?.voice_id, transcript, draft, status }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Voice intake failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
