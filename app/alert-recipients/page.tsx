import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import Link from 'next/link'
import AlertRecipientsClient from './AlertRecipientsClient'

export const dynamic = 'force-dynamic'

export default async function AlertRecipientsPage() {
  await requireAuth()

  const [recipients, pendingCount, failedCount, totalEvents] = await Promise.all([
    db.alertRecipient.findMany({
      where: { isActive: true },
      orderBy: [{ company: 'asc' }, { escalationLevel: 'asc' }, { name: 'asc' }],
    }),
    db.alertDelivery.count({ where: { status: 'Sent' } }),
    db.alertDelivery.count({ where: { status: 'Failed' } }),
    db.alertEvent.count(),
  ])

  const byCompany: Record<string, typeof recipients> = {}
  for (const r of recipients) {
    if (!byCompany[r.company]) byCompany[r.company] = []
    byCompany[r.company].push(r)
  }

  const companies = Object.keys(byCompany).sort()

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Alert Recipients</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Who receives compliance alerts per company
          </p>
        </div>
        <Link
          href="/alert-events"
          className="shrink-0 text-xs font-semibold text-purple-700 border border-purple-200 hover:bg-purple-50 rounded-lg px-3 py-1.5 transition-colors"
        >
          Audit Log ({totalEvents})
        </Link>
      </div>

      {/* Status bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[120px]">
          <div className="text-2xl font-bold text-slate-900">{recipients.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total recipients</div>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex-1 min-w-[120px]">
          <div className="text-2xl font-bold text-slate-900">{companies.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Companies covered</div>
        </div>
        <div className={`border rounded-xl px-4 py-3 flex-1 min-w-[120px] ${pendingCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-2xl font-bold ${pendingCount > 0 ? 'text-orange-700' : 'text-slate-900'}`}>{pendingCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Awaiting ack</div>
        </div>
        <div className={`border rounded-xl px-4 py-3 flex-1 min-w-[120px] ${failedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`text-2xl font-bold ${failedCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{failedCount}</div>
          <div className="text-xs text-slate-500 mt-0.5">Failed deliveries</div>
        </div>
      </div>

      <AlertRecipientsClient byCompany={byCompany} companies={companies} pendingCount={pendingCount} />
    </div>
  )
}
