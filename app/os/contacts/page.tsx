import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function OSContactsPage({ searchParams }: { searchParams: { companyId?: string } }) {
  const suffix = searchParams.companyId ? `?companyId=${encodeURIComponent(searchParams.companyId)}` : ''

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">OS Contacts</h1>
        <p className="text-sm text-slate-500 mt-1">Contact creation is available. Use the main Contacts page for the current list view.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <Link href={`/os/contacts/new${suffix}`} className="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
          Add another contact
        </Link>
        <Link href="/contacts" className="block w-full text-center py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors">
          Open Contacts
        </Link>
      </div>
    </div>
  )
}
