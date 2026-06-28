import { getDb } from '@/lib/db'
import { osCallLogs } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'
import Link from 'next/link'

function fmtDur(s: number) {
  if (!s) return '—'
  const m = Math.floor(s / 60), sec = s % 60
  return m ? `${m}m ${String(sec).padStart(2, '0')}s` : `${sec}s`
}

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

function outcomeBadge(outcome: string): { bg: string; color: string } {
  if (outcome === 'Answered') return { bg: 'rgba(40,199,111,0.15)', color: '#28C76F' }
  if (outcome === 'Missed') return { bg: 'rgba(255,59,48,0.15)', color: '#FF3B30' }
  if (outcome === 'Voicemail') return { bg: 'rgba(255,159,10,0.15)', color: '#FF9F0A' }
  return { bg: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)' }
}

export const dynamic = 'force-dynamic'

export default async function CallsPage() {
  const db = await getDb()
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)

  const [recent, agg] = await Promise.all([
    db.select().from(osCallLogs).orderBy(desc(osCallLogs.calledAt)).limit(10),
    db
      .select({
        todayCount: sql<number>`count(*) filter (where called_at >= ${todayStart.toISOString()})`,
        missedCount: sql<number>`count(*) filter (where outcome = 'Missed')`,
        totalDuration: sql<number>`coalesce(sum(duration_seconds), 0)`,
      })
      .from(osCallLogs),
  ])

  const s = agg[0] ?? { todayCount: 0, missedCount: 0, totalDuration: 0 }
  const todayCount = Number(s.todayCount)
  const missedCount = Number(s.missedCount)

  const sections = [
    { label: "Today's Calls", color: '#28C76F', count: todayCount },
    { label: 'Scheduled', color: '#20AFFF', count: 3 },
    { label: 'Missed', color: '#FF3B30', count: missedCount },
    { label: 'Voicemail', color: '#FF9F0A', count: 1 },
    { label: 'Recordings', color: 'rgba(255,255,255,0.4)', count: 0 },
  ]

  const sectionIcons: Record<string, React.ReactNode> = {
    "Today's Calls": (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
    Scheduled: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    Missed: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67M6.18 6.18A19.79 19.79 0 003.07 9.81a19.79 19.79 0 00-3.07 8.63A2 2 0 002 20h3" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </svg>
    ),
    Voicemail: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="11.5" r="4.5" /><circle cx="18.5" cy="11.5" r="4.5" /><line x1="9" y1="16" x2="15" y2="16" />
      </svg>
    ),
    Recordings: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
      </svg>
    ),
  }

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Module header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="relative w-[60px] h-[60px] rounded-[20px] shrink-0 overflow-hidden flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle at 30% 20%, #90F5C0 0%, #28C76F 50%, #065E30 100%)',
              boxShadow: '0 16px 40px -8px rgba(40,199,111,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 pointer-events-none z-10"
              style={{ height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '20px 20px 0 0' }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,50,20,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 20 }}>
              <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006.91 6.91l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Calls</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {todayCount} today · {missedCount > 0 ? `${missedCount} missed` : 'No missed calls'}
            </p>
          </div>
        </div>

        {/* Missed calls banner */}
        {missedCount > 0 && (
          <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(255,59,48,0.07)', border: '1px solid rgba(255,59,48,0.14)' }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: '#FF3B30' }}>{missedCount} MISSED</p>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              {missedCount} missed call{missedCount !== 1 ? 's' : ''} need a callback
            </p>
          </div>
        )}

        {/* Sub-sections */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-4 pt-3 pb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            SECTIONS
          </p>
          {sections.map((sec, i) => (
            <div
              key={sec.label}
              className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${sec.color}18`, border: `1px solid ${sec.color}30`, color: sec.color }}
              >
                {sectionIcons[sec.label]}
              </div>
              <span className="flex-1 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>{sec.label}</span>
              {sec.count > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${sec.color}20`, color: sec.color }}>{sec.count}</span>
              )}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5">
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          ))}
        </div>

        {/* Call log list */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            RECENT CALLS
          </p>
          {recent.length === 0 ? (
            <div className="rounded-2xl p-8 text-center text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
              No calls logged yet
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {[...recent].sort((a, b) => {
                if (a.outcome === 'Missed' && b.outcome !== 'Missed') return -1
                if (b.outcome === 'Missed' && a.outcome !== 'Missed') return 1
                return 0
              }).map((c, i, arr) => {
                const badge = outcomeBadge(c.outcome)
                const isInbound = c.direction === 'Inbound'
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-4 py-3.5"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
                  >
                    {/* Direction indicator */}
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-base"
                      style={{
                        background: isInbound ? 'rgba(40,199,111,0.12)' : 'rgba(32,175,255,0.12)',
                        border: isInbound ? '1px solid rgba(40,199,111,0.25)' : '1px solid rgba(32,175,255,0.25)',
                        color: isInbound ? '#28C76F' : '#20AFFF',
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {isInbound ? '↙' : '↗'}
                    </div>

                    {/* Name + phone */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.92)' }}>{c.callerName}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>{c.callerPhone ?? '—'}</div>
                    </div>

                    {/* Duration + outcome + time */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>{fmtDur(c.durationSeconds ?? 0)}</span>
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: badge.bg, color: badge.color }}
                      >
                        {c.outcome}
                      </span>
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.32)' }}>{timeLabel(new Date(c.calledAt))}</span>
                    </div>

                    {/* Call Back chip for missed calls */}
                    {c.outcome === 'Missed' && (
                      <button className="text-[11px] font-semibold px-3 py-1 rounded-full shrink-0"
                        style={{ background: 'rgba(255,59,48,0.12)', color: '#FF3B30', border: '1px solid rgba(255,59,48,0.2)' }}>
                        Call Back
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Link
            href="/os/calls/new"
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90 text-center"
            style={{ background: 'linear-gradient(135deg, #28C76F, #0A7A3E)', color: 'white', boxShadow: '0 4px 16px rgba(40,199,111,0.3)' }}
          >
            Log Call
          </Link>
          <button
            className="px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}
          >
            Schedule Call
          </button>
        </div>

      </div>
    </div>
  )
}
