import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Loader2, AlertCircle, CheckCircle, RefreshCw, Plus } from 'lucide-react';
import { Layout } from '../../components/fineguard/Layout';
import { AlertCard } from '../../components/fineguard/AlertCard';
import { api, type AlertItem } from '../../lib/api';

export default function AlertsPage() {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [showHandled, setShowHandled] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getAllAlerts();
      setAlerts(res.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkHandled(alertId: string) {
    setHandlingId(alertId);
    try {
      await api.markAlertHandled(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId ? { ...a, status: 'handled', handledAt: new Date().toISOString() } : a,
        ),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setHandlingId(null);
    }
  }

  const pendingAlerts = alerts.filter((a) => a.status === 'pending');
  const handledAlerts = alerts.filter((a) => a.status === 'handled');

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-fg-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-4" />
          <p className="text-sm">Loading alerts…</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Failed to load alerts</h2>
          <p className="text-fg-muted text-sm mb-6">{error}</p>
          <button onClick={loadAlerts} className="text-sm text-fg-gold hover:text-fg-gold-hover">
            Try again
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white">Alerts</h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {pendingAlerts.length === 0
              ? 'No alerts require action'
              : `${pendingAlerts.length} alert${pendingAlerts.length === 1 ? '' : 's'} require action`}
          </p>
        </div>
        <button
          onClick={loadAlerts}
          disabled={loading}
          title="Refresh"
          className="text-fg-muted hover:text-white transition-colors p-1.5 rounded hover:bg-white/5"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* All clear state */}
      {pendingAlerts.length === 0 && alerts.length === 0 && (
        <div className="text-center py-20">
          <div className="w-14 h-14 rounded-2xl bg-green-400/10 border border-green-400/20 flex items-center justify-center mx-auto mb-5">
            <Bell className="w-7 h-7 text-green-400" />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">No alerts</h2>
          <p className="text-fg-muted text-sm mb-8 max-w-xs mx-auto">
            Start monitoring a company to receive deadline alerts.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 bg-fg-gold hover:bg-fg-gold-hover text-white font-medium rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Check a company
          </button>
        </div>
      )}

      {/* No pending, but have history */}
      {pendingAlerts.length === 0 && alerts.length > 0 && (
        <div className="border border-green-400/20 bg-green-400/5 rounded-xl p-4 flex items-center gap-3 mb-6">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <p className="text-sm text-white/70">No alerts require action right now.</p>
        </div>
      )}

      {/* Pending alerts */}
      {pendingAlerts.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs text-fg-muted uppercase tracking-wider mb-3 flex items-center gap-2">
            Requiring action
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

      {/* Handled alerts */}
      {handledAlerts.length > 0 && (
        <section>
          <button
            onClick={() => setShowHandled((p) => !p)}
            className="flex items-center gap-2 text-xs text-fg-muted hover:text-white uppercase tracking-wider mb-3 transition-colors"
          >
            Handled ({handledAlerts.length})
            <span className="text-fg-muted/50">{showHandled ? '▲' : '▼'}</span>
          </button>

          {showHandled && (
            <div className="space-y-2">
              {handledAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* Add more companies CTA */}
      {alerts.length > 0 && (
        <div className="mt-8 pt-6 border-t border-fg-border/40 text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-fg-muted hover:text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            Check another company
          </button>
        </div>
      )}
    </Layout>
  );
}
