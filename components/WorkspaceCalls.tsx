'use client'

import { useEffect, useState } from 'react'

interface WorkspaceCallsProps {
  companyId: string
  companyName: string
}

interface CallLog {
  id: string
  direction: string
  duration: number | null
  notes: string | null
  recordedAt: string
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return '—'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function WorkspaceCalls({ companyId, companyName }: WorkspaceCallsProps) {
  const [calls, setCalls] = useState<CallLog[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setCalls(null)
      try {
        const res = await fetch(`/api/os/call-logs?companyId=${encodeURIComponent(companyId)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load calls')
        }
        const data: CallLog[] = await res.json()
        if (!cancelled) setCalls(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load calls')
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [companyId])

  if (error) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,120,120,0.85)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (calls === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading calls…
        </p>
      </div>
    )
  }

  if (calls.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No calls logged yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {calls.map((call) => (
        <div
          key={call.id}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {call.direction} call
            </p>
            {call.notes && (
              <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {call.notes}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              {formatDate(call.recordedAt)}
            </span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
              style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              {formatDuration(call.duration)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
