import { getDb } from '@/lib/db'
import { osAlerts } from '@/db/schema'
import { desc, sql, eq } from 'drizzle-orm'

function timeLabel(d: Date) {
  const diff = Date.now() - d.getTime()
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return 'Today'
  const days = Math.floor(diff / 86_400_000)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

const SEV: Record<string, { bg: string; border: string; dot: string; badge: string }> = {
  Critical: {
    bg: '#FEF2F2', border: '#FECACA', dot: '#EF4444',
    badge: 'bg-red-100 text-red-700',
  },
  Warning: {
    bg: '#FFFBEB', border: '#FDE68A', dot: '#F59E0B',
    badge: 'bg-amber-100 text-amber-700',
  },
  Info: {
    bg: '#EFF6FF', border: '#BFDBFE', dot: '#3B82F6',
    badge: 'bg-blue-100 text-blue-700',
  },
}

export const dynamic = 'force-dynamic'

export default async function AlertsPage() {
  const db = await getDb()

  const [alerts, agg] = await Promise.all([
    db
      .select()
      .from(osAlerts)
      .where(eq(osAlerts.isRead, false))
      .orderBy(desc(osAlerts.createdAt))
      .limit(30),
    db
      .select({
        critical: sql<number>`count(*) filter (where severity = 'Critical' and is_read = false)`,
        warning: sql<number>`count(*) filter (where severity = 'Warning' and is_read = false)`,
        info: sql<number>`count(*) filter (where severity = 'Info' and is_read = false)`,
      })
      .from(osAlerts),
  ])

  const s = agg[0] ?? { critical: 0, warning: 0, info: 0 }
  const total = Number(s.critical) + Number(s.warning) + Number(s.info)

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #FFB07A, #CC5500)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-500 text-sm">{total} unread</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Critical', value: String(s.critical), bg: '#FEF2F2', text: '#B91C1C' },
          { label: 'Warning', value: String(s.warning), bg: '#FFFBEB', text: '#B45309' },
          { label: 'Info', value: String(s.info), bg: '#EFF6FF', text: '#1D4ED8' },
        ].map((st) => (
          <div key={st.label} className="rounded-xl border p-4 text-center" style={{ background: st.bg }}>
            <div className="text-3xl font-bold" style={{ color: st.text }}>{st.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{st.label}</div>
          </div>
        ))}
      </div>

      {alerts.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-400 text-sm">
          No unread alerts
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const sev = SEV[a.severity] ?? SEV.Info
            return (
              <div
                key={a.id}
                className="flex items-start gap-3 p-4 rounded-xl border"
                style={{ background: sev.bg, borderColor: sev.border }}
              >
                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: sev.dot }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{a.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{timeLabel(new Date(a.createdAt))}</span>
                  </div>
                  {a.body && <p className="text-xs text-slate-600 mt-1 leading-relaxed">{a.body}</p>}
                  {a.source && <p className="text-xs text-slate-400 mt-1">Source: {a.source}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
