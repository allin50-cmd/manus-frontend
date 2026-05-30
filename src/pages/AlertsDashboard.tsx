import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  RefreshCw,
  Plus,
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

interface Company {
  id: string;
  companyNumber: string;
  companyName: string;
}

interface AlertEvent {
  id: string;
  action: string;
  note?: string;
  createdAt: string;
  actor?: string;
}

interface Alert {
  id: string;
  ref: string;
  title: string;
  description?: string;
  source?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ESCALATED' | 'CLOSED';
  score?: number;
  companyId?: string;
  createdAt: string;
  updatedAt: string;
  events?: AlertEvent[];
}

const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  MEDIUM: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  HIGH: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  CRITICAL: 'bg-red-500/20 text-red-400 border-red-500/50',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  ESCALATED: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
  CLOSED: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

function AdminKeyModal({ onSave }: { onSave: (key: string) => void }) {
  const [key, setKey] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 w-full max-w-sm mx-4">
        <Shield className="w-10 h-10 text-[#5A4BFF] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Admin access required</h2>
        <p className="text-sm text-gray-400 mb-6">
          Enter your admin key to access the FineGuard Alert Centre.
        </p>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && key && onSave(key)}
          className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-[#5A4BFF] mb-4"
          placeholder="sk-admin-..."
          autoFocus
        />
        <button
          onClick={() => key && onSave(key)}
          className="w-full px-6 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors"
        >
          Access Alert Centre
        </button>
      </div>
    </div>
  );
}

function NewAlertModal({
  onClose,
  onCreated,
  adminKey,
  companyId,
}: {
  onClose: () => void;
  onCreated: () => void;
  adminKey: string;
  companyId?: string;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    source: '',
    severity: 'MEDIUM',
    companyId: companyId || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-ADMIN-KEY': adminKey,
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success('Alert created');
        onCreated();
        onClose();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create alert');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">New Alert</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#5A4BFF]"
              placeholder="Alert title"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#5A4BFF] resize-none"
              placeholder="Optional description"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Source</label>
            <input
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#5A4BFF]"
              placeholder="e.g. companies-house, manual"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Severity</label>
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="w-full bg-[#0F1014] border border-[#2A2D3A] rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#5A4BFF]"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-white/20 text-white rounded-lg hover:border-white/40 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-[#5A4BFF] hover:bg-[#6B5BFF] disabled:opacity-50 text-white font-semibold rounded-lg transition-colors text-sm"
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailPanel({
  alert,
  onClose,
  onAction,
  adminKey,
}: {
  alert: Alert;
  onClose: () => void;
  onAction: () => void;
  adminKey: string;
}) {
  const doAction = async (action: 'acknowledge' | 'escalate' | 'close', note?: string) => {
    try {
      const statusMap = { acknowledge: 'OPEN', escalate: 'ESCALATED', close: 'CLOSED' };
      const res = await fetch(`/api/alerts/${alert.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': adminKey },
        body: JSON.stringify({ status: statusMap[action], note }),
      });
      if (res.ok) {
        toast.success(`Alert ${action}d`);
        onAction();
      } else {
        const d = await res.json();
        toast.error(d.error || 'Action failed');
      }
    } catch {
      toast.error('Network error');
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex">
      <div className="flex-1 bg-black/50" onClick={onClose} />
      <div className="w-full max-w-md bg-[#0F1014] border-l border-[#2A2D3A] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-xs font-mono text-gray-500 mb-1">{alert.ref}</p>
              <h2 className="text-lg font-bold text-white">{alert.title}</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white ml-4 flex-shrink-0">
              <X className="w-5 h-5" />
            </button>
          </div>

          {alert.description && (
            <p className="text-sm text-gray-400 mb-6">{alert.description}</p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-[#13151C] rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Severity</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${SEVERITY_COLORS[alert.severity]}`}>
                {alert.severity}
              </span>
            </div>
            <div className="bg-[#13151C] rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_COLORS[alert.status]}`}>
                {alert.status}
              </span>
            </div>
            {alert.score !== undefined && (
              <div className="bg-[#13151C] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Score</p>
                <p className="text-sm font-semibold text-white">{alert.score}</p>
              </div>
            )}
            {alert.source && (
              <div className="bg-[#13151C] rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Source</p>
                <p className="text-sm text-gray-300">{alert.source}</p>
              </div>
            )}
          </div>

          {alert.status !== 'CLOSED' && (
            <div className="flex gap-2 mb-6">
              {alert.status === 'OPEN' && (
                <button
                  onClick={() => doAction('acknowledge')}
                  className="flex-1 px-3 py-2 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                >
                  Acknowledge
                </button>
              )}
              {alert.status !== 'ESCALATED' && (
                <button
                  onClick={() => doAction('escalate')}
                  className="flex-1 px-3 py-2 text-xs bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg hover:bg-orange-500/30 transition-colors"
                >
                  Escalate
                </button>
              )}
              <button
                onClick={() => doAction('close')}
                className="flex-1 px-3 py-2 text-xs bg-gray-500/20 text-gray-300 border border-gray-500/30 rounded-lg hover:bg-gray-500/30 transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {/* Event history */}
          {alert.events && alert.events.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Event history
              </h3>
              <div className="space-y-3">
                {alert.events.map((ev) => (
                  <div key={ev.id} className="flex gap-3 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5A4BFF] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-gray-300 capitalize">{ev.action.replace('_', ' ')}</p>
                      {ev.note && <p className="text-gray-500 text-xs">{ev.note}</p>}
                      <p className="text-gray-600 text-xs mt-0.5">
                        {new Date(ev.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlertsDashboard() {
  const [adminKey, setAdminKey] = useState<string>(() => {
    try { return localStorage.getItem('ultai_admin_key') || ''; } catch { return ''; }
  });
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const handleSaveKey = (key: string) => {
    try { localStorage.setItem('ultai_admin_key', key); } catch { /* noop */ }
    setAdminKey(key);
  };

  const fetchCompanies = useCallback(async () => {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/companies', {
        headers: { 'X-ADMIN-KEY': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setCompanies(Array.isArray(data) ? data : data.companies || []);
      }
    } catch {
      // companies endpoint optional
    }
  }, [adminKey]);

  const fetchAlerts = useCallback(async () => {
    if (!adminKey) return;
    setLoading(true);
    try {
      const url = selectedCompanyId
        ? `/api/alerts?companyId=${encodeURIComponent(selectedCompanyId)}`
        : '/api/alerts';
      const res = await fetch(url, {
        headers: { 'X-ADMIN-KEY': adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(Array.isArray(data) ? data : data.alerts || []);
      } else if (res.status === 401) {
        toast.error('Invalid admin key');
        setAdminKey('');
        try { localStorage.removeItem('ultai_admin_key'); } catch { /* noop */ }
      } else {
        toast.error('Failed to fetch alerts');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }, [adminKey, selectedCompanyId]);

  useEffect(() => {
    if (adminKey) {
      fetchCompanies();
      fetchAlerts();
    }
  }, [adminKey, fetchCompanies, fetchAlerts]);

  const counts = {
    OPEN: alerts.filter((a) => a.status === 'OPEN').length,
    ESCALATED: alerts.filter((a) => a.status === 'ESCALATED').length,
    CRITICAL: alerts.filter((a) => a.severity === 'CRITICAL').length,
    CLOSED: alerts.filter((a) => a.status === 'CLOSED').length,
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'HIGH': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  if (!adminKey) {
    return <AdminKeyModal onSave={handleSaveKey} />;
  }

  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#C9A64A]" />
            <div>
              <h1 className="text-2xl font-bold text-white">FineGuard Alert Centre</h1>
              <p className="text-sm text-gray-400">Monitor and manage compliance alerts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {companies.length > 0 && (
              <div className="relative">
                <select
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="appearance-none bg-[#13151C] border border-[#2A2D3A] rounded-lg px-4 py-2 pr-8 text-sm text-white focus:outline-none focus:border-[#5A4BFF]"
                >
                  <option value="">All companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
            <button
              onClick={fetchAlerts}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-[#13151C] border border-[#2A2D3A] hover:border-[#3A3D4A] text-white text-sm rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Alert
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Open', value: counts.OPEN, color: 'text-blue-400' },
            { label: 'Escalated', value: counts.ESCALATED, color: 'text-orange-400' },
            { label: 'Critical', value: counts.CRITICAL, color: 'text-red-400' },
            { label: 'Closed', value: counts.CLOSED, color: 'text-gray-400' },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Alerts table */}
        <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2A2D3A]">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ref / Title</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Severity</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">Score</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Created</th>
                  <th className="text-left px-4 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-gray-500">
                      <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      {loading ? 'Loading alerts...' : 'No alerts found'}
                    </td>
                  </tr>
                ) : (
                  alerts.map((alert) => (
                    <tr
                      key={alert.id}
                      className="border-b border-[#2A2D3A] hover:bg-[#1A1D28] cursor-pointer transition-colors"
                      onClick={() => setSelectedAlert(alert)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {getSeverityIcon(alert.severity)}
                          <div>
                            <p className="text-sm font-medium text-white">{alert.title}</p>
                            <p className="text-xs font-mono text-gray-500">{alert.ref}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${SEVERITY_COLORS[alert.severity]}`}>
                          {alert.severity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${STATUS_COLORS[alert.status]}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden md:table-cell">
                        <span className="text-sm text-gray-400">{alert.score ?? '—'}</span>
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <span className="text-xs text-gray-500">
                          {new Date(alert.createdAt).toLocaleDateString('en-GB')}
                        </span>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          {alert.status !== 'CLOSED' && (
                            <>
                              {alert.status === 'OPEN' && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const res = await fetch(`/api/alerts/${alert.id}`, {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': adminKey },
                                        body: JSON.stringify({ status: 'OPEN', note: 'Acknowledged' }),
                                      });
                                      if (res.ok) { toast.success('Acknowledged'); fetchAlerts(); }
                                    } catch { toast.error('Error'); }
                                  }}
                                  className="text-xs px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded hover:bg-blue-500/20 transition-colors"
                                >
                                  Ack
                                </button>
                              )}
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/alerts/${alert.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': adminKey },
                                      body: JSON.stringify({ status: 'ESCALATED' }),
                                    });
                                    if (res.ok) { toast.success('Escalated'); fetchAlerts(); }
                                  } catch { toast.error('Error'); }
                                }}
                                className="text-xs px-2 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded hover:bg-orange-500/20 transition-colors"
                              >
                                Esc
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch(`/api/alerts/${alert.id}`, {
                                      method: 'PATCH',
                                      headers: { 'Content-Type': 'application/json', 'X-ADMIN-KEY': adminKey },
                                      body: JSON.stringify({ status: 'CLOSED' }),
                                    });
                                    if (res.ok) { toast.success('Closed'); fetchAlerts(); }
                                  } catch { toast.error('Error'); }
                                }}
                                className="text-xs px-2 py-1 bg-gray-500/10 text-gray-400 border border-gray-500/20 rounded hover:bg-gray-500/20 transition-colors"
                              >
                                Close
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-600 text-center mt-4">
          Admin key stored locally.{' '}
          <button
            onClick={() => {
              try { localStorage.removeItem('ultai_admin_key'); } catch { /* noop */ }
              setAdminKey('');
            }}
            className="underline hover:text-gray-400 transition-colors"
          >
            Clear key
          </button>
        </p>
      </div>

      {selectedAlert && (
        <DetailPanel
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onAction={() => { fetchAlerts(); setSelectedAlert(null); }}
          adminKey={adminKey}
        />
      )}

      {showNewModal && (
        <NewAlertModal
          onClose={() => setShowNewModal(false)}
          onCreated={fetchAlerts}
          adminKey={adminKey}
          companyId={selectedCompanyId}
        />
      )}
    </div>
  );
}
