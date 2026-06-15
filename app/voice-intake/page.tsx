'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import type { DraftRecord } from '@/lib/voice/types'
import { WORK_ITEM_TYPES, TYPE_LABELS, PRIORITIES, WORK_ITEM_STATUSES, STATUS_LABELS } from '@/lib/work-item-enums'

type Stage = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'review' | 'done' | 'error'

const SUPPORTED_MIME = ['audio/webm', 'audio/ogg', 'audio/mp4']

interface VoiceDraft {
  id: string
  createdAt: string
  status: string
  transcript: string | null
  parsedJson: DraftRecord | null
  mimeType: string
  transcriptConfidence: number | null
  qualityFlags: string[]
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

export default function VoiceIntakePage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft] = useState<DraftRecord>({ title: '', type: 'InternalTask', owner: 'George' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [workItemId, setWorkItemId] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [confidenceScore, setConfidenceScore] = useState<number | null>(null)
  const [qualityFlags, setQualityFlags] = useState<string[]>([])
  const [pendingDrafts, setPendingDrafts] = useState<VoiceDraft[]>([])
  const [draftsVisible, setDraftsVisible] = useState(true)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef<string>('audio/mp4')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    // Load pending drafts on mount for recovery banner
    fetch('/api/voice/drafts')
      .then((r) => r.ok ? r.json() : { drafts: [] })
      .then((data) => { if (Array.isArray(data.drafts) && data.drafts.length > 0) setPendingDrafts(data.drafts) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      const recorder = mediaRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      recorder?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

  function stopTimer() {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
  }

  // iOS Safari reports false for isTypeSupported on most types yet still records
  // to audio/mp4. Return '' (browser default) rather than null so we still try.
  function pickMimeType(): string | null {
    if (typeof MediaRecorder === 'undefined') return null
    if (typeof MediaRecorder.isTypeSupported !== 'function') return ''
    return SUPPORTED_MIME.find((m) => MediaRecorder.isTypeSupported(m)) ?? ''
  }

  async function startRecording() {
    setErrorMsg('')

    const mimeType = pickMimeType()
    if (mimeType === null) {
      setErrorMsg('Audio recording (MediaRecorder) is not available in this browser. Use the 📱 or 📂 buttons below instead instead.')
      setStage('error')
      return
    }

    // navigator.mediaDevices is undefined on insecure origins and inside some
    // iOS home-screen (standalone PWA) contexts — the classic silent failure.
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg('Microphone access is unavailable here (needs HTTPS, and on iPhone it may be blocked when launched from the Home Screen icon — open in Safari instead). Use the 📱 or 📂 buttons below instead.')
      setStage('error')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (err) {
      const name = err instanceof Error ? err.name : 'Error'
      const msg =
        name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser settings and try again.'
        : name === 'NotFoundError' ? 'No microphone was found on this device.'
        : `Microphone error: ${name}. Use the 📱 or 📂 buttons below instead.`
      setErrorMsg(msg)
      setStage('error')
      return
    }

    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      // 1s timeslice: chunks accumulate during recording. Even if iOS flushes
      // nothing on stop(), the periodic chunks give us a non-empty blob.
      recorder.start(1000)
      mimeTypeRef.current = recorder.mimeType || mimeType || 'audio/mp4'
      mediaRef.current = recorder
      // Start elapsed timer
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000)
      setStage('recording')
    } catch (err) {
      stream.getTracks().forEach((t) => t.stop())
      const detail = err instanceof Error ? `${err.name}: ${err.message}` : 'unknown error'
      setErrorMsg(`Could not start recording (${detail}). Use the 📱 or 📂 buttons below instead.`)
      setStage('error')
    }
  }

  // Shared upload → transcribe pipeline used by both recorder and file-input fallback.
  async function uploadAndTranscribe(blob: Blob, mime: string) {
    if (!blob.size) {
      setErrorMsg('No audio was captured (0 bytes). Record a little longer, or try the file upload option.')
      setStage('error')
      return
    }

    setStage('uploading')
    try {
      const uploadRes = await fetch('/api/voice/upload', {
        method: 'POST',
        headers: { 'content-type': mime },
        body: blob,
      })
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}))
        setErrorMsg(err.error ? `${err.error} (${uploadRes.status})` : `Upload failed (${uploadRes.status})`)
        setStage('error')
        return
      }

      const { id } = await uploadRes.json()
      setIntakeId(id)
      setStage('transcribing')

      const txRes = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!txRes.ok) {
        const err = await txRes.json().catch(() => ({}))
        setErrorMsg(err.error ? `${err.error} (${txRes.status})` : `Transcription failed (${txRes.status})`)
        setStage('error')
        return
      }

      const { transcript: tx, parsedJson, confidenceScore: cs, qualityFlags: qf } = await txRes.json()
      setTranscript(tx ?? '')
      setDraft(parsedJson ?? { title: (tx ?? '').slice(0, 120), type: 'InternalTask', owner: 'George' })
      setConfidenceScore(typeof cs === 'number' ? cs : null)
      setQualityFlags(Array.isArray(qf) ? qf : [])
      setStage('review')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStage('error')
    }
  }

  async function stopRecording() {
    const recorder = mediaRef.current
    if (!recorder) return
    stopTimer()
    setStage('uploading')

    // Build blob inside onstop — after encoder flushes the final buffer.
    // Stop mic tracks INSIDE onstop: killing them before onstop fires truncates
    // the encoder on iOS, producing a 0-byte blob.
    const mime = mimeTypeRef.current
    const blob: Blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        recorder.stream.getTracks().forEach((t) => t.stop())
        resolve(new Blob(chunksRef.current, { type: mime }))
      }
      try { recorder.requestData() } catch { /* not all browsers support it */ }
      recorder.stop()
    })
    mediaRef.current = null

    await uploadAndTranscribe(blob, mime)
  }

  // Fallback for browsers/contexts where MediaRecorder/getUserMedia is blocked.
  async function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setErrorMsg('')
    const mime = file.type || 'audio/mp4'
    await uploadAndTranscribe(file, mime)
  }

  async function approve() {
    if (!intakeId || submitting) return
    setSubmitting(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/voice/approve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: intakeId, draft }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setErrorMsg(err.error ?? 'Approval failed')
        return
      }
      const { workItemId: wid } = await res.json()
      setWorkItemId(wid)
      setStage('done')
    } catch {
      setErrorMsg('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function reject() {
    if (!intakeId || submitting) return
    setSubmitting(true)
    try {
      await fetch('/api/voice/reject', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: intakeId }),
      }).catch(() => {})
    } finally {
      setSubmitting(false)
      reset()
    }
  }

  function reset() {
    stopTimer()
    setStage('idle')
    setIntakeId(null)
    setTranscript('')
    setDraft({ title: '', type: 'InternalTask', owner: 'George' })
    setErrorMsg('')
    setWorkItemId(null)
    setElapsed(0)
    setConfidenceScore(null)
    setQualityFlags([])
  }

  function field(label: string, node: ReactNode) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
        {node}
      </div>
    )
  }

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const secs = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Voice Intake</h1>
        <p className="text-slate-400 text-sm">Record a voice note to quickly capture a work item.</p>

        {stage === 'idle' && pendingDrafts.length > 0 && draftsVisible && (
          <div className="p-4 bg-slate-800 border border-slate-600 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-200">
                You have {pendingDrafts.length} unfinished voice intake{pendingDrafts.length === 1 ? '' : 's'}. Tap to resume.
              </p>
              <button
                onClick={() => setDraftsVisible(false)}
                className="text-slate-400 hover:text-white text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <ul className="space-y-2">
              {pendingDrafts.map((d) => (
                <li key={d.id}>
                  <button
                    className="w-full text-left p-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors space-y-0.5"
                    onClick={() => {
                      setIntakeId(d.id)
                      setTranscript(d.transcript ?? '')
                      setDraft((d.parsedJson as DraftRecord | null) ?? { title: (d.transcript ?? '').slice(0, 120), type: 'InternalTask', owner: 'George' })
                      setConfidenceScore(d.transcriptConfidence ?? null)
                      setQualityFlags(d.qualityFlags ?? [])
                      setStage('review')
                    }}
                  >
                    <p className="text-xs text-slate-400">{relativeTime(d.createdAt)}</p>
                    {d.transcript ? (
                      <p className="text-sm text-slate-200 truncate">{d.transcript.slice(0, 60)}</p>
                    ) : (
                      <p className="text-sm text-slate-500 italic">No transcript yet</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {stage === 'idle' && (
          <div className="space-y-3">
            <button
              onClick={startRecording}
              className="w-full py-5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-lg transition-colors"
            >
              🎤 Start Recording
            </button>

            {/* iOS native audio options — two separate paths because capture
                without a value opens the camera on some iOS versions */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-medium text-center text-sm cursor-pointer transition-colors">
                📱 Record with mic
                <input
                  type="file"
                  accept="audio/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFilePick}
                />
              </label>
              <label className="block py-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 font-medium text-center text-sm cursor-pointer transition-colors">
                📂 Upload audio file
                <input
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={handleFilePick}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500 text-center">
              On iPhone: tap 📱 to record with the system mic, or 📂 to pick from Voice Memos / Files.
              Use 🎤 only if the other options fail.
            </p>
          </div>
        )}

        {stage === 'recording' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-900/40 rounded-xl border border-red-600">
              <div className="flex items-center gap-3">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-300 font-medium">Recording…</span>
              </div>
              <span className="text-red-300 font-mono text-lg tabular-nums">{mins}:{secs}</span>
            </div>
            <button
              onClick={stopRecording}
              className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white font-semibold text-lg transition-colors"
            >
              ⏹ Stop &amp; Transcribe
            </button>
          </div>
        )}

        {(stage === 'uploading' || stage === 'transcribing') && (
          <div className="p-6 bg-slate-800 rounded-xl text-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-300 text-sm">
              {stage === 'uploading' ? 'Uploading audio…' : 'Transcribing with Whisper…'}
            </p>
          </div>
        )}

        {stage === 'error' && (
          <div className="p-4 bg-red-900/40 border border-red-600 rounded-xl space-y-3">
            <p className="text-red-300 text-sm">{errorMsg || 'Something went wrong.'}</p>
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={reset} className="text-sm text-slate-300 hover:text-white underline">
                Try again
              </button>
              <label className="text-sm text-blue-300 hover:text-blue-200 underline cursor-pointer">
                📱 Record with mic
                <input type="file" accept="audio/*" capture="user" className="hidden" onChange={handleFilePick} />
              </label>
              <label className="text-sm text-blue-300 hover:text-blue-200 underline cursor-pointer">
                📂 Upload audio
                <input type="file" accept="audio/*" className="hidden" onChange={handleFilePick} />
              </label>
            </div>
          </div>
        )}

        {stage === 'review' && (
          <div className="space-y-5">
            <div className="p-4 bg-slate-800 rounded-xl">
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">Transcript</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {transcript || <span className="text-slate-500 italic">No speech detected — edit the fields below.</span>}
              </p>
            </div>

            <div className="space-y-4">
              {field('Title *', (
                <input
                  className={inputCls}
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                />
              ))}
              {field('Type', (
                <select
                  className={inputCls}
                  value={draft.type}
                  onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                >
                  {WORK_ITEM_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              ))}
              {field('Status', (
                <select
                  className={inputCls}
                  value={draft.status ?? 'Captured'}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
                >
                  {WORK_ITEM_STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              ))}
              {field('Owner', (
                <input
                  className={inputCls}
                  value={draft.owner ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, owner: e.target.value }))}
                />
              ))}
              {field('Company', (
                <input
                  className={inputCls}
                  value={draft.company ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
                />
              ))}
              {field('Priority', (
                <select
                  className={inputCls}
                  value={draft.priority ?? 'Medium'}
                  onChange={(e) => setDraft((d) => ({ ...d, priority: e.target.value }))}
                >
                  {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              ))}
              {field('Due Date', (
                <input
                  type="date"
                  className={inputCls}
                  value={draft.dueDate ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, dueDate: e.target.value }))}
                />
              ))}
              {field('Next Action', (
                <input
                  className={inputCls}
                  placeholder="What's the immediate next step?"
                  value={draft.nextAction ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, nextAction: e.target.value }))}
                />
              ))}
              {field('Notes', (
                <textarea
                  rows={3}
                  className={inputCls}
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
              ))}
            </div>

            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

            <div className="flex gap-3">
              <button
                onClick={approve}
                disabled={submitting || !draft.title.trim()}
                className="flex-1 py-3 rounded-xl bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-colors"
              >
                {submitting ? 'Creating…' : 'Approve & Create'}
              </button>
              <button
                onClick={reject}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold transition-colors"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {stage === 'done' && (
          <div className="p-6 bg-green-900/40 border border-green-600 rounded-xl space-y-4 text-center">
            <p className="text-green-300 font-semibold">Work item created!</p>
            {workItemId && (
              <a
                href={`/work-items/${workItemId}`}
                className="inline-block px-4 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-white text-sm font-medium transition-colors"
              >
                View Work Item
              </a>
            )}
            <div>
              <button onClick={reset} className="text-sm text-slate-400 hover:text-white underline block mx-auto">
                Record another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
