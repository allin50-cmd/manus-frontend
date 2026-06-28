'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const PERSONS = ['George', 'Dagon', 'Alissa', 'Michelle', 'Chris', 'Charlie'] as const

interface WorkItemSummary {
  id: string
  title: string
  company: string | null
  status: string
  priority: string
}

interface Task {
  id: string
  label: string
  status: string
  dueDate: string | null
  assignedTo: string | null
  workItemId: string
  workItem: WorkItemSummary
}

interface Props {
  initialTasks: Task[]
  currentPerson: string
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: 'bg-blue-100 text-blue-700',
    Blocked: 'bg-amber-100 text-amber-700',
    Done: 'bg-green-100 text-green-700',
    Cancelled: 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`text-xs font-medium rounded px-2 py-0.5 ${map[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {status}
    </span>
  )
}

function DueDateDisplay({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return <span className="text-xs text-slate-400">No due date</span>
  const d = new Date(dueDate)
  const isOverdue = d < new Date()
  const formatted = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return (
    <span className={`text-xs font-medium ${isOverdue ? 'text-red-600' : 'text-slate-500'}`}>
      {isOverdue ? '⚠ ' : ''}{formatted}
    </span>
  )
}

export default function MyTasksClient({ initialTasks, currentPerson }: Props) {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [statusFilter, setStatusFilter] = useState<'all' | 'Open' | 'Blocked' | 'Done'>('all')
  const [dueFilter, setDueFilter] = useState<'all' | 'overdue' | 'today' | 'week'>('all')
  const [reassigning, setReassigning] = useState<string | null>(null)
  const [reassignPerson, setReassignPerson] = useState<string>('')
  const [handoffNote, setHandoffNote] = useState<string>('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function markDone(task: Task) {
    setLoadingId(task.id)
    setError(null)
    try {
      const res = await fetch(
        `/api/work-items/${task.workItem.id}/actions/${task.id}`,
        { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'Done' }) },
      )
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Failed to mark done')
      } else {
        setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, status: 'Done' } : t))
      }
    } catch {
      setError('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  async function submitReassign(task: Task) {
    if (!reassignPerson) return
    setLoadingId(task.id)
    setError(null)
    try {
      const res = await fetch(
        `/api/work-items/${task.workItem.id}/actions/${task.id}/reassign`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedTo: reassignPerson, handoffNote: handoffNote || undefined }),
        },
      )
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Failed to reassign')
      } else {
        if (reassignPerson !== currentPerson) {
          setTasks((prev) => prev.filter((t) => t.id !== task.id))
        } else {
          setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, assignedTo: reassignPerson } : t))
        }
        setReassigning(null)
        setReassignPerson('')
        setHandoffNote('')
        router.refresh()
      }
    } catch {
      setError('Network error')
    } finally {
      setLoadingId(null)
    }
  }

  const now = new Date()
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 23, 59, 59)

  const filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false
    if (dueFilter === 'overdue') {
      if (!t.dueDate || new Date(t.dueDate) >= now) return false
    } else if (dueFilter === 'today') {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      if (d > todayEnd) return false
    } else if (dueFilter === 'week') {
      if (!t.dueDate) return false
      const d = new Date(t.dueDate)
      if (d > weekEnd) return false
    }
    return true
  })

  const statusTabs = [
    { key: 'all', label: 'All' },
    { key: 'Open', label: 'Open' },
    { key: 'Blocked', label: 'Blocked' },
    { key: 'Done', label: 'Done' },
  ] as const

  const dueTabs = [
    { key: 'all', label: 'All dates' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'today', label: 'Due today' },
    { key: 'week', label: 'Due this week' },
  ] as const

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex gap-1 flex-wrap">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 flex-wrap">
          {dueTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setDueFilter(tab.key)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                dueFilter === tab.key
                  ? 'bg-slate-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 font-medium">No open tasks — you&apos;re all clear.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-slate-200 px-4 py-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm">{task.label}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <Link
                      href={`/work-items/${task.workItem.id}`}
                      className="text-xs text-blue-600 hover:underline truncate"
                    >
                      {task.workItem.title}
                    </Link>
                    {task.workItem.company && (
                      <span className="text-xs text-slate-400">{task.workItem.company}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={task.status} />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 flex-wrap">
                <DueDateDisplay dueDate={task.dueDate} />
                <div className="flex gap-2">
                  {task.status !== 'Done' && task.status !== 'Cancelled' && (
                    <button
                      onClick={() => markDone(task)}
                      disabled={loadingId === task.id}
                      className="text-xs font-semibold px-3 py-1 rounded-lg bg-green-600 hover:bg-green-700 text-white transition-colors disabled:opacity-50"
                    >
                      {loadingId === task.id ? 'Saving…' : 'Mark Done'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setReassigning(task.id)
                      setReassignPerson('')
                      setHandoffNote('')
                    }}
                    disabled={loadingId === task.id}
                    className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
                  >
                    Reassign
                  </button>
                </div>
              </div>

              {reassigning === task.id && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-xs font-semibold text-slate-600">Reassign to:</p>
                  <div className="flex gap-2 flex-wrap">
                    {PERSONS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setReassignPerson(p)}
                        className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                          reassignPerson === p
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Handoff note (optional)"
                    value={handoffNote}
                    onChange={(e) => setHandoffNote(e.target.value)}
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReassign(task)}
                      disabled={!reassignPerson || loadingId === task.id}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-40"
                    >
                      {loadingId === task.id ? 'Saving…' : 'Confirm'}
                    </button>
                    <button
                      onClick={() => { setReassigning(null); setReassignPerson(''); setHandoffNote('') }}
                      className="text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
