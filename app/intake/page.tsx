'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { VoiceDraft } from '@/lib/voice/types'

type DraftResponse = {
  voice_id?: string
  draft?: VoiceDraft
  status?: string
  error?: string
}

export default function IntakePage() {
  const router = useRouter()
  const [transcript, setTranscript] = useState('')
  const [voiceId, setVoiceId] = useState('')
  const [status, setStatus] = useState('')
  const [draftText, setDraftText] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function createDraft(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch('/api/voice/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      })
      const data = (await res.json()) as DraftResponse
      if (!res.ok) throw new Error(data.error || 'Could not create draft')

      setVoiceId(data.voice_id || '')
      setStatus(data.status || 'PARSED')
      setDraftText(JSON.stringify(data.draft || {}, null, 2))
      setMessage('Draft created. Review it before approval.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create draft')
    } finally {
      setBusy(false)
    }
  }

  async function decide(action: 'approve' | 'reject') {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      if (!voiceId) throw new Error('Create a draft first')
      const draft = action === 'approve' ? (JSON.parse(draftText) as VoiceDraft) : undefined
      const res = await fetch('/api/voice/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_id: voiceId, draft, action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Decision failed')

      if (action === 'approve' && data.workItemId) {
        router.push(`/os/work-items/${data.workItemId}`)
        return
      }

      setVoiceId('')
      setStatus('')
      setDraftText('')
      setMessage('Rejected. No live records were created.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Decision failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-5 pb-20">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">Voice Intake</h1>
        <p className="text-sm text-slate-500">Transcript first, then review and approve before live records are created.</p>
      </div>

      <form onSubmit={createDraft} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Transcript</span>
          <textarea
            rows={7}
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste or type a field note here."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </label>
        <button disabled={busy || !transcript.trim()} className="w-full rounded-xl bg-blue-600 px-4 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {busy ? 'Working...' : 'Create Draft'}
        </button>
      </form>

      {draftText && (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Review Draft</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{status}</span>
          </div>
          <textarea
            rows={14}
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button type="button" disabled={busy} onClick={() => decide('approve')} className="rounded-xl bg-green-600 px-4 py-4 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              Approve and Create Records
            </button>
            <button type="button" disabled={busy} onClick={() => decide('reject')} className="rounded-xl bg-slate-200 px-4 py-4 font-semibold text-slate-800 hover:bg-slate-300 disabled:opacity-50">
              Reject
            </button>
          </div>
        </div>
      )}

      {message && <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">{message}</div>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    </div>
  )
}
