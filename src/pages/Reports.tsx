import { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../context/AuthContext';
import {
  Download, Building2, Search, ArrowUpDown,
  AlertTriangle, CheckCircle, Clock, BarChart3,
  PieChart, ChevronLeft, ChevronRight, ShieldAlert, TrendingUp,
} from 'lucide-react';
import { fetchDashboard, fetchAlerts, type MonitoredCompany, type AlertItem, type DashboardStats } from '../utils/api';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';
import { toast } from 'sonner';
import Breadcrumb from '../components/Breadcrumb';

type SortKey = 'companyName' | 'companyNumber' | 'complianceStatus' | 'riskLevel' | 'accountsNextDue' | 'confirmationNextDue';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 10;

export default function Reports() {
  usePageTitle('Reports');
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<MonitoredCompany[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'alerts'>('overview');

  // Table interactivity state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('companyName');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [currentPage, setCurrentPage] = useState(1);

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
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load reports data');
        toast.error('Failed to load reports data');
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated, setLocation]);

  // Filtered + sorted + paginated companies
  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.companyName?.toLowerCase().includes(q) ||
          c.companyNumber?.toLowerCase().includes(q) ||
          c.complianceStatus?.toLowerCase().includes(q) ||
          c.riskLevel?.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [companies, searchQuery, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Reset page when search changes
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-4 border-[#5A4BFF]/30 border-t-[#5A4BFF] rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <p className="text-red-400 text-lg font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2.5 bg-[#5A4BFF] text-white rounded-full font-bold text-sm hover:bg-[#6B5BFF] transition-colors"
        >
          Retry
        </button>
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
    const escapeCSV = (val: string | null | undefined) => {
      if (val == null) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };
    const rows = companies.map((c) => [escapeCSV(c.companyNumber), escapeCSV(c.companyName), escapeCSV(c.companyStatus), escapeCSV(c.complianceStatus), escapeCSV(c.riskLevel), escapeCSV(c.accountsNextDue), escapeCSV(c.confirmationNextDue)].join(','));
    const csv = ['"Company Number","Company Name","Status","Compliance","Risk","Accounts Due","Confirmation Due"', ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fineguard-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortableHeader = ({ label, colKey }: { label: string; colKey: SortKey }) => (
    <th
      className="text-left py-3 px-5 text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
      onClick={() => handleSort(colKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className={clsx('w-3 h-3', sortKey === colKey ? 'text-[#5A4BFF]' : 'text-slate-600')} />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen">
      <section className="py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Reports' }]} />
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
            <div className="space-y-6">
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

                {/* Risk Level Breakdown */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-[#5A4BFF]" /> Risk Distribution</h3>
                  {(() => {
                    const riskCounts = { high: 0, medium: 0, low: 0, secure: 0 };
                    companies.forEach(c => {
                      const r = (c.riskLevel || 'secure') as keyof typeof riskCounts;
                      if (r in riskCounts) riskCounts[r]++;
                      else riskCounts.secure++;
                    });
                    const total = companies.length || 1;
                    const items = [
                      { label: 'High Risk', count: riskCounts.high, color: 'bg-red-500', textColor: 'text-red-400' },
                      { label: 'Medium Risk', count: riskCounts.medium, color: 'bg-amber-500', textColor: 'text-amber-400' },
                      { label: 'Low Risk', count: riskCounts.low, color: 'bg-blue-500', textColor: 'text-blue-400' },
                      { label: 'Secure', count: riskCounts.secure, color: 'bg-green-500', textColor: 'text-green-400' },
                    ];
                    return (
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.label}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-slate-300">{item.label}</span>
                              <span className="text-sm font-bold text-white">{item.count} ({Math.round((item.count / total) * 100)}%)</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={clsx('h-full rounded-full transition-all duration-500', item.color)} style={{ width: `${Math.round((item.count / total) * 100)}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alert Severity Summary */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#5A4BFF]" /> Alert Summary</h3>
                  {alerts.length === 0 ? (
                    <p className="text-slate-500 text-sm">No alerts to display.</p>
                  ) : (
                    <div className="space-y-4">
                      {(['critical', 'warning', 'info'] as const).map((severity) => {
                        const count = alerts.filter(a => a.severity === severity).length;
                        const unread = alerts.filter(a => a.severity === severity && !a.read).length;
                        return (
                          <div key={severity} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5">
                            <div className="flex items-center gap-3">
                              <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center',
                                severity === 'critical' ? 'bg-red-500/15' : severity === 'warning' ? 'bg-amber-500/15' : 'bg-blue-500/15'
                              )}>
                                <AlertTriangle className={clsx('w-4 h-4', severity === 'critical' ? 'text-red-400' : severity === 'warning' ? 'text-amber-400' : 'text-blue-400')} />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white capitalize">{severity}</p>
                                {unread > 0 && <p className="text-xs text-slate-500">{unread} unread</p>}
                              </div>
                            </div>
                            <span className="text-lg font-black text-white">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            </div>
          )}

          {activeTab === 'companies' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b border-white/10">
                <div className="relative max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search companies..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#5A4BFF]/60 focus:ring-1 focus:ring-[#5A4BFF]/20 transition-all"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <SortableHeader label="Company" colKey="companyName" />
                      <SortableHeader label="Number" colKey="companyNumber" />
                      <SortableHeader label="Status" colKey="complianceStatus" />
                      <SortableHeader label="Risk" colKey="riskLevel" />
                      <SortableHeader label="Accounts Due" colKey="accountsNextDue" />
                      <SortableHeader label="Confirmation Due" colKey="confirmationNextDue" />
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedCompanies.map((c) => (
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
                    {paginatedCompanies.length === 0 && (
                      <tr><td colSpan={6} className="py-12 text-center text-slate-500">
                        {searchQuery ? 'No companies match your search.' : 'No companies monitored yet.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredCompanies.length > PAGE_SIZE && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
                  <span className="text-xs text-slate-500">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredCompanies.length)} of {filteredCompanies.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-xs font-medium transition-colors',
                          page === currentPage ? 'bg-[#5A4BFF] text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                        )}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
