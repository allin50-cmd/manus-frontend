import Link from 'next/link'

const APPS = [
  {
    href: '/apps/receptionist',
    name: 'AI Receptionist',
    tagline: 'Never miss a customer call',
    desc: 'Set up a virtual receptionist to take messages, capture leads, and book appointments — while you focus on the job.',
    price: 'From £29/mo',
    emoji: '📞',
    ready: true,
  },
  {
    href: '/apps/quote-builder',
    name: 'Quote Builder',
    tagline: 'Send professional quotes in 2 minutes',
    desc: 'Build clear, itemised quotes on your phone. No spreadsheets. No guesswork. Just the numbers your customer needs.',
    price: 'Free to start',
    emoji: '💷',
    ready: true,
  },
  {
    href: '/apps/booking',
    name: 'Appointment Booking',
    tagline: 'Book jobs and track your diary',
    desc: 'Log every appointment with customer details, time, location, and notes — all in one place.',
    price: 'Free to start',
    emoji: '📅',
    ready: true,
  },
  {
    href: '/apps/lead-capture',
    name: 'Website Lead Capture',
    tagline: 'Turn website visitors into enquiries',
    desc: 'Add a simple lead form to any website. Every enquiry goes straight into your business system.',
    price: 'From £19/mo',
    emoji: '🌐',
    ready: false,
  },
  {
    href: '/apps/fineguard',
    name: 'FineGuard Compliance',
    tagline: 'Never miss a Companies House deadline',
    desc: 'Automated monitoring of UK company filing deadlines. Get alerts before fines hit.',
    price: 'From £9/mo',
    emoji: '🛡️',
    ready: false,
  },
  {
    href: '/apps/business-money',
    name: 'Business Money',
    tagline: 'Invoices and quotes, done',
    desc: "Track what you've quoted, what you've invoiced, and what you're owed — from your phone.",
    price: 'From £19/mo',
    emoji: '💰',
    ready: false,
  },
  {
    href: '/apps/legal-docs',
    name: 'Legal Docs',
    tagline: 'Basic contracts without the solicitor bill',
    desc: 'Generate simple business contracts, NDAs, and terms in minutes.',
    price: 'From £9/mo',
    emoji: '📄',
    ready: false,
  },
]

export default function AppsIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Simple Tools for UK Businesses</h1>
        <p className="text-gray-500 text-sm">
          Small tools that solve real problems. Try any of them from your phone in under 5 minutes.
        </p>
      </div>

      <div className="space-y-3">
        {APPS.map((app) => (
          <Link
            key={app.href}
            href={app.href}
            className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl">{app.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-gray-900 text-sm">{app.name}</span>
                  {app.ready ? (
                    <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Ready</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Coming soon</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-1">{app.tagline}</p>
                <p className="text-xs text-gray-400 line-clamp-2">{app.desc}</p>
                <p className="text-xs font-medium text-gray-600 mt-1.5">{app.price}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
