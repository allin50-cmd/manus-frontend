import { requireAuth } from '@/lib/auth'
import { getDb, activityLogs, workItems } from '@/lib/db'
import { formatUKDate } from '@/lib/utils'
import Link from 'next/link'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  await requireAuth()

  const db = await getDb()

  const rows = await db
    .select({
      id: activityLogs.id,
      workItemId: activityLogs.workItemId,
      actionId: activityLogs.actionId,
      person: activityLogs.person,
      eventType: activityLogs.eventType,
      summary: activityLogs.summary,
      oldStatus: activityLogs.oldStatus,
      newStatus: activityLogs.newStatus,
      evidenceLink: activityLogs.evidenceLink,
      createdAt: activityLogs.createdAt,
      workItemTitle: workItems.title,
    })
    .from(activityLogs)
    .innerJoin(workItems, eq(activityLogs.workItemId, workItems.id))
    .orderBy(desc(activityLogs.createdAt))
    .limit(100)

  const logs = rows.map((row) => ({
    ...row,
    workItem: { id: row.workItemId, title: row.workItemTitle },
  }))

  const eventColors: Record<string, string> = {
    Created: 'bg-blue-100 text-blue-700',
    NoteAdded: 'bg-slate-100 text-slate-700',
    StatusChanged: 'bg-yellow-100 text-yellow-800',
    ActionCreated: 'bg-orange-100 text-orange-700',
    ActionCompleted: 'bg-green-100 text-green-700',
    DecisionRequested: 'bg-purple-100 text-purple-700',
    DecisionMade: 'bg-purple-100 text-purple-700',
    FollowUpSet: 'bg-cyan-100 text-cyan-700',
    Archived: 'bg-slate-100 text-slate-600',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
      <p className="text-xs text-slate-500">Append-only. Showing last 100 events.</p>

      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
        {logs.map((log) => (
          <div key={log.id} className="px-4 py-3 flex gap-3">
            <div className="shrink-0 text-right w-20">
              <span className="text-xs text-slate-400">{formatUKDate(log.createdAt)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <Link href={`/work-items/${log.workItem.id}`} className="text-xs font-medium text-blue-600 hover:underline truncate max-w-[200px]">
                  {log.workItem.title}
                </Link>
                <span className={`text-xs font-medium rounded px-2 py-0.5 ${eventColors[log.eventType] ?? 'bg-slate-100 text-slate-600'}`}>
                  {log.eventType.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <p className="text-sm text-slate-800">{log.summary}</p>
              {log.oldStatus && log.newStatus && (
                <p className="text-xs text-slate-400 mt-0.5">{log.oldStatus} → {log.newStatus}</p>
              )}
              <p className="text-xs text-slate-400 mt-0.5">by {log.person}</p>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <div className="p-8 text-center text-slate-400">No activity yet</div>
        )}
      </div>
    </div>
  )
}
