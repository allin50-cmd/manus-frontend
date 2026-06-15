/** Thrown when transcription is misconfigured server-side (e.g. missing API key). */
export class TranscriptionConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionConfigError'
  }
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new TranscriptionConfigError('GROQ_API_KEY not configured')

  const OpenAI = (await import('openai')).default
  const groq = new OpenAI({
    apiKey,
    baseURL: 'https://api.groq.com/openai/v1',
  })

  const ext = mimeType.includes('m4a') ? 'm4a'
    : mimeType.includes('aac') ? 'm4a'
    : mimeType.includes('3gpp') ? '3gp'
    : mimeType.includes('mp4') ? 'mp4'
    : mimeType.includes('mpeg') ? 'mp3'
    : mimeType.includes('ogg') ? 'ogg'
    : mimeType.includes('wav') ? 'wav'
    : 'webm'

  const { byteOffset, byteLength } = audioBuffer
  const arrayBuffer = audioBuffer.buffer.slice(byteOffset, byteOffset + byteLength) as ArrayBuffer
  const file = new File([arrayBuffer], `audio.${ext}`, { type: mimeType })

  // Priming prompt: tells Whisper the expected vocabulary so business terms,
  // names, and company spellings survive transcription accurately.
  const prompt =
    'UltraCore Ops. People: George, Dagon, Alissa, Michelle, Chris, Charlie. ' +
    'Terms: compliance alert, planning lead, construction lead, work item, follow-up, ' +
    'EasyEstimate, decision needed, escalated, waiting for, next action.'

  const response = await groq.audio.transcriptions.create({
    model: 'whisper-large-v3-turbo',
    file,
    language: 'en',
    prompt,
  })

  return response.text
}
