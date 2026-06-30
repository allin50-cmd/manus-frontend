'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'

const DIRECTIONS = ['Inbound', 'Outbound']
const OUTCOMES = ['Answered', 'Missed', 'Voicemail', 'NoAnswer']

interface CallLog {
  id: string
  direction: string
  callerName: string
  callerPhone: string | null
  durationSeconds: number | null
  outcome: string
  notes: string | null
  linkedWorkItemId: string | null
  calledAt: string
  createdAt: string
}

export default function CallDetailPage() {
  const router = useRouter()
  const params = useParams()
  const callId = params.id as string

  const [callLog, setCallLog] = useState<CallLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    direction: 'Inbound',
    callerName: '',
    callerPhone: '',
    durationMinutes: '',
    outcome: 'Answered',
    notes: '',
    linkedWorkItemId: '',
    calledAt: '',
  })

  useEffect(() => {
    fetchCall()
  }, [callId])

  async function fetchCall() {
    try {
      setLoading(true)
      const res = await fetch(`/api/os/calls/${callId}`)
      if (res.ok) {
        const data = await res.json()
        setCallLog(data)
        const durationMinutes = data.durationSeconds ? Math.round(data.durationSeconds / 60) : ''
        setForm({
          direction: data.direction || 'Inbound',
          callerName: data.callerName || '',
          callerPhone: data.callerPhone || '',
          durationMinutes: durationMinutes.toString(),
          outcome: data.outcome || 'Answered',
          notes: data.notes || '',
          linkedWorkItemId: data.linkedWorkItemId || '',
          calledAt: data.calledAt ? new Date(data.calledAt).toISOString().slice(0, 16) : '',
        })
      } else {
        setError('Call not found')
      }
    } catch (err) {
      setError('Failed to load call')
    } finally {
      setLoading(false)
    }
  }

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const durationSeconds = form.durationMinutes ? parseInt(form.durationMinutes, 10) * 60 : 0

      const res = await fetch(`/api/os/calls/${callId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: form.direction,
          callerName: form.callerName,
          callerPhone: form.callerPhone || undefined,
          durationSeconds,
          outcome: form.outcome,
          notes: form.notes || undefined,
          linkedWorkItemId: form.linkedWorkItemId || undefined,
          calledAt: form.calledAt ? new Date(form.calledAt).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        await fetchCall()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update call')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this call log?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/os/calls/${callId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/os/calls')
      } else {
        setError('Failed to delete call')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading call…</div>
  }

  if (!callLog) {
    return <div className="text-center py-8 text-red-600">Call not found</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Call Details</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Caller Name *">
          <input
            required
            value={form.callerName}
            onChange={(e) => set('callerName', e.target.value)}
            placeholder="Name of the person who called"
            className={inputClass}
          />
        </Field>

        <Field label="Direction">
          <select value={form.direction} onChange={(e) => set('direction', e.target.value)} className={inputClass}>
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Phone Number">
          <input
            type="tel"
            value={form.callerPhone}
            onChange={(e) => set('callerPhone', e.target.value)}
            placeholder="+44 20 1234 5678"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Duration (minutes)">
            <input
              type="number"
              value={form.durationMinutes}
              onChange={(e) => set('durationMinutes', e.target.value)}
              placeholder="0"
              min="0"
              className={inputClass}
            />
          </Field>

          <Field label="Outcome">
            <select value={form.outcome} onChange={(e) => set('outcome', e.target.value)} className={inputClass}>
              {OUTCOMES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Call Date & Time">
          <input
            type="datetime-local"
            value={form.calledAt}
            onChange={(e) => set('calledAt', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Linked Work Item">
          <input
            value={form.linkedWorkItemId}
            onChange={(e) => set('linkedWorkItemId', e.target.value)}
            placeholder="Work item ID (optional)"
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            placeholder="Call notes…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="px-4 py-3 bg-red-100 hover:bg-red-200 disabled:opacity-50 text-red-700 font-semibold rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      </form>

      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg">
        <p>Created: {new Date(callLog.createdAt).toLocaleString()}</p>
      </div>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}
