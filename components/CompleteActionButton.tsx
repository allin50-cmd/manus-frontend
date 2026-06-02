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

  async function handleComplete() {
    setLoading(true)
    try {
      await fetch(`/api/work-items/${workItemId}/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleComplete}
      disabled={loading}
      className="shrink-0 text-xs font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg px-3 py-1.5 disabled:opacity-50 transition-colors"
    >
      {loading ? '…' : '✓ Done'}
    </button>
  )
}
