import { useEffect, useState } from 'react';
import {
  Shield, Plus, Bell, Settings, LogOut, RefreshCw,
  AlertTriangle, CheckCircle, Clock, Building, ChevronRight, AlertCircle
} from 'lucide-react';
import { fetchDashboard, type DashboardStats, type MonitoredCompany, type AlertItem, type UserProfile } from '../utils/api';

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

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDashboard();
      setStats(data.stats);
      setCompanies(data.companies);
      setRecentAlerts(data.recentAlerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const getRiskBadge = (risk: string | null) => {
    switch (risk) {
      case 'high': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30">HIGH</span>;
      case 'medium': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">MEDIUM</span>;
      case 'low': return <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
      default: return <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/30">SECURE</span>;
    }
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'overdue': return <AlertCircle size={20} className="text-red-400" />;
      case 'warning': return <AlertTriangle size={20} className="text-yellow-400" />;
      default: return <CheckCircle size={20} className="text-green-400" />;
    }
  };

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
            <p className="text-slate-500 text-sm">{user.name} &middot; {user.plan} plan</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadDashboard} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onViewAlerts} className="relative p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <Bell size={18} />
            {stats && stats.unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                {stats.unreadAlerts > 9 ? '9+' : stats.unreadAlerts}
              </span>
            )}
          </button>
          <button onClick={onSettings} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition">
            <Settings size={18} />
          </button>
          <button onClick={onLogout} className="p-3 rounded-2xl bg-white/5 border border-white/10 text-slate-400 hover:text-red-400 hover:bg-white/10 transition">
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
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
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
        <a href="/acsp" className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center hover:bg-emerald-500/20 transition group">
          <Shield size={24} className="text-emerald-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">ACSP</div>
          <div className="text-xs text-slate-500">Service Provider</div>
        </a>
        <a href="/workflows" className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center hover:bg-blue-500/20 transition group">
          <Clock size={24} className="text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-sm font-bold text-white">Workflows</div>
          <div className="text-xs text-slate-500">Team & Tasks</div>
        </a>
        <button onClick={onAddCompany} className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 text-center hover:bg-purple-500/20 transition group">
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
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">Monitored Companies</h2>
            <button
              onClick={onAddCompany}
              className="flex items-center gap-2 bg-blue-500 text-navy px-5 py-3 rounded-full font-bold text-sm hover:scale-105 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Plus size={16} /> Add Company
            </button>
          </div>

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
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
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
          )}
        </div>

        {/* Recent alerts sidebar */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white">Recent Alerts</h2>
            {recentAlerts.length > 0 && (
              <button onClick={onViewAlerts} className="text-blue-400 text-sm font-semibold hover:text-blue-300">
                View all
              </button>
            )}
          </div>

          {recentAlerts.length === 0 ? (
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
      </div>
    </div>
  );
}
