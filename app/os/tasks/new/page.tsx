'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const OWNERS = ['George', 'Dagon', 'Alissa', 'Michelle']
const PRIORITIES = ['Urgent', 'High', 'Medium', 'Low']

export default function NewTaskPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    company: '',
    contact: '',
    owner: 'George',
    priority: 'Medium',
    dueDate: '',
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
        body: JSON.stringify({ ...form, dueDate: form.dueDate || null }),
      })

      if (res.ok) {
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
      <h1 className="text-xl font-bold text-slate-900">Add Task</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        <Field label="Task *"><input required value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} /></Field>
        <Field label="Company"><input value={form.company} onChange={(e) => set('company', e.target.value)} className={inputClass} /></Field>
        <Field label="Contact"><input value={form.contact} onChange={(e) => set('contact', e.target.value)} className={inputClass} /></Field>

        <Field label="Assign To">
          <select value={form.owner} onChange={(e) => set('owner', e.target.value)} className={inputClass}>
            {OWNERS.map((owner) => <option key={owner}>{owner}</option>)}
          </select>
        </Field>

        <Field label="Priority">
          <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
            {PRIORITIES.map((priority) => <option key={priority}>{priority}</option>)}
          </select>
        </Field>

        <Field label="Due"><input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} className={inputClass} /></Field>
        <Field label="Notes"><textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} className={inputClass} /></Field>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button type="submit" disabled={loading || !form.title} className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg">
          {loading ? 'Creating…' : 'Create Task'}
        </button>
      </form>
    </div>
  )
}

const inputClass = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-semibold text-slate-600 mb-1 uppercase tracking-wide">{label}</label>{children}</div>
}
