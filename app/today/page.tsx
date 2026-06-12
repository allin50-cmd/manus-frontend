import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { formatUKDate } from '../../lib/utils'
import Link from 'next/link'
import StatusBadge from '../../components/StatusBadge'
import CompleteActionButton from '../../components/CompleteActionButton'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
  await requireAuth()

  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  let rows
  try {
    rows = await Promise.all([
      db.workItem.findMany({
        where: {
          dueDate: { lt: startOfToday },
          status: { notIn: ['Completed', 'Archived', 'NotFit'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      db.workItem.findMany({
        where: {
          dueDate: { gte: startOfToday, lte: endOfToday },
          status: { notIn: ['Completed', 'Archived', 'NotFit'] },
        },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      db.action.findMany({
        where: {
          dueDate: { lt: startOfToday },
          status: 'Open',
        },
        include: { workItem: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
      db.action.findMany({
        where: {
          dueDate: { gte: startOfToday, lte: endOfToday },
          status: 'Open',
        },
        include: { workItem: { select: { id: true, title: true } } },
        orderBy: { dueDate: 'asc' },
        take: 100,
      }),
    ])
  } catch {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Today&apos;s Actions</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load today&apos;s data. Please refresh the page.
        </div>
      </div>
    )
  }

  const [overdueItems, dueTodayItems, overdueActions, dueTodayActions] = rows

  const allClear = overdueItems.length === 0 && dueTodayItems.length === 0 && overdueActions.length === 0 && dueTodayActions.length === 0

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Today's Actions</h1>

      {allClear && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-800 font-semibold">All clear for today</p>
          <p className="text-sm text-green-600">Nothing overdue or due today. Keep it moving.</p>
        </div>
      )}

      {overdueItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">
              Overdue ({overdueItems.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdueItems.map((item) => (
              <Link
                key={item.id}
                href={`/work-items/${item.id}`}
                className="block bg-red-50 rounded-xl border border-red-200 px-4 py-3 hover:border-red-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.company && `${item.company} · `}Owner: {item.owner}
                    </p>
                    {item.nextAction && (
                      <div className="flex items-center gap-2 mt-1.5 border-l-2 border-blue-400 bg-white rounded-r pl-2 pr-3 py-1">
                        <span className="text-xs font-medium text-blue-800 flex-1">{item.nextAction}</span>
                        <span className="text-blue-400 text-sm">→</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={item.status} />
                    <span className="text-xs font-semibold text-red-600">{formatUKDate(item.dueDate)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {dueTodayItems.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
            <h2 className="text-sm font-semibold text-orange-700 uppercase tracking-wide">
              Due Today ({dueTodayItems.length})
            </h2>
          </div>
          <div className="space-y-2">
            {dueTodayItems.map((item) => (
              <Link
                key={item.id}
                href={`/work-items/${item.id}`}
                className="block bg-orange-50 rounded-xl border border-orange-200 px-4 py-3 hover:border-orange-400 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.company && `${item.company} · `}Owner: {item.owner}
                    </p>
                    {item.nextAction && (
                      <div className="flex items-center gap-2 mt-1.5 border-l-2 border-blue-400 bg-white rounded-r pl-2 pr-3 py-1">
                        <span className="text-xs font-medium text-blue-800 flex-1">{item.nextAction}</span>
                        <span className="text-blue-400 text-sm">→</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <StatusBadge status={item.status} />
                    <span className="text-xs font-semibold text-orange-600">Today</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {(overdueActions.length > 0 || dueTodayActions.length > 0) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Actions Due ({overdueActions.length + dueTodayActions.length})
            </h2>
          </div>
          <div className="space-y-2">
            {overdueActions.map((action) => (
              <div key={action.id} className="bg-yellow-50 rounded-xl border border-yellow-200 px-4 py-3 space-y-2">
                <p className="font-medium text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-600">On: {action.workItem.title}</p>
                {action.assignedTo && <p className="text-xs text-slate-500">Assigned: {action.assignedTo}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-semibold text-red-600">Overdue: {formatUKDate(action.dueDate)}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/work-items/${action.workItem.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Open work item →
                    </Link>
                    <CompleteActionButton workItemId={action.workItem.id} actionId={action.id} />
                  </div>
                </div>
              </div>
            ))}
            {dueTodayActions.map((action) => (
              <div key={action.id} className="bg-yellow-50 rounded-xl border border-yellow-200 px-4 py-3 space-y-2">
                <p className="font-medium text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-600">On: {action.workItem.title}</p>
                {action.assignedTo && <p className="text-xs text-slate-500">Assigned: {action.assignedTo}</p>}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs font-semibold text-orange-600">Due: Today</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link href={`/work-items/${action.workItem.id}`} className="text-xs font-medium text-blue-600 hover:underline">
                      Open work item →
                    </Link>
                    <CompleteActionButton workItemId={action.workItem.id} actionId={action.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
