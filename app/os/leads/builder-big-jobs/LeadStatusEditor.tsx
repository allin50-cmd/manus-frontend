'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const STATUSES = ['new', 'qualified', 'contacted', 'site_visit_booked', 'quoted', 'won', 'lost', 'not_suitable']
const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  contacted: 'Contacted',
  site_visit_booked: 'Site visit',
  quoted: 'Quoted',
  won: 'Won',
  lost: 'Lost',
  not_suitable: 'Not suitable',
}
const ASSIGNEES = ['', 'Dagon', 'Alissa', 'George']

type Props =
  | { leadId: string; currentStatus: string; mode?: 'status' }
  | { leadId: string; currentAssigned: string | null; mode: 'assignee' }

export default function LeadStatusEditor(props: Props) {
  const router = useRouter()
  const isAssignee = props.mode === 'assignee'
  const [busy, setBusy] = useState(false)

  const currentValue = isAssignee
    ? (props as { currentAssigned: string | null }).currentAssigned ?? ''
    : (props as { currentStatus: string }).currentStatus

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value
    setBusy(true)
    try {
      await fetch(`/api/builder-big-jobs/leads/${props.leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isAssignee ? { assignedTo: value } : { status: value }),
      })
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  if (isAssignee) {
    return (
      <select
        value={currentValue}
        onChange={handleChange}
        disabled={busy}
        className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
      >
        {ASSIGNEES.map((a) => (
          <option key={a} value={a}>{a || '—'}</option>
        ))}
      </select>
    )
  }

  return (
    <select
      value={currentValue}
      onChange={handleChange}
      disabled={busy}
      className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
      ))}
    </select>
  )
}
