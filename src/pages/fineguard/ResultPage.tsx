import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  MapPin,
  Calendar,
  Bell,
  BellOff,
  Loader2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Layout } from '../../components/fineguard/Layout';
import { StatusBadge } from '../../components/fineguard/StatusBadge';
import { DeadlineCard } from '../../components/fineguard/DeadlineCard';
import { api, type CompanyCheckResult, type DeadlineStatus } from '../../lib/api';

function computeDeadlineStatus(daysUntil: number | null | undefined): DeadlineStatus {
  if (daysUntil == null) return 'safe';
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 7) return 'urgent';
  if (daysUntil <= 30) return 'due_soon';
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

const NEXT_ACTION: Record<DeadlineStatus, string> = {
  safe: 'Start monitoring to get notified if anything changes.',
  due_soon: 'Start monitoring and prepare to file soon.',
  urgent: 'File immediately. Start monitoring for updates.',
  overdue: 'File now to avoid further penalties.',
  handled: 'No action required.',
};

export default function ResultPage() {
  const { number } = useParams<{ number: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [data, setData] = useState<CompanyCheckResult | null>(
    (location.state as CompanyCheckResult) ?? null,
  );
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState<string | null>(null);
  const [monitoring, setMonitoring] = useState(false);
  const [monitoringLoading, setMonitoringLoading] = useState(false);

  useEffect(() => {
    if (!data && number) {
      api
        .getCompany(number)
        .then(setData)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [number, data]);

  useEffect(() => {
    if (data) {
      setMonitoring(data.isMonitored);
    }
  }, [data]);

  async function handleStartMonitoring() {
    if (!data) return;
    setMonitoringLoading(true);
    try {
      await api.startMonitoring(data.companyId);
      setMonitoring(true);
      // Navigate to monitoring view
      navigate(`/monitoring/${data.companyId}`, { state: data });
    } catch (err) {
      console.error(err);
    } finally {
      setMonitoringLoading(false);
    }
  }

  async function handleRefresh() {
    if (!number) return;
    setLoading(true);
    setError(null);
    try {
      const fresh = await api.getCompany(number);
      setData(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Layout showBack>
        <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Looking up company…</p>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout showBack>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Company not found</h2>
          <p className="text-fg-muted text-sm mb-6 max-w-xs">
            {error ?? 'We couldn\'t retrieve information for this company.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-fg-gold hover:text-fg-gold-hover transition-colors"
          >
            Try another company
          </button>
        </div>
      </Layout>
    );
  }

  const csStatus = computeDeadlineStatus(daysUntil(data.nextConfirmationStatementDue));
  const accStatus = computeDeadlineStatus(daysUntil(data.nextAccountsDue));

  const address = [
    data.registeredAddress?.line1,
    data.registeredAddress?.line2,
    data.registeredAddress?.locality,
    data.registeredAddress?.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Layout showBack backTo="/" backLabel="New search">
      {/* Company header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-fg-surface border border-fg-border flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-fg-muted" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white leading-tight">
                {data.companyName}
              </h1>
              <p className="text-sm text-fg-muted mt-0.5">{data.companyNumber}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
            className="text-fg-muted hover:text-white transition-colors p-1.5 rounded hover:bg-white/5 flex-shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-fg-muted">
          <span className="capitalize">{data.companyStatus}</span>
          {data.incorporationDate && (
            <>
              <span className="text-fg-border">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Incorporated{' '}
                {new Date(data.incorporationDate).toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </>
          )}
          {address && (
            <>
              <span className="text-fg-border">·</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {address}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status panel */}
      <div className="bg-fg-surface border border-fg-border rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-xs text-fg-muted uppercase tracking-wider mb-2">Current status</p>
            <StatusBadge status={data.status} size="lg" />
          </div>
        </div>

        <p className="text-sm text-white/80 mt-3">{data.statusReason}</p>

        {data.nextDeadlineDate && data.nextDeadlineLabel && (
          <p className="text-xs text-fg-muted mt-2">
            Next deadline: <span className="text-white/70">{data.nextDeadlineLabel}</span>
            {' — '}
            <span className="text-white/70">
              {new Date(data.nextDeadlineDate).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </p>
        )}

        {/* Next action prompt */}
        <div className="mt-4 pt-4 border-t border-fg-border/60">
          <p className="text-xs text-fg-muted uppercase tracking-wider mb-1">Next action</p>
          <p className="text-sm text-white/70">{NEXT_ACTION[data.status]}</p>
        </div>
      </div>

      {/* Deadlines */}
      <section className="mb-5">
        <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3">
          Companies House deadlines
        </h2>
        <div className="space-y-2">
          {data.nextConfirmationStatementDue ? (
            <DeadlineCard
              label="Confirmation statement"
              dueDate={data.nextConfirmationStatementDue}
              status={csStatus}
              daysUntil={daysUntil(data.nextConfirmationStatementDue)}
            />
          ) : (
            <EmptyDeadline label="Confirmation statement" />
          )}
          {data.nextAccountsDue ? (
            <DeadlineCard
              label="Annual accounts"
              dueDate={data.nextAccountsDue}
              status={accStatus}
              daysUntil={daysUntil(data.nextAccountsDue)}
            />
          ) : (
            <EmptyDeadline label="Annual accounts" />
          )}
        </div>
      </section>

      {/* CTA */}
      <div className="mt-8">
        {monitoring ? (
          <div className="space-y-3">
            <button
              onClick={() => navigate(`/monitoring/${data.companyId}`)}
              className="w-full bg-fg-surface border border-fg-border hover:border-fg-gold/40 text-white font-medium rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-colors text-sm"
            >
              <Bell className="w-4 h-4 text-fg-gold" />
              View monitoring
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-center text-xs text-green-400">Monitoring active</p>
          </div>
        ) : (
          <button
            onClick={handleStartMonitoring}
            disabled={monitoringLoading}
            className="w-full bg-fg-gold hover:bg-fg-gold-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl px-6 py-3.5 flex items-center justify-center gap-2 transition-colors text-sm"
          >
            {monitoringLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            Start monitoring
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </Layout>
  );
}

function EmptyDeadline({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-fg-border/40 p-4 bg-fg-surface/30">
      <div className="flex items-center gap-3">
        <BellOff className="w-4 h-4 text-fg-muted/40" />
        <div>
          <p className="text-sm font-medium text-white/50">{label}</p>
          <p className="text-xs text-fg-muted/60 mt-0.5">No date available from Companies House</p>
        </div>
      </div>
    </div>
  );
}
