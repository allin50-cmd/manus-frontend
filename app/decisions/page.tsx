import { requireAuth } from '../../lib/auth'
import { db } from '../../lib/db'
import { formatUKDate } from '../../lib/utils'
import Link from 'next/link'
import DecisionActions from '../../components/DecisionActions'

export const dynamic = 'force-dynamic'

export default async function DecisionsPage() {
  const session = await requireAuth()

  const decisions = await db.decision.findMany({
    where: { status: 'Open' },
    include: { workItem: { select: { id: true, title: true, company: true } } },
    orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Decision Queue</h1>

      {decisions.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-green-100 rounded-2xl mx-auto">
            <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-green-800 font-semibold">No open decisions</p>
          <p className="text-sm text-green-600">Nothing waiting for a decision right now.</p>
        </div>
      )}

      <div className="space-y-4">
        {decisions.map((dec) => {
          const overdue = dec.dueDate && new Date(dec.dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
          return (
          <div key={dec.id} className={`bg-white rounded-xl border p-5 space-y-3 ${overdue ? 'border-red-200' : 'border-slate-200'}`}>
            {overdue && (
              <div className="flex items-center gap-2 -mt-1 mb-1">
                <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                  Overdue · {formatUKDate(dec.dueDate)}
                </span>
              </div>
            )}
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/work-items/${dec.workItem.id}`} className="text-xs text-blue-600 hover:underline">
                  {dec.workItem.title}{dec.workItem.company ? ` · ${dec.workItem.company}` : ''}
                </Link>
                <p className="font-semibold text-slate-900 mt-1">{dec.question}</p>
              </div>
              {dec.dueDate && !overdue && (
                <span className="text-xs font-medium shrink-0 text-orange-600">
                  Due: {formatUKDate(dec.dueDate)}
                </span>
              )}
            </div>

            {dec.options && (
              <div className="bg-slate-50 rounded-lg px-3 py-2 text-sm text-slate-700">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Options: </span>
                {dec.options}
              </div>
            )}

            {dec.recommendation && (
              <div className="bg-blue-50 rounded-lg px-3 py-2 text-sm text-blue-800">
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Recommendation: </span>
                {dec.recommendation}
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <p className="text-xs text-slate-500">Awaiting decision from: <span className="font-medium text-slate-700">{dec.decisionBy}</span></p>
              {dec.workItem && (
                <Link href={`/work-items/${dec.workItem.id}`} className="text-xs font-medium text-blue-600 hover:underline shrink-0">
                  Open work item →
                </Link>
              )}
            </div>

            <DecisionActions decisionId={dec.id} workItemId={dec.workItem.id} person={session.person} />
          </div>
        )})}
      </div>
    </div>
  )
}
