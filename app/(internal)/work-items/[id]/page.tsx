import { requireAuth } from '@/lib/auth'
import { getDb, workItems, actions, activityLogs, decisions } from '@/lib/db'
import { formatUKDate, statusLabel, typeLabel } from '@/lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '@/components/StatusBadge'
import WorkItemActions from '@/components/WorkItemActions'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function WorkItemDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth()

  const db = await getDb()

  const rows = await db.select().from(workItems).where(eq(workItems.id, params.id)).limit(1)
  const item = rows[0]
  if (!item) notFound()

  const [itemActions, itemLogs, itemDecisions] = await Promise.all([
    db.select().from(actions).where(eq(actions.workItemId, params.id)).orderBy(desc(actions.createdAt)).limit(20),
    db.select().from(activityLogs).where(eq(activityLogs.workItemId, params.id)).orderBy(desc(activityLogs.createdAt)).limit(30),
    db.select().from(decisions).where(eq(decisions.workItemId, params.id)).orderBy(desc(decisions.createdAt)).limit(10),
  ])

  const priorityColors: Record<string, string> = {
    Low: 'text-slate-600',
    Medium: 'text-blue-700',
    High: 'text-orange-700',
    Urgent: 'text-red-700 font-bold',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <Link href="/work-items" className="text-slate-400 hover:text-slate-600 mt-1 shrink-0">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">{typeLabel(item.type)}</span>
            <StatusBadge status={item.status} />
            <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>{item.priority}</span>
            {item.decisionNeeded && (
              <span className="text-xs bg-red-100 text-red-700 font-medium rounded px-2 py-0.5">Decision needed</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 break-words">{item.title}</h1>
        </div>
      </div>

      {/* Detail grid */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {[
          { label: 'Company', value: item.company },
          { label: 'Contact', value: item.contactName },
          { label: 'Owner', value: item.owner },
          { label: 'Status', value: statusLabel(item.status) },
          { label: 'Priority', value: item.priority },
          { label: 'Next Action', value: item.nextAction },
          { label: 'Due Date', value: formatUKDate(item.dueDate) },
          { label: 'Created', value: formatUKDate(item.createdAt) },
          { label: 'Updated', value: formatUKDate(item.updatedAt) },
        ].map(({ label, value }) => value ? (
          <div key={label} className="flex gap-3 px-4 py-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-slate-900 flex-1">{value}</span>
          </div>
        ) : null)}
        {item.notes && (
          <div className="px-4 py-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Notes</span>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <WorkItemActions
        workItemId={item.id}
        currentStatus={item.status}
        person={session.person}
      />

      {/* Open actions */}
      {itemActions.filter((a) => a.status === 'Open').length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Open Actions</h2>
          <div className="space-y-2">
            {itemActions.filter((a) => a.status === 'Open').map((action) => (
              <div key={action.id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{action.label}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {action.assignedTo && `Assigned: ${action.assignedTo} · `}
                  {action.dueDate && `Due: ${formatUKDate(action.dueDate)}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open decisions */}
      {itemDecisions.filter((d) => d.status === 'Open').length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Open Decisions</h2>
          <div className="space-y-2">
            {itemDecisions.filter((d) => d.status === 'Open').map((dec) => (
              <div key={dec.id} className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{dec.question}</p>
                {dec.recommendation && <p className="text-xs text-slate-600 mt-1">Recommendation: {dec.recommendation}</p>}
                <p className="text-xs text-purple-700 mt-1">Awaiting: {dec.decisionBy}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity log */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Activity Log</h2>
        <div className="space-y-1">
          {itemLogs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 pt-0.5">{formatUKDate(log.createdAt)}</span>
              <div>
                <span className="text-xs font-medium text-slate-600">{log.person}</span>
                {' · '}
                <span className="text-xs text-slate-500">{log.eventType.replace(/([A-Z])/g, ' $1').trim()}</span>
                <p className="text-sm text-slate-800">{log.summary}</p>
                {log.oldStatus && log.newStatus && (
                  <p className="text-xs text-slate-500">
                    {statusLabel(log.oldStatus)} → {statusLabel(log.newStatus)}
                  </p>
                )}
              </div>
            </div>
          ))}
          {itemLogs.length === 0 && (
            <p className="text-sm text-slate-400">No activity yet</p>
          )}
        </div>
      </section>
    </div>
  )
}
