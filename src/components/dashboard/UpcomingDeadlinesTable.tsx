import type { UpcomingDeadline } from '@/types/dashboard';
import { ALERT_LABELS } from '@/types/alerts';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDate } from '@/lib/companies-house/deadlines';

export function UpcomingDeadlinesTable({ deadlines }: { deadlines: UpcomingDeadline[] }) {
  if (!deadlines.length) {
    return <EmptyState title="No upcoming deadlines" description="All filings are up to date." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            {['Company', 'Deadline', 'Type', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {deadlines.map((d, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium text-slate-900">{d.companyName}</td>
              <td className="px-4 py-3 text-slate-600">
                {formatDate(d.dueDate)}
                <span className="text-xs text-slate-400 ml-1">({d.daysLeft} days)</span>
              </td>
              <td className="px-4 py-3 text-slate-600">{ALERT_LABELS[d.type]}</td>
              <td className="px-4 py-3"><StatusBadge status={d.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
