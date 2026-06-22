import Link from 'next/link'

const TODAY_CALLS = [
  {
    company: 'Hawk Construction',
    contact: 'James Hawkins',
    time: '11:20',
    duration: '8m 34s',
    status: 'done' as const,
    phone: 'tel:+441234567892',
  },
  {
    company: 'Premier Build Co',
    contact: 'Inbound',
    time: '09:05',
    duration: 'Missed',
    status: 'missed' as const,
    phone: 'tel:+441234567893',
  },
]

const RECENT_CALLS = [
  {
    company: 'FineGuard Renewal',
    contact: 'Clare Webb',
    date: 'Yesterday',
    duration: '5m 12s',
    status: 'done' as const,
  },
  {
    company: 'Accuracy Planning',
    contact: 'Sarah Thornton',
    date: 'Jun 20',
    duration: '11m 48s',
    status: 'done' as const,
  },
]

export default function CallsPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-5 py-5 text-white"
        style={{ background: 'linear-gradient(135deg,#065F46,#059669)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
        >
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M10 9C10 9 11.5 6.5 14 6.5C15 6.5 16 7 16.5 8L18 11.5C18.5 12.5 18 13.8 17 14.3L15.5 15.2C16.5 17.2 20 21 23 22.5L24 21.5C24.5 20.5 25.8 20 26.8 20.5L30 22C31 22.5 31.5 23.5 31.5 24.5C31.5 27 28.5 30 28.5 30C24.5 32 6.5 19 10 9Z"
              fill="rgba(255,255,255,0.9)"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs opacity-60 uppercase tracking-wide mb-1">Module</div>
          <div className="text-2xl font-bold tracking-tight">Calls</div>
          <div className="text-sm opacity-60 mt-0.5">Today · Scheduled · Log</div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 gap-3 px-4 py-4">
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">14</div>
          <div className="text-xs text-slate-400 mt-0.5">This week</div>
        </div>
        <div className="bg-white rounded-xl p-3 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">8m</div>
          <div className="text-xs text-slate-400 mt-0.5">Avg duration</div>
        </div>
      </div>

      <div className="px-4 space-y-5 pb-8">
        {/* Today */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Today</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {TODAY_CALLS.map((call, i) => (
              <div
                key={`${call.company}-${call.time}`}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < TODAY_CALLS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{call.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{call.contact} · {call.time}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={
                    call.status === 'missed'
                      ? { background: '#FEE2E2', color: '#DC2626' }
                      : { background: '#D1FAE5', color: '#065F46' }
                  }
                >
                  {call.status === 'missed' ? 'Missed' : call.duration}
                </span>
                {call.status === 'missed' && (
                  <a
                    href={call.phone}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shrink-0"
                    style={{ background: '#EFF6FF', color: '#1D4ED8' }}
                  >
                    📞 Call Back
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Calls */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Recent Calls</h2>
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {RECENT_CALLS.map((call, i) => (
              <div
                key={`${call.company}-${call.date}`}
                className="flex items-center gap-3 px-4 py-3.5"
                style={{ borderBottom: i < RECENT_CALLS.length - 1 ? '1px solid #F1F5F9' : 'none' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-900 truncate">{call.company}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{call.contact} · {call.date}</div>
                </div>
                <span
                  className="text-xs font-semibold px-2 py-1 rounded-full shrink-0"
                  style={{ background: '#D1FAE5', color: '#065F46' }}
                >
                  {call.duration}
                </span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/os" className="block text-center text-xs text-slate-400 py-2">
          ← Back to Ultratech OS
        </Link>
      </div>
    </div>
  )
}
