import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SOURCES = [
  {
    id: 'messages',
    label: 'Messages',
    desc: 'Internal threads',
    emoji: '💬',
    href: '/os/messages',
    color: '#20AFFF',
    bg: 'rgba(32,175,255,0.12)',
    border: 'rgba(32,175,255,0.2)',
  },
  {
    id: 'calls',
    label: 'Calls',
    desc: 'Missed & voicemail',
    emoji: '📞',
    href: '/os/calls',
    color: '#28C76F',
    bg: 'rgba(40,199,111,0.12)',
    border: 'rgba(40,199,111,0.2)',
  },
  {
    id: 'leads',
    label: 'Leads',
    desc: 'New enquiries',
    emoji: '🎯',
    href: '/os/leads/builder-big-jobs',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    border: 'rgba(249,115,22,0.2)',
  },
  {
    id: 'alerts',
    label: 'Alerts',
    desc: 'System & compliance',
    emoji: '🔔',
    href: '/os/alerts',
    color: '#FF9F0A',
    bg: 'rgba(255,159,10,0.12)',
    border: 'rgba(255,159,10,0.2)',
  },
]

export default function InboxPage() {
  return (
    <div
      className="min-h-screen pb-28 lg:pb-0"
      style={{ background: 'linear-gradient(160deg, #050816 0%, #071120 55%, #0B1830 100%)' }}
    >
      <div className="max-w-sm mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/os"
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>Inbox</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>All Messages</p>
          </div>
        </div>

        <div
          className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(61,139,255,0.07)', border: '1px solid rgba(61,139,255,0.15)' }}
        >
          <span style={{ fontSize: '1.2em', lineHeight: 1 }} aria-hidden>📬</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>Unified inbox coming soon</p>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              Calls, messages, leads, and alerts will appear here in one view.
            </p>
          </div>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.25)' }}>
          VIEW BY SOURCE
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {SOURCES.map((src, i) => (
            <Link
              key={src.id}
              href={src.href}
              className="flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white/[0.03]"
              style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                style={{ background: src.bg, border: `1px solid ${src.border}` }}
                aria-hidden
              >
                {src.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.88)' }}>{src.label}</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>{src.desc}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2.5" aria-hidden>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
