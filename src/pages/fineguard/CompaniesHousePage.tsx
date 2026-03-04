import { useState, useEffect, useRef } from 'react';
import {
  Building, CheckCircle, AlertCircle, Clock, AlertTriangle,
  Search, Filter, ArrowRight, TrendingUp, Shield, Activity,
  FileText, Users, BarChart3, Bell, RefreshCw, ExternalLink,
  ChevronDown, Eye, Download,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { Button } from '@/components/ui/button';

// ── Types ───────────────────────────────────────────────────────────────────

type ComplianceStatus = 'overdue' | 'due_soon' | 'compliant' | 'pending';
type ServiceType =
  | 'Confirmation Statement'
  | 'Annual Accounts'
  | 'VAT Return'
  | 'Payroll'
  | 'Corporation Tax'
  | 'Director Change'
  | 'PSC Register';

interface Client {
  id: number;
  company: string;
  companyNumber: string;
  serviceType: ServiceType;
  nextDeadline: string;
  daysLeft: number;
  status: ComplianceStatus;
  filingHistory: number;
  incorporationDate: string;
  riskScore: number;
}

// ── Data ────────────────────────────────────────────────────────────────────

const CLIENTS: Client[] = [
  { id: 1,  company: 'Apex Solutions Ltd',          companyNumber: '12345678', serviceType: 'VAT Return',              nextDeadline: '28 May 2026', daysLeft: -3,  status: 'overdue',   filingHistory: 8,  incorporationDate: '12 Jan 2019', riskScore: 95 },
  { id: 2,  company: 'Juniper Tech PLC',             companyNumber: '87654321', serviceType: 'Confirmation Statement',  nextDeadline: '15 Jun 2026', daysLeft: 17,  status: 'due_soon',  filingHistory: 12, incorporationDate: '5 Mar 2015',  riskScore: 62 },
  { id: 3,  company: 'Horizon Trade Ltd',            companyNumber: '11223344', serviceType: 'Payroll',                 nextDeadline: '5 May 2026',  daysLeft: 61,  status: 'compliant', filingHistory: 24, incorporationDate: '22 Aug 2012', riskScore: 12 },
  { id: 4,  company: 'Innovate UK Ltd',              companyNumber: '55667788', serviceType: 'Annual Accounts',         nextDeadline: '1 Apr 2026',  daysLeft: -30, status: 'overdue',   filingHistory: 5,  incorporationDate: '8 Feb 2021',  riskScore: 98 },
  { id: 5,  company: 'Fintech Solutions Plc',        companyNumber: '99001122', serviceType: 'Corporation Tax',         nextDeadline: '7 Apr 2026',  daysLeft: 3,   status: 'due_soon',  filingHistory: 7,  incorporationDate: '14 Jul 2018', riskScore: 81 },
  { id: 6,  company: 'Brighton Builders Ltd',        companyNumber: '33445566', serviceType: 'Confirmation Statement',  nextDeadline: '9 Apr 2026',  daysLeft: 5,   status: 'due_soon',  filingHistory: 9,  incorporationDate: '30 Nov 2016', riskScore: 74 },
  { id: 7,  company: 'London Tech Hub Ltd',          companyNumber: '77889900', serviceType: 'VAT Return',              nextDeadline: '11 Apr 2026', daysLeft: 7,   status: 'due_soon',  filingHistory: 11, incorporationDate: '3 Sep 2017',  riskScore: 70 },
  { id: 8,  company: 'Midlands Manufacturing Ltd',  companyNumber: '22334455', serviceType: 'Annual Accounts',         nextDeadline: '15 Mar 2026', daysLeft: -16, status: 'overdue',   filingHistory: 4,  incorporationDate: '19 Jun 2020', riskScore: 99 },
  { id: 9,  company: 'Global Services LLP',          companyNumber: '66778899', serviceType: 'PSC Register',            nextDeadline: '7 Apr 2026',  daysLeft: 3,   status: 'due_soon',  filingHistory: 6,  incorporationDate: '11 Dec 2014', riskScore: 79 },
  { id: 10, company: 'Northern Logistics Ltd',       companyNumber: '44556677', serviceType: 'Payroll',                 nextDeadline: '19 May 2026', daysLeft: 45,  status: 'compliant', filingHistory: 18, incorporationDate: '25 Apr 2011', riskScore: 8  },
  { id: 11, company: 'Coastal Property Group Ltd',  companyNumber: '88990011', serviceType: 'Annual Accounts',         nextDeadline: '30 Jun 2026', daysLeft: 87,  status: 'compliant', filingHistory: 14, incorporationDate: '7 Oct 2013',  riskScore: 5  },
  { id: 12, company: 'Sterling Advisory Ltd',        companyNumber: '11334455', serviceType: 'Corporation Tax',         nextDeadline: '31 Jul 2026', daysLeft: 118, status: 'compliant', filingHistory: 21, incorporationDate: '2 Feb 2010',  riskScore: 3  },
  { id: 13, company: 'Spark Digital Ltd',            companyNumber: '55889900', serviceType: 'Confirmation Statement',  nextDeadline: '1 Aug 2026',  daysLeft: 119, status: 'compliant', filingHistory: 16, incorporationDate: '16 May 2018', riskScore: 7  },
  { id: 14, company: 'Crown Consulting Ltd',         companyNumber: '22554477', serviceType: 'VAT Return',              nextDeadline: '7 Aug 2026',  daysLeft: 125, status: 'compliant', filingHistory: 20, incorporationDate: '29 Jan 2012', riskScore: 10 },
];

const FILING_ACTIVITY = [38, 55, 42, 68, 72, 84, 91, 78, 65, 88, 95, 82];
const ACTIVITY_MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<ComplianceStatus, { pill: string; row: string; label: string }> = {
  overdue:   { pill: 'bg-red-100 text-red-700 border border-red-200',       row: 'bg-red-50/50',     label: 'OVERDUE'   },
  due_soon:  { pill: 'bg-amber-100 text-amber-700 border border-amber-200', row: 'bg-amber-50/40',   label: 'DUE SOON'  },
  compliant: { pill: 'bg-green-100 text-green-700 border border-green-200', row: '',                  label: 'COMPLIANT' },
  pending:   { pill: 'bg-gray-100 text-gray-600 border border-gray-200',    row: '',                  label: 'PENDING'   },
};

const SERVICE_COLOUR: Record<ServiceType, string> = {
  'Confirmation Statement': 'bg-blue-100 text-blue-700',
  'Annual Accounts':         'bg-indigo-100 text-indigo-700',
  'VAT Return':              'bg-purple-100 text-purple-700',
  'Payroll':                 'bg-teal-100 text-teal-700',
  'Corporation Tax':         'bg-cyan-100 text-cyan-700',
  'Director Change':         'bg-orange-100 text-orange-700',
  'PSC Register':            'bg-pink-100 text-pink-700',
};

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      setValue(Math.round(pct * target));
      if (pct < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

// ── Sub-components ──────────────────────────────────────────────────────────

function ComplianceScoreRing({ score }: { score: number }) {
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;
  const colour = score >= 90 ? '#16a34a' : score >= 75 ? '#d97706' : '#dc2626';

  return (
    <div className="relative flex items-center justify-center w-36 h-36">
      <svg className="absolute inset-0 -rotate-90" width="144" height="144" viewBox="0 0 144 144">
        <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
        <circle
          cx="72" cy="72" r={radius} fill="none"
          stroke={colour} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-3xl font-bold" style={{ color: colour }}>{score}<span className="text-base font-medium text-gray-400">%</span></p>
        <p className="text-xs text-gray-500 mt-0.5">Verified</p>
      </div>
    </div>
  );
}

function DataStreamChart() {
  return (
    <div className="space-y-3">
      <div className="flex items-end gap-1 h-20">
        {FILING_ACTIVITY.map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-t transition-all duration-700"
              style={{
                height: `${h}%`,
                background: h >= 80 ? '#0F1B35' : h >= 60 ? '#C9A64A' : '#6b7280',
              }}
            />
            <span className="text-[9px] text-gray-400">{ACTIVITY_MONTHS[i]}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-brand-navy inline-block" /> High volume</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-brand-gold inline-block" /> Medium</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-gray-400 inline-block" /> Low</span>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

type ViewMode = 'portfolio' | 'at_risk';
type SortField = 'daysLeft' | 'riskScore' | 'company';

export default function CompaniesHousePage() {
  const [search, setSearch]     = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('portfolio');
  const [sortField, setSortField] = useState<SortField>('daysLeft');
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const overdueCount  = useCountUp(CLIENTS.filter((c) => c.status === 'overdue').length);
  const dueSoonCount  = useCountUp(CLIENTS.filter((c) => c.status === 'due_soon').length, 800);
  const compliantCount = useCountUp(CLIENTS.filter((c) => c.status === 'compliant').length, 1200);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1800);
  }

  const filtered = CLIENTS
    .filter((c) => {
      const matchSearch = c.company.toLowerCase().includes(search.toLowerCase()) ||
                          c.companyNumber.includes(search) ||
                          c.serviceType.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchView   = viewMode === 'portfolio'
        ? true
        : c.status === 'overdue' || c.status === 'due_soon';
      return matchSearch && matchStatus && matchView;
    })
    .sort((a, b) => {
      if (sortField === 'daysLeft')   return a.daysLeft - b.daysLeft;
      if (sortField === 'riskScore')  return b.riskScore - a.riskScore;
      return a.company.localeCompare(b.company);
    });

  const complianceScore = Math.round(
    (CLIENTS.filter((c) => c.status === 'compliant').length / CLIENTS.length) * 100 * 1.15,
  );

  return (
    <AppLayout title="Companies House — Compliance Management">
      <div className="space-y-6">

        {/* ── Header strip ── */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building className="h-5 w-5 text-brand-gold" />
                <h2 className="text-base font-bold text-white">FineGuard — Complete Control & Efficiency</h2>
              </div>
              <p className="text-sm text-slate-400">
                Real-time synchronisation with Companies House API · {CLIENTS.length} companies tracked
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                CH API Live
              </div>
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7 border-white/20 text-white hover:bg-white/10 gap-1.5"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Syncing…' : 'Sync now'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Overdue',           value: overdueCount,   colour: 'text-red-600',   bg: 'border-red-200 bg-red-50',     icon: <AlertCircle className="h-5 w-5 text-red-500" />,   sub: 'Require immediate action' },
            { label: 'Due Soon',          value: dueSoonCount,   colour: 'text-amber-600', bg: 'border-amber-200 bg-amber-50', icon: <Clock className="h-5 w-5 text-amber-500" />,       sub: 'Within 14 days'           },
            { label: 'Compliant',         value: compliantCount, colour: 'text-green-600', bg: 'border-green-200 bg-green-50', icon: <CheckCircle className="h-5 w-5 text-green-500" />, sub: 'On track'                 },
            { label: 'Total Companies',   value: CLIENTS.length, colour: 'text-brand-navy',bg: 'border-gray-200 bg-white',     icon: <Building className="h-5 w-5 text-brand-navy" />,   sub: 'Portfolio size'           },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-5 shadow-sm ${s.bg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-600">{s.label}</span>
                {s.icon}
              </div>
              <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Two-col: Compliance score + Data stream ── */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Compliance score */}
          <Card
            title="UK Compliance Status"
            icon={<Shield className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 flex flex-col items-center gap-4">
              <ComplianceScoreRing score={Math.min(98, complianceScore)} />
              <div className="w-full space-y-2 text-sm">
                {[
                  { label: 'Filing timeliness',    pct: 95 },
                  { label: 'Data completeness',    pct: 98 },
                  { label: 'Submission accuracy',  pct: 100 },
                  { label: 'Risk flag clearance',  pct: 78 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-0.5">
                      <span className="text-gray-600">{item.label}</span>
                      <span className="font-semibold text-gray-900">{item.pct}%</span>
                    </div>
                    <div className="w-full rounded-full bg-gray-200 h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-700 ${item.pct >= 95 ? 'bg-green-500' : item.pct >= 80 ? 'bg-brand-gold' : 'bg-amber-500'}`}
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="w-full rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-center">
                <p className="text-xs font-semibold text-green-700">UK Compliance: Verified</p>
                <p className="text-xs text-green-600 mt-0.5">98.5% Total Verification Score</p>
              </div>
            </div>
          </Card>

          {/* Data stream + workflow */}
          <div className="lg:col-span-2 space-y-4">
            <Card
              title="Data Stream Analysis"
              description="Filing activity — last 12 months"
              icon={<Activity className="h-4 w-4 text-brand-gold" />}
            >
              <div className="mt-4">
                <DataStreamChart />
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Verified Records', value: '2,450', icon: <CheckCircle className="h-4 w-4 text-green-500" />, colour: 'text-green-600' },
                { label: 'Total Records',    value: '370',   icon: <FileText className="h-4 w-4 text-blue-500" />,     colour: 'text-blue-600'  },
                { label: 'Source Records',   value: '3',     icon: <BarChart3 className="h-4 w-4 text-brand-gold" />,  colour: 'text-brand-navy'},
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm text-center">
                  <div className="flex justify-center mb-2">{s.icon}</div>
                  <p className={`text-xl font-bold ${s.colour}`}>{s.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Client portfolio ── */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Table controls */}
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center gap-3">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-brand-gold" />
                <h3 className="font-semibold text-gray-900">Client Portfolio</h3>
                <span className="text-xs text-gray-400 ml-1">{filtered.length} of {CLIENTS.length}</span>
              </div>

              <div className="flex flex-1 items-center gap-2 lg:justify-end flex-wrap">
                {/* View toggle */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
                  {([['portfolio', 'All Clients'], ['at_risk', 'At Risk Only']] as const).map(([mode, label]) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-3 py-1.5 font-medium transition-colors ${
                        viewMode === mode ? 'bg-brand-navy text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Status filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as ComplianceStatus | 'all')}
                  className="rounded-lg border border-gray-200 text-xs px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                >
                  <option value="all">All statuses</option>
                  <option value="overdue">Overdue</option>
                  <option value="due_soon">Due soon</option>
                  <option value="compliant">Compliant</option>
                </select>

                {/* Sort */}
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="rounded-lg border border-gray-200 text-xs px-2 py-1.5 text-gray-600 focus:outline-none focus:ring-1 focus:ring-brand-gold"
                >
                  <option value="daysLeft">Sort: Urgency</option>
                  <option value="riskScore">Sort: Risk score</option>
                  <option value="company">Sort: Company name</option>
                </select>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search companies…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-brand-gold w-44"
                  />
                </div>

                <Button size="sm" variant="outline" className="text-xs h-7 gap-1">
                  <Download className="h-3 w-3" /> Export
                </Button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-brand-surface text-gray-500 text-xs uppercase tracking-wide">
                  <th className="px-5 py-3 text-left">Company Name</th>
                  <th className="px-5 py-3 text-left">Reg. Number</th>
                  <th className="px-5 py-3 text-left">Service Type</th>
                  <th className="px-5 py-3 text-left">Next Deadline</th>
                  <th className="px-5 py-3 text-left">Days</th>
                  <th className="px-5 py-3 text-left">Risk</th>
                  <th className="px-5 py-3 text-left">Status</th>
                  <th className="px-5 py-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((c) => (
                  <tr key={c.id} className={`hover:bg-brand-surface/50 transition-colors ${STATUS_STYLE[c.status].row}`}>
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="font-semibold text-gray-900">{c.company}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Inc. {c.incorporationDate}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{c.companyNumber}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SERVICE_COLOUR[c.serviceType]}`}>
                        {c.serviceType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.nextDeadline}</td>
                    <td className="px-5 py-3.5">
                      <span className={`font-semibold text-sm ${
                        c.daysLeft < 0 ? 'text-red-600' :
                        c.daysLeft <= 7 ? 'text-red-500' :
                        c.daysLeft <= 14 ? 'text-amber-600' : 'text-gray-600'
                      }`}>
                        {c.daysLeft < 0 ? `${Math.abs(c.daysLeft)}d overdue` : `${c.daysLeft}d`}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 rounded-full bg-gray-200 h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${c.riskScore >= 80 ? 'bg-red-500' : c.riskScore >= 50 ? 'bg-amber-500' : 'bg-green-500'}`}
                            style={{ width: `${c.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500">{c.riskScore}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[c.status].pill}`}>
                        {STATUS_STYLE[c.status].label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button className="flex items-center gap-1 text-xs text-brand-gold font-semibold hover:underline">
                        {c.status === 'overdue' ? 'File now' :
                         c.status === 'due_soon' ? 'Review' : 'View'}
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-gray-400">
                No companies match your filters.
              </div>
            )}
          </div>
        </div>

        {/* ── Strike-off risk + Filing history ── */}
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Strike-off risk detector */}
          <Card
            title="Strike-Off Risk Detection"
            description="Companies flagged for potential compulsory strike-off"
            icon={<AlertTriangle className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-3">
              {CLIENTS
                .filter((c) => c.status === 'overdue')
                .map((c) => (
                  <div key={c.id} className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                    <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-red-800">{c.company}</p>
                      <p className="text-xs text-red-700 mt-0.5">
                        {c.serviceType} — {Math.abs(c.daysLeft)} days overdue ·
                        Reg. {c.companyNumber}
                      </p>
                    </div>
                    <button className="text-xs text-red-600 font-semibold shrink-0 hover:underline">
                      File now →
                    </button>
                  </div>
                ))}
              <div className="rounded-lg border border-brand-gold/30 bg-brand-navy/5 px-4 py-3 text-xs text-gray-600">
                <p className="font-semibold text-gray-900 mb-0.5">Zero-tolerance overdue policy</p>
                Companies House can strike off a company that has failed to file its confirmation statement or accounts within the prescribed period. FineGuard alerts fire at 30, 14, 7 and 1 days before deadline.
              </div>
            </div>
          </Card>

          {/* Director & PSC management */}
          <Card
            title="Director & PSC Management"
            description="Persons with Significant Control register"
            icon={<Users className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 space-y-3">
              {[
                { company: 'Juniper Tech PLC',  directors: 3, pscs: 1, lastUpdated: '12 Jan 2026', status: 'current' as const },
                { company: 'Apex Solutions Ltd',directors: 2, pscs: 2, lastUpdated: '3 Nov 2025',  status: 'review'  as const },
                { company: 'Fintech Solutions', directors: 4, pscs: 3, lastUpdated: '28 Feb 2026', status: 'current' as const },
                { company: 'Brighton Builders', directors: 1, pscs: 1, lastUpdated: '15 Oct 2025', status: 'review'  as const },
              ].map((item) => (
                <div key={item.company} className="flex items-center justify-between text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{item.company}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.directors} directors · {item.pscs} PSC · Updated {item.lastUpdated}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ml-2 ${
                    item.status === 'current' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.status === 'current' ? 'Current' : 'Review needed'}
                  </span>
                </div>
              ))}
              <Button size="sm" variant="outline" className="w-full text-xs h-8 gap-1.5 mt-2">
                <Eye className="h-3.5 w-3.5" /> View all directors & PSCs
              </Button>
            </div>
          </Card>
        </div>

        {/* ── Notification engine ── */}
        <Card
          title="Compliance Notification Engine"
          description="Automated alerts delivered via Microsoft Teams"
          icon={<Bell className="h-4 w-4 text-brand-gold" />}
        >
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
            {[
              {
                type: 'Overdue Filings',
                count: CLIENTS.filter((c) => c.status === 'overdue').length,
                colour: 'border-red-200 bg-red-50',
                text: 'text-red-700',
                icon: <AlertCircle className="h-4 w-4 text-red-500" />,
                items: CLIENTS.filter((c) => c.status === 'overdue').map((c) => c.company),
              },
              {
                type: 'Due Within 7 Days',
                count: CLIENTS.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7).length,
                colour: 'border-red-100 bg-red-50/60',
                text: 'text-red-600',
                icon: <Clock className="h-4 w-4 text-red-400" />,
                items: CLIENTS.filter((c) => c.daysLeft >= 0 && c.daysLeft <= 7).map((c) => `${c.company} (${c.daysLeft}d)`),
              },
              {
                type: 'Due Within 14 Days',
                count: CLIENTS.filter((c) => c.daysLeft > 7 && c.daysLeft <= 14).length,
                colour: 'border-amber-200 bg-amber-50',
                text: 'text-amber-700',
                icon: <Bell className="h-4 w-4 text-amber-500" />,
                items: CLIENTS.filter((c) => c.daysLeft > 7 && c.daysLeft <= 14).map((c) => `${c.company} (${c.daysLeft}d)`),
              },
            ].map((bucket) => (
              <div key={bucket.type} className={`rounded-lg border px-4 py-3 ${bucket.colour}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    {bucket.icon}
                    <span className={`font-semibold text-sm ${bucket.text}`}>{bucket.type}</span>
                  </div>
                  <span className={`text-lg font-bold ${bucket.text}`}>{bucket.count}</span>
                </div>
                {bucket.items.length === 0 ? (
                  <p className="text-xs text-gray-400">None</p>
                ) : (
                  <ul className="space-y-0.5">
                    {bucket.items.map((item) => (
                      <li key={item} className={`text-xs ${bucket.text} truncate`}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </Card>

      </div>
    </AppLayout>
  );
}
