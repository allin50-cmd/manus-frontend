import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import { formatUKDateTime } from '@/lib/utils'

export const dynamic = 'force-dynamic'

const EVENT_COLORS: Record<string, string> = {
  RecipientSelected:         'bg-blue-100 text-blue-700',
  RecipientSuppressed:       'bg-orange-100 text-orange-700',
  DeliveryCreated:           'bg-slate-100 text-slate-600',
  DeliverySent:              'bg-blue-100 text-blue-700',
  DeliveryFailed:            'bg-red-100 text-red-700',
  AlertAcknowledged:         'bg-green-100 text-green-700',
  EscalationTriggered:       'bg-purple-100 text-purple-700',
  EscalationDeliveryCreated: 'bg-purple-100 text-purple-700',
}

const EVENT_LABELS: Record<string, string> = {
  RecipientSelected:         'Recipient selected',
  RecipientSuppressed:       'Recipient suppressed',
  DeliveryCreated:           'Delivery created',
  DeliverySent:              'Delivery sent',
  DeliveryFailed:            'Delivery failed',
  AlertAcknowledged:         'Alert acknowledged',
  EscalationTriggered:       'Escalation triggered',
  EscalationDeliveryCreated: 'Escalation delivery created',
}

function parsePayload(raw: string | null): string {
  if (!raw) return ''
  try {
    const obj = JSON.parse(raw)
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ')
  } catch {
    return raw
  }
}

export default async function AlertEventsPage() {
  await requireAuth()

  const events = await db.alertEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: {
      workItem: { select: { id: true, title: true, company: true } },
      recipient: { select: { id: true, name: true, company: true } },
      delivery: { select: { id: true, channel: true, status: true } },
    },
  })

  const totalEvents = await db.alertEvent.count()

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Alert Audit Log</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Every routing decision, delivery, and acknowledgement — {totalEvents} events total
          </p>
        </div>
        <Link
          href="/alert-recipients"
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5"
        >
          Manage recipients →
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-14 text-slate-400 text-sm">
          No alert events yet. Create a ComplianceAlert work item to trigger the first dispatch.
        </div>
      ) : (
        <div className="space-y-1">
          {events.map((event) => {
            const payload = parsePayload(event.payload)
            const color = EVENT_COLORS[event.eventType] ?? 'bg-slate-100 text-slate-600'
            const label = EVENT_LABELS[event.eventType] ?? event.eventType

            return (
              <div
                key={event.id}
                className="flex gap-3 py-3 border-b border-slate-100 last:border-0"
              >
                <div className="w-32 shrink-0 pt-0.5">
                  <p className="text-xs text-slate-400 leading-tight">
                    {formatUKDateTime(event.createdAt)}
                  </p>
                </div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${color}`}>
                      {label}
                    </span>
                    <span className="text-xs text-slate-500">
                      {event.actorType}
                      {event.actorId && event.actorId !== 'System'
                        ? ` · ${event.actorId}`
                        : ''}
                    </span>
                  </div>

                  {event.workItem && (
                    <p className="text-xs text-slate-700">
                      <Link
                        href={`/work-items/${event.workItem.id}`}
                        className="font-medium text-blue-700 hover:underline"
                      >
                        {event.workItem.title}
                      </Link>
                      {event.workItem.company && (
                        <span className="text-slate-500"> · {event.workItem.company}</span>
                      )}
                    </p>
                  )}

                  {event.recipient && (
                    <p className="text-xs text-slate-600">
                      Recipient: <span className="font-medium">{event.recipient.name}</span>
                      <span className="text-slate-400"> ({event.recipient.company})</span>
                    </p>
                  )}

                  {event.delivery && (
                    <p className="text-xs text-slate-500">
                      Delivery: {event.delivery.channel} ·{' '}
                      <span
                        className={
                          event.delivery.status === 'Acknowledged'
                            ? 'text-green-600 font-medium'
                            : event.delivery.status === 'Failed'
                              ? 'text-red-600 font-medium'
                              : 'text-slate-500'
                        }
                      >
                        {event.delivery.status}
                      </span>
                    </p>
                  )}

                  {payload && (
                    <p className="text-xs text-slate-400 font-mono">{payload}</p>
                  )}
                </div>
              </div>
            )
          })}
          {totalEvents > 200 && (
            <p className="text-xs text-slate-400 text-center pt-4">
              Showing most recent 200 of {totalEvents} events
            </p>
          )}
        </div>
      )}
    </div>
  )
}
