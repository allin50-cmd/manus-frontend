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
} from '../../../../lib/work-item-enums'

interface Item {
  id: string
  type: string
  title: string
  company: string | null
  contactName: string | null
  owner: string
  status: string
  priority: string
  nextAction: string | null
  dueDate: string | null
  decisionNeeded: boolean
  notes: string | null
}

export default function EditForm({ item }: { item: Item }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: item.type,
    title: item.title,
    company: item.company ?? '',
    contactName: item.contactName ?? '',
    owner: item.owner,
    status: item.status,
    priority: item.priority,
    nextAction: item.nextAction ?? '',
    dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
    decisionNeeded: item.decisionNeeded,
    notes: item.notes ?? '',
  })

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const body = {
        ...form,
        dueDate: form.dueDate || null,
        company: form.company || null,
        contactName: form.contactName || null,
        nextAction: form.nextAction || null,
        notes: form.notes || null,
      }
      const res = await fetch(`/api/work-items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        router.push(`/work-items/${item.id}`)
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to save changes')
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
        <h1 className="text-xl font-bold text-slate-900">Edit Work Item</h1>
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
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Company">
            <input value={form.company} onChange={(e) => set('company', e.target.value)}
              placeholder="Company name" className={inputClass} />
          </Field>
        </div>

        <Field label="Contact Name">
          <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
            placeholder="Contact person" className={inputClass} />
        </Field>

        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)}
            rows={3} placeholder="Any context or background…" className={inputClass} />
        </Field>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.decisionNeeded}
            onChange={(e) => set('decisionNeeded', e.target.checked)}
            className="w-4 h-4 accent-purple-600" />
          <span className="text-sm text-slate-700">Decision needed from George</span>
        </label>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.title}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          {loading ? 'Saving…' : 'Save Changes'}
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
