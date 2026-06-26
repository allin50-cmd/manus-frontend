import Link from 'next/link'

export default function LeadCapturePage() {
  return (
    <div className="text-center py-12">
      <div className="text-3xl mb-4">🌐</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Website Lead Capture</h1>
      <p className="text-gray-500 text-sm mb-6">
        Turn website visitors into customer enquiries — automatically logged and tracked.
      </p>
      <div className="bg-gray-100 rounded-xl px-4 py-3 mb-6">
        <p className="text-sm text-gray-500 font-medium">Coming soon</p>
        <p className="text-xs text-gray-400 mt-1">Planned for Phase 2</p>
      </div>
      <Link href="/apps" className="text-sm text-blue-600 font-medium">
        ← See all tools
      </Link>
    </div>
  )
}
