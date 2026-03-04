import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Building, CheckCircle, AlertCircle, Clock, AlertTriangle,
  Search, Filter, ArrowRight, Shield, Activity, FileText,
  Users, BarChart3, Bell, RefreshCw, ExternalLink, Plus,
  Trash2, X, Loader2, ChevronDown, Download, Eye,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// ── API types (matching server response shapes) ──────────────────────────────

interface FilingDeadline {
  type: string;
  description: string;
  dueDate: string;
  daysUntilDue: number;
  overdue: boolean;
  penaltyRisk?: number;
}

interface ComplianceData {
  companyNumber: string;
  companyName: string;
  status: 'compliant' | 'warning' | 'overdue';
  riskLevel: 'none' | 'low' | 'medium' | 'high';
  overdueFilings: FilingDeadline[];
  upcomingDeadlines: FilingDeadline[];
  lastFiling?: { type: string; date: string };
  accountsStatus: { nextDue: string; overdue: boolean; daysUntilDue: number };
  confirmationStatementStatus: { nextDue: string; overdue: boolean; daysUntilDue: number };
  penalties?: { estimated: number; description: string }[];
}

interface PortfolioEntry {
  id: string;
  companyNumber: string;
  companyName: string;
  serviceType: string | null;
  complianceStatus: 'overdue' | 'due_soon' | 'compliant' | 'pending';
  complianceData: ComplianceData | null;
  addedAt: string;
  lastSynced: string | null;
}

interface SearchResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string | null;
  address: string | null;
}

// ── Style maps ───────────────────────────────────────────────────────────────

const STATUS_STYLE = {
  overdue:   { pill: 'bg-red-100 text-red-700 border border-red-200',       row: 'bg-red-50/40',   label: 'OVERDUE'   },
  due_soon:  { pill: 'bg-amber-100 text-amber-700 border border-amber-200', row: 'bg-amber-50/30', label: 'DUE SOON'  },
  compliant: { pill: 'bg-green-100 text-green-700 border border-green-200', row: '',               label: 'COMPLIANT' },
  pending:   { pill: 'bg-gray-100 text-gray-500 border border-gray-200',    row: '',               label: 'PENDING'   },
};

const RISK_COLOUR = {
  none:   'bg-green-500',
  low:    'bg-amber-400',
  medium: 'bg-orange-500',
  high:   'bg-red-600',
};

// ── Service type options ─────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Confirmation Statement',
  'Annual Accounts',
  'VAT Return',
  'Corporation Tax',
  'Payroll',
  'Director Change',
  'PSC Register',
  'Full Compliance Package',
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function urgencyDays(entry: PortfolioEntry): number {
  if (!entry.complianceData) return 999;
  const d = entry.complianceData;
  return Math.min(d.accountsStatus.daysUntilDue, d.confirmationStatementStatus.daysUntilDue);
}

function riskScore(entry: PortfolioEntry): number {
  const level = entry.complianceData?.riskLevel ?? 'none';
  return { none: 5, low: 40, medium: 70, high: 95 }[level];
}

function nextDeadlineLabel(entry: PortfolioEntry): string {
  if (!entry.complianceData) return '—';
  const d = entry.complianceData;
  const days = urgencyDays(entry);
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 999) return '—';
  return `${days} days`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Add Company Modal ─────────────────────────────────────────────────────────

interface AddCompanyModalProps {
  onClose: () => void;
  onAdded: () => void;
}

function AddCompanyModal({ onClose, onAdded }: AddCompanyModalProps) {
  const [query, setQuery]           = useState('');
  const [searching, setSearching]   = useState(false);
  const [results, setResults]       = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected]     = useState<SearchResult | null>(null);
  const [serviceType, setServiceType] = useState('Confirmation Statement');
  const [adding, setAdding]         = useState(false);
  const debouncedQuery = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); return; }
    setSearching(true);
    setSearchError('');
    fetch(`/api/ch/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setResults(data.results);
        else setSearchError(data.error || 'Search failed');
      })
      .catch(() => setSearchError('Network error. Please retry.'))
      .finally(() => setSearching(false));
  }, [debouncedQuery]);

  async function handleAdd() {
    if (!selected) return;
    setAdding(true);
    try {
      const res = await fetch('/api/ch/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber: selected.companyNumber, serviceType }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success(`${selected.companyName} added to portfolio`);
        onAdded();
      } else {
        toast.error(data.error || 'Failed to add company');
      }
    } catch {
      toast.error('Network error. Please retry.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-brand-navy">
          <div className="flex items-center gap-2">
            <Building className="h-5 w-5 text-brand-gold" />
            <h2 className="text-base font-bold text-white">Add Company to Portfolio</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Search by company name or number
            </label>
            <div className="relative">
              {searching
                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              }
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                placeholder="e.g. Apple Retail UK or 00445790"
                className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              />
            </div>
            {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
          </div>

          {/* Results */}
          {!selected && results.length > 0 && (
            <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-52 overflow-y-auto">
              {results.map((r) => (
                <button
                  key={r.companyNumber}
                  onClick={() => setSelected(r)}
                  className="w-full text-left px-4 py-2.5 hover:bg-brand-surface transition-colors"
                >
                  <p className="text-sm font-semibold text-gray-900">{r.companyName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.companyNumber} · {r.companyType} ·
                    <span className={`ml-1 font-medium ${r.companyStatus === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                      {r.companyStatus}
                    </span>
                    {r.address && ` · ${r.address}`}
                  </p>
                </button>
              ))}
            </div>
          )}

          {/* Selected company confirmation */}
          {selected && (
            <div className="rounded-lg border border-brand-gold/40 bg-brand-gold/5 px-4 py-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{selected.companyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selected.companyNumber} · {selected.companyStatus}
                    {selected.dateOfCreation && ` · Inc. ${selected.dateOfCreation}`}
                  </p>
                </div>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 ml-2">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* Service type */}
          {selected && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Service type provided to this client
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full rounded-lg border border-gray-200 text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
              >
                {SERVICE_TYPES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1 h-10">Cancel</Button>
            <Button
              disabled={!selected || adding}
              onClick={handleAdd}
              className="flex-1 h-10 bg-brand-navy hover:bg-brand-navy/90 text-white gap-2"
            >
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {adding ? 'Verifying with CH…' : 'Add to Portfolio'}
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Company data is fetched live from the Companies House API and cached locally.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Company Detail Panel ──────────────────────────────────────────────────────

interface DetailPanelProps {
  entry: PortfolioEntry;
  onClose: () => void;
  onRemove: (number: string) => void;
  onSync: (number: string) => void;
}

function CompanyDetailPanel({ entry, onClose, onRemove, onSync }: DetailPanelProps) {
  const cd = entry.complianceData;
  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-white shadow-2xl border-l border-gray-200 overflow-y-auto">
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-brand-navy">
        <div>
          <h3 className="font-bold text-white text-sm truncate max-w-xs">{entry.companyName}</h3>
          <p className="text-xs text-slate-400 font-mono">{entry.companyNumber}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSync(entry.companyNumber)}
            className="text-slate-400 hover:text-brand-gold transition-colors"
            title="Re-sync this company"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Status banner */}
        <div className={`rounded-xl border p-4 ${
          entry.complianceStatus === 'overdue'   ? 'border-red-200 bg-red-50' :
          entry.complianceStatus === 'due_soon'  ? 'border-amber-200 bg-amber-50' :
          'border-green-200 bg-green-50'
        }`}>
          <div className="flex items-center gap-2">
            {entry.complianceStatus === 'overdue'   && <AlertCircle className="h-5 w-5 text-red-500" />}
            {entry.complianceStatus === 'due_soon'  && <Clock className="h-5 w-5 text-amber-500" />}
            {entry.complianceStatus === 'compliant' && <CheckCircle className="h-5 w-5 text-green-500" />}
            <span className={`font-bold text-sm ${
              entry.complianceStatus === 'overdue' ? 'text-red-700' :
              entry.complianceStatus === 'due_soon' ? 'text-amber-700' : 'text-green-700'
            }`}>
              {STATUS_STYLE[entry.complianceStatus].label}
            </span>
            {entry.lastSynced && (
              <span className="ml-auto text-xs text-gray-400">
                Synced {new Date(entry.lastSynced).toLocaleDateString('en-GB')}
              </span>
            )}
          </div>
          {cd && entry.complianceStatus !== 'compliant' && (
            <p className="text-xs mt-1.5 text-gray-600">
              {cd.overdueFilings.length > 0
                ? `${cd.overdueFilings.length} filing(s) overdue — immediate action required`
                : `${cd.upcomingDeadlines.length} deadline(s) approaching`}
            </p>
          )}
        </div>

        {/* Deadlines */}
        {cd && (
          <>
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Filing Deadlines</h4>
              <div className="space-y-3">
                {[
                  { label: 'Annual Accounts',        ...cd.accountsStatus },
                  { label: 'Confirmation Statement', ...cd.confirmationStatementStatus },
                ].map((item) => (
                  <div key={item.label} className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
                    item.overdue ? 'border-red-200 bg-red-50' :
                    item.daysUntilDue <= 14 ? 'border-amber-200 bg-amber-50' :
                    'border-gray-200 bg-gray-50'
                  }`}>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Due: {item.nextDue !== 'N/A' ? new Date(item.nextDue).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not available'}</p>
                    </div>
                    <span className={`text-sm font-bold ${
                      item.overdue ? 'text-red-600' : item.daysUntilDue <= 14 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {item.nextDue === 'N/A' ? '—' :
                       item.overdue ? `${Math.abs(item.daysUntilDue)}d overdue` :
                       item.daysUntilDue === 999 ? '—' : `${item.daysUntilDue}d`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Penalties */}
            {cd.penalties && cd.penalties.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-500 uppercase tracking-wide mb-3">Estimated Penalties</h4>
                {cd.penalties.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 mb-2">
                    <p className="text-xs text-red-700">{p.description}</p>
                    <p className="text-sm font-bold text-red-700 ml-4">£{p.estimated.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Last filing */}
            {cd.lastFiling && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Last Filing</h4>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5">
                  <p className="text-sm text-gray-700">{cd.lastFiling.type}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(cd.lastFiling.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                </div>
              </div>
            )}
          </>
        )}

        {!cd && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
            No compliance data cached. Click the refresh icon to sync.
          </div>
        )}

        {/* Service type */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Service Provided</h4>
          <p className="text-sm text-gray-700">{entry.serviceType || 'Not specified'}</p>
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-gray-100 flex gap-2">
          <a
            href={`https://find-and-update.company-information.service.gov.uk/company/${entry.companyNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="outline" className="w-full h-9 text-xs gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" /> View on CH
            </Button>
          </a>
          <Button
            variant="outline"
            onClick={() => onRemove(entry.companyNumber)}
            className="h-9 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Compliance score ring ─────────────────────────────────────────────────────

function ComplianceRing({ score }: { score: number }) {
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const colour = score >= 90 ? '#16a34a' : score >= 75 ? '#d97706' : '#dc2626';
  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle cx="72" cy="72" r={radius} fill="none" stroke={colour} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold" style={{ color: colour }}>{score}<span className="text-base font-medium text-gray-400">%</span></p>
        <p className="text-xs text-gray-500 mt-0.5">Compliant</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type SortField = 'urgency' | 'risk' | 'name';
type ViewMode  = 'all' | 'at_risk';

export default function CompaniesHousePage() {
  const [portfolio, setPortfolio]       = useState<PortfolioEntry[]>([]);
  const [loading, setLoading]           = useState(true);
  const [syncing, setSyncing]           = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const [selected, setSelected]         = useState<PortfolioEntry | null>(null);
  const [search, setSearch]             = useState('');
  const [sortField, setSortField]       = useState<SortField>('urgency');
  const [viewMode, setViewMode]         = useState<ViewMode>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const loadPortfolio = useCallback(async () => {
    try {
      const res  = await fetch('/api/ch/portfolio');
      const data = await res.json();
      if (data.ok) setPortfolio(data.portfolio);
      else toast.error(data.error || 'Failed to load portfolio');
    } catch {
      toast.error('Network error loading portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPortfolio(); }, [loadPortfolio]);

  async function syncAll() {
    setSyncing(true);
    try {
      const res  = await fetch('/api/ch/portfolio/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Synced ${data.synced} of ${data.total} companies`);
        await loadPortfolio();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Sync failed — network error');
    } finally {
      setSyncing(false);
    }
  }

  async function syncOne(companyNumber: string) {
    try {
      const res  = await fetch('/api/ch/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Company data refreshed');
        await loadPortfolio();
      }
    } catch {
      toast.error('Refresh failed');
    }
  }

  async function removeCompany(companyNumber: string) {
    try {
      const res  = await fetch(`/api/ch/portfolio/${companyNumber}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        toast.success('Company removed from portfolio');
        setSelected(null);
        await loadPortfolio();
      } else {
        toast.error(data.error || 'Remove failed');
      }
    } catch {
      toast.error('Remove failed — network error');
    }
  }

  // ── Computed stats ──
  const overdueCount  = portfolio.filter((c) => c.complianceStatus === 'overdue').length;
  const dueSoonCount  = portfolio.filter((c) => c.complianceStatus === 'due_soon').length;
  const compliantCount = portfolio.filter((c) => c.complianceStatus === 'compliant').length;
  const complianceScore = portfolio.length === 0 ? 0
    : Math.min(99, Math.round((compliantCount / portfolio.length) * 100));

  const totalPenalties = portfolio.reduce((sum, e) => {
    if (!e.complianceData?.penalties) return sum;
    return sum + e.complianceData.penalties.reduce((s, p) => s + p.estimated, 0);
  }, 0);

  // ── Filtering & sorting ──
  const filtered = portfolio
    .filter((e) => {
      const matchSearch = search === '' ||
        e.companyName.toLowerCase().includes(search.toLowerCase()) ||
        e.companyNumber.includes(search);
      const matchStatus = filterStatus === 'all' || e.complianceStatus === filterStatus;
      const matchView   = viewMode === 'all' || e.complianceStatus === 'overdue' || e.complianceStatus === 'due_soon';
      return matchSearch && matchStatus && matchView;
    })
    .sort((a, b) => {
      if (sortField === 'urgency') return urgencyDays(a) - urgencyDays(b);
      if (sortField === 'risk')    return riskScore(b) - riskScore(a);
      return a.companyName.localeCompare(b.companyName);
    });

  // ── Empty / loading states ──
  if (loading) {
    return (
      <AppLayout title="Companies House — Compliance Management">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-brand-gold" />
          <span className="ml-3 text-gray-500">Loading portfolio from Companies House…</span>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Companies House — Compliance Management">
      <div className="space-y-6">

        {/* Modals */}
        {showAdd && (
          <AddCompanyModal
            onClose={() => setShowAdd(false)}
            onAdded={() => { setShowAdd(false); loadPortfolio(); }}
          />
        )}
        {selected && (
          <CompanyDetailPanel
            entry={selected}
            onClose={() => setSelected(null)}
            onRemove={async (n) => { await removeCompany(n); setSelected(null); }}
            onSync={async (n) => { await syncOne(n); await loadPortfolio(); }}
          />
        )}

        {/* ── Header ── */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-5 w-5 text-brand-gold" />
                <h2 className="text-base font-bold text-white">FineGuard — Companies House Real-Time Monitoring</h2>
              </div>
              <p className="text-sm text-slate-400">
                Live data from Companies House API ·
                {portfolio.length === 0 ? ' No companies tracked yet' : ` ${portfolio.length} companies tracked`}
                {portfolio.some((e) => e.lastSynced)
                  ? ` · Last synced ${new Date(Math.max(...portfolio.filter(e => e.lastSynced).map(e => new Date(e.lastSynced!).getTime()))).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                  : ''}
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {portfolio.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-green-400">
                  <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  CH API Connected
                </div>
              )}
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-8 border-white/20 text-white hover:bg-white/10 gap-1.5"
                onClick={syncAll}
                disabled={syncing || portfolio.length === 0}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing…' : 'Sync all'}
              </Button>
              <Button
                size="sm"
                className="text-xs h-8 bg-brand-gold hover:bg-brand-gold/90 text-brand-navy gap-1.5 font-semibold"
                onClick={() => setShowAdd(true)}
              >
                <Plus className="h-3.5 w-3.5" /> Add Company
              </Button>
            </div>
          </div>
        </div>

        {/* ── Empty state ── */}
        {portfolio.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-brand-gold/30 bg-brand-gold/5 p-12 text-center">
            <Building className="h-10 w-10 text-brand-gold/50 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-2">No companies tracked yet</h3>
            <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto">
              Add your first client company to start monitoring compliance deadlines in real time.
            </p>
            <Button
              onClick={() => setShowAdd(true)}
              className="bg-brand-navy hover:bg-brand-navy/90 text-white gap-2"
            >
              <Plus className="h-4 w-4" /> Add First Company
            </Button>
          </div>
        )}

        {portfolio.length > 0 && (
          <>
            {/* ── Stats row ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Overdue',         value: overdueCount,   colour: 'text-red-600',    bg: 'border-red-200 bg-red-50',     icon: <AlertCircle className="h-5 w-5 text-red-500" />,   sub: 'Immediate action required',    click: () => { setFilterStatus('overdue'); setViewMode('at_risk'); } },
                { label: 'Due Soon',        value: dueSoonCount,   colour: 'text-amber-600',  bg: 'border-amber-200 bg-amber-50', icon: <Clock className="h-5 w-5 text-amber-500" />,       sub: 'Within next 14 days',          click: () => { setFilterStatus('due_soon'); setViewMode('at_risk'); } },
                { label: 'Compliant',       value: compliantCount, colour: 'text-green-600',  bg: 'border-green-200 bg-green-50', icon: <CheckCircle className="h-5 w-5 text-green-500" />, sub: 'No action required',           click: () => { setFilterStatus('compliant'); setViewMode('all'); } },
                { label: 'Total Portfolio', value: portfolio.length, colour: 'text-brand-navy', bg: 'border-gray-200 bg-white',   icon: <Building className="h-5 w-5 text-brand-navy" />,  sub: 'Companies monitored',          click: () => { setFilterStatus('all'); setViewMode('all'); } },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={s.click}
                  className={`rounded-xl border p-5 shadow-sm text-left transition-transform hover:scale-105 ${s.bg}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-600">{s.label}</span>
                    {s.icon}
                  </div>
                  <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
                </button>
              ))}
            </div>

            {/* ── Compliance score + Penalty exposure ── */}
            <div className="grid lg:grid-cols-3 gap-4">
              <Card
                title="Overall Compliance Score"
                description="Based on live CH filing data"
                icon={<Shield className="h-4 w-4 text-brand-gold" />}
              >
                <div className="mt-4 flex flex-col items-center gap-4">
                  <ComplianceRing score={complianceScore} />
                  <div className="w-full space-y-1.5 text-sm">
                    {(['overdue', 'due_soon', 'compliant'] as const).map((s) => {
                      const count = portfolio.filter((e) => e.complianceStatus === s).length;
                      const pct   = portfolio.length > 0 ? Math.round((count / portfolio.length) * 100) : 0;
                      return (
                        <div key={s} className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 w-24 shrink-0">{STATUS_STYLE[s].label}</span>
                          <div className="flex-1 rounded-full bg-gray-200 h-1.5">
                            <div
                              className={`h-1.5 rounded-full ${s === 'compliant' ? 'bg-green-500' : s === 'due_soon' ? 'bg-amber-500' : 'bg-red-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <div className="lg:col-span-2 space-y-4">
                {/* Penalty exposure */}
                {totalPenalties > 0 && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <h3 className="font-bold text-red-800">Estimated Penalty Exposure</h3>
                    </div>
                    <p className="text-4xl font-bold text-red-700">£{totalPenalties.toLocaleString()}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Based on Companies House late filing penalty schedule.
                      File immediately to avoid further escalation.
                    </p>
                  </div>
                )}

                {/* Overdue companies */}
                {overdueCount > 0 && (
                  <Card
                    title="Strike-Off Risk"
                    description="Companies with overdue filings"
                    icon={<AlertCircle className="h-4 w-4 text-red-500" />}
                  >
                    <div className="mt-3 space-y-2">
                      {portfolio
                        .filter((e) => e.complianceStatus === 'overdue')
                        .map((e) => (
                          <div
                            key={e.id}
                            className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 cursor-pointer hover:bg-red-100 transition-colors"
                            onClick={() => setSelected(e)}
                          >
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-red-800 truncate">{e.companyName}</p>
                              <p className="text-xs text-red-600 mt-0.5">
                                {e.complianceData?.overdueFilings.map((f) => f.description).join(', ') || 'Overdue filings'}
                                {e.complianceData?.overdueFilings[0] && ` — ${Math.abs(e.complianceData.overdueFilings[0].daysUntilDue)}d overdue`}
                              </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-red-400 shrink-0" />
                          </div>
                        ))}
                    </div>
                  </Card>
                )}

                {overdueCount === 0 && dueSoonCount === 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-bold text-green-800">All companies compliant</p>
                    <p className="text-xs text-green-600 mt-0.5">No overdue filings or upcoming deadlines</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Portfolio table ── */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
              {/* Controls */}
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-brand-gold" />
                    <h3 className="font-semibold text-gray-900">Client Portfolio</h3>
                    <span className="text-xs text-gray-400 ml-1">{filtered.length} of {portfolio.length}</span>
                  </div>

                  <div className="flex flex-1 items-center gap-2 lg:justify-end flex-wrap">
                    <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                      {([['all', 'All Clients'], ['at_risk', 'At Risk Only']] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1.5 font-medium transition-colors ${viewMode === mode ? 'bg-brand-navy text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="rounded-lg border border-gray-200 text-xs px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      <option value="all">All statuses</option>
                      <option value="overdue">Overdue</option>
                      <option value="due_soon">Due soon</option>
                      <option value="compliant">Compliant</option>
                      <option value="pending">Pending sync</option>
                    </select>

                    <select
                      value={sortField}
                      onChange={(e) => setSortField(e.target.value as SortField)}
                      className="rounded-lg border border-gray-200 text-xs px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                    >
                      <option value="urgency">Sort: Urgency</option>
                      <option value="risk">Sort: Risk level</option>
                      <option value="name">Sort: Company name</option>
                    </select>

                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold w-40"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-brand-surface text-gray-500 text-xs uppercase tracking-wide">
                      <th className="px-5 py-3 text-left">Company</th>
                      <th className="px-5 py-3 text-left">Service</th>
                      <th className="px-5 py-3 text-left">Accounts Due</th>
                      <th className="px-5 py-3 text-left">CS Due</th>
                      <th className="px-5 py-3 text-left">Risk</th>
                      <th className="px-5 py-3 text-left">Status</th>
                      <th className="px-5 py-3 text-left">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((entry) => {
                      const cd = entry.complianceData;
                      const risk = entry.complianceData?.riskLevel ?? 'none';
                      return (
                        <tr
                          key={entry.id}
                          className={`hover:bg-brand-surface/60 transition-colors cursor-pointer ${STATUS_STYLE[entry.complianceStatus].row}`}
                          onClick={() => setSelected(entry)}
                        >
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-gray-900">{entry.companyName}</p>
                            <p className="text-xs font-mono text-gray-400">{entry.companyNumber}</p>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="text-xs text-gray-600">{entry.serviceType || '—'}</span>
                          </td>
                          <td className="px-5 py-3.5">
                            {cd ? (
                              <span className={`text-sm font-semibold ${cd.accountsStatus.overdue ? 'text-red-600' : cd.accountsStatus.daysUntilDue <= 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                                {cd.accountsStatus.nextDue === 'N/A' ? '—' :
                                 cd.accountsStatus.overdue ? `${Math.abs(cd.accountsStatus.daysUntilDue)}d overdue` :
                                 cd.accountsStatus.daysUntilDue === 999 ? '—' :
                                 `${cd.accountsStatus.daysUntilDue}d`}
                              </span>
                            ) : <span className="text-xs text-gray-400">Pending</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            {cd ? (
                              <span className={`text-sm font-semibold ${cd.confirmationStatementStatus.overdue ? 'text-red-600' : cd.confirmationStatementStatus.daysUntilDue <= 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                                {cd.confirmationStatementStatus.nextDue === 'N/A' ? '—' :
                                 cd.confirmationStatementStatus.overdue ? `${Math.abs(cd.confirmationStatementStatus.daysUntilDue)}d overdue` :
                                 cd.confirmationStatementStatus.daysUntilDue === 999 ? '—' :
                                 `${cd.confirmationStatementStatus.daysUntilDue}d`}
                              </span>
                            ) : <span className="text-xs text-gray-400">Pending</span>}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 rounded-full bg-gray-200 h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${RISK_COLOUR[risk]}`}
                                  style={{ width: `${riskScore(entry)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 capitalize">{risk}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[entry.complianceStatus].pill}`}>
                              {STATUS_STYLE[entry.complianceStatus].label}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <button className="flex items-center gap-1 text-xs text-brand-gold font-semibold hover:underline" onClick={(e) => { e.stopPropagation(); setSelected(entry); }}>
                              {entry.complianceStatus === 'overdue' ? 'File now' : entry.complianceStatus === 'due_soon' ? 'Review' : 'Details'}
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <div className="px-5 py-10 text-center text-sm text-gray-400">
                    {portfolio.length > 0 ? 'No companies match your filters.' : 'No companies in portfolio yet.'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── Info footer ── */}
        <div className="rounded-xl border border-brand-gold/20 bg-brand-navy/5 px-5 py-4 text-xs text-gray-500 leading-relaxed">
          <p className="font-semibold text-gray-700 mb-1">Data Source</p>
          All compliance data is fetched live from the{' '}
          <a href="https://developer-specs.company-information.service.gov.uk/" target="_blank" rel="noopener noreferrer" className="text-brand-gold hover:underline">
            Companies House REST API
          </a>. Deadline calculations are based on statutory filing periods. Penalty estimates follow the
          official Companies House late filing penalty schedule. Use the Sync button to refresh compliance
          data for all portfolio companies.
        </div>

      </div>
    </AppLayout>
  );
}
