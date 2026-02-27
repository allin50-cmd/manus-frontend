import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Bell, CheckCheck, RefreshCw, AlertCircle, AlertTriangle, Info, Filter } from 'lucide-react';
import { fetchAlerts, markAlertRead, markAllAlertsRead, type AlertItem } from '../utils/api';

interface AlertsViewProps {
  onBack: () => void;
}

export default function AlertsView({ onBack }: AlertsViewProps) {
  const [alertsList, setAlertsList] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [readFilter, setReadFilter] = useState<'all' | 'unread' | 'read'>('all');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await fetchAlerts();
      setAlertsList(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAlerts(); }, []);

  const handleMarkRead = async (id: string) => {
    const prev = alertsList;
    setAlertsList(list => list.map(a => a.id === id ? { ...a, read: true } : a));
    try {
      await markAlertRead(id);
    } catch (err) {
      setAlertsList(prev);
      toast.error('Failed to mark alert as read');
    }
  };

  const handleMarkAll = async () => {
    const prev = alertsList;
    setAlertsList(list => list.map(a => ({ ...a, read: true })));
    try {
      await markAllAlertsRead();
    } catch (err) {
      setAlertsList(prev);
      toast.error('Failed to mark all alerts as read');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle size={18} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={18} className="text-yellow-400" />;
      default: return <Info size={18} className="text-blue-400" />;
    }
  };

  const getSeverityStyle = (severity: string, read: boolean) => {
    const opacity = read ? 'opacity-50' : '';
    switch (severity) {
      case 'critical': return `bg-red-500/5 border-red-500/20 ${opacity}`;
      case 'warning': return `bg-yellow-500/5 border-yellow-500/20 ${opacity}`;
      default: return `bg-blue-500/5 border-blue-500/20 ${opacity}`;
    }
  };

  const formatDate = (d: string) => {
    try {
      const date = new Date(d);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const filteredAlerts = useMemo(() => {
    let list = alertsList;
    if (severityFilter !== 'all') {
      list = list.filter(a => a.severity === severityFilter);
    }
    if (readFilter === 'unread') {
      list = list.filter(a => !a.read);
    } else if (readFilter === 'read') {
      list = list.filter(a => a.read);
    }
    return list;
  }, [alertsList, severityFilter, readFilter]);

  const formatAlertType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const unreadCount = alertsList.filter(a => !a.read).length;

  return (
    <div className="py-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-white transition">
          <ArrowLeft size={20} /> Dashboard
        </button>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAll}
              className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
          <button
            onClick={loadAlerts}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Bell size={28} className="text-blue-400" />
        <h1 className="text-2xl font-black text-white">Alerts</h1>
        {unreadCount > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">{unreadCount} unread</span>
        )}
      </div>

      {/* Severity filter chips */}
      {alertsList.length > 0 && (
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <Filter size={14} className="text-slate-500" />
          {(['all', 'critical', 'warning', 'info'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setSeverityFilter(level)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase transition ${
                severityFilter === level
                  ? level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : level === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    : level === 'info' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-[#5A4BFF]/20 text-[#5A4BFF] border border-[#5A4BFF]/30'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {level}{level !== 'all' && ` (${alertsList.filter(a => a.severity === level).length})`}
            </button>
          ))}
          <span className="w-px h-5 bg-white/10 mx-1" />
          {(['all', 'unread', 'read'] as const).map((rf) => (
            <button
              key={rf}
              onClick={() => setReadFilter(rf)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition ${
                readFilter === rf
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }`}
            >
              {rf}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && alertsList.length === 0 ? (
        <div className="text-center py-20">
          <RefreshCw size={32} className="animate-spin text-slate-500 mx-auto mb-4" />
          <p className="text-slate-500">Loading alerts...</p>
        </div>
      ) : alertsList.length === 0 ? (
        <div className="text-center py-20 bg-white/5 border border-white/10 rounded-3xl">
          <Bell size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">No alerts yet</h3>
          <p className="text-slate-500">Alerts will appear here when compliance issues are detected.</p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="text-center py-16 bg-white/5 border border-white/10 rounded-3xl">
          <Filter size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No {severityFilter} alerts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => !alert.read && handleMarkRead(alert.id)}
              className={`border rounded-2xl p-5 transition cursor-pointer hover:bg-white/5 ${getSeverityStyle(alert.severity, alert.read)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <p className={`font-semibold text-sm ${alert.read ? 'text-slate-400' : 'text-white'}`}>{alert.title}</p>
                    <span className="text-slate-600 text-xs whitespace-nowrap">{formatDate(alert.createdAt)}</span>
                  </div>
                  <p className="text-slate-400 text-sm mt-1">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`text-xs font-bold uppercase ${
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'warning' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>{alert.severity}</span>
                    <span className="text-slate-600 text-xs">{formatAlertType(alert.type)}</span>
                    {!alert.read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
