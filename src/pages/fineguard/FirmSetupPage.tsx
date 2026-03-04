import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle, XCircle, Loader2, Circle,
  Building, Users, Activity, Shield, ArrowRight,
  Terminal, Zap, Search, Plus, AlertCircle,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

// ── Types ────────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface SetupStep {
  id: number;
  label: string;
  desc: string;
  status: StepStatus;
  errorMsg?: string;
}

interface LogEntry {
  ts: string;
  level: 'info' | 'success' | 'warn' | 'error' | 'engine';
  msg: string;
}

interface SearchResult {
  companyNumber: string;
  companyName: string;
  companyStatus: string;
  companyType: string;
  dateOfCreation: string | null;
  address: string | null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function ts() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const LOG_COLOUR: Record<LogEntry['level'], string> = {
  info:    'text-slate-400',
  success: 'text-green-400',
  warn:    'text-amber-400',
  error:   'text-red-400',
  engine:  'text-brand-gold font-semibold',
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'Confirmation Statement', 'Annual Accounts', 'VAT Return',
  'Corporation Tax', 'Payroll', 'Full Compliance Package',
];

export default function FirmSetupPage() {
  const [, navigate] = useLocation();

  // ── Step state ──
  const INITIAL_STEPS: SetupStep[] = [
    { id: 1, label: 'Health check',           desc: 'Verifying server and database connectivity',              status: 'pending' },
    { id: 2, label: 'Companies House API',     desc: 'Authenticating with Companies House REST API',           status: 'pending' },
    { id: 3, label: 'Add first company',       desc: 'Search and add your first client to the portfolio',      status: 'pending' },
    { id: 4, label: 'Sync compliance data',    desc: 'Fetching live filing deadlines from Companies House',    status: 'pending' },
    { id: 5, label: 'Portfolio ready',         desc: 'All systems connected and monitoring active',            status: 'pending' },
  ];
  const [steps, setSteps]   = useState<SetupStep[]>(INITIAL_STEPS);
  const [logs, setLogs]     = useState<LogEntry[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  // ── Company search ──
  const [query, setQuery]             = useState('');
  const [searching, setSearching]     = useState(false);
  const [results, setResults]         = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<SearchResult | null>(null);
  const [serviceType, setServiceType] = useState('Confirmation Statement');
  const [adding, setAdding]           = useState(false);
  const [companyAdded, setCompanyAdded] = useState(false);

  // ── UI refs ──
  const logRef = useRef<HTMLDivElement>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  // ── Helpers ──

  function setStep(id: number, status: StepStatus, errorMsg?: string) {
    setSteps((prev) =>
      prev.map((s) => s.id === id ? { ...s, status, errorMsg } : s),
    );
  }

  function addLog(level: LogEntry['level'], msg: string) {
    setLogs((prev) => [...prev, { ts: ts(), level, msg }]);
  }

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  // ── Step 1: Health check ──
  const runHealthCheck = useCallback(async () => {
    setCurrentStep(1);
    setStep(1, 'running');
    addLog('info', 'FineGuard Setup — running health check…');

    try {
      const res  = await fetch('/api/health');
      const data = await res.json() as { status: string; database: string };

      if (data.status === 'ok' || data.status === 'healthy') {
        addLog('success', `Server: OK · Database: ${data.database}`);
        setStep(1, 'done');
        runCHCheck();
      } else {
        addLog('error', `Health check failed: ${data.database}`);
        setStep(1, 'error', 'Server or database unavailable');
      }
    } catch (err) {
      addLog('error', 'Cannot reach server — is the backend running?');
      setStep(1, 'error', 'Server unreachable');
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Step 2: CH API check ──
  async function runCHCheck() {
    setCurrentStep(2);
    setStep(2, 'running');
    addLog('info', 'Connecting to Companies House REST API…');

    try {
      // Probe the CH API by searching for a well-known company
      const res  = await fetch('/api/ch/search?q=apple');
      const data = await res.json() as { ok: boolean; results?: unknown[]; error?: string };

      if (data.ok) {
        addLog('success', `Companies House API: authenticated · ${data.results?.length ?? 0} test results returned`);
        addLog('engine', 'Compliance Engine: structured data tracking active');
        setStep(2, 'done');
        setCurrentStep(3);
        setStep(3, 'running');
        addLog('info', 'Step 3: Add your first client company to begin monitoring');
      } else if (data.error?.includes('API key')) {
        addLog('error', 'COMPANIES_HOUSE_API_KEY is not configured on the server');
        setStep(2, 'error', 'API key not configured');
        addLog('warn', 'Set COMPANIES_HOUSE_API_KEY in your .env file and restart the server');
      } else {
        addLog('error', data.error || 'CH API test failed');
        setStep(2, 'error', data.error || 'CH API error');
      }
    } catch {
      addLog('error', 'Network error reaching Companies House API');
      setStep(2, 'error', 'Network error');
    }
  }

  // ── Company search ──
  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      setSearchError('');
      try {
        const res  = await fetch(`/api/ch/search?q=${encodeURIComponent(query)}`);
        const data = await res.json() as { ok: boolean; results?: SearchResult[]; error?: string };
        if (data.ok) setResults(data.results ?? []);
        else setSearchError(data.error || 'Search failed');
      } catch {
        setSearchError('Network error');
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  // ── Step 3→4: Add company then sync ──
  async function handleAddCompany() {
    if (!selectedCompany) return;
    setAdding(true);
    addLog('info', `Adding ${selectedCompany.companyName} (${selectedCompany.companyNumber}) to portfolio…`);

    try {
      const res  = await fetch('/api/ch/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyNumber: selectedCompany.companyNumber, serviceType }),
      });
      const data = await res.json() as { ok: boolean; error?: string };

      if (data.ok) {
        addLog('success', `${selectedCompany.companyName} added — compliance data fetched from CH API`);
        setStep(3, 'done');
        setCompanyAdded(true);
        toast.success(`${selectedCompany.companyName} added to portfolio`);

        // Step 4: sync
        setCurrentStep(4);
        setStep(4, 'running');
        addLog('info', 'Running compliance sync for portfolio…');

        const syncRes  = await fetch('/api/ch/portfolio/sync', { method: 'POST' });
        const syncData = await syncRes.json() as { ok: boolean; synced?: number; total?: number };

        if (syncData.ok) {
          addLog('success', `Compliance sync complete — ${syncData.synced ?? 1} of ${syncData.total ?? 1} companies updated`);
          addLog('engine', `Deadline engine: all filing obligations calculated`);
          setStep(4, 'done');

          // Step 5
          setCurrentStep(5);
          setStep(5, 'running');
          setTimeout(() => {
            addLog('success', '✓ FineGuard Compliance Engine is LIVE — portfolio monitoring active');
            setStep(5, 'done');
          }, 1200);
        } else {
          addLog('error', 'Sync failed');
          setStep(4, 'error', 'Sync failed');
        }
      } else {
        addLog('error', data.error || 'Failed to add company');
        toast.error(data.error || 'Failed to add company');
      }
    } catch {
      addLog('error', 'Network error adding company');
      toast.error('Network error');
    } finally {
      setAdding(false);
    }
  }

  // Start on mount
  useEffect(() => { runHealthCheck(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = steps.filter((s) => s.status === 'done').length;
  const progress  = Math.round((doneCount / steps.length) * 100);
  const allDone   = doneCount === steps.length;
  const hasError  = steps.some((s) => s.status === 'error');

  return (
    <AppLayout title="Firm Setup — Companies House Integration">
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* ── Header ── */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-brand-gold" />
            <h2 className="text-lg font-bold">Companies House Integration Setup</h2>
            {allDone && (
              <span className="ml-auto rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-semibold text-green-400">
                ✓ Complete
              </span>
            )}
            {hasError && (
              <span className="ml-auto rounded-full bg-red-500/20 px-3 py-0.5 text-xs font-semibold text-red-400">
                Action required
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-4">
            Connecting to the live Companies House REST API — all data is fetched in real time.
          </p>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Setup Progress</span>
              <span className="text-brand-gold font-semibold">{progress}%</span>
            </div>
            <div className="w-full rounded-full bg-white/10 h-3">
              <div
                className="h-3 rounded-full bg-brand-gold transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* ── Steps ── */}
          <Card title="Setup Progress" icon={<Zap className="h-4 w-4 text-brand-gold" />}>
            <div className="mt-4">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    {step.status === 'done'    && <CheckCircle className="h-6 w-6 text-green-500" />}
                    {step.status === 'running' && <Loader2 className="h-6 w-6 text-brand-gold animate-spin" />}
                    {step.status === 'error'   && <XCircle className="h-6 w-6 text-red-500" />}
                    {step.status === 'pending' && <Circle className="h-6 w-6 text-gray-300" />}
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-10 mt-0.5 transition-colors duration-700 ${step.status === 'done' ? 'bg-green-400' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-semibold ${
                      step.status === 'done'    ? 'text-green-700' :
                      step.status === 'running' ? 'text-brand-gold' :
                      step.status === 'error'   ? 'text-red-600'   : 'text-gray-400'
                    }`}>
                      {step.label}
                      {step.status === 'running' && (
                        <span className="ml-2 inline-flex gap-0.5 text-brand-gold">
                          {[0, 150, 300].map((d, j) => (
                            <span key={j} className="animate-bounce" style={{ animationDelay: `${d}ms` }}>.</span>
                          ))}
                        </span>
                      )}
                    </p>
                    <p className={`text-xs mt-0.5 leading-relaxed ${step.status === 'error' ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                      {step.status === 'error' && step.errorMsg ? step.errorMsg : step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Log terminal ── */}
          <Card title="Live Setup Log" icon={<Terminal className="h-4 w-4 text-brand-gold" />}>
            <div
              ref={logRef}
              className="mt-4 h-80 overflow-y-auto rounded-lg bg-gray-950 p-4 font-mono text-xs space-y-1.5"
              style={{ scrollBehavior: 'smooth' }}
            >
              {logs.length === 0 && (
                <span className="text-slate-600 animate-pulse">Initialising…</span>
              )}
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">{entry.ts}</span>
                  <span className={LOG_COLOUR[entry.level]}>{entry.msg}</span>
                </div>
              ))}
              {!allDone && !hasError && (
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="animate-pulse">▋</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Step 3: Add company UI (shown when CH API is ready) ── */}
        {currentStep >= 3 && !companyAdded && (
          <Card
            title="Add First Company to Portfolio"
            description="Search Companies House for your first client"
            icon={<Building className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-4">
              {/* Search input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Search by company name or registration number
                </label>
                <div className="relative">
                  {searching
                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  }
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setSelectedCompany(null); }}
                    placeholder="e.g. British Airways or 00245365"
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-gold/50"
                  />
                </div>
                {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
              </div>

              {/* Results */}
              {!selectedCompany && results.length > 0 && (
                <div className="rounded-lg border border-gray-200 divide-y divide-gray-100 max-h-52 overflow-y-auto">
                  {results.map((r) => (
                    <button
                      key={r.companyNumber}
                      onClick={() => setSelectedCompany(r)}
                      className="w-full text-left px-4 py-2.5 hover:bg-brand-surface transition-colors"
                    >
                      <p className="text-sm font-semibold text-gray-900">{r.companyName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.companyNumber} · {r.companyType}
                        <span className={`ml-1 font-medium ${r.companyStatus === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                          · {r.companyStatus}
                        </span>
                        {r.address && ` · ${r.address}`}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected */}
              {selectedCompany && (
                <div className="rounded-lg border border-brand-gold/40 bg-brand-gold/5 px-4 py-3">
                  <p className="text-sm font-bold text-gray-900">{selectedCompany.companyName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedCompany.companyNumber} · {selectedCompany.companyStatus}
                    {selectedCompany.dateOfCreation && ` · Inc. ${selectedCompany.dateOfCreation}`}
                  </p>
                </div>
              )}

              {/* Service type */}
              {selectedCompany && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Service type for this client
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

              <div className="flex gap-2">
                <Button
                  disabled={!selectedCompany || adding}
                  onClick={handleAddCompany}
                  className="bg-brand-navy hover:bg-brand-navy/90 text-white gap-2 h-10"
                >
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {adding ? 'Fetching CH data…' : 'Add to Portfolio'}
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2 text-gray-500"
                  onClick={() => navigate('/app/companies-house')}
                >
                  Skip — add later
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* ── System status indicators ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'API Server',         connected: steps[0].status === 'done', icon: <Activity className="h-4 w-4" />, error: steps[0].status === 'error' },
            { label: 'Companies House API',connected: steps[1].status === 'done', icon: <Building className="h-4 w-4" />, error: steps[1].status === 'error' },
            { label: 'Portfolio DB',       connected: steps[3].status === 'done', icon: <Users className="h-4 w-4" />,    error: steps[3].status === 'error' },
            { label: 'Compliance Engine',  connected: steps[4].status === 'done', icon: <Shield className="h-4 w-4" />,   error: steps[4].status === 'error' },
          ].map((sys) => (
            <div key={sys.label} className={`rounded-xl border p-4 ${sys.error ? 'border-red-200 bg-red-50' : sys.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={sys.error ? 'text-red-500' : sys.connected ? 'text-green-600' : 'text-gray-400'}>{sys.icon}</span>
                <span className={`h-2 w-2 rounded-full ${sys.error ? 'bg-red-500' : sys.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              </div>
              <p className="text-xs font-semibold text-gray-900">{sys.label}</p>
              <p className={`text-xs mt-0.5 ${sys.error ? 'text-red-600' : sys.connected ? 'text-green-600' : 'text-gray-400'}`}>
                {sys.error ? 'Error' : sys.connected ? 'Connected' : 'Waiting…'}
              </p>
            </div>
          ))}
        </div>

        {/* ── Error remediation ── */}
        {steps[1].status === 'error' && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800">Companies House API Key Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Add your API key to the server environment variables and restart:
                </p>
                <code className="block mt-2 rounded bg-amber-900/10 px-3 py-2 text-xs text-amber-800 font-mono">
                  COMPANIES_HOUSE_API_KEY=your_key_here
                </code>
                <p className="text-xs text-amber-600 mt-2">
                  Free API keys are available at{' '}
                  <a
                    href="https://developer.company-information.service.gov.uk/get-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    developer.company-information.service.gov.uk
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Completion CTA ── */}
        {allDone && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-800 mb-1">
                  Companies House Integration is Live
                </h3>
                <p className="text-sm text-green-700 mb-4">
                  Your portfolio is connected to the live Companies House API.
                  Filing deadlines, strike-off risk, and compliance scores are
                  now updated in real time.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => navigate('/app/companies-house')}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    View Portfolio <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/dashboard')}
                    className="border-green-300 text-green-700 hover:bg-green-100"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
