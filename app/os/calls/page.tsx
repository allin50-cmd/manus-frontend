import { getDb } from '@/lib/db'
import { osCallLogs } from '@/db/schema'
import { desc, sql, gte } from 'drizzle-orm'

function dur(secs: number) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}m ${s}s`
}

function timeLabel(d: Date) {
  const diff = Date.now() - d.getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) {
    const h = d.getHours(), m = d.getMinutes()
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }
  const diff_d = Math.floor(diff / 86_400_000)
  return `${diff_d}d ago`
}

export const dynamic = 'force-dynamic'

export default async function CallsPage() {
  const db = await getDb()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const [recent, stats] = await Promise.all([
    db.select().from(osCallLogs).orderBy(desc(osCallLogs.calledAt)).limit(25),
    db
      .select({
        todayCount: sql<number>`count(*) filter (where called_at >= ${todayStart.toISOString()})`,
        missedToday: sql<number>`count(*) filter (where called_at >= ${todayStart.toISOString()} and outcome = 'Missed')`,
        totalMissed: sql<number>`count(*) filter (where outcome = 'Missed')`,
      })
      .from(osCallLogs),
  ])

  const s = stats[0] ?? { todayCount: 0, missedToday: 0, totalMissed: 0 }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #4CE890, #16954A)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 011 1.18a2 2 0 012-2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 8a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Calls</h1>
          <p className="text-slate-500 text-sm">Today · Missed · Log</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Today', value: String(s.todayCount) },
          { label: 'Missed Today', value: String(s.missedToday), urgent: Number(s.missedToday) > 0 },
          { label: 'Total Missed', value: String(s.totalMissed) },
        ].map((st) => (
          <div key={st.label} className="bg-white rounded-xl border border-slate-100 p-4 text-center">
            <div className={`text-3xl font-bold ${st.urgent ? 'text-red-600' : 'text-slate-800'}`}>{st.value}</div>
            <div className="text-xs text-slate-500 mt-1">{st.label}</div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Recent Calls</h2>
        {recent.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
            No calls logged yet
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      c.outcome === 'Missed' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {c.direction === 'Inbound' ? '↙' : '↗'}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-sm">{c.callerName}</div>
                    <div className="text-xs text-slate-400">{c.callerPhone ?? '—'}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-medium ${c.outcome === 'Missed' ? 'text-red-500' : 'text-slate-500'}`}>
                    {c.outcome}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {dur(c.durationSeconds ?? 0)} · {timeLabel(new Date(c.calledAt))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
