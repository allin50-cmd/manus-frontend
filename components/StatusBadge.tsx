const STATUS_STYLES: Record<string, string> = {
  Captured: 'bg-blue-100 text-blue-700',
  Controlled: 'bg-indigo-100 text-indigo-700',
  InProgress: 'bg-yellow-100 text-yellow-800',
  Waiting: 'bg-slate-100 text-slate-600',
  FollowUpDue: 'bg-orange-100 text-orange-700',
  Escalated: 'bg-red-100 text-red-700',
  DecisionNeeded: 'bg-purple-100 text-purple-700',
  Completed: 'bg-green-100 text-green-700',
  Paused: 'bg-slate-100 text-slate-500',
  NotFit: 'bg-red-50 text-red-500',
  Archived: 'bg-slate-100 text-slate-400',
}

const STATUS_LABELS: Record<string, string> = {
  Captured: 'Captured',
  Controlled: 'Controlled',
  InProgress: 'In Progress',
  Waiting: 'Waiting',
  FollowUpDue: 'Follow-Up Due',
  Escalated: 'Escalated',
  DecisionNeeded: 'Decision Needed',
  Completed: 'Completed',
  Paused: 'Paused',
  NotFit: 'Not Fit',
  Archived: 'Archived',
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium rounded px-2 py-0.5 whitespace-nowrap ${STATUS_STYLES[status] ?? 'bg-slate-100 text-slate-600'}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  )
}
