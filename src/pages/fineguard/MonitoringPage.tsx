import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Bell,
  BellOff,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../../components/fineguard/Layout';
import { StatusBadge } from '../../components/fineguard/StatusBadge';
import { DeadlineCard } from '../../components/fineguard/DeadlineCard';
import { AlertCard } from '../../components/fineguard/AlertCard';
import { api, type MonitoringData, type DeadlineStatus, type AuditItem } from '../../lib/api';

function computeDeadlineStatus(dateStr: string | null | undefined): DeadlineStatus {
  if (!dateStr) return 'safe';
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const days = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'overdue';
  if (days <= 7) return 'urgent';
  if (days <= 30) return 'due_soon';
  return 'safe';
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const EVENT_LABELS: Record<string, string> = {
  company_checked: 'Company checked',
  monitoring_started: 'Monitoring started',
  monitoring_stopped: 'Monitoring stopped',
  alert_created: 'Alert created',
  alert_handled: 'Alert handled',
  status_updated: 'Status updated',
  sweep_run: 'System sweep',
};

export default function MonitoringPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [stoppingMonitor, setStoppingMonitor] = useState(false);
  const [showFullAudit, setShowFullAudit] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadData();
    }
  }, [companyId]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const d = await api.getMonitoring(companyId!);
      setData(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkHandled(alertId: string) {
    setHandlingId(alertId);
    try {
      await api.markAlertHandled(alertId);
      await loadData(); // Refresh
    } catch (err) {
      console.error(err);
    } finally {
      setHandlingId(null);
    }
  }

  async function handleStopMonitoring() {
    if (!companyId) return;
    setStoppingMonitor(true);
    try {
      await api.stopMonitoring(companyId);
      navigate('/', { replace: true });
    } catch (err) {
      console.error(err);
    } finally {
      setStoppingMonitor(false);
    }
  }

  if (loading) {
    return (
      <Layout showBack>
        <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Loading monitoring data…</p>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout showBack>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Failed to load</h2>
          <p className="text-fg-muted text-sm mb-6">{error ?? 'Unknown error'}</p>
          <button onClick={loadData} className="text-sm text-fg-gold hover:text-fg-gold-hover">
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  const { company, monitoring, alerts, auditLog } = data;
  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const handledAlerts = alerts.filter((a) => a.status === 'handled');

  const currentStatus: DeadlineStatus = monitoring?.currentStatus ?? 'safe';
  const csStatus = computeDeadlineStatus(company.confirmationStatementDue);
  const accStatus = computeDeadlineStatus(company.accountsDue);

  const auditToShow: AuditItem[] = showFullAudit ? auditLog : auditLog.slice(0, 5);

  return (
    <Layout showBack backTo={`/company/${company.companyNumber}`} backLabel="Company">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-fg-surface border border-fg-border flex items-center justify-center flex-shrink-0">
            <Building2 className="w-5 h-5 text-fg-muted" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white leading-tight">
              {company.companyName}
            </h1>
            <p className="text-sm text-fg-muted mt-0.5">{company.companyNumber}</p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          title="Refresh"
          className="text-fg-muted hover:text-white transition-colors p-1.5 rounded hover:bg-white/5 flex-shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Monitoring status card */}
      <div className="bg-fg-surface border border-fg-border rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {monitoring?.monitoringEnabled ? (
                <Bell className="w-4 h-4 text-fg-gold" />
              ) : (
                <BellOff className="w-4 h-4 text-fg-muted" />
              )}
              <span className="text-xs text-fg-muted uppercase tracking-wider">
                {monitoring?.monitoringEnabled ? 'Monitoring active' : 'Monitoring inactive'}
              </span>
            </div>
            <StatusBadge status={currentStatus} size="lg" />
          </div>

          {monitoring?.monitoringEnabled && (
            <button
              onClick={handleStopMonitoring}
              disabled={stoppingMonitor}
              className="text-xs text-fg-muted hover:text-red-400 transition-colors px-3 py-1.5 rounded border border-fg-border/60 hover:border-red-400/30 flex-shrink-0"
            >
              {stoppingMonitor ? 'Stopping…' : 'Stop monitoring'}
            </button>
          )}
        </div>

        {monitoring?.nextDeadlineAt && (
          <div className="mt-4 pt-4 border-t border-fg-border/60">
            <p className="text-xs text-fg-muted mb-1 uppercase tracking-wider">Next deadline</p>
            <p className="text-sm text-white/80">
              {new Date(monitoring.nextDeadlineAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
        )}

        {monitoring?.lastCheckedAt && (
          <p className="text-xs text-fg-muted/60 mt-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Last checked{' '}
            {new Date(monitoring.lastCheckedAt).toLocaleDateString('en-GB', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        )}
      </div>

      {/* Deadlines */}
      <section className="mb-5">
        <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3">Deadlines</h2>
        <div className="space-y-2">
          {company.confirmationStatementDue && (
            <DeadlineCard
              label="Confirmation statement"
              dueDate={company.confirmationStatementDue}
              status={csStatus}
              daysUntil={daysUntil(company.confirmationStatementDue)}
            />
          )}
          {company.accountsDue && (
            <DeadlineCard
              label="Annual accounts"
              dueDate={company.accountsDue}
              status={accStatus}
              daysUntil={daysUntil(company.accountsDue)}
            />
          )}
          {!company.confirmationStatementDue && !company.accountsDue && (
            <p className="text-sm text-fg-muted py-4 text-center">No deadline data available.</p>
          )}
        </div>
      </section>

      {/* Pending alerts */}
      {pendingAlerts.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            Alerts requiring action
            <span className="bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
              {pendingAlerts.length}
            </span>
          </h2>
          <div className="space-y-2">
            {pendingAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onMarkHandled={handleMarkHandled}
                loading={handlingId === alert.id}
              />
            ))}
          </div>
        </section>
      )}

      {/* No active alerts */}
      {pendingAlerts.length === 0 && monitoring?.monitoringEnabled && (
        <section className="mb-5">
          <div className="border border-green-400/20 bg-green-400/5 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            <p className="text-sm text-white/70">No alerts require action right now.</p>
          </div>
        </section>
      )}

      {/* Handled alerts (collapsed by default) */}
      {handledAlerts.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3">
            Handled alerts ({handledAlerts.length})
          </h2>
          <div className="space-y-2">
            {handledAlerts.slice(0, 3).map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      )}

      {/* Audit log */}
      {auditLog.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3">Activity log</h2>
          <div className="bg-fg-surface border border-fg-border rounded-xl overflow-hidden divide-y divide-fg-border/50">
            {auditToShow.map((entry) => (
              <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fg-muted/40 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/70 leading-snug">{entry.eventSummary}</p>
                  <p className="text-xs text-fg-muted/60 mt-0.5">
                    {EVENT_LABELS[entry.eventType] ?? entry.eventType}
                    {' · '}
                    {new Date(entry.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}

            {auditLog.length > 5 && (
              <button
                onClick={() => setShowFullAudit((p) => !p)}
                className="w-full px-4 py-3 flex items-center gap-2 text-xs text-fg-muted hover:text-white hover:bg-white/5 transition-colors"
              >
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${showFullAudit ? 'rotate-90' : ''}`}
                />
                {showFullAudit ? 'Show less' : `Show all ${auditLog.length} events`}
              </button>
            )}
          </div>
        </section>
      )}
    </Layout>
  );
}
