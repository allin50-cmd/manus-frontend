import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { formatUKDate } from '../../lib/utils'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  await requireAuth()

  let logs: Awaited<ReturnType<typeof db.activityLog.findMany<{ include: { workItem: { select: { id: true; title: true } } } }>>> = []
  try {
    logs = await db.activityLog.findMany({
      include: { workItem: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
  } catch {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-sm text-red-700">
          Could not load activity log. Please refresh the page.
        </div>
      </div>
    )
  }

  const eventBadge: Record<string, string> = {
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

  const dotColor: Record<string, string> = {
    Created: 'bg-blue-500',
    NoteAdded: 'bg-slate-400',
    StatusChanged: 'bg-yellow-500',
    ActionCreated: 'bg-orange-400',
    ActionCompleted: 'bg-green-500',
    DecisionRequested: 'bg-purple-500',
    DecisionMade: 'bg-purple-500',
    FollowUpSet: 'bg-cyan-500',
    Archived: 'bg-slate-400',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
      <p className="text-xs text-slate-500">Append-only · last 100 events</p>

      <div className="space-y-0">
        {logs.map((log, i) => (
          <div key={log.id} className="relative pl-7 pb-4">
            {i < logs.length - 1 && (
              <div className="absolute left-[9px] top-5 bottom-0 w-px bg-slate-200" />
            )}
            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white shadow-sm ${dotColor[log.eventType] ?? 'bg-slate-400'}`} />
            <div className="space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                {log.workItem && (
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[200px]">
                    {log.workItem.title}
                  </span>
                )}
                <span className={`text-xs font-medium rounded px-1.5 py-0.5 ${eventBadge[log.eventType] ?? 'bg-slate-100 text-slate-600'}`}>
                  {log.eventType.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
              <p className="text-sm text-slate-800">{log.summary}</p>
              {log.oldStatus && log.newStatus && (
                <p className="text-xs text-slate-500">{log.oldStatus} → {log.newStatus}</p>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-slate-400">{log.person} · {formatUKDate(log.createdAt)}</p>
                {log.workItem && (
                  <Link
                    href={`/work-items/${log.workItem.id}`}
                    className="text-xs font-medium text-blue-600 hover:underline shrink-0"
                  >
                    Open work item →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-sm text-slate-400 py-8 text-center">No activity yet</p>
        )}
      </div>
    </div>
  )
}
