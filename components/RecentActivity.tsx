import { getDb, activityLogs, workItems } from '@/lib/db'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

interface RecentActivityProps {
  companyId: string
  companyName: string
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

function groupByDate(activities: any[]): Record<string, any[]> {
  const groups: Record<string, any[]> = {}

  activities.forEach((activity) => {
    const date = new Date(activity.createdAt)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    let dateKey: string
    if (date.toDateString() === today.toDateString()) {
      dateKey = 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday'
    } else {
      dateKey = date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })
    }

    if (!groups[dateKey]) {
      groups[dateKey] = []
    }
    groups[dateKey].push(activity)
  })

  return groups
}

export default async function RecentActivity({ companyId, companyName }: RecentActivityProps) {
  try {
    const db = await getDb()

    // For FineGuard, filter by company name
    // For other companies, we don't have direct activity logs yet
    if (companyId !== 'fineguard') {
      return null
    }

    const recentActivities = await db
      .select({
        id: activityLogs.id,
        person: activityLogs.person,
        eventType: activityLogs.eventType,
        summary: activityLogs.summary,
        createdAt: activityLogs.createdAt,
        workItemId: activityLogs.workItemId,
        workItemTitle: workItems.title,
      })
      .from(activityLogs)
      .innerJoin(workItems, eq(activityLogs.workItemId, workItems.id))
      .where(eq(workItems.company, companyName))
      .orderBy(activityLogs.createdAt)
      .limit(20)

    if (recentActivities.length === 0) {
      return null
    }

    const grouped = groupByDate(recentActivities)

    return (
      <section>
        <p
          className="text-[10px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        >
          Recent Activity
        </p>
        <div className="space-y-4">
          {Object.entries(grouped).map(([dateLabel, activities]) => (
            <div key={dateLabel}>
              <p className="text-xs font-semibold mb-2" style={{ color: 'rgba(255,255,255,0.32)' }}>
                {dateLabel}
              </p>
              <div className="space-y-2">
                {activities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/os/work-items/${activity.workItemId}`}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div className="w-5 h-5 rounded-full mt-0.5 shrink-0" style={{ background: 'rgba(122,90,248,0.3)' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.88)' }}>
                        <span className="font-medium">{activity.person}</span>{' '}
                        <span style={{ color: 'rgba(255,255,255,0.6)' }}>
                          {activity.eventType === 'Created' && 'created'}
                          {activity.eventType === 'Updated' && 'updated'}
                          {activity.eventType === 'Completed' && 'marked complete'}
                          {activity.eventType === 'Reopened' && 'reopened'}
                        </span>{' '}
                        <span style={{ color: 'rgba(255,255,255,0.5)' }} className="truncate inline-block">
                          "{activity.workItemTitle}"
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {formatTimeAgo(new Date(activity.createdAt))}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Link
          href={`/os/workspace/${companyId}/activity`}
          className="mt-4 text-xs font-medium"
          style={{ color: 'rgba(255,255,255,0.4)' }}
        >
          View all activity →
        </Link>
      </section>
    )
  } catch (err) {
    console.error('Error fetching recent activity:', err)
    return null
  }
}
