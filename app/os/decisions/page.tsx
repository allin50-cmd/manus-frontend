import { requireAuth } from '@/lib/auth'
import { getDb, decisions, workItems } from '@/lib/db'
import { formatUKDate } from '@/lib/utils'
import Link from 'next/link'
import DecisionActions from '@/components/DecisionActions'
import { eq, asc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export default async function DecisionsPage() {
  const session = await requireAuth()

  const db = await getDb()

  const rows = await db
    .select({
      id: decisions.id,
      workItemId: decisions.workItemId,
      question: decisions.question,
      options: decisions.options,
      recommendation: decisions.recommendation,
      decisionBy: decisions.decisionBy,
      decision: decisions.decision,
      status: decisions.status,
      dueDate: decisions.dueDate,
      decidedAt: decisions.decidedAt,
      createdAt: decisions.createdAt,
      workItemTitle: workItems.title,
      workItemCompany: workItems.company,
    })
    .from(decisions)
    .innerJoin(workItems, eq(decisions.workItemId, workItems.id))
    .where(eq(decisions.status, 'Open'))
    .orderBy(asc(decisions.dueDate), asc(decisions.createdAt))

  const decisionsWithWorkItem = rows.map((row) => ({
    id: row.id,
    workItemId: row.workItemId,
    question: row.question,
    options: row.options,
    recommendation: row.recommendation,
    decisionBy: row.decisionBy,
    decision: row.decision,
    status: row.status,
    dueDate: row.dueDate,
    decidedAt: row.decidedAt,
    createdAt: row.createdAt,
    workItem: {
      id: row.workItemId,
      title: row.workItemTitle,
      company: row.workItemCompany,
    },
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Decision Queue</h1>

      {decisionsWithWorkItem.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <p className="text-green-700 font-semibold">No open decisions. All clear.</p>
        </div>
      )}

      <div className="space-y-4">
        {decisionsWithWorkItem.map((dec) => (
          <div key={dec.id} className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Link href={`/os/work-items/${dec.workItem.id}`} className="text-xs text-blue-600 hover:underline">
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
