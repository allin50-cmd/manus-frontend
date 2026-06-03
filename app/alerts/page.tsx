import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_COLORS: Record<string, string> = {
  Sent: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Acknowledged: 'bg-green-100 text-green-700',
  Failed: 'bg-red-100 text-red-700',
  Escalated: 'bg-orange-100 text-orange-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-slate-100 text-slate-600',
}

export default async function AlertsPage() {
  await requireAuth()

  const [items, deliverySummary, total, pending, allAcked] = await Promise.all([
    db.workItem.findMany({
      where: { type: 'ComplianceAlert' },
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        alertDeliveries: {
          orderBy: { createdAt: 'desc' },
          include: { recipient: { select: { name: true, role: true } } },
        },
      },
    }),
    db.alertDelivery.groupBy({
      by: ['status'],
      _count: { id: true },
    }),
    db.workItem.count({ where: { type: 'ComplianceAlert' } }),
    db.workItem.count({
      where: {
        type: 'ComplianceAlert',
        alertDeliveries: { some: { status: { in: ['Sent', 'Pending'] } } },
      },
    }),
    db.workItem.count({
      where: {
        type: 'ComplianceAlert',
        alertDeliveries: { some: { status: 'Acknowledged' } },
        NOT: { alertDeliveries: { some: { status: { in: ['Sent', 'Pending'] } } } },
      },
    }),
  ])

  const byStatus = Object.fromEntries(deliverySummary.map((r) => [r.status, r._count.id]))

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Compliance Alerts</h1>
          <p className="text-sm text-slate-500 mt-0.5">All compliance alert work items and their delivery status</p>
        </div>
        <Link
          href="/alerts/new"
          className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Alert
        </Link>
      </div>

      {/* Summary cards */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[100px]">
          <div className="text-2xl font-bold text-slate-900">{total}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total alerts</div>
        </div>
        <div className={`border rounded-xl px-4 py-3 flex-1 min-w-[100px] ${pending > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-2xl font-bold ${pending > 0 ? 'text-orange-700' : 'text-slate-900'}`}>{pending}</div>
          <div className="text-xs text-slate-500 mt-0.5">Awaiting ack</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex-1 min-w-[100px]">
          <div className="text-2xl font-bold text-green-700">{allAcked}</div>
          <div className="text-xs text-slate-500 mt-0.5">Acknowledged</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[100px]">
          <div className="text-2xl font-bold text-slate-900">{byStatus['Failed'] ?? 0}</div>
          <div className="text-xs text-slate-500 mt-0.5">Failed deliveries</div>
        </div>
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-slate-400 text-sm">
          No compliance alerts yet.{' '}
          <Link href="/alerts/new" className="text-blue-600 hover:underline">
            Create the first one
          </Link>
          .
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => {
          const latestDelivery = item.alertDeliveries[0]
          const deliveryCount = item.alertDeliveries.length
          const hasUnacked = item.alertDeliveries.some(
            (d) => d.status === 'Sent' || d.status === 'Pending',
          )

          return (
            <Link
              key={item.id}
              href={`/work-items/${item.id}`}
              className={`block bg-white border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow ${
                hasUnacked ? 'border-orange-200' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{item.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${PRIORITY_COLORS[item.priority] ?? 'bg-slate-100 text-slate-600'}`}>
                      {item.priority}
                    </span>
                    {hasUnacked && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded px-2 py-0.5 font-medium">
                        Awaiting ack
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {item.company && <span className="font-medium text-slate-700">{item.company}</span>}
                    {item.dueDate && (
                      <span className="ml-2">
                        Due{' '}
                        {new Date(item.dueDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </p>
                  {deliveryCount > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-1.5">
                      {item.alertDeliveries.slice(0, 5).map((d) => (
                        <span
                          key={d.id}
                          className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[d.status] ?? 'bg-slate-100 text-slate-600'}`}
                          title={d.recipient?.name ?? ''}
                        >
                          {d.status}
                          {d.recipient?.name ? ` · ${d.recipient.name}` : ''}
                        </span>
                      ))}
                      {deliveryCount > 5 && (
                        <span className="text-xs text-slate-400">+{deliveryCount - 5} more</span>
                      )}
                    </div>
                  )}
                  {deliveryCount === 0 && (
                    <p className="text-xs text-slate-400 mt-1">No deliveries</p>
                  )}
                </div>
                <div className="text-xs text-slate-400 shrink-0">
                  {new Date(item.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                  })}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
