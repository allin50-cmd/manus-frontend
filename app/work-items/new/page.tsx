'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const TYPES = ['Partnership', 'ConstructionLead', 'PlanningLead', 'ComplianceAlert', 'DocumentRecord', 'MediaBrief', 'InternalTask', 'Other']
const TYPE_LABELS: Record<string, string> = {
  Partnership: 'Partnership',
  ConstructionLead: 'Construction Lead',
  PlanningLead: 'Planning Lead',
  ComplianceAlert: 'Compliance Alert',
  DocumentRecord: 'Document Record',
  MediaBrief: 'Media Brief',
  InternalTask: 'Internal Task',
  Other: 'Other',
}
const STATUSES = ['Captured', 'Controlled', 'InProgress', 'Waiting', 'FollowUpDue', 'Escalated', 'DecisionNeeded', 'Completed', 'Paused', 'NotFit', 'Archived']
const STATUS_LABELS: Record<string, string> = {
  Captured: 'Captured', Controlled: 'Controlled', InProgress: 'In Progress', Waiting: 'Waiting',
  FollowUpDue: 'Follow-Up Due', Escalated: 'Escalated', DecisionNeeded: 'Decision Needed',
  Completed: 'Completed', Paused: 'Paused', NotFit: 'Not Fit', Archived: 'Archived',
}
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const OWNERS = ['Dagon', 'George', 'Alissa']

export default function NewWorkItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: 'Partnership',
    title: '',
    company: '',
    contactName: '',
    owner: 'Dagon',
    status: 'Captured',
    priority: 'Medium',
    nextAction: '',
    dueDate: '',
    decisionNeeded: false,
    notes: '',
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
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Add Work Item</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Type *">
          <select value={form.type} onChange={(e) => set('type', e.target.value)} className={inputClass}>
            {TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </Field>

        <Field label="Title *">
          <input required value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="What is this?" className={inputClass} />
        </Field>

        <Field label="Owner *">
          <select value={form.owner} onChange={(e) => set('owner', e.target.value)} className={inputClass}>
            {OWNERS.map((o) => <option key={o}>{o}</option>)}
            <option value="Other">Other</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </Field>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
              {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Company">
          <input value={form.company} onChange={(e) => set('company', e.target.value)}
            placeholder="Company name" className={inputClass} />
        </Field>

        <Field label="Contact Name">
          <input value={form.contactName} onChange={(e) => set('contactName', e.target.value)}
            placeholder="Contact person" className={inputClass} />
        </Field>

        <Field label="Next Action">
          <input value={form.nextAction} onChange={(e) => set('nextAction', e.target.value)}
            placeholder="What needs to happen next?" className={inputClass} />
        </Field>

        <Field label="Due Date">
          <input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass} />
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
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Create Work Item'}
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
