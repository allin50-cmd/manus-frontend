import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export const runtime = 'nodejs'

// Whisper accepts up to 25 MB; reject anything larger before buffering/storing.
const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const ALLOWED_MIME = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav']

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawContentType = req.headers.get('content-type')
  if (!rawContentType) {
    return NextResponse.json({ error: 'Content-Type header required' }, { status: 415 })
  }
  const contentType = rawContentType.split(';')[0].trim()
  if (!ALLOWED_MIME.includes(contentType)) {
    return NextResponse.json({ error: 'Unsupported audio type' }, { status: 415 })
  }

  // Reject oversized uploads up front via Content-Length when present.
  const declared = Number(req.headers.get('content-length') ?? '')
  if (Number.isFinite(declared) && declared > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'Audio too large (max 25MB)' }, { status: 413 })
  }

  let buffer: Buffer
  try {
    const arrayBuffer = await req.arrayBuffer()
    if (!arrayBuffer.byteLength) {
      return NextResponse.json({ error: 'Empty audio body' }, { status: 400 })
    }
    if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: 'Audio too large (max 25MB)' }, { status: 413 })
    }
    buffer = Buffer.from(arrayBuffer)
  } catch {
    return NextResponse.json({ error: 'Could not read audio body' }, { status: 400 })
  }

  try {
    const intake = await db.voiceIntake.create({
      data: {
        createdBy: session.person,
        audioData: buffer,
        mimeType: contentType,
        status: 'UPLOADED',
      },
    })
    return NextResponse.json({ id: intake.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Could not save recording' }, { status: 503 })
  }
}
