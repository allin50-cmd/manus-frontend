'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DecisionActions({
  decisionId,
  workItemId,
  person,
}: {
  decisionId: string
  workItemId: string
  person: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [showNote, setShowNote] = useState(false)
  const [note, setNote] = useState('')

  async function decide(status: string) {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`/api/decisions/${decisionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, decision: note || null }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setMsg(data.error ?? 'Something went wrong')
      }
    } catch {
      setMsg('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      {showNote && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note about this decision (optional)…"
          rows={2}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => decide('Approved')}
          disabled={loading}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Approve
        </button>
        <button
          onClick={() => decide('Rejected')}
          disabled={loading}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Reject
        </button>
        <button
          onClick={() => decide('MoreInfoNeeded')}
          disabled={loading}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          More Info Needed
        </button>
        <button
          onClick={() => setShowNote(!showNote)}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors"
        >
          {showNote ? 'Hide note' : '+ Add note'}
        </button>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}
    </div>
  )
}
