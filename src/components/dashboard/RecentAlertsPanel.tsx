import type { ComplianceAlert } from '@/types/alerts';
import { ALERT_LABELS } from '@/types/alerts';
import { Bell } from 'lucide-react';

export function RecentAlertsPanel({ alerts }: { alerts: ComplianceAlert[] }) {
  if (!alerts.length) {
    return (
      <div className="rounded-xl border bg-white p-4 text-sm text-slate-500 text-center py-8">
        No alerts at the moment.
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white divide-y">
      {alerts.map((alert) => (
        <div key={alert.id} className="flex items-center gap-3 px-4 py-3">
          <Bell className="w-4 h-4 text-blue-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900">{ALERT_LABELS[alert.alertType]}</p>
            <p className="text-xs text-slate-500">Active since {new Date(alert.activatedAt).toLocaleDateString('en-GB')}</p>
          </div>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Active</span>
        </div>
      ))}
    </div>
  );
}
