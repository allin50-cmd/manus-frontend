import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { formatUKDate } from '@/lib/utils'
import Link from 'next/link'
import DecisionActions from '@/components/DecisionActions'

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
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-semibold">No open decisions. All clear.</p>
        </div>
      )}

      <div className="space-y-4">
        {decisions.map((dec) => (
          <div key={dec.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/work-items/${dec.workItem.id}`} className="text-xs text-blue-600 hover:underline">
                  {dec.workItem.title}{dec.workItem.company ? ` · ${dec.workItem.company}` : ''}
                </Link>
                <p className="font-semibold text-slate-900 mt-1">{dec.question}</p>
              </div>
              {dec.dueDate && (
                <span className={`text-xs font-medium shrink-0 ${new Date(dec.dueDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
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

            <p className="text-xs text-slate-500">Awaiting decision from: <span className="font-medium text-slate-700">{dec.decisionBy}</span></p>

            <DecisionActions decisionId={dec.id} workItemId={dec.workItem.id} person={session.person} />
          </div>
        ))}
      </div>
    </div>
  )
}
