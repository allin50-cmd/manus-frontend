import { useState } from 'react';
import {
  AlertTriangle, CheckCircle, Bell, Filter,
  Calendar, Building2, XCircle, Info
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import { mockComplianceAlerts } from '@/lib/mockData';
import { formatDate, formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { ComplianceAlert, AlertSeverity } from '@/types/fineguard';

const SEVERITY_CONFIG: Record<AlertSeverity, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string; borderColor: string }> = {
  critical: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
};

export default function ComplianceAlerts() {
  const [alerts, setAlerts] = useState(mockComplianceAlerts);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  const filtered = alerts.filter(a => {
    const matchSeverity = severityFilter === 'all' || a.severity === severityFilter;
    const matchResolved = showResolved || !a.isResolved;
    return matchSeverity && matchResolved;
  });

  const stats = {
    critical: alerts.filter(a => a.severity === 'critical' && !a.isResolved).length,
    warning: alerts.filter(a => a.severity === 'warning' && !a.isResolved).length,
    info: alerts.filter(a => a.severity === 'info' && !a.isResolved).length,
    resolved: alerts.filter(a => a.isResolved).length,
  };

  const markRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
  };

  const resolve = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isResolved: true, isRead: true } : a));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader
        title="Compliance Alerts"
        description="Deadlines, errors, and compliance warnings across all companies"
      />

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Critical', value: stats.critical, color: 'text-red-700', bg: 'bg-red-50 border-red-200', filter: 'critical' },
          { label: 'Warnings', value: stats.warning, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', filter: 'warning' },
          { label: 'Info', value: stats.info, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', filter: 'info' },
          { label: 'Resolved', value: stats.resolved, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', filter: 'resolved' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setSeverityFilter(p => p === s.filter ? 'all' : s.filter)}
            className={cn(
              'card p-3 text-center border transition-all',
              s.bg,
              severityFilter === s.filter ? 'ring-2 ring-offset-1 ring-blue-500' : 'hover:shadow-md'
            )}
          >
            <p className={cn('text-2xl font-bold font-mono', s.color)}>{s.value}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select
            value={severityFilter}
            onChange={e => setSeverityFilter(e.target.value)}
            className="input w-auto text-sm"
          >
            <option value="all">All Alerts</option>
            <option value="critical">Critical Only</option>
            <option value="warning">Warnings Only</option>
            <option value="info">Info Only</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={e => setShowResolved(e.target.checked)}
            className="rounded"
          />
          Show resolved
        </label>
      </div>

      {/* Alert List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">All Clear</h2>
            <p className="text-gray-500">No compliance alerts at this time.</p>
          </div>
        ) : (
          filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onMarkRead={() => markRead(alert.id)}
              onResolve={() => resolve(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function AlertCard({
  alert,
  onMarkRead,
  onResolve,
}: {
  alert: ComplianceAlert;
  onMarkRead: () => void;
  onResolve: () => void;
}) {
  const config = SEVERITY_CONFIG[alert.severity];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'card p-4 border',
        config.borderColor,
        !alert.isRead && 'border-l-4',
        alert.isResolved && 'opacity-60'
      )}
      onClick={onMarkRead}
    >
      <div className="flex items-start gap-3">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
          <Icon className={cn('w-4 h-4', config.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  'text-sm font-semibold',
                  !alert.isRead ? 'text-gray-900' : 'text-gray-600'
                )}>
                  {alert.title}
                </h3>
                {!alert.isRead && !alert.isResolved && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
                {alert.isResolved && (
                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    Resolved
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Building2 className="w-3 h-3" />
                  {alert.companyName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDateTime(alert.createdAt)}
                </span>
                {alert.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Due: {formatDate(alert.dueDate)}
                  </span>
                )}
              </div>
            </div>
            <StatusBadge status={alert.severity} />
          </div>

          <p className="text-sm text-gray-600 mt-2">{alert.message}</p>

          {!alert.isResolved && (
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={e => { e.stopPropagation(); onResolve(); }}
                className="text-xs text-green-700 hover:text-green-800 flex items-center gap-1 bg-green-50 hover:bg-green-100 px-2 py-1 rounded transition-colors"
              >
                <CheckCircle className="w-3 h-3" /> Mark Resolved
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
