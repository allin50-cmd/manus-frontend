'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompleteActionButton({
  workItemId,
  actionId,
}: {
  workItemId: string
  actionId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleComplete() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/work-items/${workItemId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Could not mark complete')
        return
      }
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shrink-0 flex flex-col items-end gap-1">
      <button
        onClick={handleComplete}
        disabled={loading}
        className="text-xs font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
      >
        {loading ? '…' : '✓ Done'}
      </button>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
