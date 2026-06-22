import Link from 'next/link'

const CATEGORIES = [
  { href: '#', label: 'Customers', count: '—' },
  { href: '#', label: 'Prospects', count: '—' },
  { href: '#', label: 'Suppliers', count: '—' },
  { href: '#', label: 'Partners', count: '—' },
  { href: '#', label: 'Staff', count: '—' },
]

export default function ContactsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #C47BFF, #7A1ABF)' }}
        >
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
          <p className="text-slate-500 text-sm">Customers · Prospects · Suppliers · Staff</p>
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
        <p className="text-sm text-slate-500">Contact management coming soon.</p>
      </div>
    </div>
  )
}
