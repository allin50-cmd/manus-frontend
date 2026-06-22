import Link from 'next/link'

const CATEGORIES = [
  { href: '#', label: 'Contracts', count: '—' },
  { href: '#', label: 'Invoices', count: '—' },
  { href: '#', label: 'Policies', count: '—' },
  { href: '#', label: 'Quotes', count: '—' },
  { href: '#', label: 'Uploads', count: '—' },
]

export default function DocumentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #A5B4FC, #6366F1)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm">Contracts · Invoices · Policies · Quotes</p>
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
        <p className="text-sm text-slate-500">Document management coming soon.</p>
      </div>
    </div>
  )
}
