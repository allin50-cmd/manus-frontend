'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface OutreachLog {
  id: string
  workItemId: string
  contactId: string | null
  contactName: string | null
  channel: string
  direction: string
  summary: string
  loggedBy: string
  occurredAt: Date | string
  createdAt: Date | string
  followUpDate: Date | null | string
  followUpDone: boolean
}

const CHANNELS = ['Email', 'Phone', 'VideoCall', 'InPerson', 'LinkedIn', 'WhatsApp', 'Other'] as const
const DIRECTIONS = ['Outbound', 'Inbound'] as const

const CHANNEL_ICONS: Record<string, string> = {
  Email: '📧',
  Phone: '📞',
  VideoCall: '📹',
  InPerson: '🤝',
  LinkedIn: '💼',
  WhatsApp: '💬',
  Other: '📝',
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function formatDateTime(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OutreachLogSection({
  workItemId,
  logs: initial,
}: {
  workItemId: string
  logs: OutreachLog[]
}) {
  const router = useRouter()
  const [logs, setLogs] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [markingDone, setMarkingDone] = useState<string | null>(null)

  const [channel, setChannel] = useState<string>('Email')
  const [direction, setDirection] = useState<string>('Outbound')
  const [summary, setSummary] = useState('')
  const [occurredAt, setOccurredAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [contactName, setContactName] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!summary.trim()) {
      setFormError('Summary is required')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/work-items/${workItemId}/outreach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          direction,
          summary: summary.trim(),
          occurredAt: new Date(occurredAt).toISOString(),
          contactName: contactName.trim() || undefined,
          followUpDate: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setFormError(data.error ?? `Error ${res.status}`)
        return
      }
      const newLog: OutreachLog = await res.json()
      setLogs((prev) => [newLog, ...prev])
      // Reset form
      setSummary('')
      setContactName('')
      setFollowUpDate('')
      setOccurredAt(new Date().toISOString().slice(0, 16))
      setShowForm(false)
      router.refresh()
    } catch {
      setFormError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  async function markFollowUpDone(logId: string) {
    setMarkingDone(logId)
    try {
      const res = await fetch(`/api/outreach/${logId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDone: true }),
      })
      if (res.ok) {
        setLogs((prev) => prev.map((l) => (l.id === logId ? { ...l, followUpDone: true } : l)))
        router.refresh()
      }
    } catch {
      // silent
    } finally {
      setMarkingDone(null)
    }
  }

  const sorted = [...logs].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  )

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Outreach Log
        </h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Log Outreach'}
        </button>
      </div>

      {/* Inline log form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Channel</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>
                    {CHANNEL_ICONS[c]} {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Direction</label>
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {DIRECTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Summary <span className="text-red-500">*</span>
            </label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={2}
              placeholder="What was discussed / agreed?"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Occurred At</label>
              <input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Optional"
                className="w-full border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Follow-up Date</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="border border-slate-300 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {formError && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-800 border border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-1.5 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Saving…' : 'Save Log'}
            </button>
          </div>
        </form>
      )}

      {/* Log entries */}
      {sorted.length === 0 ? (
        <p className="text-sm text-slate-400">No outreach logged yet.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((log) => (
            <div
              key={log.id}
              className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base leading-none" aria-label={log.channel}>
                      {CHANNEL_ICONS[log.channel] ?? '📝'}
                    </span>
                    <span className="text-xs font-bold text-slate-700">{log.channel}</span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        log.direction === 'Outbound'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}
                    >
                      {log.direction}
                    </span>
                    {log.contactName && (
                      <span className="text-xs text-slate-500">with {log.contactName}</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-800">{log.summary}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs text-slate-400">{formatDateTime(log.occurredAt)}</span>
                    <span className="text-xs text-slate-400">by {log.loggedBy}</span>
                    {log.followUpDate && (
                      <span
                        className={`text-xs font-medium ${
                          log.followUpDone
                            ? 'text-green-600 line-through'
                            : new Date(log.followUpDate) < new Date()
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        Follow-up: {formatDate(log.followUpDate)}
                      </span>
                    )}
                  </div>
                </div>
                {log.followUpDate && !log.followUpDone && (
                  <button
                    onClick={() => markFollowUpDone(log.id)}
                    disabled={markingDone === log.id}
                    className="shrink-0 text-xs font-semibold text-green-700 border border-green-300 hover:bg-green-50 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
                  >
                    {markingDone === log.id ? '…' : '✓ Done'}
                  </button>
                )}
                {log.followUpDone && (
                  <span className="shrink-0 text-xs text-green-600 font-semibold">✓ Done</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
