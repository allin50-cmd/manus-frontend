/** Thrown when transcription is misconfigured server-side (e.g. missing API key). */
export class TranscriptionConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'TranscriptionConfigError'
  }
}

export interface TranscriptionResult {
  transcript: string
  confidenceScore: number
  qualityFlags: string[]
}

// Shape of the verbose_json response from Whisper via Groq.
// The Groq SDK doesn't have perfect types for this format, so we define it here.
interface VerboseSegment {
  avg_logprob: number      // log probability, negative; more negative = less confident
  no_speech_prob: number   // 0-1, probability segment is silence
}

interface VerboseJsonResponse {
  text: string
  segments: VerboseSegment[]
}

export async function transcribeAudio(audioBuffer: Buffer, mimeType: string): Promise<TranscriptionResult> {
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (groq.audio.transcriptions.create as any)({
    model: 'whisper-large-v3-turbo',
    file,
    language: 'en',
    prompt,
    response_format: 'verbose_json',
  }) as VerboseJsonResponse

  const segments: VerboseSegment[] = response.segments ?? []
  const speechSegments = segments.filter((s) => s.no_speech_prob < 0.8)

  // Compute mean confidence from speech segments; default to 0.5 if none qualify.
  let confidenceScore: number
  if (speechSegments.length === 0) {
    confidenceScore = 0.5
  } else {
    const sum = speechSegments.reduce((acc, s) => acc + Math.exp(s.avg_logprob), 0)
    confidenceScore = sum / speechSegments.length
  }

  const qualityFlags: string[] = []
  if (confidenceScore < 0.50) {
    qualityFlags.push('low_confidence')
  }
  if (segments.length > 0) {
    const silentCount = segments.filter((s) => s.no_speech_prob > 0.8).length
    if (silentCount / segments.length > 0.3) {
      qualityFlags.push('high_silence')
    }
  }

  return {
    transcript: response.text,
    confidenceScore,
    qualityFlags,
  }
}
