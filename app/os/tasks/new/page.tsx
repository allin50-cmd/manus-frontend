'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUSES = ['Open', 'InProgress', 'Done', 'Cancelled']

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    priority: 'Medium',
    status: 'Open',
    assignedTo: '',
    dueAt: '',
    linkedWorkItemId: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/os/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          priority: form.priority,
          status: form.status,
          assignedTo: form.assignedTo || undefined,
          dueAt: form.dueAt || undefined,
          linkedWorkItemId: form.linkedWorkItemId || undefined,
          notes: form.notes || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        router.push('/os/tasks')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create task')
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
        <h1 className="text-xl font-bold text-slate-900">Add Task</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Title *">
          <input
            required
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Task title"
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Assigned To">
          <input
            value={form.assignedTo}
            onChange={(e) => set('assignedTo', e.target.value)}
            placeholder="Name or team member"
            className={inputClass}
          />
        </Field>

        <Field label="Due Date">
          <input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => set('dueAt', e.target.value)}
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
            placeholder="Additional notes…"
            className={inputClass}
          />
        </Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading || !form.title}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
        >
          {loading ? 'Creating…' : 'Create Task'}
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
