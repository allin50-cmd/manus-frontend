import Link from 'next/link'

export default function CheckSuccessPage({
  searchParams,
}: {
  searchParams: { company?: string; number?: string }
}) {
  const companyName = searchParams.company
    ? decodeURIComponent(searchParams.company)
    : null
  const companyNumber = searchParams.number
    ? decodeURIComponent(searchParams.number)
    : null

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-12">
        <div className="w-8 h-8 bg-[#00A86B] rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-base leading-none">✓</span>
        </div>
        <span className="text-[#0B1F3A] font-bold text-xl tracking-tight">FineGuard</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Green header bar */}
        <div className="bg-[#00A86B] px-8 py-6 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl">Payment confirmed</h1>
          <p className="text-white/80 text-sm mt-1">Monitoring is now active</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          {companyName && (
            <div className="mb-6 p-4 bg-[#F7F8FA] rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Company
              </p>
              <p className="font-semibold text-[#0B1F3A] text-sm">{companyName}</p>
              {companyNumber && (
                <p className="text-xs text-slate-400 font-mono mt-0.5">{companyNumber}</p>
              )}
            </div>
          )}

          <h2 className="font-bold text-[#0B1F3A] text-base mb-3">What happens next</h2>
          <ul className="space-y-3 text-sm text-slate-600 mb-6">
            {[
              'We check your Companies House deadlines every day.',
              'You\'ll receive an email alert 30, 14, and 7 days before each filing date.',
              'Annual accounts and confirmation statement deadlines are both covered.',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-0.5 w-4 h-4 flex-shrink-0 bg-[#E6F7F1] rounded-full flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-[#00A86B]" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="text-xs text-slate-500 mb-6">
            Questions? Reply to any alert email or contact us at{' '}
            <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">
              hello@fineguard.co.uk
            </a>
          </p>

          <Link
            href="/check"
            className="block w-full text-center bg-[#0B1F3A] hover:bg-[#162d50] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Monitor another company
          </Link>
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 text-center">
        FineGuard Limited · Registered in England and Wales
      </p>
    </div>
  )
}
