import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import ActivityClient, { type ActivityLogClient } from './ActivityClient'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  await requireAuth()

  let logs: ActivityLogClient[] = []
  try {
    const raw = await db.activityLog.findMany({
      include: { workItem: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    logs = raw.map((log) => ({
      id: log.id,
      workItemId: log.workItemId,
      person: log.person,
      eventType: log.eventType,
      summary: log.summary,
      oldStatus: log.oldStatus ?? null,
      newStatus: log.newStatus ?? null,
      createdAt: log.createdAt.toISOString(),
      workItem: log.workItem
        ? { id: log.workItem.id, title: log.workItem.title ?? '' }
        : null,
    }))
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
        <p className="text-xs text-slate-500 mt-0.5">Append-only · last 500 events</p>
      </div>
      <ActivityClient logs={logs} />
    </div>
  )
}
