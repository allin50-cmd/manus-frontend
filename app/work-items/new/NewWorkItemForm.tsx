'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  WORK_ITEM_TYPES as TYPES,
  TYPE_LABELS,
  WORK_ITEM_STATUSES as STATUSES,
  STATUS_LABELS,
  PRIORITIES,
  OWNERS,
} from '@/lib/work-item-enums'

interface Initial {
  type?: string
  title?: string
  nextAction?: string
  notes?: string
}

export default function NewWorkItemForm({ initial }: { initial?: Initial }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showMore, setShowMore] = useState(!!(initial?.notes))

  const safeType = (TYPES as readonly string[]).includes(initial?.type ?? '') ? initial!.type! : 'Partnership'

  const [form, setForm] = useState({
    type: safeType,
    title: initial?.title ?? '',
    company: '',
    contactName: '',
    owner: 'Dagon',
    status: 'Captured',
    priority: 'Medium',
    nextAction: initial?.nextAction ?? '',
    dueDate: '',
    decisionNeeded: false,
    notes: initial?.notes ?? '',
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = { ...form, dueDate: form.dueDate || null }
      const res = await fetch('/api/work-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/work-items/${data.id}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create work item')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Add Work Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type *">
            <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
              {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Title *">
          <input
            required
            autoFocus
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="What is this?"
            className={inputClass}
          />
        </Field>

        <Field label="Next Action">
          <input
            value={form.nextAction}
            onChange={(e) => set('nextAction', e.target.value)}
            placeholder="What needs to happen next?"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Owner *">
            <select value={form.owner} onChange={(e) => set('owner', e.target.value)} className={inputClass}>
              {OWNERS.map((o) => <option key={o}>{o}</option>)}
              <option value="Other">Other</option>
            </select>
          </Field>
          <Field label="Due Date">
            <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass} />
          </Field>
        </div>

        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 py-1"
        >
          <span className={`transition-transform ${showMore ? 'rotate-90' : ''}`}>▶</span>
          {showMore ? 'Fewer options' : 'More options (company, contact, status, notes…)'}
        </button>

        {showMore && (
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <Field label="Company">
              <input value={form.company} onChange={(e) => set('company', e.target.value)}
                placeholder="Company name" className={inputClass} />
            </Field>

            <Field label="Contact Name">
              <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
                placeholder="Contact person" className={inputClass} />
            </Field>

            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </Field>

            <Field label="Notes">
              <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
                rows={4} placeholder="Any context or background…" className={inputClass} />
            </Field>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.decisionNeeded}
                onChange={(e) => set('decisionNeeded', e.target.checked)}
                className="w-4 h-4 accent-purple-600" />
              <span className="text-sm text-slate-700">Decision needed from George</span>
            </label>
          </div>
        )}

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.title}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Creating…' : 'Create Work Item'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  )
}
