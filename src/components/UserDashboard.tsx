import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link } from 'wouter';
import {
  Shield, Plus, Bell, Settings, LogOut, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Building, ChevronRight, ChevronLeft, AlertCircle, Search,
  ArrowUpDown, Download, Filter,
} from 'lucide-react';
import { fetchDashboard, type DashboardStats, type MonitoredCompany, type AlertItem, type UserProfile } from '../utils/api';
import M365IntegrationPanel from './M365IntegrationPanel';

const RISK_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2, secure: 3 };
const STATUS_ORDER: Record<string, number> = { overdue: 0, warning: 1, compliant: 2 };

interface UserDashboardProps {
  user: UserProfile;
  onAddCompany: () => void;
  onViewCompany: (id: string) => void;
  onViewAlerts: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

export default function UserDashboard({ user, onAddCompany, onViewCompany, onViewAlerts, onSettings, onLogout }: UserDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [companies, setCompanies] = useState<MonitoredCompany[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'status'>('name');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'warning' | 'overdue'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const COMPANIES_PER_PAGE = 10;

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboard();
      setStats(data.stats);
      setCompanies(data.companies);
      setRecentAlerts(data.recentAlerts);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  // Keyboard shortcut: Ctrl/Cmd+K to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const formatLastRefreshed = useCallback(() => {
    if (!lastRefreshed) return '';
    const diff = Math.floor((Date.now() - lastRefreshed.getTime()) / 1000);
    if (diff < 10) return 'Just now';
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return lastRefreshed.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }, [lastRefreshed]);

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case 'high': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30" role="status">HIGH RISK</span>;
      case 'medium': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" role="status">MEDIUM RISK</span>;
      case 'low': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30" role="status">LOW RISK</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30" role="status">SECURE</span>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'overdue': return <span className="flex items-center gap-1"><AlertCircle size={20} className="text-red-400" aria-hidden="true" /><span className="sr-only">Overdue</span></span>;
      case 'warning': return <span className="flex items-center gap-1"><AlertTriangle size={20} className="text-yellow-400" aria-hidden="true" /><span className="sr-only">Warning</span></span>;
      default: return <span className="flex items-center gap-1"><CheckCircle size={20} className="text-green-400" aria-hidden="true" /><span className="sr-only">Compliant</span></span>;
    }
  };

  const filteredCompanies = useMemo(() => {
    let list = companies;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) => c.companyName.toLowerCase().includes(q) || c.companyNumber.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((c) => (c.complianceStatus || 'compliant') === statusFilter);
    }
    return [...list].sort((a, b) => {
      if (sortBy === 'risk') {
        return (RISK_ORDER[a.riskLevel || 'secure'] ?? 3) - (RISK_ORDER[b.riskLevel || 'secure'] ?? 3);
      }
      if (sortBy === 'status') {
        return (STATUS_ORDER[a.complianceStatus || 'compliant'] ?? 2) - (STATUS_ORDER[b.complianceStatus || 'compliant'] ?? 2);
      }
      return a.companyName.localeCompare(b.companyName);
    });
  }, [companies, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.ceil(filteredCompanies.length / COMPANIES_PER_PAGE);
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * COMPANIES_PER_PAGE;
    return filteredCompanies.slice(start, start + COMPANIES_PER_PAGE);
  }, [filteredCompanies, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, statusFilter, sortBy]);

  const exportCsv = useCallback(() => {
    if (companies.length === 0) return;
    const headers = ['Company Name', 'Company Number', 'Status', 'Risk Level', 'Compliance', 'Last Checked'];
    const rows = companies.map(c => [
      `"${c.companyName.replace(/"/g, '""')}"`,
      c.companyNumber,
      c.companyStatus || 'active',
      c.riskLevel || 'secure',
      c.complianceStatus || 'compliant',
      c.lastCheckedAt || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fineguard-companies-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [companies]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500/30 bg-red-500/5';
      case 'warning': return 'border-yellow-500/30 bg-yellow-500/5';
      default: return 'border-blue-500/30 bg-blue-500/5';
    }
  };

  return (
    <div className="py-8 animate-in fade-in duration-500">
      {/* Top nav bar */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <Shield size={32} className="text-blue-500" />
          <div>
            <h1 className="text-2xl font-black text-white">FineGuard Pro</h1>
            <p className="text-slate-500 text-sm">
              {user.name} &middot; {user.plan} plan
              {lastRefreshed && <span className="text-slate-600"> &middot; Updated {formatLastRefreshed()}</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboard} aria-label="Refresh dashboard" className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onViewAlerts} aria-label="View alerts" className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <Bell size={18} />
            {stats && stats.unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}
              </span>
            )}
          </button>
          <button onClick={onSettings} aria-label="Settings" className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <Settings size={18} />
          </button>
          <button onClick={onLogout} aria-label="Sign out" className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-white/10 transition">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-8">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Stats row */}
      {loading && !stats ? (
        <div id="tour-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center animate-pulse">
              <div className="h-9 w-12 bg-white/10 rounded-lg mx-auto mb-2" />
              <div className="h-3 w-16 bg-white/5 rounded mx-auto" />
            </div>
          ))}
        </div>
      ) : stats && (
        <div id="tour-stats" className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-black text-white">{stats.totalCompanies}</div>
            <div className="text-xs uppercase tracking-wider mt-1 text-slate-500">Monitored</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-black text-green-400">{stats.compliantCount}</div>
            <div className="text-xs uppercase tracking-wider mt-1 text-slate-500">Compliant</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-black text-yellow-400">{stats.warningCount}</div>
            <div className="text-xs uppercase tracking-wider mt-1 text-slate-500">Warnings</div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 text-center">
            <div className="text-3xl font-black text-red-400">{stats.overdueCount}</div>
            <div className="text-xs uppercase tracking-wider mt-1 text-slate-500">Overdue</div>
          </div>
        </div>
      )}

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Link href="/acsp" className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center hover:bg-emerald-500/20 transition group">
          <Shield size={24} className="text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">ACSP</div>
          <div className="text-xs text-slate-500">Service Provider</div>
        </Link>
        <Link href="/workflows" className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center hover:bg-blue-500/20 transition group">
          <Clock size={24} className="text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">Workflows</div>
          <div className="text-xs text-slate-500">Team & Tasks</div>
        </Link>
        <button id="tour-add-company" onClick={onAddCompany} className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center hover:bg-purple-500/20 transition group">
          <Plus size={24} className="text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">Add Company</div>
          <div className="text-xs text-slate-500">Monitor new</div>
        </button>
        <button onClick={onViewAlerts} className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 text-center hover:bg-orange-500/20 transition group relative">
          <Bell size={24} className="text-orange-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">Alerts</div>
          <div className="text-xs text-slate-500">View all</div>
          {stats && stats.unreadAlerts > 0 && (
            <span className="absolute top-2 right-2 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
              {stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}
            </span>
          )}
        </button>
      </div>

      {/* Companies + Alerts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Companies list */}
        <div id="tour-companies" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">Monitored Companies</h2>
            <div className="flex items-center gap-2">
              {companies.length > 0 && (
                <button
                  onClick={exportCsv}
                  aria-label="Export companies to CSV"
                  className="flex items-center gap-2 px-4 py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
                >
                  <Download size={14} /> Export
                </button>
              )}
              <button
                onClick={onAddCompany}
                className="flex items-center gap-2 bg-blue-500 text-navy px-5 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Plus size={16} /> Add Company
              </button>
            </div>
          </div>

          {companies.length > 3 && (
            <>
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search companies... (Ctrl+K)"
                    className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-[#5A4BFF]/50 transition"
                  />
                </div>
                <div className="flex items-center">
                  <button
                    onClick={() => setSortBy(sortBy === 'name' ? 'risk' : sortBy === 'risk' ? 'status' : 'name')}
                    className="flex items-center gap-1.5 px-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-xs font-semibold whitespace-nowrap"
                    aria-label="Change sort order"
                  >
                    <ArrowUpDown size={14} />
                    {sortBy === 'name' ? 'A-Z' : sortBy === 'risk' ? 'Risk' : 'Status'}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Filter size={14} className="text-slate-500" />
                {(['all', 'compliant', 'warning', 'overdue'] as const).map((s) => {
                  const count = s === 'all' ? companies.length : companies.filter(c => (c.complianceStatus || 'compliant') === s).length;
                  return (
                    <button
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition ${
                        statusFilter === s
                          ? s === 'overdue' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : s === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : s === 'compliant' ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-[#5A4BFF]/20 text-[#5A4BFF] border border-[#5A4BFF]/30'
                          : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                      }`}
                    >
                      {s}{s !== 'all' ? ` (${count})` : ''}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {loading && companies.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
              <RefreshCw size={32} className="animate-spin text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500">Loading your portfolio...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
              <Building size={48} className="text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">No companies yet</h3>
              <p className="text-slate-500 mb-6">Add your first company to start monitoring compliance.</p>
              <button
                onClick={onAddCompany}
                className="bg-blue-500 text-navy px-8 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all"
              >
                Add Your First Company
              </button>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
              <Search size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">
                {searchQuery ? <>No companies match &ldquo;{searchQuery}&rdquo;</> : `No ${statusFilter} companies`}
              </p>
              {statusFilter !== 'all' && (
                <button onClick={() => setStatusFilter('all')} className="text-[#5A4BFF] text-xs font-semibold mt-2 hover:underline">
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedCompanies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => onViewCompany(company.id)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 hover:bg-white/10 transition text-left group"
                  >
                    {getStatusIcon(company.complianceStatus)}
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{company.companyName}</p>
                      <p className="text-slate-500 text-sm">{company.companyNumber} &middot; {company.companyStatus || 'active'}</p>
                    </div>
                    {getRiskBadge(company.riskLevel)}
                    <ChevronRight size={16} className="text-slate-600 group-hover:text-slate-300 transition" />
                  </button>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-slate-500 text-xs">
                    {(currentPage - 1) * COMPANIES_PER_PAGE + 1}&ndash;{Math.min(currentPage * COMPANIES_PER_PAGE, filteredCompanies.length)} of {filteredCompanies.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition ${
                          p === currentPage
                            ? 'bg-[#5A4BFF] text-white'
                            : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition disabled:opacity-30 disabled:pointer-events-none"
                      aria-label="Next page"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Sidebar: Recent alerts + M365 */}
        <div id="tour-alerts" className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-white">Recent Alerts</h2>
              {recentAlerts.length > 0 && (
                <button onClick={onViewAlerts} className="text-blue-400 text-sm font-semibold hover:text-blue-300">
                  View all
                </button>
              )}
            </div>

            {loading && recentAlerts.length === 0 ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="border border-white/10 bg-white/5 rounded-2xl p-4 animate-pulse">
                    <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                  </div>
                ))}
              </div>
            ) : recentAlerts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                <Bell size={32} className="text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No new alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAlerts.map((alert) => (
                  <div key={alert.id} className={`border rounded-2xl p-4 ${getSeverityColor(alert.severity)}`}>
                    <p className="text-white text-sm font-semibold mb-1">{alert.title}</p>
                    <p className="text-slate-400 text-xs line-clamp-2">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* M365 Integration Panel */}
          <M365IntegrationPanel />
        </div>
      </div>
    </div>
  );
}
