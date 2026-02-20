import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import {
  fetchAcspClients, addAcspClient, updateAcspClient, deleteAcspClient,
  fetchAcspFilings, addAcspFiling, updateAcspFiling, fetchAcspDashboard,
  type AcspClient, type AcspFiling, type AcspDashboardStats,
} from '../utils/api';
import {
  Shield, Plus, FileText, CheckCircle, Users, X, Search,
  Trash2, Edit3, Clock, Building2, ArrowLeft, ChevronRight,
} from 'lucide-react';
import XlsxImport from '../components/XlsxImport';
import { usePageTitle } from '../hooks/usePageTitle';

type AcspView = 'dashboard' | 'clients' | 'add_client' | 'client_detail' | 'filings' | 'import';

export default function Acsp() {
  usePageTitle('ACSP Management');
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [view, setView] = useState<AcspView>('dashboard');
  const [stats, setStats] = useState<AcspDashboardStats | null>(null);
  const [clients, setClients] = useState<AcspClient[]>([]);
  const [filings, setFilings] = useState<AcspFiling[]>([]);
  const [selectedClient, setSelectedClient] = useState<AcspClient | null>(null);
  const [error, setError] = useState('');
  const [loadingData, setLoadingData] = useState(true);

  // Form state
  const [formCompanyNumber, setFormCompanyNumber] = useState('');
  const [formCompanyName, setFormCompanyName] = useState('');
  const [formClientRef, setFormClientRef] = useState('');
  const [formServiceType, setFormServiceType] = useState('filing');
  const [formAcspRegNumber, setFormAcspRegNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Filing form
  const [showFilingForm, setShowFilingForm] = useState(false);
  const [filingType, setFilingType] = useState('annual_accounts');
  const [filingDueDate, setFilingDueDate] = useState('');
  const [filingNotes, setFilingNotes] = useState('');

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation('/login');
  }, [loading, isAuthenticated, setLocation]);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  const loadData = async () => {
    setLoadingData(true);
    try {
      const [s, c] = await Promise.all([fetchAcspDashboard(), fetchAcspClients()]);
      setStats(s);
      setClients(c);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await addAcspClient({
        companyNumber: formCompanyNumber,
        companyName: formCompanyName,
        clientRef: formClientRef || undefined,
        serviceType: formServiceType,
        acspRegNumber: formAcspRegNumber || undefined,
        notes: formNotes || undefined,
      });
      setFormCompanyNumber(''); setFormCompanyName(''); setFormClientRef('');
      setFormServiceType('filing'); setFormAcspRegNumber(''); setFormNotes('');
      await loadData();
      setView('clients');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add client');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVerified = async (client: AcspClient) => {
    try {
      await updateAcspClient(client.id, { identityVerified: !client.identityVerified } as Partial<AcspClient>);
      await loadData();
    } catch (err) {
      toast.error('Failed to update verification status');
    }
  };

  const handleToggleAml = async (client: AcspClient) => {
    try {
      await updateAcspClient(client.id, { amlChecked: !client.amlChecked } as Partial<AcspClient>);
      await loadData();
    } catch (err) {
      toast.error('Failed to update AML status');
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await deleteAcspClient(id);
      await loadData();
      if (selectedClient?.id === id) {
        setSelectedClient(null);
        setView('clients');
      }
    } catch (err) {
      toast.error('Failed to delete client');
    }
  };

  const handleAddFiling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      await addAcspFiling({
        acspClientId: selectedClient.id,
        filingType,
        dueDate: filingDueDate || undefined,
        notes: filingNotes || undefined,
      });
      setShowFilingForm(false);
      setFilingType('annual_accounts'); setFilingDueDate(''); setFilingNotes('');
      const f = await fetchAcspFilings(selectedClient.id);
      setFilings(f);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create filing');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilingStatusUpdate = async (filingId: string, newStatus: string) => {
    try {
      await updateAcspFiling(filingId, { status: newStatus } as Partial<AcspFiling>);
      if (selectedClient) {
        const f = await fetchAcspFilings(selectedClient.id);
        setFilings(f);
      }
      await loadData();
    } catch (err) {
      toast.error('Failed to update filing status');
    }
  };

  const openClientDetail = async (client: AcspClient) => {
    setSelectedClient(client);
    setView('client_detail');
    try {
      const f = await fetchAcspFilings(client.id);
      setFilings(f);
    } catch (err) {
      toast.error('Failed to load filings');
    }
  };

  if (loading || !isAuthenticated || !user) return null;

  const serviceLabels: Record<string, string> = {
    formation: 'Company Formation',
    filing: 'Filing Agent',
    registered_office: 'Registered Office',
    verification: 'Identity Verification',
  };

  const filingTypeLabels: Record<string, string> = {
    annual_accounts: 'Annual Accounts',
    confirmation_statement: 'Confirmation Statement',
    change_of_director: 'Change of Director',
    change_of_address: 'Change of Address',
    incorporation: 'Incorporation',
    dissolution: 'Dissolution',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Shield className="text-emerald-400" size={28} />
          <div>
            <h1 className="text-2xl font-bold text-white">ACSP Management</h1>
            <p className="text-sm text-slate-400">Authorised Corporate Service Provider</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLocation('/dashboard')}
            className="px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
            Dashboard
          </button>
          <button onClick={() => setLocation('/workflows')}
            className="px-3 py-2 text-sm bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700">
            Workflows
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg mb-6">
          {error}
          <button onClick={() => setError('')} className="ml-2 text-red-400 hover:text-red-300"><X size={14} /></button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800/50 rounded-lg p-1">
        {(['dashboard', 'clients', 'add_client', 'import'] as AcspView[]).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              view === v ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}>
            {v === 'dashboard' ? 'Overview' : v === 'clients' ? 'Clients' : v === 'add_client' ? 'Add Client' : v === 'import' ? 'Import XLSX' : v}
          </button>
        ))}
      </div>

      {/* Dashboard View */}
      {view === 'dashboard' && (
        <div>
          {loadingData ? (
            <div className="text-center py-12 text-slate-400">Loading ACSP data...</div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard label="Total Clients" value={stats.totalClients} icon={<Users size={20} />} color="blue" />
                <StatCard label="Active" value={stats.activeClients} icon={<CheckCircle size={20} />} color="emerald" />
                <StatCard label="ID Verified" value={stats.verifiedClients} icon={<Shield size={20} />} color="purple" />
                <StatCard label="AML Checked" value={stats.amlCheckedClients} icon={<Search size={20} />} color="amber" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <StatCard label="Pending Filings" value={stats.pendingFilings} icon={<Clock size={20} />} color="yellow" />
                <StatCard label="Submitted" value={stats.submittedFilings} icon={<FileText size={20} />} color="blue" />
                <StatCard label="Total Filings" value={stats.totalFilings} icon={<FileText size={20} />} color="slate" />
              </div>
              {Object.keys(stats.serviceBreakdown).length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                  <h3 className="text-lg font-semibold text-white mb-4">Service Breakdown</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(stats.serviceBreakdown).map(([type, count]) => (
                      <div key={type} className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-white">{count}</div>
                        <div className="text-xs text-slate-400 mt-1">{serviceLabels[type] || type}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <Shield className="mx-auto mb-4 text-slate-600" size={48} />
              <h3 className="text-lg font-semibold text-white mb-2">No ACSP clients yet</h3>
              <p className="text-slate-400 mb-4">Add your first ACSP client to get started</p>
              <button onClick={() => setView('add_client')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500">
                <Plus size={16} className="inline mr-2" />Add Client
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clients List */}
      {view === 'clients' && (
        <div>
          {clients.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="mx-auto mb-4 text-slate-600" size={48} />
              <p className="text-slate-400">No ACSP clients. Add one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map(c => (
                <div key={c.id} onClick={() => openClientDetail(c)}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 hover:border-emerald-600/50 cursor-pointer transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white">{c.companyName}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span>{c.companyNumber}</span>
                        {c.clientRef && <span>Ref: {c.clientRef}</span>}
                        <span className="px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded text-xs">
                          {serviceLabels[c.serviceType] || c.serviceType}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {c.identityVerified && (
                          <span className="text-xs px-2 py-1 bg-purple-900/30 text-purple-400 rounded">ID Verified</span>
                        )}
                        {c.amlChecked && (
                          <span className="text-xs px-2 py-1 bg-amber-900/30 text-amber-400 rounded">AML OK</span>
                        )}
                      </div>
                      <ChevronRight size={18} className="text-slate-500" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Client Form */}
      {view === 'add_client' && (
        <div className="max-w-xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Add ACSP Client</h2>
            <form onSubmit={handleAddClient} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Number *</label>
                <input value={formCompanyNumber} onChange={e => setFormCompanyNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Company Name *</label>
                <input value={formCompanyName} onChange={e => setFormCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Client Reference</label>
                <input value={formClientRef} onChange={e => setFormClientRef(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" placeholder="e.g. CLI-001" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Service Type *</label>
                <select value={formServiceType} onChange={e => setFormServiceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white">
                  <option value="filing">Filing Agent</option>
                  <option value="formation">Company Formation</option>
                  <option value="registered_office">Registered Office</option>
                  <option value="verification">Identity Verification</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">ACSP Registration Number</label>
                <input value={formAcspRegNumber} onChange={e => setFormAcspRegNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Notes</label>
                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-white" />
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-500 disabled:opacity-50">
                {submitting ? 'Adding...' : 'Add Client'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Client Detail */}
      {view === 'client_detail' && selectedClient && (
        <div>
          <button onClick={() => { setView('clients'); setSelectedClient(null); }}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 text-sm">
            <ArrowLeft size={16} /> Back to Clients
          </button>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selectedClient.companyName}</h2>
                <p className="text-sm text-slate-400">{selectedClient.companyNumber} {selectedClient.clientRef && `| Ref: ${selectedClient.clientRef}`}</p>
              </div>
              <button onClick={() => handleDeleteClient(selectedClient.id)}
                className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg">
                <Trash2 size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Service</div>
                <div className="text-sm font-medium text-white">{serviceLabels[selectedClient.serviceType] || selectedClient.serviceType}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className={`text-sm font-medium ${selectedClient.status === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedClient.status}
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 cursor-pointer hover:bg-slate-900" onClick={() => handleToggleVerified(selectedClient)}>
                <div className="text-xs text-slate-400 mb-1">Identity Verified</div>
                <div className={`text-sm font-medium ${selectedClient.identityVerified ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedClient.identityVerified ? 'Yes' : 'No'} <Edit3 size={12} className="inline" />
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 cursor-pointer hover:bg-slate-900" onClick={() => handleToggleAml(selectedClient)}>
                <div className="text-xs text-slate-400 mb-1">AML Checked</div>
                <div className={`text-sm font-medium ${selectedClient.amlChecked ? 'text-emerald-400' : 'text-red-400'}`}>
                  {selectedClient.amlChecked ? 'Yes' : 'No'} <Edit3 size={12} className="inline" />
                </div>
              </div>
            </div>
            {selectedClient.notes && (
              <div className="bg-slate-900/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Notes</div>
                <div className="text-sm text-slate-300">{selectedClient.notes}</div>
              </div>
            )}
          </div>

          {/* Filings Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Filings</h3>
              <button onClick={() => setShowFilingForm(!showFilingForm)}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm hover:bg-emerald-500">
                <Plus size={14} className="inline mr-1" />New Filing
              </button>
            </div>

            {showFilingForm && (
              <form onSubmit={handleAddFiling} className="bg-slate-900/50 rounded-lg p-4 mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Filing Type</label>
                    <select value={filingType} onChange={e => setFilingType(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm">
                      {Object.entries(filingTypeLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Due Date</label>
                    <input type="date" value={filingDueDate} onChange={e => setFilingDueDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Notes</label>
                  <input value={filingNotes} onChange={e => setFilingNotes(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-800 border border-slate-600 rounded text-white text-sm" />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm disabled:opacity-50">
                    {submitting ? 'Creating...' : 'Create Filing'}
                  </button>
                  <button type="button" onClick={() => setShowFilingForm(false)}
                    className="px-3 py-1.5 bg-slate-700 text-slate-300 rounded text-sm">Cancel</button>
                </div>
              </form>
            )}

            {filings.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No filings recorded yet</p>
            ) : (
              <div className="space-y-2">
                {filings.map(f => (
                  <div key={f.id} className="flex items-center justify-between bg-slate-900/50 rounded-lg p-3">
                    <div>
                      <span className="text-sm font-medium text-white">{filingTypeLabels[f.filingType] || f.filingType}</span>
                      {f.dueDate && <span className="text-xs text-slate-400 ml-2">Due: {f.dueDate}</span>}
                      {f.referenceNumber && <span className="text-xs text-slate-400 ml-2">Ref: {f.referenceNumber}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <select value={f.status} onChange={e => handleFilingStatusUpdate(f.id, e.target.value)}
                        className={`text-xs px-2 py-1 rounded border-0 ${
                          f.status === 'accepted' ? 'bg-emerald-900/30 text-emerald-400' :
                          f.status === 'submitted' ? 'bg-blue-900/30 text-blue-400' :
                          f.status === 'rejected' ? 'bg-red-900/30 text-red-400' :
                          'bg-yellow-900/30 text-yellow-400'
                        }`}>
                        <option value="pending">Pending</option>
                        <option value="submitted">Submitted</option>
                        <option value="accepted">Accepted</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Import XLSX View */}
      {view === 'import' && (
        <XlsxImport
          onComplete={() => { loadData(); setView('clients'); }}
          onViewWorkflow={() => setLocation('/workflows')}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-400 bg-blue-900/20',
    emerald: 'text-emerald-400 bg-emerald-900/20',
    purple: 'text-purple-400 bg-purple-900/20',
    amber: 'text-amber-400 bg-amber-900/20',
    yellow: 'text-yellow-400 bg-yellow-900/20',
    red: 'text-red-400 bg-red-900/20',
    slate: 'text-slate-400 bg-slate-900/20',
  };
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className={`p-2 rounded-lg ${colorMap[color] || colorMap.slate}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}
