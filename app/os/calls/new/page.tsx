'use client'

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const DIRECTIONS = ['Inbound', 'Outbound']

export default function NewCallPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyId = searchParams.get('companyId')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    direction: 'Inbound',
    personId: '',
    duration: '',
    transcript: '',
    notes: '',
    recordedAt: new Date().toISOString().slice(0, 16),
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!companyId) {
      setError('Company context is required')
      return
    }
    if (!form.personId.trim()) {
      setError('Person ID is required')
      return
    }

    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/os/call-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId,
          personId: form.personId,
          direction: form.direction,
          duration: form.duration ? parseInt(form.duration, 10) : undefined,
          transcript: form.transcript || undefined,
          notes: form.notes || undefined,
          recordedAt: form.recordedAt ? new Date(form.recordedAt).toISOString() : undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/os/calls?companyId=${companyId}`)
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

  if (!companyId) {
    return (
      <div className="max-w-lg space-y-6">
        <h1 className="text-xl font-bold text-slate-900">Log Call</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          <p>Please access this form from a workspace context with a company ID.</p>
        </div>
      </div>
    )
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
        <Field label="Person ID *">
          <input
            required
            value={form.personId}
            onChange={(e) => set('personId', e.target.value)}
            placeholder="ID of the person involved in this call"
            className={inputClass}
          />
        </Field>

        <Field label="Direction *">
          <select value={form.direction} onChange={(e) => set('direction', e.target.value)} className={inputClass}>
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Duration (seconds)">
          <input
            type="number"
            value={form.duration}
            onChange={(e) => set('duration', e.target.value)}
            placeholder="0"
            min="0"
            className={inputClass}
          />
        </Field>

        <Field label="Recorded At">
          <input
            type="datetime-local"
            value={form.recordedAt}
            onChange={(e) => set('recordedAt', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Transcript">
          <textarea
            value={form.transcript}
            onChange={(e) => set('transcript', e.target.value)}
            rows={3}
            placeholder="Call transcript (optional)…"
            className={inputClass}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={2}
            placeholder="Additional notes…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.personId}
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
