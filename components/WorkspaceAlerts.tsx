'use client'

import { useEffect, useState } from 'react'

interface WorkspaceAlertsProps {
  companyName: string
}

interface AlertDelivery {
  id: string
  status: string
  channel: string
  sentAt: string | null
  acknowledgedAt: string | null
  createdAt: string
  recipient: { name: string; role: string } | null
  workItem: { id: string; title: string; priority: string } | null
}

const cardStyle = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.07)',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function WorkspaceAlerts({ companyName }: WorkspaceAlertsProps) {
  const [alerts, setAlerts] = useState<AlertDelivery[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setError('')
      setAlerts(null)
      try {
        const res = await fetch(`/api/alert-deliveries?company=${encodeURIComponent(companyName)}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error ?? 'Failed to load alerts')
        }
        const data: AlertDelivery[] = await res.json()
        if (!cancelled) setAlerts(data)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load alerts')
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

  if (alerts === null) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Loading alerts…
        </p>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-2xl" style={cardStyle}>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          No alerts yet for {companyName}.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <a
          key={alert.id}
          href={alert.workItem ? `/work-items/${alert.workItem.id}` : '/alert-deliveries'}
          className="flex items-center justify-between gap-3 p-4 rounded-2xl flex-wrap sm:flex-nowrap hover:bg-white/[0.02] transition-colors"
          style={cardStyle}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {alert.workItem?.title ?? 'Untitled work item'}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {alert.recipient?.name ?? 'Unassigned'} · {alert.channel} · {formatDate(alert.createdAt)}
            </p>
          </div>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0"
            style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.09)' }}
          >
            {alert.status}
          </span>
        </a>
      ))}
    </div>
  )
}
