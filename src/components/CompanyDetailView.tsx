import { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft, RefreshCw, Trash2, AlertCircle,
  FileText, Clock, Shield, Building, Bell,
  Copy, Check, Pencil, X as XIcon, Save,
} from 'lucide-react';
import {
  fetchCompanyDetail, refreshCompany, removeCompany, updateCompanyNotes,
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
  const [copied, setCopied] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

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

  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleCopyNumber = async () => {
    if (!company) return;
    try {
      await navigator.clipboard.writeText(company.companyNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleEditNotes = () => {
    setNotesValue(company?.notes || '');
    setEditingNotes(true);
    setTimeout(() => notesRef.current?.focus(), 50);
  };

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      const updated = await updateCompanyNotes(companyId, notesValue);
      setCompany(updated);
      setEditingNotes(false);
      toast.success('Notes saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes');
    } finally {
      setSavingNotes(false);
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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
        <button onClick={onBack} className="flex items-center gap-2 text-blue-400 hover:text-white transition">
          <ArrowLeft size={20} /> Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition text-sm font-semibold"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition text-sm font-semibold"
          >
            <Trash2 size={16} />
            <span className="hidden sm:inline">{deleting ? 'Removing...' : 'Remove'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Company header card */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-5 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <Building size={24} className="text-blue-400 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white">{company.companyName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <button
                  onClick={handleCopyNumber}
                  className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors group"
                  aria-label="Copy company number"
                >
                  <span className="font-mono text-sm">{company.companyNumber}</span>
                  {copied ? (
                    <Check size={14} className="text-green-400" />
                  ) : (
                    <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>
                <span className="text-slate-600">&middot;</span>
                <span className="text-slate-500 text-sm">{company.companyStatus || 'active'}</span>
              </div>
            </div>
          </div>
          {compliance && (
            <div className={`px-5 py-2 rounded-full text-sm font-bold uppercase shrink-0 ${
              compliance.status === 'compliant' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
              compliance.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
              'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}>
              {compliance.status}
            </div>
          )}
        </div>

        {/* Notes section */}
        <div className="mt-4 pl-0 sm:pl-[4rem]">
          {editingNotes ? (
            <div className="space-y-2">
              <textarea
                ref={notesRef}
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder="Add notes about this company..."
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5A4BFF]/50 resize-none"
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#5A4BFF] text-white text-xs font-bold hover:bg-[#6B5BFF] transition-colors disabled:opacity-50"
                >
                  <Save size={12} /> {savingNotes ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingNotes(false)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/5 text-slate-400 text-xs font-bold hover:bg-white/10 transition-colors"
                >
                  <XIcon size={12} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleEditNotes}
              className="group flex items-start gap-2 text-left w-full"
            >
              {company.notes ? (
                <>
                  <p className="text-slate-400 text-sm flex-1">{company.notes}</p>
                  <Pencil size={14} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 shrink-0" />
                </>
              ) : (
                <span className="text-slate-600 text-sm flex items-center gap-1.5 hover:text-slate-400 transition-colors">
                  <Pencil size={14} /> Add notes
                </span>
              )}
            </button>
          )}
        </div>

        {company.lastCheckedAt && (
          <p className="text-slate-600 text-xs mt-3 pl-0 sm:pl-[4rem]">Last checked: {formatDate(company.lastCheckedAt)}</p>
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
                  <div key={i} className="bg-red-500/10 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-white font-semibold">{f.description}</p>
                      <p className="text-red-300 text-sm">Due: {formatDate(f.dueDate)} ({Math.abs(f.daysUntilDue)} days overdue)</p>
                    </div>
                    {f.penaltyRisk !== undefined && f.penaltyRisk > 0 && (
                      <div className="text-right shrink-0">
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
                {compliance.upcomingDeadlines.map((d, i) => {
                  const urgent = d.daysUntilDue <= 14;
                  const soon = d.daysUntilDue <= 30;
                  return (
                    <div key={i} className={`rounded-2xl p-4 flex items-center justify-between ${
                      urgent ? 'bg-red-500/10' : soon ? 'bg-yellow-500/10' : 'bg-yellow-500/5'
                    }`}>
                      <div>
                        <p className="text-white font-semibold">{d.description}</p>
                        <p className={`text-sm ${urgent ? 'text-red-300' : 'text-yellow-300'}`}>Due: {formatDate(d.dueDate)}</p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <span className={`text-lg font-black ${
                          urgent ? 'text-red-400' : soon ? 'text-yellow-400' : 'text-green-400'
                        }`}>{d.daysUntilDue}</span>
                        <p className={`text-xs ${
                          urgent ? 'text-red-300' : soon ? 'text-yellow-300' : 'text-green-300'
                        }`}>{d.daysUntilDue === 1 ? 'day left' : 'days left'}</p>
                      </div>
                    </div>
                  );
                })}
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
