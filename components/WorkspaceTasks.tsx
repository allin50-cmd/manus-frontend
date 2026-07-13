'use client'

import { useEffect, useState } from 'react'

interface WorkspaceTasksProps {
  companyName: string
}

interface WorkItemTask {
  id: string
  title: string
  status: string
  priority: string
  owner: string
  dueDate: string | null
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function WorkspaceTasks({ companyName }: WorkspaceTasksProps) {
  const [tasks, setTasks] = useState<WorkItemTask[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setTasks(null)
      try {
        const res = await fetch(
          `/api/work-items?type=InternalTask&company=${encodeURIComponent(companyName)}`
        )
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load tasks')
        }
        const data: WorkItemTask[] = await res.json()
        if (!cancelled) setTasks(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load tasks')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [companyName])

  if (error) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,120,120,0.85)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (tasks === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading tasks…
        </p>
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No tasks yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <a
          key={task.id}
          href={`/work-items/${task.id}`}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap hover:bg-white/[0.02] transition-colors"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {task.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {task.owner} · Due {formatDate(task.dueDate)}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {task.priority}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {task.status}
            </span>
          </div>
        </a>
      ))}
    </div>
  )
}
