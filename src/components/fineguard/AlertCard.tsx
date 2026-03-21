import { Bell, CheckCircle, Calendar } from 'lucide-react';
import type { AlertItem, AlertType } from '../../lib/api';

interface AlertCardProps {
  alert: AlertItem;
  onMarkHandled?: (id: string) => void;
  loading?: boolean;
}

const TYPE_LABELS: Record<AlertType, string> = {
  confirmation_statement: 'Confirmation statement',
  annual_accounts: 'Annual accounts',
  officer_change: 'Officer change',
};

const THRESHOLD_LABELS: Record<number, string> = {
  30: '30-day warning',
  7: '7-day warning',
  1: '1-day warning',
  0: 'Overdue',
};

export function AlertCard({ alert, onMarkHandled, loading }: AlertCardProps) {
  const isHandled = alert.status === 'handled';
  const isOverdue = alert.thresholdDays === 0;
  const dueDateFormatted = new Date(alert.dueDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const urgencyColor = isHandled
    ? 'border-gray-700 bg-gray-800/30'
    : isOverdue
    ? 'border-red-500/30 bg-red-500/5'
    : alert.thresholdDays <= 7
    ? 'border-red-400/30 bg-red-400/5'
    : 'border-amber-400/30 bg-amber-400/5';

  const badgeColor = isHandled
    ? 'text-gray-400 bg-gray-700'
    : isOverdue || alert.thresholdDays <= 7
    ? 'text-red-400 bg-red-400/10'
    : 'text-amber-400 bg-amber-400/10';

  return (
    <div className={`rounded-lg border p-4 transition-opacity ${urgencyColor} ${isHandled ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Bell
            className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
              isHandled ? 'text-gray-500' : isOverdue ? 'text-red-400' : 'text-amber-400'
            }`}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-white/90">
                {TYPE_LABELS[alert.type]}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeColor}`}>
                {THRESHOLD_LABELS[alert.thresholdDays] ?? `${alert.thresholdDays}d warning`}
              </span>
              {isHandled && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium text-gray-400 bg-gray-700">
                  Handled
                </span>
              )}
            </div>

            {(alert.companyName) && (
              <p className="text-xs text-white/50 mt-0.5">
                {alert.companyName}
                {alert.companyNumber && ` · ${alert.companyNumber}`}
              </p>
            )}

            <p className="text-sm text-white/70 mt-2">{alert.message}</p>

            <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
              <Calendar className="w-3 h-3" />
              <span>Due {dueDateFormatted}</span>
            </div>
          </div>
        </div>

        {!isHandled && onMarkHandled && (
          <button
            onClick={() => onMarkHandled(alert.id)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-white/60 hover:text-green-400 transition-colors px-3 py-1.5 rounded border border-white/10 hover:border-green-400/30 flex-shrink-0 disabled:opacity-50"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Mark handled
          </button>
        )}

        {isHandled && (
          <div className="flex items-center gap-1.5 text-xs text-green-500/70 flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5" />
            Done
          </div>
        )}
      </div>
    </div>
  );
}
