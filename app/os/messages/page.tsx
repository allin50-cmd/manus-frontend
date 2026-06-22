import { getDb } from '@/lib/db'
import { osMessageThreads } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

function timeLabel(d: Date) {
  const diff = Date.now() - d.getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) {
    const h = d.getHours(), m = d.getMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const diff_d = Math.floor(diff / 86_400_000)
  if (diff_d === 1) return 'Yesterday'
  return `${diff_d}d ago`
}

export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const db = await getDb()

  const [threads, agg] = await Promise.all([
    db.select().from(osMessageThreads).orderBy(desc(osMessageThreads.lastMessageAt)).limit(30),
    db
      .select({
        totalUnread: sql<number>`coalesce(sum(unread_count), 0)`,
        threadCount: sql<number>`count(*)`,
      })
      .from(osMessageThreads),
  ])

  const s = agg[0] ?? { totalUnread: 0, threadCount: 0 }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #60C8FF, #0070CC)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          <p className="text-slate-500 text-sm">
            {Number(s.threadCount)} threads · {Number(s.totalUnread)} unread
          </p>
        </div>
      </div>

      {threads.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          No messages yet
        </div>
      ) : (
        <div className="space-y-2">
          {threads.map((t) => {
            const participants = (t.participantNames as string[]) ?? []
            const initials = participants[0]?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-slate-200 transition"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold truncate ${t.unreadCount > 0 ? 'text-slate-900' : 'text-slate-600'}`}>
                      {t.subject}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0 ml-2">{timeLabel(new Date(t.lastMessageAt))}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {participants.join(', ') || 'No participants'}
                  </div>
                </div>
                {t.unreadCount > 0 && (
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {t.unreadCount}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
