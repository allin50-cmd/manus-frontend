import type { ComplianceAlert } from '@/types/alerts';
import { ALERT_LABELS } from '@/types/alerts';
import { EmptyState } from '@/components/shared/EmptyState';

export function AlertsTable({ alerts }: { alerts: ComplianceAlert[] }) {
  if (!alerts.length) {
    return <EmptyState title="No alerts" description="No compliance alerts found." />;
  }

  return (
    <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="w-full text-sm">
        <thead className="border-b bg-slate-50">
          <tr>
            {['Company', 'Type', 'Message', 'Date', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {alerts.map((alert) => (
            <tr key={alert.id}>
              <td className="px-4 py-3 font-medium text-slate-900">{alert.companyNumber}</td>
              <td className="px-4 py-3 text-slate-600">{ALERT_LABELS[alert.alertType]}</td>
              <td className="px-4 py-3 text-slate-600">{ALERT_LABELS[alert.alertType]} monitoring active</td>
              <td className="px-4 py-3 text-slate-600">{new Date(alert.activatedAt).toLocaleDateString('en-GB')}</td>
              <td className="px-4 py-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  alert.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {alert.status === 'active' ? 'Active' : 'Cancelled'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
