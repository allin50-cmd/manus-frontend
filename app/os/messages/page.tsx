import { getDb } from '@/lib/db'
import { osMessageThreads } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

// TODO: add channel column to os_message_threads to enable real per-channel breakdowns

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
    db.select().from(osMessageThreads).orderBy(desc(osMessageThreads.lastMessageAt)).limit(10),
    db
      .select({
        totalUnread: sql<number>`coalesce(sum(unread_count), 0)`,
        threadCount: sql<number>`count(*)`,
        pinnedCount: sql<number>`count(*) filter (where is_pinned = true)`,
      })
      .from(osMessageThreads),
  ])

  const s = agg[0] ?? { totalUnread: 0, threadCount: 0, pinnedCount: 0 }

  // TODO: add channel column to os_message_threads for real breakdowns
  const sections = [
    { label: 'Email', color: '#20AFFF', count: 3 },
    { label: 'WhatsApp', color: '#28C76F', count: 2 },
    { label: 'SMS', color: '#FF9F0A', count: 1 },
    { label: 'Website Enquiries', color: '#BF5AF2', count: 2 },
    { label: 'Notifications', color: 'rgba(255,255,255,0.4)', count: 0 },
  ]

  const sectionIcons: Record<string, React.ReactNode> = {
    Email: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    WhatsApp: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    SMS: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    'Website Enquiries': (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    Notifications: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
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
              background: 'radial-gradient(circle at 30% 20%, #A8E8FF 0%, #20AFFF 50%, #003A8C 100%)',
              boxShadow: '0 16px 40px -8px rgba(32,175,255,0.55), 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45)',
            }}
          >
            <div
              className="absolute inset-x-0 top-0 pointer-events-none z-10"
              style={{ height: '55%', background: 'linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)', borderRadius: '20px 20px 0 0' }}
            />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(0,30,100,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 20 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Messages</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {Number(s.threadCount)} threads · {Number(s.totalUnread)} unread
            </p>
          </div>
        </div>

        {/* Unread banner */}
        {Number(s.totalUnread) > 0 && (
          <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(32,175,255,0.07)', border: '1px solid rgba(32,175,255,0.14)' }}>
            <p className="text-xs font-bold mb-0.5" style={{ color: '#20AFFF' }}>{s.totalUnread} UNREAD</p>
            <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.75)' }}>
              You have unread messages waiting
            </p>
          </div>
        )}

        {/* Sub-sections */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <p className="text-[10px] font-semibold uppercase tracking-widest px-4 pt-3 pb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
            CHANNELS
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

        {/* Thread list */}
        <div className="mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
            RECENT THREADS
          </p>
          {threads.length === 0 ? (
            <div className="rounded-2xl p-8 text-center text-sm" style={{ background: 'rgba(255,255,255,0.04)', border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' }}>
              No messages yet
            </div>
          ) : (
            <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              {threads.map((t, i) => {
                const participants = (t.participantNames as string[]) ?? []
                const initials = participants[0]?.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ?? '?'
                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-white/[0.03] transition-colors"
                    style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : undefined }}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                      style={{ background: 'rgba(32,175,255,0.15)', color: '#20AFFF', border: '1px solid rgba(32,175,255,0.25)' }}
                    >
                      {initials}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-sm truncate"
                          style={{ color: 'rgba(255,255,255,0.92)', fontWeight: t.unreadCount > 0 ? 700 : 500 }}
                        >
                          {t.subject}
                        </span>
                        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.32)' }}>
                          {timeLabel(new Date(t.lastMessageAt))}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.32)' }}>
                        {participants.join(', ') || 'No participants'}
                      </div>
                    </div>

                    {/* Unread badge */}
                    {t.unreadCount > 0 && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                        style={{ background: '#20AFFF', color: '#fff' }}
                      >
                        {t.unreadCount}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #20AFFF, #0060CC)', color: 'white', boxShadow: '0 4px 16px rgba(32,175,255,0.3)' }}
          >
            Compose
          </button>
          <button
            className="px-5 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', color: 'rgba(255,255,255,0.7)' }}
          >
            Open Inbox
          </button>
        </div>

      </div>
    </div>
  )
}
