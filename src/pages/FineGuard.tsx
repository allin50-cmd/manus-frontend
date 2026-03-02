import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, Settings, Menu, X, ArrowRight,
  ShieldCheck, RefreshCw, Search, Clock, AlertTriangle, CheckCircle2,
  Activity, Edit2, Home, Building2, Briefcase, Layers, ArrowLeft,
  Check, Map, Globe, Smartphone, ChevronRight, Mail, Terminal, Bell,
  TrendingUp, Zap, Lock, Filter,
} from 'lucide-react';

// ─── CONFIGURATION ────────────────────────────────────────────────────────────
const DEFAULT_TENANT_ID = 'FIRM123';

// ─── COLOUR MAPS (fix Tailwind purge — no dynamic class strings) ──────────────
const STAT_ICON_CLS: Record<string, string> = {
  red:    'bg-red-50    text-red-500',
  amber:  'bg-amber-50  text-amber-500',
  emerald:'bg-emerald-50 text-emerald-600',
  blue:   'bg-blue-50   text-blue-600',
};
const BIG_ICON_CLS: Record<string, string> = {
  red:    'bg-red-50    text-red-500',
  amber:  'bg-amber-50  text-amber-500',
  emerald:'bg-emerald-50 text-emerald-600',
};

// ─── BRAND LOGO ───────────────────────────────────────────────────────────────
const FineGuardLogo = ({ className = 'h-8', light = false }: { className?: string; light?: boolean }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg viewBox="0 0 120 130" className="h-full w-auto flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 3 L6 24 C6 65 22 97 60 114 C98 97 114 65 114 24 Z" fill="#60AADC" />
      <path d="M60 14 L18 32 C18 67 31 93 60 108 C89 93 102 67 102 32 Z" fill="#1E4FA0" />
      <path d="M60 14 L18 32 C18 50 24 68 40 85 C30 67 26 48 26 32 L60 14 Z" fill="#3B7FD4" opacity="0.45" />
      <rect x="45" y="28" width="28" height="36" rx="3" fill="white" />
      <path d="M65 28 L73 36 L65 36 Z" fill="#6BAED6" opacity="0.75" />
      <path d="M45 51 Q26 38 6 46 Q14 55 40 55 Q43 55 45 56 Z" fill="white" />
      <path d="M45 57 Q23 49 4 60 Q14 68 42 63 Q44 61 45 62 Z" fill="white" opacity="0.70" />
      <path d="M73 51 Q92 38 114 46 Q106 55 80 55 Q77 55 73 56 Z" fill="white" />
      <path d="M73 57 Q95 49 116 60 Q106 68 78 63 Q76 61 73 62 Z" fill="white" opacity="0.70" />
      <text x="60" y="97" fill="rgba(255,255,255,0.88)" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">U</text>
    </svg>
    <span className={`font-black text-2xl tracking-tight leading-none ${light ? 'text-white' : 'text-[#1A3A7C]'}`}>
      Fine<span style={{ color: '#38A3D8' }}>Guard</span>
    </span>
  </div>
);

// ─── TYPES & DATA ─────────────────────────────────────────────────────────────
interface Client {
  id: string;
  CompanyName: string;
  ServiceType: string;
  Status: 'OVERDUE' | 'DUE SOON' | 'COMPLIANT';
  NextDeadline: string;
}
interface Summary { overdue: number; dueSoon: number; compliant: number; }
interface AgencyStats { totalFirms: number; totalClients: number; totalRisks: number; uptime: string; }

const SEED_CLIENTS: Client[] = [
  { id: 'abc123', CompanyName: 'ABC Ltd.',       ServiceType: 'Annual Return', Status: 'DUE SOON',  NextDeadline: '2026-03-18' },
  { id: 'xyz789', CompanyName: 'Innovate UK',    ServiceType: 'VAT Return',    Status: 'OVERDUE',   NextDeadline: '2026-02-10' },
  { id: 'def456', CompanyName: 'Vertex Global',  ServiceType: 'Payroll',       Status: 'COMPLIANT', NextDeadline: '2026-04-15' },
  { id: 'ghi012', CompanyName: 'Cedar & Fox',    ServiceType: 'Corp. Tax',     Status: 'OVERDUE',   NextDeadline: '2026-01-31' },
  { id: 'jkl345', CompanyName: 'Meridian Co.',   ServiceType: 'Annual Return', Status: 'DUE SOON',  NextDeadline: '2026-03-25' },
  { id: 'mno678', CompanyName: 'Hallmark Trust', ServiceType: 'VAT Return',    Status: 'COMPLIANT', NextDeadline: '2026-05-01' },
];

function useFineGuardData(currentTenantId: string) {
  const [summary]     = useState<Summary>({ overdue: 2, dueSoon: 2, compliant: 2 });
  const [clients]     = useState<Client[]>(SEED_CLIENTS);
  const [agencyStats] = useState<AgencyStats>({ totalFirms: 12, totalClients: 450, totalRisks: 8, uptime: '99.9%' });
  const [loading, setLoading] = useState(false);

  const refresh = async () => { setLoading(true); await new Promise(r => setTimeout(r, 600)); setLoading(false); };
  useEffect(() => { refresh(); }, [currentTenantId]);
  return { summary, clients, agencyStats, loading, refresh };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}
function daysLabel(dateStr: string, status: Client['Status']): string {
  const d = daysUntil(dateStr);
  if (status === 'OVERDUE') return `${Math.abs(d)}d overdue`;
  if (d === 0) return 'Due today';
  return `${d}d left`;
}

// ─── VIEW TYPES ───────────────────────────────────────────────────────────────
type ViewName =
  | 'marketing' | 'intake' | 'setup'
  | 'agency-dash' | 'firm-summary' | 'portfolio'
  | 'risks' | 'portal' | 'mobile-alerts'
  | 'mobile-engine' | 'sitemap' | 'settings';

interface ViewProps {
  onNavigate: (v: ViewName) => void;
  onStart: () => void;
  stats: AgencyStats;
  summary: Summary;
  clients: Client[];
  setupProgress: number;
  setTenantId: (id: string) => void;
  tenantId: string;
  intakeStep: number;
  setIntakeStep: (n: number) => void;
  intakeData: { firmName: string; email: string };
  setIntakeData: (d: { firmName: string; email: string }) => void;
  setIsEditing: (c: Client | null) => void;
  setIsAdding: (b: boolean) => void;
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FineGuard() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const { summary, clients, agencyStats, loading, refresh } = useFineGuardData(tenantId);

  const [view, setView]           = useState<ViewName>('marketing');
  const [history, setHistory]     = useState<ViewName[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [setupProgress, setSetupProgress] = useState(0);
  const [intakeStep, setIntakeStep] = useState(1);
  const [intakeData, setIntakeData] = useState({ firmName: '', email: '' });
  const [isAdding, setIsAdding]   = useState(false);
  const [isEditing, setIsEditing] = useState<Client | null>(null);

  const navigateTo = (newView: ViewName) => {
    if (view === newView) return;
    setHistory(prev => [...prev, view]);
    setView(newView);
    setIsMenuOpen(false);
    setIsAdding(false);
    setIsEditing(null);
  };
  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setView(prev);
  };
  const goHome = () => { setHistory([]); setView('marketing'); };

  // auto-advance setup progress bar
  useEffect(() => {
    if (view !== 'setup') { setSetupProgress(0); return; }
    const t = setInterval(() => {
      setSetupProgress(p => {
        if (p >= 100) { clearInterval(t); setTimeout(() => navigateTo('firm-summary'), 800); return 100; }
        return p + 4;
      });
    }, 100);
    return () => clearInterval(t);
  }, [view]);

  const GlobalHeader = () => (
    <header className="h-20 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
      <div className="flex items-center gap-3">
        <button onClick={goHome} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition-all" title="Home">
          <Home size={20} />
        </button>
        <button onClick={goBack} disabled={history.length === 0}
          className={`p-2.5 rounded-xl transition-all ${history.length > 0 ? 'hover:bg-slate-50 text-slate-500 hover:text-slate-900' : 'text-slate-200 cursor-not-allowed'}`}
          title="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="h-6 w-px bg-slate-100 mx-1" />
        <FineGuardLogo className="h-6" />
      </div>

      <div className="flex items-center gap-4">
        <nav className="hidden lg:flex items-center gap-8 mr-4">
          <NavTab label="Agency Hub"          active={view === 'agency-dash'}  onClick={() => navigateTo('agency-dash')} />
          <NavTab label="Compliance Summary"  active={view === 'firm-summary'} onClick={() => navigateTo('firm-summary')} />
          <NavTab label="Client Portfolio"    active={view === 'portfolio'}    onClick={() => navigateTo('portfolio')} />
        </nav>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all
            ${isMenuOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'bg-slate-900 text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-500/25'}`}>
          {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          <span className="hidden sm:inline">Menu</span>
        </button>
      </div>

      {isMenuOpen && (
        <div className="fixed inset-0 top-20 z-[99] bg-white/98 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto p-12 grid md:grid-cols-4 gap-8">
            <MenuSection title="Public Funnel" items={[
              { label: 'Marketing',  v: 'marketing',  icon: Globe },
              { label: 'Intake',     v: 'intake',     icon: Mail },
              { label: 'Onboarding', v: 'setup',      icon: Terminal },
            ]} onNav={navigateTo} />
            <MenuSection title="Governance" items={[
              { label: 'Agency Hub', v: 'agency-dash', icon: Layers },
              { label: 'Config',     v: 'settings',    icon: Settings },
              { label: 'Site Map',   v: 'sitemap',     icon: Map },
            ]} onNav={navigateTo} />
            <MenuSection title="Firm Ops" items={[
              { label: 'Summary',   v: 'firm-summary', icon: LayoutDashboard },
              { label: 'Portfolio', v: 'portfolio',    icon: Users },
              { label: 'Triage',    v: 'risks',        icon: ShieldAlert },
            ]} onNav={navigateTo} />
            <MenuSection title="Mobile" items={[
              { label: 'Portal',  v: 'portal',        icon: Smartphone },
              { label: 'Alerts',  v: 'mobile-alerts', icon: Bell },
              { label: 'Engine',  v: 'mobile-engine', icon: Activity },
            ]} onNav={navigateTo} />
          </div>
        </div>
      )}
    </header>
  );

  const fullPage: ViewName[] = ['marketing', 'setup', 'portal', 'mobile-alerts', 'mobile-engine', 'intake'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GlobalHeader />
      <main className="flex-1">
        <div className={fullPage.includes(view) ? '' : 'p-8 md:p-12 max-w-7xl mx-auto w-full'}>
          {renderView(view, { onNavigate: navigateTo, onStart: () => navigateTo('intake'), stats: agencyStats, summary, clients, setupProgress, setTenantId, tenantId, intakeStep, setIntakeStep, intakeData, setIntakeData, setIsEditing, setIsAdding })}
        </div>
      </main>

      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-[200] bg-slate-950/75 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white rounded-[3rem] shadow-2xl p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-blue-600" />
            <button onClick={() => { setIsAdding(false); setIsEditing(null); }}
              className="absolute top-6 right-6 p-2.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition">
              <X size={22} />
            </button>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter mb-1">
              {isAdding ? 'Register Entity' : 'Update Record'}
            </h2>
            <p className="text-slate-400 text-sm mb-8">Tenant: <span className="font-black text-slate-600">{tenantId}</span></p>
            <form className="space-y-6" onSubmit={e => { e.preventDefault(); setIsAdding(false); setIsEditing(null); }}>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Legal Entity Name</label>
                <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 outline-none transition font-black text-slate-900 text-lg"
                  placeholder="Registered Name" defaultValue={isEditing?.CompanyName} />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Service Type</label>
                <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-600 outline-none transition font-bold text-slate-600"
                  placeholder="Annual Return, VAT, Payroll…" defaultValue={isEditing?.ServiceType} />
              </div>
              <button type="submit"
                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/25 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-500/30 transition-all active:scale-[0.98]">
                Sync to SharePoint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
function renderView(view: ViewName, props: ViewProps) {
  switch (view) {
    case 'marketing':     return <MarketingPage    {...props} />;
    case 'intake':        return <IntakePage        {...props} onComplete={() => props.onNavigate('setup')} />;
    case 'setup':         return <SetupSimulation   {...props} />;
    case 'agency-dash':   return <AgencyDash        {...props} />;
    case 'firm-summary':  return <FirmSummary       {...props} />;
    case 'portfolio':     return <PortfolioMatrix   {...props} />;
    case 'risks':         return <RiskTriage        {...props} />;
    case 'portal':        return <StakeholderPortal />;
    case 'mobile-alerts': return <MobileAlerts      />;
    case 'mobile-engine': return <MobileEngine      />;
    case 'sitemap':       return <SiteMapHub        {...props} />;
    case 'settings':      return <SettingsView      {...props} />;
    default:              return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// VIEWS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── MARKETING ────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: Bell,         title: 'Deadline Alerts',   body: 'Get notified days before a filing is due — not after it is missed.' },
  { icon: ShieldCheck,  title: 'Proof of Warning',  body: 'Every alert is logged with a timestamp so you are never blamed.' },
  { icon: TrendingUp,   title: 'Risk Dashboard',    body: 'See every at-risk client in one view, ranked by urgency.' },
  { icon: Zap,          title: 'Auto-Sync',         body: 'Pulls deadlines directly from Companies House and SharePoint.' },
  { icon: Lock,         title: 'Audit Trail',       body: 'Immutable log of every action, alert and acknowledgement.' },
  { icon: Smartphone,   title: 'Mobile Ready',      body: 'Stakeholder portal and alert views work on any device.' },
];

const MarketingPage = ({ onStart }: Pick<ViewProps, 'onStart'>) => (
  <div className="bg-[#020617] text-white">

    {/* ── HERO ── */}
    <section className="px-8 md:px-20 pt-28 pb-24 flex flex-col items-center text-center space-y-10">
      <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
        <ShieldCheck size={18} className="text-blue-400" />
        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">UK Compliance Early-Warning System</span>
      </div>

      <h1 className="text-6xl md:text-[7.5rem] font-black tracking-tighter leading-[0.82] max-w-5xl">
        Filing <span className="italic" style={{ color: '#38A3D8' }}>Failure</span>
        <br />is Optional.
      </h1>

      <p className="text-xl text-slate-400 max-w-xl font-medium leading-relaxed">
        Stop getting blamed for missed client deadlines. FineGuard alerts you <em>before</em> things go wrong — and keeps proof you warned them.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <button onClick={onStart}
          className="px-10 py-6 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.03] transition-all active:scale-[0.98] flex items-center gap-3">
          Analyze My Risks <ArrowRight size={24} />
        </button>
        <button className="px-10 py-6 border border-white/10 text-slate-300 rounded-2xl font-black text-xl hover:border-white/30 hover:text-white transition-all">
          See a Demo
        </button>
      </div>

      {/* trust bar */}
      <div className="flex flex-wrap items-center justify-center gap-8 pt-4 border-t border-white/5 w-full max-w-2xl">
        {['12 Accountancy Firms', '450+ Clients Tracked', '99.9% Uptime', 'GDPR Compliant'].map(t => (
          <span key={t} className="text-[11px] font-black uppercase tracking-widest text-slate-600">{t}</span>
        ))}
      </div>
    </section>

    {/* ── BEFORE / AFTER ── */}
    <section className="px-8 md:px-20 pb-24">
      <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-10">The difference</p>
      <div className="max-w-4xl mx-auto grid grid-cols-2 rounded-[3rem] overflow-hidden border border-white/5 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.9)]">
        {/* Old way */}
        <div className="bg-[#09090F] p-12 text-center space-y-6 border-r border-white/5">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">The Old Way</p>
          <div className="w-28 h-28 mx-auto bg-slate-900 rounded-[2rem] flex items-center justify-center border border-red-900/20">
            <span className="text-5xl select-none">😤</span>
          </div>
          <div className="space-y-2">
            {['Missed deadlines', 'Client complaints', 'Manual chasing', 'No paper trail'].map(i => (
              <p key={i} className="text-red-400/70 text-sm font-semibold flex items-center justify-center gap-2">
                <X size={12} className="text-red-600" /> {i}
              </p>
            ))}
          </div>
          <div className="bg-red-950/50 border border-red-800/30 rounded-xl px-4 py-3">
            <p className="text-red-400 font-black text-xs uppercase tracking-wider">⚠ Compliance Failure</p>
          </div>
        </div>
        {/* FineGuard */}
        <div className="bg-[#030E1C] p-12 text-center space-y-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: '#38A3D8' }}>FineGuard</p>
          <div className="w-28 h-28 mx-auto bg-blue-950 rounded-[2rem] flex items-center justify-center border border-blue-500/20 shadow-[0_0_50px_rgba(56,163,216,0.2)]">
            <FineGuardLogo className="h-14" light />
          </div>
          <div className="space-y-2">
            {['Automated alerts', 'Proof of notification', 'Priority dashboard', 'Audit log'].map(i => (
              <p key={i} className="text-emerald-400/80 text-sm font-semibold flex items-center justify-center gap-2">
                <Check size={12} className="text-emerald-500" /> {i}
              </p>
            ))}
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
            <p className="font-black text-xs uppercase tracking-wider" style={{ color: '#38A3D8' }}>✓ 98% Compliant</p>
          </div>
        </div>
      </div>
    </section>

    {/* ── FEATURES GRID ── */}
    <section className="px-8 md:px-20 pb-24">
      <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] text-slate-600 mb-4">What you get</p>
      <h2 className="text-center text-4xl md:text-6xl font-black tracking-tighter mb-16 leading-tight">
        Everything a firm needs.<br /><span style={{ color: '#38A3D8' }}>Nothing it doesn't.</span>
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-white/5 border border-white/8 rounded-2xl p-8 hover:bg-white/8 hover:border-white/15 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center mb-5 group-hover:bg-blue-500/25 transition">
              <Icon size={22} style={{ color: '#38A3D8' }} />
            </div>
            <h3 className="font-black text-white text-lg mb-2 tracking-tight">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">{body}</p>
          </div>
        ))}
      </div>
    </section>

    {/* ── PHONE SHOWCASE ── */}
    <section className="px-8 md:px-20 pb-32">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Engine</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.88]">
            Compliance<br /><span style={{ color: '#38A3D8' }}>Engine</span><br />Running.
          </h2>
          <p className="text-slate-400 font-medium leading-relaxed max-w-xs">
            Real-time monitoring across all clients. Every deadline tracked. Every risk flagged. Every action logged.
          </p>
          <div className="space-y-2.5">
            {[
              { time: '14:32:01', action: 'Verify ID Docs — ABC Ltd',        status: 'Success',  ok: true },
              { time: '14:32:03', action: 'Streamline Data — Def Co',        status: 'Complete', ok: true },
              { time: '14:32:05', action: 'Analyze Client Risk — Ghi Inc',   status: 'Moderate', ok: false },
              { time: '14:32:08', action: 'Check Compliance — Jkl LLC',      status: 'Verified', ok: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-slate-600 font-mono text-[11px] shrink-0">{item.time}</span>
                <span className="text-white font-semibold text-xs flex-1 truncate">{item.action}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider shrink-0 ${item.ok ? 'text-emerald-400' : 'text-amber-400'}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div className="flex justify-center">
          <div className="w-[220px] bg-white rounded-[3rem] border-[12px] border-slate-800 shadow-[0_60px_120px_-20px_rgba(56,163,216,0.3)] overflow-hidden">
            <div className="px-5 pt-7 pb-4 border-b border-slate-100 flex flex-col items-center gap-2">
              <FineGuardLogo className="h-6" />
              <p className="text-sm font-black text-slate-900 tracking-tight text-center leading-tight">Compliance<br />Engine Running</p>
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_12px_#10b981]" />
            </div>
            <div className="px-4 py-3 space-y-2.5 bg-slate-50">
              {[
                { t: '14:32:01', d: 'Verify ID Docs\nABC Ltd — Success' },
                { t: '14:32:03', d: 'Streamline Data Streams\nDef Co — Complete' },
                { t: '14:32:05', d: 'Analyze Client Risk\nGhi Inc — Moderate' },
                { t: '14:32:08', d: 'Check Compliance\nJkl LLC — Verified' },
                { t: '14:32:10', d: 'Update Filing Logs\nMno Plc — Stored' },
              ].map((log, i) => (
                <p key={i} className="text-[9px] text-slate-500 font-medium leading-snug whitespace-pre-line">
                  <span className="font-black text-slate-800">[{log.t}]</span> {log.d}
                </p>
              ))}
            </div>
            <div className="px-4 py-3 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-900 uppercase tracking-wider">All deadlines monitored</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── CTA ── */}
    <section className="px-8 md:px-20 pb-32 text-center">
      <div className="max-w-2xl mx-auto border border-white/8 rounded-[3rem] p-16 bg-white/3 space-y-8">
        <FineGuardLogo className="h-12 justify-center" light />
        <h2 className="text-4xl md:text-6xl font-black tracking-tighter">
          Ready to stop <span className="italic" style={{ color: '#38A3D8' }}>fire-fighting</span>?
        </h2>
        <button onClick={onStart}
          className="px-10 py-6 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-2xl shadow-blue-600/30 hover:bg-blue-500 hover:scale-[1.03] transition-all flex items-center gap-3 mx-auto">
          Analyze My Risks <ArrowRight size={24} />
        </button>
      </div>
    </section>

  </div>
);

// ─── INTAKE ───────────────────────────────────────────────────────────────────
const IntakePage = ({
  intakeStep, setIntakeStep, intakeData, setIntakeData, onComplete
}: Pick<ViewProps, 'intakeStep' | 'setIntakeStep' | 'intakeData' | 'setIntakeData'> & { onComplete: () => void }) => (
  <div className="min-h-[calc(100vh-80px)] bg-[#020617] flex items-center justify-center p-8 text-white">
    <div className="max-w-xl w-full space-y-10">
      {/* step indicator */}
      <div className="flex items-center gap-3">
        {[1, 2].map(n => (
          <React.Fragment key={n}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm transition-all
              ${n <= intakeStep ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-500'}`}>{n}</div>
            {n < 2 && <div className={`flex-1 h-px transition-all ${intakeStep > n ? 'bg-blue-600' : 'bg-white/10'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-slate-900 p-12 rounded-[3rem] border border-white/5 space-y-8">
        <h2 className="text-4xl font-black tracking-tighter leading-tight">
          {intakeStep === 1 ? 'Which practice are\nwe protecting?' : 'Where should we\nsend the report?'}
        </h2>
        <div className="space-y-4">
          <input
            className="w-full px-8 py-6 bg-slate-950 rounded-2xl font-black text-2xl text-white outline-none ring-2 ring-white/5 focus:ring-blue-600/50 transition"
            placeholder={intakeStep === 1 ? 'Firm Name' : 'Email Address'}
            type={intakeStep === 2 ? 'email' : 'text'}
            value={intakeStep === 1 ? intakeData.firmName : intakeData.email}
            onChange={e => intakeStep === 1
              ? setIntakeData({ ...intakeData, firmName: e.target.value })
              : setIntakeData({ ...intakeData, email: e.target.value })}
          />
          <button
            onClick={() => intakeStep === 1 ? setIntakeStep(2) : onComplete()}
            className="w-full py-6 bg-blue-600 text-white rounded-2xl font-black text-xl hover:bg-blue-500 transition-all active:scale-[0.98] flex items-center justify-center gap-4 shadow-xl shadow-blue-600/25">
            Continue <ArrowRight size={26} />
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── SETUP SIMULATION ─────────────────────────────────────────────────────────
const SETUP_LOGS = [
  { at: 10,  msg: '[14:32:01] Auth Handshake: Verified',            cls: 'text-emerald-400' },
  { at: 25,  msg: '[14:32:03] Mapping Document Libraries…',         cls: 'text-slate-400'  },
  { at: 45,  msg: '[14:32:05] Importing Statutory Deadlines…',      cls: 'text-white'      },
  { at: 65,  msg: '[14:32:08] Building Risk Matrix…',               cls: 'text-slate-400'  },
  { at: 80,  msg: '[14:32:11] Syncing Client Records…',             cls: 'text-white'      },
  { at: 95,  msg: '[14:32:14] ✓ Hub Active. All systems nominal.',  cls: 'text-emerald-300' },
];

const SetupSimulation = ({ setupProgress }: Pick<ViewProps, 'setupProgress'>) => (
  <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-8 bg-slate-50">
    <div className="max-w-2xl w-full bg-white p-16 rounded-[4rem] shadow-xl border border-slate-100 text-center space-y-12">
      <div>
        <FineGuardLogo className="h-10 justify-center mb-8" />
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight italic">Syncing<br />Practice</h2>
      </div>
      <div className="space-y-3 text-left">
        <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
          <span>Progress</span><span>{setupProgress}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(37,99,235,0.5)]"
            style={{ width: `${setupProgress}%` }} />
        </div>
      </div>
      <div className="bg-slate-950 rounded-2xl p-8 text-left font-mono text-xs overflow-hidden leading-loose space-y-1 min-h-[180px]">
        {SETUP_LOGS.filter(l => setupProgress >= l.at).map(l => (
          <p key={l.at} className={l.cls}>{l.msg}</p>
        ))}
        {setupProgress < 95 && <span className="text-emerald-400 animate-pulse">▌</span>}
      </div>
    </div>
  </div>
);

// ─── AGENCY HUB ───────────────────────────────────────────────────────────────
const AgencyDash = ({ stats, setTenantId, onNavigate }: Pick<ViewProps, 'stats' | 'setTenantId' | 'onNavigate'>) => (
  <div className="space-y-10">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Oversight</p>
      <h1 className="text-7xl font-black tracking-tighter leading-none">Global Hub</h1>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <StatBlock title="Practices"  val={stats?.totalFirms}   icon={Building2}  color="blue"    />
      <StatBlock title="Records"    val={stats?.totalClients} icon={Briefcase}  color="blue"    />
      <StatBlock title="Threats"    val={stats?.totalRisks}   icon={ShieldAlert} color="red"    />
      <StatBlock title="Uptime"     val={stats?.uptime}       icon={RefreshCw}  color="emerald" />
    </div>

    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-black text-slate-900 text-xl tracking-tight">Partner Practices</h3>
        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">3 active</span>
      </div>
      <div className="divide-y divide-slate-50">
        {[
          { id: 'FIRM123',   name: 'Flagship Accountants', clients: 182, risk: 3 },
          { id: 'ALPHA_TAX', name: 'Alpha Tax Group',       clients: 143, risk: 4 },
          { id: 'OMEGA_UK',  name: 'Omega UK Partners',     clients: 125, risk: 1 },
        ].map(firm => (
          <div key={firm.id}
            onClick={() => { setTenantId(firm.id); onNavigate('firm-summary'); }}
            className="px-10 py-7 flex items-center gap-6 group cursor-pointer hover:bg-slate-50 transition-all">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center font-black text-blue-600 text-lg flex-shrink-0">
              {firm.id[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-lg tracking-tight">{firm.name}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{firm.clients} clients · ID: {firm.id}</p>
            </div>
            <div className="flex items-center gap-4">
              {firm.risk > 0 && (
                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-black">
                  {firm.risk} at risk
                </span>
              )}
              <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── FIRM SUMMARY ─────────────────────────────────────────────────────────────
const STATUS_ROW_CLS: Record<Client['Status'], string> = {
  OVERDUE:   'bg-red-500',
  'DUE SOON':'bg-amber-400',
  COMPLIANT: 'bg-emerald-500',
};
const STATUS_BADGE_CLS: Record<Client['Status'], string> = {
  OVERDUE:   'bg-red-50 text-red-600',
  'DUE SOON':'bg-amber-50 text-amber-600',
  COMPLIANT: 'bg-emerald-50 text-emerald-700',
};

const FirmSummary = ({ summary, clients, setIsEditing, onNavigate }: Pick<ViewProps, 'summary' | 'clients' | 'setIsEditing' | 'onNavigate'>) => (
  <div className="space-y-10">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Practice</p>
      <h1 className="text-7xl font-black tracking-tighter leading-none">Summary</h1>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <BigStat title="Overdue"   val={summary?.overdue}   color="red"     icon={AlertTriangle}  />
      <BigStat title="Due Soon"  val={summary?.dueSoon}   color="amber"   icon={Clock}          />
      <BigStat title="Compliant" val={summary?.compliant} color="emerald" icon={CheckCircle2}   />
    </div>

    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-black text-slate-900 text-xl tracking-tight">All Clients</h3>
        <button onClick={() => onNavigate('portfolio')}
          className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1 transition">
          View Matrix <ChevronRight size={14} />
        </button>
      </div>
      <div className="divide-y divide-slate-50">
        {[...clients].sort((a, b) => {
          const order = { OVERDUE: 0, 'DUE SOON': 1, COMPLIANT: 2 };
          return order[a.Status] - order[b.Status];
        }).map(c => (
          <div key={c.id}
            className="px-10 py-6 flex items-center gap-5 hover:bg-slate-50 transition cursor-pointer group"
            onClick={() => setIsEditing(c)}>
            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${STATUS_ROW_CLS[c.Status]}`} />
            <div className="flex-1 min-w-0">
              <p className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition">{c.CompanyName}</p>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">{c.ServiceType}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${STATUS_BADGE_CLS[c.Status]}`}>
                {c.Status}
              </span>
              <p className="text-[11px] font-mono text-slate-400 mt-1.5">{daysLabel(c.NextDeadline, c.Status)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── PORTFOLIO MATRIX ─────────────────────────────────────────────────────────
const STATUS_ORDER: Record<Client['Status'], number> = { OVERDUE: 0, 'DUE SOON': 1, COMPLIANT: 2 };
const STATUS_TABLE_CLS: Record<Client['Status'], string> = {
  OVERDUE:   'bg-red-600 text-white',
  'DUE SOON':'bg-amber-100 text-amber-700',
  COMPLIANT: 'bg-emerald-50 text-emerald-700',
};

const PortfolioMatrix = ({ clients, setIsEditing }: Pick<ViewProps, 'clients' | 'setIsEditing'>) => {
  const [query, setQuery] = useState('');
  const [sortStatus, setSortStatus] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = clients.filter(c =>
      c.CompanyName.toLowerCase().includes(q) ||
      c.ServiceType.toLowerCase().includes(q)
    );
    if (sortStatus) list = [...list].sort((a, b) => STATUS_ORDER[a.Status] - STATUS_ORDER[b.Status]);
    return list;
  }, [clients, query, sortStatus]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Compliance</p>
        <h1 className="text-7xl font-black tracking-tighter leading-none">Matrix</h1>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        {/* toolbar */}
        <div className="px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
              placeholder="Search by name or service…"
            />
          </div>
          <button
            onClick={() => setSortStatus(s => !s)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all border
              ${sortStatus ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            <Filter size={14} /> Sort by Risk
          </button>
        </div>

        {/* table */}
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-slate-400 font-black">No matches for "{query}"</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black uppercase text-slate-400 tracking-widest">
                <th className="px-8 py-5">Client</th>
                <th className="px-8 py-5">Service</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id}
                  className="hover:bg-slate-50/80 transition cursor-pointer group"
                  onClick={() => setIsEditing(c)}>
                  <td className="px-8 py-5 font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition">{c.CompanyName}</td>
                  <td className="px-8 py-5 text-sm text-slate-500 font-semibold">{c.ServiceType}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider ${STATUS_TABLE_CLS[c.Status]}`}>
                      {c.Status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="font-mono text-sm text-slate-400 font-semibold">{c.NextDeadline}</p>
                    <p className={`text-[11px] font-black mt-0.5 ${c.Status === 'OVERDUE' ? 'text-red-500' : c.Status === 'DUE SOON' ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {daysLabel(c.NextDeadline, c.Status)}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="px-8 py-4 border-t border-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold">{filtered.length} of {clients.length} records</p>
        </div>
      </div>
    </div>
  );
};

// ─── RISK TRIAGE ──────────────────────────────────────────────────────────────
const RISK_CARD_CLS: Record<Client['Status'], string> = {
  OVERDUE:   'border-l-red-500   bg-red-50/30',
  'DUE SOON':'border-l-amber-400 bg-amber-50/20',
  COMPLIANT: 'border-l-emerald-400 bg-white',
};
const RISK_ICON_BG: Record<Client['Status'], string> = {
  OVERDUE:   'bg-red-600   text-white',
  'DUE SOON':'bg-amber-500 text-white',
  COMPLIANT: 'bg-slate-200 text-slate-500',
};
const RISK_DAYS_CLS: Record<Client['Status'], string> = {
  OVERDUE:   'text-red-600',
  'DUE SOON':'text-amber-600',
  COMPLIANT: 'text-emerald-600',
};

const RiskTriage = ({ clients, setIsEditing }: Pick<ViewProps, 'clients' | 'setIsEditing'>) => {
  const sorted = useMemo(() =>
    [...clients].sort((a, b) => STATUS_ORDER[a.Status] - STATUS_ORDER[b.Status]),
    [clients]);

  return (
    <div className="space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Risk</p>
          <h1 className="text-7xl font-black tracking-tighter leading-none">Triage</h1>
        </div>
        <div className="flex gap-4 text-xs font-black uppercase tracking-widest">
          <span className="flex items-center gap-1.5 text-red-500"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Overdue</span>
          <span className="flex items-center gap-1.5 text-amber-500"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" /> Due soon</span>
          <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Compliant</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sorted.map(risk => {
          const d = daysUntil(risk.NextDeadline);
          return (
            <div key={risk.id}
              className={`rounded-2xl bg-white border border-slate-200 border-l-[6px] ${RISK_CARD_CLS[risk.Status]} shadow-sm hover:shadow-md transition-all group cursor-pointer p-8 space-y-5`}>
              <div className="flex items-start justify-between">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${RISK_ICON_BG[risk.Status]}`}>
                  <AlertTriangle size={20} />
                </div>
                <button onClick={e => { e.stopPropagation(); setIsEditing(risk); }}
                  className="p-2 rounded-lg text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition">
                  <Edit2 size={16} />
                </button>
              </div>

              <div>
                <h4 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-700 transition">{risk.CompanyName}</h4>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">{risk.ServiceType}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs text-slate-400">{risk.NextDeadline}</span>
                <span className={`text-xs font-black uppercase tracking-wider ${RISK_DAYS_CLS[risk.Status]}`}>
                  {daysLabel(risk.NextDeadline, risk.Status)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── MOBILE FRAMES ────────────────────────────────────────────────────────────
const MobileDemoFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="min-h-[calc(100vh-80px)] bg-slate-950 flex flex-col items-center justify-center p-8">
    <div className="max-w-[380px] w-full bg-white rounded-[5rem] border-[20px] border-slate-800 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.8)] aspect-[9/19.5] flex flex-col overflow-hidden ring-[10px] ring-white/5">
      <div className="px-10 pt-16 pb-6 border-b border-slate-50 flex flex-col items-center gap-3 bg-white sticky top-0 z-10">
        <FineGuardLogo className="h-7" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
      </div>
      <div className="flex-1 p-8 space-y-6 overflow-y-auto bg-slate-50">{children}</div>
    </div>
  </div>
);

const StakeholderPortal = () => (
  <MobileDemoFrame title="Stakeholder">
    <div className="bg-blue-600 p-8 rounded-2xl text-white space-y-5 shadow-lg">
      <h3 className="text-2xl font-black tracking-tight">ABC Ltd.</h3>
      <div className="h-px bg-white/20" />
      <div>
        <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Next Filing</p>
        <p className="text-lg font-black">Annual Return FY24</p>
      </div>
      <div className="bg-white text-blue-600 px-5 py-2 rounded-xl font-black text-sm w-fit shadow-md">3 Days Left</div>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-3 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">All Filings</p>
      {[{ name: 'VAT Return Q1', date: '2026-03-31', ok: true }, { name: 'Payroll RTI', date: '2026-04-19', ok: true }].map(f => (
        <div key={f.name} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
          <p className="text-sm font-black text-slate-800">{f.name}</p>
          <span className="text-[10px] font-black text-emerald-600 uppercase">✓ OK</span>
        </div>
      ))}
    </div>
  </MobileDemoFrame>
);

const MobileAlerts = () => (
  <MobileDemoFrame title="Alerts">
    <div className="bg-red-50 border-2 border-red-100 p-7 rounded-2xl space-y-4">
      <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center">
        <AlertTriangle size={24} className="text-white" />
      </div>
      <h3 className="text-xl font-black text-red-700 tracking-tight leading-tight">Urgent<br />Compliance Alert</h3>
      <p className="text-sm font-semibold text-slate-600">F&amp;F Annual Return is overdue by 12 days.</p>
      <button className="w-full py-3 bg-red-600 text-white rounded-xl font-black text-sm shadow-md shadow-red-500/20">
        View & Acknowledge
      </button>
    </div>
    <div className="bg-amber-50 border-2 border-amber-100 p-6 rounded-2xl space-y-3">
      <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">⚠ Due Soon</p>
      <p className="font-black text-slate-900">ABC Ltd — VAT Return</p>
      <p className="text-xs text-slate-500 font-semibold">Due in 3 days · 28 Mar 2026</p>
    </div>
  </MobileDemoFrame>
);

const MobileEngine = () => (
  <MobileDemoFrame title="Engine">
    <div className="bg-slate-950 p-6 rounded-2xl font-mono text-[10px] text-emerald-400 space-y-2 leading-relaxed">
      {[
        '[14:32:01] Verify ID — ABC Ltd — OK',
        '[14:32:03] Sync Stream — Success',
        '[14:32:05] Risk Engine — Low',
        '[14:32:08] Filing Log — Mapped',
        '[14:32:10] Alert Sent — Innovate UK',
        '[14:32:12] Deadline Check — 6 clients',
      ].map((l, i) => <p key={i}>{l}</p>)}
      <div className="pt-4 flex items-center gap-3">
        <RefreshCw size={14} className="animate-spin text-emerald-500/40" />
        <span className="text-emerald-500/60 text-[9px]">Running continuously…</span>
      </div>
    </div>
    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm">
      <p className="text-sm font-black text-slate-900">All systems nominal</p>
      <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
    </div>
  </MobileDemoFrame>
);

// ─── SITEMAP ──────────────────────────────────────────────────────────────────
const SiteMapHub = ({ onNavigate }: Pick<ViewProps, 'onNavigate'>) => (
  <div className="space-y-10">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">Directory</p>
      <h1 className="text-7xl font-black tracking-tighter leading-none">Index</h1>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      <IndexCard title="Acquisition" items={[{ l: 'Marketing', v: 'marketing' }, { l: 'Intake', v: 'intake' }, { l: 'Onboarding', v: 'setup' }]} onNav={onNavigate} />
      <IndexCard title="Governance"  items={[{ l: 'Agency Hub', v: 'agency-dash' }, { l: 'Site Map', v: 'sitemap' }, { l: 'Config', v: 'settings' }]} onNav={onNavigate} />
      <IndexCard title="Operations"  items={[{ l: 'Summary', v: 'firm-summary' }, { l: 'Portfolio', v: 'portfolio' }, { l: 'Triage', v: 'risks' }]} onNav={onNavigate} />
      <IndexCard title="Mobility"    items={[{ l: 'Portal', v: 'portal' }, { l: 'Alerts', v: 'mobile-alerts' }, { l: 'Engine', v: 'mobile-engine' }]} onNav={onNavigate} />
    </div>
  </div>
);

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
const SettingsView = ({ tenantId }: Pick<ViewProps, 'tenantId'>) => (
  <div className="space-y-10 max-w-2xl">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 mb-2">System</p>
      <h1 className="text-7xl font-black tracking-tighter leading-none">Settings</h1>
    </div>
    <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm divide-y divide-slate-100">
      <div className="p-10 space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Firm Identifier</label>
        <input className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-transparent font-black text-slate-500 text-xl outline-none cursor-not-allowed"
          value={tenantId} readOnly />
      </div>
      <div className="p-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Check size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="font-black text-slate-900">SharePoint Connected</p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Last sync: 2 minutes ago</p>
          </div>
        </div>
        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_14px_#10b981]" />
      </div>
      <div className="p-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="font-black text-slate-900">Email Alerts</p>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">Active — 5 day advance notice</p>
          </div>
        </div>
        <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer shadow-inner">
          <div className="w-5 h-5 bg-white rounded-full absolute right-0.5 top-0.5 shadow-sm" />
        </div>
      </div>
    </div>
  </div>
);

// ─── ATOMIC COMPONENTS ────────────────────────────────────────────────────────
const NavTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button onClick={onClick}
    className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2
      ${active ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'}`}>
    {label}
  </button>
);

const MenuSection = ({
  title, items, onNav,
}: {
  title: string;
  items: { label: string; v: ViewName; icon: React.ComponentType<{ size?: number }> }[];
  onNav: (v: ViewName) => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-3">{title}</h3>
    <div className="space-y-1.5">
      {items.map(i => {
        const Icon = i.icon;
        return (
          <button key={i.v} onClick={() => onNav(i.v)}
            className="w-full text-left px-5 py-4 bg-slate-50 hover:bg-blue-600 rounded-2xl text-sm font-black text-slate-700 hover:text-white transition-all flex items-center justify-between group border border-slate-100 hover:border-blue-600">
            <div className="flex items-center gap-3"><Icon size={17} /> {i.label}</div>
            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
          </button>
        );
      })}
    </div>
  </div>
);

const IndexCard = ({
  title, items, onNav,
}: {
  title: string;
  items: { l: string; v: ViewName }[];
  onNav: (v: ViewName) => void;
}) => (
  <div className="space-y-4">
    <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] px-3">{title}</h3>
    <div className="space-y-1.5">
      {items.map(i => (
        <button key={i.v} onClick={() => onNav(i.v)}
          className="w-full text-left px-5 py-4 bg-white hover:bg-blue-600 rounded-2xl text-sm font-black text-slate-700 hover:text-white transition-all flex items-center justify-between group border border-slate-100 hover:border-blue-600 shadow-sm">
          {i.l} <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition" />
        </button>
      ))}
    </div>
  </div>
);

const StatBlock = ({
  title, val, icon: Icon, color = 'blue',
}: {
  title: string;
  val: number | string | undefined;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
}) => (
  <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm group hover:shadow-md hover:-translate-y-1 transition-all duration-300">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${STAT_ICON_CLS[color] ?? STAT_ICON_CLS.blue}`}>
      <Icon size={24} />
    </div>
    <p className="text-[11px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">{title}</p>
    <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{val}</h3>
  </div>
);

const BigStat = ({
  title, val, color, icon: Icon,
}: {
  title: string;
  val: number | undefined;
  color: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) => (
  <div className="bg-white p-12 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${BIG_ICON_CLS[color] ?? BIG_ICON_CLS.blue}`}>
      <Icon size={32} strokeWidth={2.5} />
    </div>
    <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400 mb-3 italic">{title}</p>
    <h3 className="text-8xl font-black text-slate-900 tracking-tighter leading-none">{val}</h3>
  </div>
);
