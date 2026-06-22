import Link from 'next/link'

const CATEGORIES = [
  {
    href: '#',
    label: 'Critical (Red)',
    count: '—',
    bg: '#FEF2F2',
    border: '#FECACA',
    dot: '#EF4444',
  },
  {
    href: '#',
    label: 'Warning (Amber)',
    count: '—',
    bg: '#FFFBEB',
    border: '#FDE68A',
    dot: '#F59E0B',
  },
  {
    href: '#',
    label: 'Compliance',
    count: '—',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    dot: '#3B82F6',
  },
  {
    href: '#',
    label: 'Follow-Ups',
    count: '—',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    dot: '#64748B',
  },
  {
    href: '/portal',
    label: 'FineGuard Monitoring',
    count: null,
    bg: '#F0FDF4',
    border: '#BBF7D0',
    dot: '#00A86B',
  },
]

export default function AlertsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
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
          <p className="text-slate-500 text-sm">Red · Amber · Compliance</p>
        </div>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.label}
            href={cat.href}
            className="flex items-center justify-between p-4 rounded-xl border transition-all hover:shadow-sm group"
            style={{ background: cat.bg, borderColor: cat.border }}
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.dot }} />
              <div>
                <span className="font-semibold text-slate-900 text-sm">{cat.label}</span>
                {cat.count !== null && (
                  <span className="text-slate-400 text-xs ml-2">{cat.count}</span>
                )}
              </div>
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
        <p className="text-sm text-slate-500">Smart alerting across all products coming soon.</p>
      </div>
    </div>
  )
}
