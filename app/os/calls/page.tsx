import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function OSCallsPage({ searchParams }: { searchParams: { companyId?: string } }) {
  const suffix = searchParams.companyId ? `?companyId=${encodeURIComponent(searchParams.companyId)}` : ''

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Calls</h1>
        <p className="text-sm text-slate-500 mt-1">Call logging is available. The detailed call list is not built yet.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <Link href={`/os/calls/new${suffix}`} className="block w-full text-center py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors">
          Log another call
        </Link>
        <Link href="/os/today" className="block w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors">
          Back to Today Workspace
        </Link>
      </div>
    </div>
  )
}
