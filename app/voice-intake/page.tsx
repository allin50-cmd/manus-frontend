'use client'

import { useState, useRef, useEffect } from 'react'
import type { DraftRecord } from '@/lib/voice/types'
import { WORK_ITEM_TYPES, TYPE_LABELS, PRIORITIES } from '../../lib/work-item-enums'

type Stage = 'idle' | 'recording' | 'uploading' | 'transcribing' | 'review' | 'done' | 'error'

const SUPPORTED_MIME = ['audio/webm', 'audio/ogg', 'audio/mp4']

export default function VoiceIntakePage() {
  const [stage, setStage] = useState<Stage>('idle')
  const [intakeId, setIntakeId] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [draft, setDraft] = useState<DraftRecord>({ title: '', type: 'InternalTask', owner: 'George' })
  const [errorMsg, setErrorMsg] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [workItemId, setWorkItemId] = useState<string | null>(null)
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const mimeTypeRef = useRef<string>('audio/mp4')

  // Ensure the mic is released if the user navigates away mid-recording.
  useEffect(() => {
    return () => {
      const recorder = mediaRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      recorder?.stream.getTracks().forEach((t) => t.stop())
    }
  }, [])

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
      setErrorMsg('Audio recording is not supported in this browser. Try Chrome, Safari, or Firefox.')
      setStage('error')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      setErrorMsg('Microphone access was denied. Please allow microphone access and try again.')
      setStage('error')
      return
    }

    try {
      // Pass a mimeType only when we have a concrete one — handing iOS an empty
      // string throws, so fall back to the no-options constructor it accepts.
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data) }
      // No timeslice: iOS Safari frequently fails to emit periodic chunks and
      // only delivers data on stop(). A single final chunk is the reliable path.
      recorder.start()
      mimeTypeRef.current = recorder.mimeType || mimeType || 'audio/mp4'
      mediaRef.current = recorder
      setStage('recording')
    } catch {
      stream.getTracks().forEach((t) => t.stop())
      setErrorMsg('Could not start recording in this browser.')
      setStage('error')
    }
  }

  async function stopRecording() {
    const recorder = mediaRef.current
    if (!recorder) return
    setStage('uploading')

    // Build the blob inside onstop, after the final ondataavailable has fired,
    // so chunks are guaranteed populated (critical on iOS Safari).
    const mime = mimeTypeRef.current
    const blob: Blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mime }))
      try { recorder.requestData() } catch { /* not all browsers support it */ }
      recorder.stop()
      recorder.stream.getTracks().forEach((t) => t.stop())
    })
    mediaRef.current = null

    if (!blob.size) {
      setErrorMsg('No audio was captured. Hold the record button a moment longer and try again.')
      setStage('error')
      return
    }

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

      const { transcript: tx, parsedJson } = await txRes.json()
      setTranscript(tx ?? '')
      setDraft(parsedJson ?? { title: (tx ?? '').slice(0, 120), type: 'InternalTask', owner: 'George' })
      setStage('review')
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStage('error')
    }
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
    setStage('idle')
    setIntakeId(null)
    setTranscript('')
    setDraft({ title: '', type: 'InternalTask', owner: 'George' })
    setErrorMsg('')
    setWorkItemId(null)
  }

  function field(label: string, node: React.ReactNode) {
    return (
      <div className="space-y-1">
        <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</label>
        {node}
      </div>
    )
  }

  const inputCls = 'w-full rounded-lg border border-slate-600 bg-slate-700 text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-8 pb-24 sm:pb-8">
      <div className="max-w-xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Voice Intake</h1>
        <p className="text-slate-400 text-sm">Record a voice note to quickly capture a work item.</p>

        {stage === 'idle' && (
          <button
            onClick={startRecording}
            className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors"
          >
            Start Recording
          </button>
        )}

        {stage === 'recording' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-red-900/40 rounded-xl border border-red-600">
              <span className="inline-block w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-300 font-medium">Recording…</span>
            </div>
            <button
              onClick={stopRecording}
              className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold text-lg transition-colors"
            >
              Stop &amp; Transcribe
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
            <button onClick={reset} className="text-sm text-slate-300 hover:text-white underline">
              Try again
            </button>
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
