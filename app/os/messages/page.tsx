import Link from 'next/link'

const CATEGORIES = [
  { href: '#', label: 'Email', count: '—' },
  { href: '#', label: 'WhatsApp', count: '—' },
  { href: '#', label: 'SMS', count: '—' },
  { href: '/intake', label: 'Intake forms', count: null },
]

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          <p className="text-slate-500 text-sm">Email · WhatsApp · SMS · Intake</p>
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
              {cat.count !== null && (
                <span className="text-slate-400 text-xs ml-2">{cat.count}</span>
              )}
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
        <p className="text-sm text-slate-500">Message routing across all products coming soon.</p>
      </div>
    </div>
  )
}
