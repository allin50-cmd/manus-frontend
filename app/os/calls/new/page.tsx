'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const DIRECTIONS = ['Inbound', 'Outbound']
const OUTCOMES = ['Answered', 'Missed', 'Voicemail', 'NoAnswer']

export default function NewCallPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    direction: 'Inbound',
    callerName: '',
    callerPhone: '',
    durationMinutes: '',
    outcome: 'Answered',
    notes: '',
    linkedWorkItemId: '',
    calledAt: new Date().toISOString().slice(0, 16),
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const durationSeconds = form.durationMinutes ? parseInt(form.durationMinutes, 10) * 60 : 0

      const res = await fetch('/api/os/calls', {
        method: 'POST',
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
        const data = await res.json()
        router.push('/os/calls')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to log call')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Log Call</h1>
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

        <button
          type="submit"
          disabled={loading || !form.callerName}
          className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Logging…' : 'Log Call'}
        </button>
      </form>
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
