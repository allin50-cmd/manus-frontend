import { requireAuth } from '@/lib/auth'
import { getDb, workItems, actions } from '@/lib/db'
import { formatUKDate, statusLabel, typeLabel } from '@/lib/utils'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import { eq, lte, notInArray, asc, and } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function TodayPage() {
  await requireAuth()

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const db = await getDb()

  const [overdueItems, overdueActionRows] = await Promise.all([
    db.select().from(workItems).where(
      and(
        lte(workItems.dueDate, endOfToday),
        notInArray(workItems.status, ['Completed', 'Archived', 'NotFit'])
      )
    ).orderBy(asc(workItems.dueDate)),
    db
      .select({
        id: actions.id,
        workItemId: actions.workItemId,
        actionType: actions.actionType,
        label: actions.label,
        status: actions.status,
        assignedTo: actions.assignedTo,
        dueDate: actions.dueDate,
        result: actions.result,
        createdAt: actions.createdAt,
        completedAt: actions.completedAt,
        workItemTitle: workItems.title,
      })
      .from(actions)
      .innerJoin(workItems, eq(actions.workItemId, workItems.id))
      .where(
        and(
          lte(actions.dueDate, endOfToday),
          eq(actions.status, 'Open')
        )
      )
      .orderBy(asc(actions.dueDate)),
  ])

  const overdueActions = overdueActionRows.map((row) => ({
    ...row,
    workItem: { id: row.workItemId, title: row.workItemTitle },
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Today's Actions</h1>

      {overdueItems.length === 0 && overdueActions.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-semibold">All clear — nothing overdue today.</p>
        </div>
      )}

      {overdueItems.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Work Items Due / Overdue ({overdueItems.length})
          </h2>
          <div className="space-y-2">
            {overdueItems.map((item) => {
              const overdue = item.dueDate && new Date(item.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
              return (
                <Link
                  key={item.id}
                  href={`/os/work-items/${item.id}`}
                  className="block bg-white rounded-xl border border-slate-200 hover:border-blue-300 px-4 py-3 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {item.company && `${item.company} · `}Owner: {item.owner}
                      </p>
                      {item.nextAction && (
                        <p className="text-xs text-blue-700 mt-1 font-medium">→ {item.nextAction}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={item.status} />
                      <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-orange-600'}`}>
                        {overdue ? `Overdue: ${formatUKDate(item.dueDate)}` : `Due: ${formatUKDate(item.dueDate)}`}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {overdueActions.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
            Actions Due / Overdue ({overdueActions.length})
          </h2>
          <div className="space-y-2">
            {overdueActions.map((action) => {
              const overdue = action.dueDate && new Date(action.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
              return (
                <Link
                  key={action.id}
                  href={`/os/work-items/${action.workItem.id}`}
                  className="block bg-yellow-50 rounded-xl border border-yellow-200 px-4 py-3 hover:border-yellow-400 transition-colors"
                >
                  <p className="font-medium text-slate-900">{action.label}</p>
                  <p className="text-xs text-slate-600 mt-0.5">On: {action.workItem.title}</p>
                  {action.assignedTo && <p className="text-xs text-slate-500">Assigned: {action.assignedTo}</p>}
                  <span className={`text-xs font-medium ${overdue ? 'text-red-600' : 'text-orange-600'}`}>
                    {overdue ? `Overdue: ${formatUKDate(action.dueDate)}` : `Due: ${formatUKDate(action.dueDate)}`}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
