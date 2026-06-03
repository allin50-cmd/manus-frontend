'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Recipient {
  id: string
  name: string
  role: string
  email: string | null
}

interface Delivery {
  id: string
  recipientId: string
  channel: string
  status: string
  escalationLevel: number
  sentAt: Date | string | null
  acknowledgedAt: Date | string | null
  failedAt: Date | string | null
  failureReason: string | null
  createdAt: Date | string
  recipient: Recipient
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-slate-100 text-slate-600',
  Sent: 'bg-blue-100 text-blue-700',
  Failed: 'bg-red-100 text-red-700',
  Acknowledged: 'bg-green-100 text-green-700',
  Escalated: 'bg-orange-100 text-orange-700',
  Suppressed: 'bg-slate-100 text-slate-500',
}

export default function AlertDeliveriesSection({
  workItemId,
  deliveries: initial,
}: {
  workItemId: string
  deliveries: Delivery[]
}) {
  const router = useRouter()
  const [deliveries, setDeliveries] = useState(initial)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function acknowledge(deliveryId: string) {
    setBusy(deliveryId)
    setActionError(null)
    try {
      const res = await fetch(`/api/alert-deliveries/${deliveryId}/acknowledge`, {
        method: 'POST',
      })
      if (res.ok) {
        setDeliveries((d) =>
          d.map((x) =>
            x.id === deliveryId
              ? { ...x, status: 'Acknowledged', acknowledgedAt: new Date().toISOString() }
              : x,
          ),
        )
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setActionError(data.error ?? `Failed to acknowledge (${res.status})`)
      }
    } catch {
      setActionError('Network error — please try again')
    } finally {
      setBusy(null)
    }
  }

  async function retry(deliveryId: string) {
    setBusy(deliveryId)
    setActionError(null)
    try {
      const res = await fetch(`/api/alert-deliveries/${deliveryId}/retry`, { method: 'POST' })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json().catch(() => ({}))
        setActionError(data.error ?? `Retry failed (${res.status})`)
      }
    } catch {
      setActionError('Network error — please try again')
    } finally {
      setBusy(null)
    }
  }

  if (deliveries.length === 0) {
    return (
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">
          Alert Deliveries
        </h2>
        <p className="text-sm text-slate-400">
          No recipients configured for this company.{' '}
          <a href="/alert-recipients" className="text-blue-600 hover:underline">
            Add recipients →
          </a>
        </p>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Alert Deliveries
        </h2>
        <a href="/alert-recipients" className="text-xs text-blue-600 hover:underline">
          Manage recipients →
        </a>
      </div>
      {actionError && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-2">
          {actionError}
        </p>
      )}
      <div className="space-y-2">
        {deliveries.map((d) => (
          <div
            key={d.id}
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900">{d.recipient.name}</span>
                  <span className="text-xs text-slate-500">{d.recipient.role}</span>
                  <span className="text-xs text-slate-400">L{d.escalationLevel}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Channel: {d.channel}
                  {d.recipient.email && ` · ${d.recipient.email}`}
                </p>
                {d.acknowledgedAt && (
                  <p className="text-xs text-green-600 mt-0.5">
                    Acknowledged {new Date(d.acknowledgedAt as string).toLocaleString('en-GB')}
                  </p>
                )}
                {d.failureReason && (
                  <p className="text-xs text-red-600 mt-0.5">{d.failureReason}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${STATUS_COLORS[d.status] ?? 'bg-slate-100 text-slate-600'}`}
                >
                  {d.status}
                </span>
                {d.status === 'Sent' && (
                  <button
                    onClick={() => acknowledge(d.id)}
                    disabled={busy === d.id}
                    className="text-xs font-semibold text-green-700 border border-green-300 hover:bg-green-50 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
                  >
                    {busy === d.id ? '…' : '✓ Acknowledge'}
                  </button>
                )}
                {d.status === 'Failed' && (
                  <button
                    onClick={() => retry(d.id)}
                    disabled={busy === d.id}
                    className="text-xs font-semibold text-orange-700 border border-orange-300 hover:bg-orange-50 rounded px-2 py-0.5 transition-colors disabled:opacity-50"
                  >
                    {busy === d.id ? '…' : '↩ Retry'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
