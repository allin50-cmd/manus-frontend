import Link from 'next/link'

export default function FineGuardAppPage() {
  return (
    <div className="text-center py-12">
      <div className="text-3xl mb-4">🛡️</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">FineGuard Compliance</h1>
      <p className="text-gray-500 text-sm mb-4">
        Never miss a Companies House deadline. Automated monitoring with early alerts before fines hit.
      </p>
      <p className="text-xs text-gray-400 mb-6">From £9/month</p>
      <Link
        href="/check"
        className="block w-full bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl text-sm mb-4"
      >
        Check your company →
      </Link>
      <Link href="/apps" className="text-sm text-blue-600 font-medium">
        ← See all tools
      </Link>
    </div>
  )
}
