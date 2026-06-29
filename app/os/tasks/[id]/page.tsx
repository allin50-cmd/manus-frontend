'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUSES = ['Open', 'InProgress', 'Done', 'Cancelled']

interface Task {
  id: string
  title: string
  priority: string
  status: string
  assignedTo: string
  dueAt: string | null
  linkedWorkItemId: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export default function TaskDetailPage() {
  const router = useRouter()
  const params = useParams()
  const taskId = params.id as string

  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetchTask()
  }, [taskId])

  async function fetchTask() {
    try {
      setLoading(true)
      const res = await fetch(`/api/os/tasks/${taskId}`)
      if (res.ok) {
        const data = await res.json()
        setTask(data)
        setForm({
          title: data.title || '',
          priority: data.priority || 'Medium',
          status: data.status || 'Open',
          assignedTo: data.assignedTo || '',
          dueAt: data.dueAt ? new Date(data.dueAt).toISOString().slice(0, 16) : '',
          linkedWorkItemId: data.linkedWorkItemId || '',
          notes: data.notes || '',
        })
      } else {
        setError('Task not found')
      }
    } catch (err) {
      setError('Failed to load task')
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
      const res = await fetch(`/api/os/tasks/${taskId}`, {
        method: 'PUT',
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
        await fetchTask()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to update task')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task?')) return

    try {
      setSaving(true)
      const res = await fetch(`/api/os/tasks/${taskId}`, { method: 'DELETE' })
      if (res.ok) {
        router.push('/os/tasks')
      } else {
        setError('Failed to delete task')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function completeTask() {
    setSaving(true)
    try {
      const res = await fetch(`/api/os/tasks/${taskId}/complete`, { method: 'POST' })
      if (res.ok) {
        await fetchTask()
      } else {
        setError('Failed to complete task')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function reopenTask() {
    setSaving(true)
    try {
      const res = await fetch(`/api/os/tasks/${taskId}/reopen`, { method: 'POST' })
      if (res.ok) {
        await fetchTask()
      } else {
        setError('Failed to reopen task')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  async function archiveTask() {
    setSaving(true)
    try {
      const res = await fetch(`/api/os/tasks/${taskId}/archive`, { method: 'POST' })
      if (res.ok) {
        await fetchTask()
      } else {
        setError('Failed to archive task')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-slate-600">Loading task…</div>
  }

  if (!task) {
    return <div className="text-center py-8 text-red-600">Task not found</div>
  }

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-slate-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-slate-900">Task Details</h1>
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

      <div className="space-y-3">
        {task.status !== 'Done' && (
          <button
            onClick={completeTask}
            disabled={saving}
            className="w-full py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Mark Complete
          </button>
        )}
        {task.status === 'Done' && (
          <button
            onClick={reopenTask}
            disabled={saving}
            className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Reopen
          </button>
        )}
        {task.status !== 'Cancelled' && (
          <button
            onClick={archiveTask}
            disabled={saving}
            className="w-full py-2 bg-slate-400 hover:bg-slate-500 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            Archive
          </button>
        )}
      </div>

      <div className="text-xs text-slate-500 space-y-1 bg-slate-50 p-3 rounded-lg">
        <p>Created: {new Date(task.createdAt).toLocaleString()}</p>
        <p>Updated: {new Date(task.updatedAt).toLocaleString()}</p>
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
