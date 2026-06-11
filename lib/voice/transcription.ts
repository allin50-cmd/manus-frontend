/** Thrown when transcription is misconfigured server-side (e.g. missing API key). */
export class TranscriptionConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionConfigError'
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new TranscriptionConfigError('OPENAI_API_KEY not configured')

  const OpenAI = (await import('openai')).default
  const openai = new OpenAI({ apiKey })

  const ext = mimeType.includes('mp4') ? 'mp4'
    : mimeType.includes('mpeg') ? 'mp3'
    : mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('wav') ? 'wav'
    : 'webm'

  const { byteOffset, byteLength } = audioBuffer
  const arrayBuffer = audioBuffer.buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer
  const file = new File([arrayBuffer], `audio.${ext}`, { type: mimeType })

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
  })

  return response.text
}
