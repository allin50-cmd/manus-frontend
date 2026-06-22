import Link from 'next/link'

const CATEGORIES = [
  { href: '#', label: "Today's Calls", count: '—' },
  { href: '#', label: 'Missed Calls', count: '—' },
  { href: '#', label: 'Scheduled Calls', count: '—' },
  { href: '#', label: 'Call Log', count: '—' },
]

export default function CallsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          <p className="text-slate-500 text-sm">Today · Scheduled · Logged</p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all group"
          >
            <div>
              <span className="font-semibold text-slate-900 text-sm">{cat.label}</span>
              <span className="text-slate-400 text-xs ml-2">{cat.count}</span>
            </div>
            <svg
              className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>

      {/* Note */}
      <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <p className="text-sm text-slate-500">Call tracking integration coming soon.</p>
      </div>
    </div>
  )
}
