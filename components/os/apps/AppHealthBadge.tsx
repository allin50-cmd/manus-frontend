'use client'

import { useEffect, useState } from 'react'

type HealthState = 'checking' | 'healthy' | 'unavailable'

export default function AppHealthBadge({ appId }: { appId: string }) {
  const [state, setState] = useState<HealthState>('checking')

  useEffect(() => {
    let cancelled = false

    fetch(`/api/apps/${appId}/health`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (!cancelled) setState(data.status === 'ok' ? 'healthy' : 'unavailable')
      })
      .catch(() => {
        if (!cancelled) setState('unavailable')
      })

    return () => {
      cancelled = true
    }
  }, [appId])

  const config = {
    checking: { label: 'Checking…', dot: 'bg-white/30', text: 'text-white/50' },
    healthy: { label: 'Healthy', dot: 'bg-emerald-400', text: 'text-emerald-400' },
    unavailable: { label: 'Unavailable', dot: 'bg-red-400', text: 'text-red-400' },
  }[state]

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  )
}
