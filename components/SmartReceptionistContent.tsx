'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type TalkState = 'idle' | 'requesting' | 'listening' | 'processing' | 'fallback' | 'error'

interface SmartReceptionistContentProps {
  companyId?: string
  companyName?: string
}

export default function SmartReceptionistContent({ companyId, companyName }: SmartReceptionistContentProps) {
  const router = useRouter()
  const [state, setState] = useState<TalkState>('idle')
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  async function startListening() {
    setState('requesting')
    setError('')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setState('fallback')
      setError('Voice input is not supported on this browser. Use text input below.')
      return
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setState('fallback')
      setError('Microphone access was denied. Use text input below.')
      return
    }

    setState('listening')
    if ('vibrate' in navigator) navigator.vibrate(20)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionClass() as any
    recognition.lang = 'en-GB'
    recognition.continuous = false
    recognition.interimResults = false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript as string
      setText(transcript)
      setState('processing')
      // TODO: Hook into UltAi flow — send transcript to /api/ultai/process
    }

    recognition.onerror = () => {
      setState('fallback')
      setError('Could not capture voice. Try typing below.')
    }

    recognition.onend = () => {
      setState((prev) => (prev === 'listening' ? 'fallback' : prev))
    }

    recognition.start()
  }

  function handleTextSubmit() {
    if (!text.trim()) return
    setState('processing')
    // TODO: Hook into UltAi flow — send text to /api/ultai/process
    const redirectPath = companyId ? `/os/workspace/${companyId}` : '/os'
    setTimeout(() => router.push(redirectPath), 1500)
  }

  const backHref = companyId ? `/os/workspace/${companyId}` : '/os'

  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push(backHref)}
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Talk</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {companyName ? `AI Receptionist · ${companyName}` : 'AI Receptionist'}
            </p>
          </div>
        </div>

        {state !== 'fallback' && state !== 'processing' && (
          <div className="flex flex-col items-center py-10">
            <button
              onClick={startListening}
              disabled={state === 'requesting' || state === 'listening'}
              className="relative w-28 h-28 rounded-full flex items-center justify-center touch-manipulation"
              aria-label={state === 'listening' ? 'Listening…' : 'Start speaking'}
              style={{
                background: state === 'listening'
                  ? 'radial-gradient(circle, rgba(122,90,248,0.5) 0%, rgba(122,90,248,0.2) 100%)'
                  : 'rgba(122,90,248,0.15)',
                border: `2px solid ${state === 'listening' ? 'rgba(122,90,248,0.8)' : 'rgba(122,90,248,0.35)'}`,
                boxShadow: state === 'listening' ? '0 0 40px rgba(122,90,248,0.5)' : '0 0 20px rgba(122,90,248,0.2)',
                transition: 'all 200ms ease',
              }}
            >
              {state === 'listening' && (
                <>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(122,90,248,0.15)' }} aria-hidden />
                  <div className="absolute -inset-4 rounded-full animate-ping" style={{ background: 'rgba(122,90,248,0.08)', animationDelay: '0.3s' }} aria-hidden />
                </>
              )}
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={state === 'listening' ? '#fff' : 'rgba(255,255,255,0.7)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2M12 19v4M8 23h8" />
              </svg>
            </button>

            <p className="mt-5 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {state === 'idle' && 'Tap to speak'}
              {state === 'requesting' && 'Requesting microphone…'}
              {state === 'listening' && 'Listening…'}
            </p>
            <p className="mt-2 text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Speak naturally — describe what you need
            </p>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center py-10">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(122,90,248,0.2)', border: '1px solid rgba(122,90,248,0.3)' }}
            >
              <div className="w-6 h-6 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" aria-hidden />
            </div>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Processing…</p>
            {text && (
              <p className="mt-2 text-xs text-center px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
                &ldquo;{text}&rdquo;
              </p>
            )}
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl p-4 mb-4"
            style={{ background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.2)' }}
            role="alert"
          >
            <p className="text-sm" style={{ color: '#FF6B6B' }}>{error}</p>
          </div>
        )}

        {(state === 'fallback' || state === 'idle') && (
          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {state === 'fallback' ? 'TYPE INSTEAD' : 'OR TYPE'}
            </p>
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Tell me what you need…"
                rows={4}
                autoFocus={state === 'fallback'}
                className="w-full bg-transparent px-4 py-3 text-sm resize-none outline-none"
                style={{ color: 'rgba(255,255,255,0.85)' }}
              />
            </div>
            <button
              onClick={handleTextSubmit}
              disabled={!text.trim()}
              className="w-full mt-3 py-3.5 rounded-2xl text-sm font-semibold transition-all"
              style={{
                background: text.trim() ? 'linear-gradient(135deg, #7A5AF8, #A855F7)' : 'rgba(255,255,255,0.06)',
                color: text.trim() ? 'white' : 'rgba(255,255,255,0.3)',
                boxShadow: text.trim() ? '0 4px 20px rgba(122,90,248,0.4)' : 'none',
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
