'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = [
  { value: 'Captured', label: 'Captured' },
  { value: 'Controlled', label: 'Controlled' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Waiting', label: 'Waiting' },
  { value: 'FollowUpDue', label: 'Follow-Up Due' },
  { value: 'Escalated', label: 'Escalated' },
  { value: 'DecisionNeeded', label: 'Decision Needed' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Paused', label: 'Paused' },
  { value: 'NotFit', label: 'Not Fit' },
  { value: 'Archived', label: 'Archived' },
]

type Panel = 'logNote' | 'followUp' | 'changeStatus' | 'escalate' | null

export default function WorkItemActions({
  workItemId,
  currentStatus,
  person,
}: {
  workItemId: string
  currentStatus: string
  person: string
}) {
  const router = useRouter()
  const [panel, setPanel] = useState<Panel>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  function togglePanel(p: Panel) {
    setPanel((prev) => (prev === p ? null : p))
    setMsg('')
  }

  async function post(url: string, body: unknown) {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsg(data.error ?? 'Something went wrong')
        return false
      }
      return true
    } catch {
      setMsg('Network error')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function patch(body: unknown) {
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`/api/work-items/${workItemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setMsg(data.error ?? 'Something went wrong')
        return false
      }
      return true
    } catch {
      setMsg('Network error')
      return false
    } finally {
      setLoading(false)
    }
  }

  async function handleLogNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = await post(`/api/work-items/${workItemId}/log`, { text: fd.get('text') })
    if (ok) { setPanel(null); router.refresh() }
  }

  async function handleFollowUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = await post(`/api/work-items/${workItemId}/actions`, {
      label: fd.get('label'),
      assignedTo: fd.get('assignedTo') || person,
      dueDate: fd.get('dueDate') || null,
      actionType: 'CreateFollowUp',
    })
    if (ok) { setPanel(null); router.refresh() }
  }

  async function handleChangeStatus(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = await patch({ status: fd.get('status') })
    if (ok) { setPanel(null); router.refresh() }
  }

  async function handleEscalate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const ok = await post(`/api/work-items/${workItemId}/escalate`, {
      question: fd.get('question'),
      recommendation: fd.get('recommendation') || null,
      options: fd.get('options') || null,
      decisionBy: fd.get('decisionBy') || 'George',
      dueDate: fd.get('dueDate') || null,
    })
    if (ok) { setPanel(null); router.refresh() }
  }

  async function handleMarkComplete() {
    const ok = await patch({ status: 'Completed' })
    if (ok) router.refresh()
  }

  async function handleArchive() {
    if (!confirm('Archive this work item?')) return
    const ok = await patch({ status: 'Archived' })
    if (ok) router.refresh()
  }

  const btnBase = 'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Actions</h2>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => togglePanel('logNote')} className={`${btnBase} bg-slate-200 hover:bg-slate-300 text-slate-800`}>
          Log Note
        </button>
        <button onClick={() => togglePanel('followUp')} className={`${btnBase} bg-blue-100 hover:bg-blue-200 text-blue-800`}>
          Create Follow-Up
        </button>
        <button onClick={() => togglePanel('changeStatus')} className={`${btnBase} bg-yellow-100 hover:bg-yellow-200 text-yellow-900`}>
          Change Status
        </button>
        <button onClick={() => togglePanel('escalate')} className={`${btnBase} bg-purple-100 hover:bg-purple-200 text-purple-800`}>
          Escalate to George
        </button>
        <button
          onClick={handleMarkComplete}
          disabled={loading || currentStatus === 'Completed'}
          className={`${btnBase} bg-green-100 hover:bg-green-200 text-green-800`}
        >
          Mark Complete
        </button>
        <button
          onClick={handleArchive}
          disabled={loading || currentStatus === 'Archived'}
          className={`${btnBase} bg-red-50 hover:bg-red-100 text-red-700`}
        >
          Archive
        </button>
      </div>

      {msg && <p className="text-sm text-red-600">{msg}</p>}

      {/* Inline panels */}
      {panel === 'logNote' && (
        <Panel title="Log Note" onClose={() => setPanel(null)}>
          <form onSubmit={handleLogNote} className="space-y-3">
            <textarea
              name="text"
              required
              rows={3}
              placeholder="What happened? What was said?"
              className={inputCls}
              autoFocus
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className={submitCls}>
                {loading ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </form>
        </Panel>
      )}

      {panel === 'followUp' && (
        <Panel title="Create Follow-Up" onClose={() => setPanel(null)}>
          <form onSubmit={handleFollowUp} className="space-y-3">
            <input name="label" required placeholder="What needs to happen?" className={inputCls} autoFocus />
            <input name="assignedTo" placeholder={`Assigned to (default: ${person})`} className={inputCls} />
            <input name="dueDate" type="date" className={inputCls} />
            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? 'Saving…' : 'Create Follow-Up'}
            </button>
          </form>
        </Panel>
      )}

      {panel === 'changeStatus' && (
        <Panel title="Change Status" onClose={() => setPanel(null)}>
          <form onSubmit={handleChangeStatus} className="space-y-3">
            <select name="status" defaultValue={currentStatus} className={inputCls}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? 'Saving…' : 'Update Status'}
            </button>
          </form>
        </Panel>
      )}

      {panel === 'escalate' && (
        <Panel title="Escalate to George" onClose={() => setPanel(null)}>
          <form onSubmit={handleEscalate} className="space-y-3">
            <textarea
              name="question"
              required
              rows={2}
              placeholder="What decision is needed?"
              className={inputCls}
              autoFocus
            />
            <input name="recommendation" placeholder="Your recommendation (optional)" className={inputCls} />
            <input name="options" placeholder="Options available (optional)" className={inputCls} />
            <input name="decisionBy" placeholder="Decision by (default: George)" className={inputCls} />
            <input name="dueDate" type="date" className={inputCls} />
            <button type="submit" disabled={loading} className={submitCls}>
              {loading ? 'Escalating…' : 'Escalate'}
            </button>
          </form>
        </Panel>
      )}
    </div>
  )
}

function Panel({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-lg leading-none">×</button>
      </div>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white'
const submitCls = 'px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors'
