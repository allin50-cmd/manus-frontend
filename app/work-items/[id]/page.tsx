import { requireAuth } from '../../../lib/auth'
import { db } from '../../../lib/db'
import { formatUKDate, formatUKDateTime, statusLabel, typeLabel } from '../../../lib/utils'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import StatusBadge from '../../../components/StatusBadge'
import WorkItemActions from '../../../components/WorkItemActions'
import CompleteActionButton from '../../../components/CompleteActionButton'
<OutreachLogSection logs={item.outreachLogs} />
import AlertDeliveriesSection from '../../../components/AlertDeliveriesSection'

export const dynamic = 'force-dynamic'

export default async function WorkItemDetailPage({ params }: { params: { id: string } }) {
  const session = await requireAuth()

const item = await db.workItem.findUnique({
  where: { id: params.id },
  include: {
    actions: {
      orderBy: { createdAt: 'desc' },
      take: 20,
    },

    activityLogs: {
      orderBy: { createdAt: 'desc' },
      take: 30,
    },

    outreachLogs: {
      orderBy: { occurredAt: 'desc' },
      take: 20,
    },

    decisions: {
      orderBy: { createdAt: 'desc' },
      take: 10,
    },
outreachLogs: {
  orderBy: { occurredAt: 'desc' },
  take: 20,
},
    alertDeliveries: {
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        recipient: true,
      },
    },
  },
})

  if (!item) notFound()

  const priorityColors: Record<string, string> = {
    Low: 'text-slate-600',
    Medium: 'text-blue-700',
    High: 'text-orange-700',
    Urgent: 'text-red-700 font-bold',
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start gap-3">
        <Link href="/work-items" className="text-slate-400 hover:text-slate-600 mt-1 shrink-0">←</Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs bg-slate-100 text-slate-600 rounded px-2 py-0.5">{typeLabel(item.type)}</span>
            <StatusBadge status={item.status} />
            <span className={`text-xs font-medium ${priorityColors[item.priority]}`}>{item.priority}</span>
            {item.decisionNeeded && (
              <span className="text-xs bg-red-100 text-red-700 font-medium rounded px-2 py-0.5">Decision needed</span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 break-words">{item.title}</h1>
        </div>
        <Link
          href={`/work-items/${item.id}/edit`}
          className="shrink-0 mt-0.5 text-xs font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-1.5 transition-colors"
        >
          Edit
        </Link>
      </div>

      {/* Next action accent strip */}
      {item.nextAction && (
        <div className="flex items-start gap-3 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl px-3 py-3">
          <div className="flex-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">Next Action</span>
            <p className="text-sm font-semibold text-blue-900 mt-0.5">{item.nextAction}</p>
          </div>
          <span className="text-blue-400 text-xl mt-0.5">→</span>
        </div>
      )}

      {/* Detail grid */}
      <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
{[
  { label: 'Company', value: item.company },
  { label: 'Contact', value: item.contactName },
  { label: 'Owner', value: item.owner },

  {
    label: 'Pipeline',
    value: item.pipelineStage
      ? item.pipelineStage.replace(/([A-Z])/g, ' $1').trim()
      : null,
  },

  { label: 'Status', value: statusLabel(item.status) },

  { label: 'Priority', value: item.priority },

  {
    label: 'Last Contact',
    value: item.lastTouchedAt
      ? formatUKDate(item.lastTouchedAt)
      : null,
  },

  { label: 'Due Date', value: formatUKDate(item.dueDate) },

  { label: 'Created', value: formatUKDate(item.createdAt) },

  { label: 'Updated', value: formatUKDate(item.updatedAt) },
].map(({ label, value }) =>
  value ? (
    <div key={label} className="flex gap-3 px-4 py-3">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide w-28 shrink-0 pt-0.5">
        {label}
      </span>

      <span
        className={`text-sm flex-1 ${
          label === 'Due Date' &&
          item.dueDate &&
          new Date(item.dueDate) < new Date()
            ? 'text-red-600 font-semibold'
            : 'text-slate-900'
        }`}
      >
        {value}
      </span>
    </div>
  ) : null
)}
        {item.notes && (
          <div className="px-4 py-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1">Notes</span>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{item.notes}</p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <WorkItemActions
        workItemId={item.id}
        currentStatus={item.status}
        person={session.person}
      />

      {/* Open actions */}
      {item.actions.filter((a) => a.status === 'Open').length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Open Actions</h2>
          <div className="space-y-2">
            {item.actions.filter((a) => a.status === 'Open').map((action) => (
              <div key={action.id} className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900">{action.label}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {action.assignedTo && `Assigned: ${action.assignedTo} · `}
                      {action.dueDate && `Due: ${formatUKDate(action.dueDate)}`}
                    </p>
                  </div>
                  <CompleteActionButton workItemId={item.id} actionId={action.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently completed actions */}
      {(() => {
        const done = item.actions
          .filter((a) => a.status === 'Done' && a.actionType !== 'LogNote')
          .sort((a, b) => new Date(b.completedAt ?? b.createdAt).getTime() - new Date(a.completedAt ?? a.createdAt).getTime())
          .slice(0, 5)
        return (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recently completed actions</h2>
            {done.length === 0 ? (
              <p className="text-xs text-slate-400">No completed actions yet.</p>
            ) : (
              <div className="space-y-1.5">
                {done.map((action) => (
                  <div key={action.id} className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                    <p className="text-xs font-medium text-slate-700">{action.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {action.actionType.replace(/([A-Z])/g, ' $1').trim()} · {formatUKDateTime(action.completedAt)}
                    </p>
                    {action.result && <p className="text-xs text-slate-500 mt-0.5 italic">{action.result}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )
      })()}

      {/* Open decisions */}
      {item.decisions.filter((d) => d.status === 'Open').length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Open Decisions</h2>
          <div className="space-y-2">
            {item.decisions.filter((d) => d.status === 'Open').map((dec) => (
              <div key={dec.id} className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium text-slate-900">{dec.question}</p>
                {dec.recommendation && <p className="text-xs text-slate-600 mt-1">Recommendation: {dec.recommendation}</p>}
                <p className="text-xs text-purple-700 mt-1">Awaiting: {dec.decisionBy}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alert deliveries — shown for ComplianceAlert work items */}
      {item.type === 'ComplianceAlert' && (
        <AlertDeliveriesSection
          workItemId={item.id}
          deliveries={item.alertDeliveries}
        />
      )}

      {/* Activity log */}
      <section>
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-2">Activity Log</h2>
        <div className="space-y-1">
          {item.activityLogs.map((log) => (
            <div key={log.id} className="flex gap-3 text-sm py-2 border-b border-slate-100 last:border-0">
              <span className="text-xs text-slate-400 whitespace-nowrap shrink-0 pt-0.5">{formatUKDate(log.createdAt)}</span>
              <div>
                <span className="text-xs font-medium text-slate-600">{log.person}</span>
                {' · '}
                <span className="text-xs text-slate-500">{log.eventType.replace(/([A-Z])/g, ' $1').trim()}</span>
                <p className="text-sm text-slate-800">{log.summary}</p>
                {log.oldStatus && log.newStatus && (
                  <p className="text-xs text-slate-500">
                    {statusLabel(log.oldStatus)} → {statusLabel(log.newStatus)}
                  </p>
                )}
              </div>
            </div>
          ))}
          {item.activityLogs.length === 0 && (
            <p className="text-sm text-slate-400">No activity yet</p>
          )}
        </div>
      </section>
    </div>
  )
}
