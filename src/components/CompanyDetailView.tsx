import { useEffect, useState } from 'react';
import {
  ArrowLeft, RefreshCw, Trash2, AlertCircle,
  FileText, Clock, Shield, Building, Bell
} from 'lucide-react';
import {
  fetchCompanyDetail, refreshCompany, removeCompany,
  type MonitoredCompany, type ComplianceDetail, type AlertItem
} from '../utils/api';
import { formatDateShort } from '../utils/formatting';
import { toast } from 'sonner';
import AlertTriggerPanel from './AlertTriggerPanel';

interface CompanyDetailViewProps {
  companyId: string;
  onBack: () => void;
  onDeleted: () => void;
}

export default function CompanyDetailView({ companyId, onBack, onDeleted }: CompanyDetailViewProps) {
  const [company, setCompany] = useState<MonitoredCompany | null>(null);
  const [compliance, setCompliance] = useState<ComplianceDetail | null>(null);
  const [companyAlerts, setCompanyAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchCompanyDetail(companyId);
      setCompany(data.company);
      setCompliance(data.compliance);
      setCompanyAlerts(data.alerts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load company');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [companyId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const fresh = await refreshCompany(companyId);
      setCompliance(fresh);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async () => {
    if (refreshing) {
      toast.error('Please wait for refresh to complete');
      return;
    }
    if (!confirm('Remove this company from monitoring? This will also delete all related alerts.')) return;
    setDeleting(true);
    try {
      await removeCompany(companyId);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
      setDeleting(false);
    }
  };

  const formatDate = (d: string | null) => formatDateShort(d);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw size={40} className="animate-spin text-slate-500 mx-auto mb-4" />
        <p className="text-slate-500">Loading company details...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="py-20 text-center">
        <AlertCircle size={40} className="text-red-400 mx-auto mb-4" />
        <p className="text-red-400">{error || 'Company not found'}</p>
        <button onClick={onBack} className="text-blue-400 mt-4 hover:text-blue-300">Go back</button>
      </div>
    );
  }

  return (
    <div className="py-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-white transition">
          <ArrowLeft size={20} /> Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition text-sm font-semibold"
          >
            <Trash2 size={16} />
            {deleting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Company header card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center">
              <Building size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">{company.companyName}</h1>
              <p className="text-slate-500">{company.companyNumber} &middot; {company.companyStatus || 'active'}</p>
            </div>
          </div>
          {compliance && (
            <div className={`px-5 py-2 rounded-full text-sm font-bold uppercase ${
              compliance.status === 'compliant' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              compliance.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {compliance.status}
            </div>
          )}
        </div>
        {company.notes && (
          <p className="text-slate-400 text-sm mt-4 pl-[4.5rem]">{company.notes}</p>
        )}
        {company.lastCheckedAt && (
          <p className="text-slate-600 text-xs mt-3 pl-[4.5rem]">Last checked: {formatDate(company.lastCheckedAt)}</p>
        )}
      </div>

      {/* Alert Trigger Panel */}
      {compliance && (
        <div className="mb-6">
          <AlertTriggerPanel
            companyId={companyId}
            companyName={company.companyName}
            riskLevel={
              compliance.overdueFilings.length > 0 ? 'critical' :
              compliance.status === 'compliant' ? 'low' :
              compliance.status === 'warning' ? 'medium' :
              'high'
            }
          />
        </div>
      )}

      {/* Compliance details */}
      {compliance && (
        <>
          {/* Filing deadlines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className={`border rounded-3xl p-6 ${
              compliance.accounts.overdue ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <FileText size={18} className={compliance.accounts.overdue ? 'text-red-400' : 'text-blue-400'} />
                <h3 className="text-white font-bold">Annual Accounts</h3>
              </div>
              {compliance.accounts.nextDue !== 'N/A' ? (
                <>
                  <p className={`text-2xl font-black mb-1 ${
                    compliance.accounts.overdue ? 'text-red-400' : compliance.accounts.daysUntilDue <= 30 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {compliance.accounts.overdue
                      ? `${Math.abs(compliance.accounts.daysUntilDue)} days overdue`
                      : `Due in ${compliance.accounts.daysUntilDue} days`}
                  </p>
                  <p className="text-slate-500 text-sm">Due: {formatDate(compliance.accounts.nextDue)}</p>
                </>
              ) : (
                <p className="text-slate-500">No accounts data available</p>
              )}
            </div>

            <div className={`border rounded-3xl p-6 ${
              compliance.confirmationStatement.overdue ? 'bg-red-500/5 border-red-500/20' : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <FileText size={18} className={compliance.confirmationStatement.overdue ? 'text-red-400' : 'text-blue-400'} />
                <h3 className="text-white font-bold">Confirmation Statement</h3>
              </div>
              {compliance.confirmationStatement.nextDue !== 'N/A' ? (
                <>
                  <p className={`text-2xl font-black mb-1 ${
                    compliance.confirmationStatement.overdue ? 'text-red-400' : compliance.confirmationStatement.daysUntilDue <= 30 ? 'text-yellow-400' : 'text-green-400'
                  }`}>
                    {compliance.confirmationStatement.overdue
                      ? `${Math.abs(compliance.confirmationStatement.daysUntilDue)} days overdue`
                      : `Due in ${compliance.confirmationStatement.daysUntilDue} days`}
                  </p>
                  <p className="text-slate-500 text-sm">Due: {formatDate(compliance.confirmationStatement.nextDue)}</p>
                </>
              ) : (
                <p className="text-slate-500">No confirmation statement data available</p>
              )}
            </div>
          </div>

          {/* Overdue filings */}
          {compliance.overdueFilings.length > 0 && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 mb-6">
              <h3 className="text-red-400 font-black text-lg mb-4 flex items-center gap-2">
                <AlertCircle size={20} /> Overdue Filings
              </h3>
              <div className="space-y-3">
                {compliance.overdueFilings.map((f, i) => (
                  <div key={i} className="bg-red-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{f.description}</p>
                      <p className="text-red-300 text-sm">Due: {formatDate(f.dueDate)} ({Math.abs(f.daysUntilDue)} days overdue)</p>
                    </div>
                    {f.penaltyRisk !== undefined && f.penaltyRisk > 0 && (
                      <div className="text-right">
                        <p className="text-red-400 font-black text-xl">&pound;{f.penaltyRisk.toLocaleString()}</p>
                        <p className="text-red-300 text-xs">penalty risk</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming deadlines */}
          {compliance.upcomingDeadlines.length > 0 && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-3xl p-6 mb-6">
              <h3 className="text-yellow-400 font-black text-lg mb-4 flex items-center gap-2">
                <Clock size={20} /> Upcoming Deadlines
              </h3>
              <div className="space-y-3">
                {compliance.upcomingDeadlines.map((d, i) => (
                  <div key={i} className="bg-yellow-500/10 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-semibold">{d.description}</p>
                      <p className="text-yellow-300 text-sm">Due: {formatDate(d.dueDate)}</p>
                    </div>
                    <span className="text-yellow-400 font-bold">{d.daysUntilDue} days</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Penalties */}
          {compliance.penalties && compliance.penalties.length > 0 && (
            <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 mb-6">
              <h3 className="text-orange-400 font-black text-lg mb-4 flex items-center gap-2">
                <Shield size={20} /> Estimated Penalties
              </h3>
              {compliance.penalties.map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <p className="text-slate-300 text-sm">{p.description}</p>
                  <p className="text-orange-400 font-bold">&pound;{p.estimated.toLocaleString()}</p>
                </div>
              ))}
              <div className="border-t border-orange-500/20 mt-3 pt-3 flex justify-between">
                <p className="text-white font-bold">Total</p>
                <p className="text-orange-400 font-black text-xl">
                  &pound;{compliance.penalties.reduce((s, p) => s + p.estimated, 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Last filing */}
          {compliance.lastFiling && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
              <h3 className="text-white font-bold mb-2">Last Filing</h3>
              <p className="text-slate-400">{compliance.lastFiling.type}</p>
              <p className="text-slate-500 text-sm">{formatDate(compliance.lastFiling.date)}</p>
            </div>
          )}
        </>
      )}

      {/* Company alerts */}
      {companyAlerts.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
            <Bell size={20} className="text-blue-400" /> Alert History
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {companyAlerts.map((alert) => (
              <div key={alert.id} className={`rounded-2xl p-4 border ${
                alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' :
                alert.severity === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' :
                'bg-blue-500/5 border-blue-500/20'
              } ${alert.read ? 'opacity-60' : ''}`}>
                <p className="text-white text-sm font-semibold">{alert.title}</p>
                <p className="text-slate-400 text-xs mt-1">{alert.message}</p>
                <p className="text-slate-600 text-xs mt-2">{formatDate(alert.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
