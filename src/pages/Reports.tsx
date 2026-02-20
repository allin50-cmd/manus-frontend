import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  Download, Building2,
  AlertTriangle, CheckCircle, Clock, BarChart3,
  PieChart,
} from 'lucide-react';
import { fetchDashboard, fetchAlerts, type MonitoredCompany, type AlertItem, type DashboardStats } from '../utils/api';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Reports() {
  usePageTitle('Reports');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<MonitoredCompany[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'alerts'>('overview');

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/login');
      return;
    }
    Promise.all([fetchDashboard(), fetchAlerts()])
      .then(([dash, alertList]) => {
        setStats(dash.stats);
        setCompanies(dash.companies);
        setAlerts(alertList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, setLocation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-[#5A4BFF]/30 border-t-[#5A4BFF] rounded-full animate-spin" />
      </div>
    );
  }

  const complianceRate = stats && stats.totalCompanies > 0
    ? Math.round((stats.compliantCount / stats.totalCompanies) * 100)
    : 0;

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: PieChart },
    { id: 'companies' as const, label: 'Companies', icon: Building2 },
    { id: 'alerts' as const, label: 'Alert History', icon: AlertTriangle },
  ];

  const handleExportCSV = () => {
    const rows = companies.map((c) => [c.companyNumber, c.companyName, c.companyStatus, c.complianceStatus, c.riskLevel, c.accountsNextDue, c.confirmationNextDue].join(','));
    const csv = ['Company Number,Company Name,Status,Compliance,Risk,Accounts Due,Confirmation Due', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fineguard-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen">
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">Reports</h1>
              <p className="text-slate-400">Compliance analytics and export tools</p>
            </div>
            <button onClick={handleExportCSV} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5A4BFF] text-white rounded-full font-bold text-sm hover:bg-[#6B5BFF] transition-colors">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Compliance Rate', value: `${complianceRate}%`, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
              { label: 'Companies Monitored', value: String(stats?.totalCompanies ?? 0), icon: Building2, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Active Warnings', value: String(stats?.warningCount ?? 0), icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
              { label: 'Overdue Filings', value: String(stats?.overdueCount ?? 0), icon: Clock, color: 'text-red-400', bg: 'bg-red-500/10' },
            ].map((s) => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-3', s.bg)}>
                  <s.icon className={clsx('w-5 h-5', s.color)} />
                </div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 mb-8 w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  activeTab === tab.id ? 'bg-[#5A4BFF] text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Compliance Breakdown */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-[#5A4BFF]" /> Compliance Breakdown</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Compliant', count: stats?.compliantCount ?? 0, color: 'bg-green-500', pct: stats && stats.totalCompanies > 0 ? Math.round(((stats.compliantCount) / stats.totalCompanies) * 100) : 0 },
                    { label: 'Warning', count: stats?.warningCount ?? 0, color: 'bg-amber-500', pct: stats && stats.totalCompanies > 0 ? Math.round(((stats.warningCount) / stats.totalCompanies) * 100) : 0 },
                    { label: 'Overdue', count: stats?.overdueCount ?? 0, color: 'bg-red-500', pct: stats && stats.totalCompanies > 0 ? Math.round(((stats.overdueCount) / stats.totalCompanies) * 100) : 0 },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm text-slate-300">{item.label}</span>
                        <span className="text-sm font-bold text-white">{item.count} ({item.pct}%)</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div className={clsx('h-full rounded-full transition-all duration-500', item.color)} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#5A4BFF]" /> Recent Alerts</h3>
                {alerts.length === 0 ? (
                  <p className="text-slate-500 text-sm">No alerts to display.</p>
                ) : (
                  <div className="space-y-3">
                    {alerts.slice(0, 8).map((alert) => (
                      <div key={alert.id} className="flex items-start gap-3">
                        <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'warning' ? 'bg-amber-500' : 'bg-blue-500')} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-white truncate">{alert.title}</p>
                          <p className="text-xs text-slate-500">{new Date(alert.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Company</th>
                      <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Number</th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="text-center py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Risk</th>
                      <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Accounts Due</th>
                      <th className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider">Confirmation Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((c) => (
                      <tr key={c.id} className="border-b border-white/5 hover:bg-white/[0.03]">
                        <td className="py-3 px-5 text-sm font-medium text-white">{c.companyName}</td>
                        <td className="py-3 px-5 text-sm text-slate-400 font-mono">{c.companyNumber}</td>
                        <td className="py-3 px-5 text-center">
                          <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', c.complianceStatus === 'compliant' ? 'bg-green-500/20 text-green-400' : c.complianceStatus === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')}>
                            {c.complianceStatus ?? 'Unknown'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-center">
                          <span className={clsx('text-xs', c.riskLevel === 'high' ? 'text-red-400' : c.riskLevel === 'medium' ? 'text-amber-400' : 'text-green-400')}>
                            {c.riskLevel ?? '-'}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-sm text-slate-400">{c.accountsNextDue ? new Date(c.accountsNextDue).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-5 text-sm text-slate-400">{c.confirmationNextDue ? new Date(c.confirmationNextDue).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                    {companies.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">No companies monitored yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'alerts' && (
            <div className="space-y-3">
              {alerts.length === 0 ? (
                <div className="text-center py-16">
                  <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No alert history to display.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-4">
                    <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', alert.severity === 'critical' ? 'bg-red-500/10' : alert.severity === 'warning' ? 'bg-amber-500/10' : 'bg-blue-500/10')}>
                      <AlertTriangle className={clsx('w-5 h-5', alert.severity === 'critical' ? 'text-red-400' : alert.severity === 'warning' ? 'text-amber-400' : 'text-blue-400')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
                      <p className="text-xs text-slate-600 mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                    <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0', alert.read ? 'bg-white/5 text-slate-500' : 'bg-[#5A4BFF]/20 text-[#5A4BFF]')}>
                      {alert.read ? 'Read' : 'New'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
