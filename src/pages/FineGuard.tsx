import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, ShieldAlert, Settings, Menu, X, ArrowRight,
  ShieldCheck, Lock, RefreshCw, Search, Filter, ExternalLink, Clock,
  AlertTriangle, CheckCircle2, Activity, Plus, Edit2, Save, Trash2,
  ChevronLeft, Home, Building2, Briefcase, Layers, ArrowLeft, Calendar,
  Check, Map, Zap, Globe, Monitor, Smartphone, ChevronRight, Mail,
  Shield, Database, Terminal, Bell, Layout
} from 'lucide-react';

// ─── 1. CONFIGURATION ────────────────────────────────────────────────────────
const DEFAULT_TENANT_ID = "FIRM123";

// ─── 2. BRAND LOGO ────────────────────────────────────────────────────────────
// SVG matches the actual FineGuard brand: blue shield with winged document icon
const FineGuardLogo = ({ className = "h-8", light = false }: { className?: string; light?: boolean }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <svg viewBox="0 0 120 130" className="h-full w-auto flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
      {/* Outer shield — light blue/cyan */}
      <path d="M60 3 L6 24 C6 65 22 97 60 114 C98 97 114 65 114 24 Z" fill="#60AADC" />
      {/* Inner shield — dark royal blue */}
      <path d="M60 14 L18 32 C18 67 31 93 60 108 C89 93 102 67 102 32 Z" fill="#1E4FA0" />
      {/* Highlight arc on inner shield — gives 3-D gloss */}
      <path d="M60 14 L18 32 C18 50 24 68 40 85 C30 67 26 48 26 32 L60 14 Z" fill="#3B7FD4" opacity="0.45" />
      {/* Document body (white page) */}
      <rect x="45" y="28" width="28" height="36" rx="3" fill="white" />
      {/* Folded top-right corner */}
      <path d="M65 28 L73 36 L65 36 Z" fill="#6BAED6" opacity="0.75" />
      {/* Left wing — upper feather layer */}
      <path d="M45 51 Q26 38 6 46 Q14 55 40 55 Q43 55 45 56 Z" fill="white" />
      {/* Left wing — lower feather layer */}
      <path d="M45 57 Q23 49 4 60 Q14 68 42 63 Q44 61 45 62 Z" fill="white" opacity="0.70" />
      {/* Right wing — upper feather layer */}
      <path d="M73 51 Q92 38 114 46 Q106 55 80 55 Q77 55 73 56 Z" fill="white" />
      {/* Right wing — lower feather layer */}
      <path d="M73 57 Q95 49 116 60 Q106 68 78 63 Q76 61 73 62 Z" fill="white" opacity="0.70" />
      {/* U emblem at base of shield */}
      <text x="60" y="97" fill="rgba(255,255,255,0.88)" fontSize="13" fontWeight="900" textAnchor="middle" fontFamily="Arial, sans-serif">U</text>
    </svg>
    <span className={`font-black text-2xl tracking-tight leading-none ${light ? 'text-white' : 'text-[#1A3A7C]'}`}>
      Fine<span style={{ color: '#38A3D8' }}>Guard</span>
    </span>
  </div>
);

// ─── 3. DATA HOOK ─────────────────────────────────────────────────────────────
interface Client {
  id: string;
  CompanyName: string;
  ServiceType: string;
  Status: string;
  NextDeadline: string;
}

interface Summary {
  overdue: number;
  dueSoon: number;
  compliant: number;
}

interface AgencyStats {
  totalFirms: number;
  totalClients: number;
  totalRisks: number;
  uptime: string;
}

function useFineGuardData(currentTenantId: string) {
  const [summary, setSummary] = useState<Summary>({ overdue: 3, dueSoon: 5, compliant: 42 });
  const [clients, setClients] = useState<Client[]>([
    { id: 'abc123', CompanyName: 'ABC Ltd.', ServiceType: 'Annual Return', Status: 'DUE SOON', NextDeadline: '2024-05-28' },
    { id: 'xyz789', CompanyName: 'Innovate UK', ServiceType: 'VAT Return', Status: 'OVERDUE', NextDeadline: '2024-05-10' },
    { id: 'def456', CompanyName: 'Vertex Global', ServiceType: 'Payroll', Status: 'COMPLIANT', NextDeadline: '2024-06-15' },
  ]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats>({ totalFirms: 12, totalClients: 450, totalRisks: 8, uptime: "99.9%" });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
  };

  useEffect(() => { load(); }, [currentTenantId]);
  return { summary, clients, agencyStats, loading, refresh: load };
}

// ─── 4. TYPES ─────────────────────────────────────────────────────────────────
type ViewName =
  | 'marketing' | 'intake' | 'setup'
  | 'agency-dash' | 'firm-summary' | 'portfolio'
  | 'risks' | 'portal' | 'mobile-alerts'
  | 'mobile-engine' | 'sitemap' | 'settings';

// ─── 5. MAIN APPLICATION ──────────────────────────────────────────────────────
export default function FineGuard() {
  const [tenantId, setTenantId] = useState(DEFAULT_TENANT_ID);
  const { summary, clients, agencyStats, loading, refresh } = useFineGuardData(tenantId);

  const [view, setView] = useState<ViewName>('marketing');
  const [history, setHistory] = useState<ViewName[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const [setupProgress, setSetupProgress] = useState(0);
  const [intakeStep, setIntakeStep] = useState(1);
  const [intakeData, setIntakeData] = useState({ firmName: '', email: '' });
  const [isAdding, setIsAdding] = useState(false);
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
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory(prevH => prevH.slice(0, -1));
      setView(prev);
    }
  };

  const goHome = () => {
    setHistory([]);
    setView('marketing');
  };

  useEffect(() => {
    if (view === 'setup') {
      const timer = setInterval(() => {
        setSetupProgress(p => {
          if (p >= 100) {
            clearInterval(timer);
            setTimeout(() => navigateTo('firm-summary'), 800);
            return 100;
          }
          return p + 4;
        });
      }, 100);
      return () => clearInterval(timer);
    } else {
      setSetupProgress(0);
    }
  }, [view]);

  // ── GLOBAL HEADER ──────────────────────────────────────────────────────────
  const GlobalHeader = () => (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sticky top-0 z-[100] shadow-sm">
      <div className="flex items-center gap-4">
        <button onClick={goHome} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-400 hover:text-blue-600 transition" title="Home">
          <Home size={20} />
        </button>
        <button
          onClick={goBack}
          disabled={history.length === 0}
          className={`p-2.5 rounded-xl transition ${history.length > 0 ? 'hover:bg-slate-50 text-slate-600' : 'text-slate-200 cursor-not-allowed'}`}
          title="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="h-6 w-px bg-slate-100 mx-2" />
        <FineGuardLogo className="h-6" />
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex items-center gap-6 mr-6">
          <NavTab label="Agency Hub" active={view === 'agency-dash'} onClick={() => navigateTo('agency-dash')} />
          <NavTab label="Compliance Summary" active={view === 'firm-summary'} onClick={() => navigateTo('firm-summary')} />
          <NavTab label="Client Portfolio" active={view === 'portfolio'} onClick={() => navigateTo('portfolio')} />
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${isMenuOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
        >
          {isMenuOpen ? <X size={16} /> : <Menu size={16} />}
          <span>Menu Index</span>
        </button>
      </div>

      {/* MASTER MENU OVERLAY */}
      {isMenuOpen && (
        <div className="fixed inset-0 top-20 z-[100] bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto p-12 grid md:grid-cols-4 gap-12">
            <MenuSection title="Public Funnel" items={[
              { label: 'Marketing Landing', v: 'marketing', icon: Globe },
              { label: 'Intake Process', v: 'intake', icon: Mail },
              { label: 'Onboarding Logs', v: 'setup', icon: Terminal },
            ]} onNav={navigateTo} />
            <MenuSection title="Governance" items={[
              { label: 'Agency Oversight', v: 'agency-dash', icon: Layers },
              { label: 'System Configuration', v: 'settings', icon: Settings },
              { label: 'Master Site Map', v: 'sitemap', icon: Map },
            ]} onNav={navigateTo} />
            <MenuSection title="Firm Ops" items={[
              { label: 'Practice Summary', v: 'firm-summary', icon: LayoutDashboard },
              { label: 'Filing Matrix', v: 'portfolio', icon: Users },
              { label: 'Risk Triage', v: 'risks', icon: ShieldAlert },
            ]} onNav={navigateTo} />
            <MenuSection title="Mobile Demos" items={[
              { label: 'Stakeholder Portal', v: 'portal', icon: Smartphone },
              { label: 'Urgent Alert View', v: 'mobile-alerts', icon: Bell },
              { label: 'Engine Activity', v: 'mobile-engine', icon: Activity },
            ]} onNav={navigateTo} />
          </div>
        </div>
      )}
    </header>
  );

  const fullPageViews: ViewName[] = ['marketing', 'setup', 'portal', 'mobile-alerts', 'mobile-engine', 'intake'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <GlobalHeader />

      <main className="flex-1 min-w-0 relative">
        <div className={fullPageViews.includes(view) ? "" : "p-8 md:p-12 max-w-7xl mx-auto w-full"}>
          {renderView(view, {
            onNavigate: navigateTo,
            onStart: () => navigateTo('intake'),
            stats: agencyStats,
            summary,
            clients,
            setupProgress,
            setTenantId,
            tenantId,
            intakeStep,
            setIntakeStep,
            intakeData,
            setIntakeData,
            setIsEditing,
            setIsAdding,
          })}
        </div>
      </main>

      {/* MODAL SYSTEM */}
      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-[200] bg-slate-950/70 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="max-w-xl w-full bg-white rounded-[4rem] shadow-2xl border border-white/20 p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
            <button
              onClick={() => { setIsAdding(false); setIsEditing(null); }}
              className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-2xl text-slate-300 transition"
            >
              <X size={28} />
            </button>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2 leading-none">
              {isAdding ? "Register Entity" : "Update Record"}
            </h2>
            <p className="text-slate-400 font-medium text-sm italic mb-10 tracking-tight">
              Syncing Override to Tenant: {tenantId}
            </p>
            <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); setIsAdding(false); setIsEditing(null); }}>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Legal Entity Name</label>
                <input
                  className="w-full px-8 py-5 rounded-3xl bg-slate-50 border-2 border-transparent focus:border-blue-600 outline-none transition font-black text-slate-900 text-lg shadow-inner"
                  placeholder="Registered Name"
                  defaultValue={isEditing?.CompanyName}
                />
              </div>
              <button type="submit" className="w-full py-6 bg-blue-600 text-white rounded-[3rem] font-black text-xl shadow-2xl hover:bg-blue-700 transition">
                Sync to SharePoint
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VIEW ROUTER ──────────────────────────────────────────────────────────────
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

function renderView(view: ViewName, props: ViewProps) {
  switch (view) {
    case 'marketing':     return <MarketingPage {...props} />;
    case 'intake':        return <IntakePage {...props} onComplete={() => props.onNavigate('setup')} />;
    case 'setup':         return <SetupSimulation {...props} />;
    case 'agency-dash':   return <AgencyDash {...props} />;
    case 'firm-summary':  return <FirmSummary {...props} />;
    case 'portfolio':     return <PortfolioMatrix {...props} />;
    case 'risks':         return <RiskTriage {...props} />;
    case 'portal':        return <StakeholderPortal />;
    case 'mobile-alerts': return <MobileAlerts />;
    case 'mobile-engine': return <MobileEngine />;
    case 'sitemap':       return <SiteMapHub {...props} />;
    case 'settings':      return <SettingsView {...props} />;
    default:              return null;
  }
}

// ─── 1. MARKETING PAGE ────────────────────────────────────────────────────────
const MarketingPage = ({ onStart }: Pick<ViewProps, 'onStart'>) => (
  <div className="bg-[#020617] text-white min-h-[calc(100vh-80px)]">

    {/* ── HERO ── */}
    <div className="px-8 md:px-20 pt-24 pb-20 flex flex-col items-center text-center space-y-12">
      <div className="inline-flex items-center gap-3 px-5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full">
        <ShieldCheck size={20} className="text-blue-500" />
        <span className="text-[11px] font-black text-blue-400 uppercase tracking-widest">Early Warning System</span>
      </div>
      <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85]">
        Filing <span className="text-blue-500 italic">Failure</span> is <br />Optional.
      </h1>
      <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed">
        Stop getting blamed for missed client deadlines. FineGuard alerts you before things go wrong and keeps proof you warned them.
      </p>
      <button
        onClick={onStart}
        className="px-12 py-8 bg-blue-600 text-white rounded-[3rem] font-black text-2xl shadow-2xl shadow-blue-600/30 hover:scale-[1.05] transition flex items-center gap-4"
      >
        Analyze My Risks <ArrowRight size={32} />
      </button>
    </div>

    {/* ── BEFORE / AFTER COMPARISON ── */}
    <div className="px-8 md:px-20 pb-24">
      <div className="max-w-5xl mx-auto overflow-hidden rounded-[4rem] border border-white/5 shadow-[0_80px_160px_-40px_rgba(0,0,0,0.9)] grid grid-cols-2">
        {/* Old Way */}
        <div className="bg-[#08080F] p-14 text-center space-y-8 border-r border-white/5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500">The Old Way</h3>
          <div className="w-32 h-32 mx-auto bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-red-900/20">
            <span className="text-5xl select-none">😤</span>
          </div>
          <div className="bg-red-950/60 border border-red-700/30 rounded-2xl px-6 py-4">
            <p className="text-red-400 font-black text-[11px] uppercase tracking-widest leading-snug">
              ⚠ Compliance Failure:<br />Missed Deadline
            </p>
          </div>
          <p className="text-slate-600 text-sm font-semibold italic">Reactive. Stressful. Costly.</p>
        </div>
        {/* FineGuard Way */}
        <div className="bg-[#030E1C] p-14 text-center space-y-8">
          <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-[#38A3D8]">FineGuard Protection</h3>
          <div className="w-32 h-32 mx-auto bg-blue-950/80 rounded-[2.5rem] flex items-center justify-center border border-blue-500/20 shadow-[0_0_60px_rgba(56,163,216,0.2)]">
            <FineGuardLogo className="h-16" light />
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl px-6 py-4">
            <p className="text-[#38A3D8] font-black text-[11px] uppercase tracking-widest leading-snug">
              ✓ 98% Compliant<br />Always Protected
            </p>
          </div>
          <p className="text-slate-400 text-sm font-semibold italic">Proactive. Automated. Documented.</p>
        </div>
      </div>
    </div>

    {/* ── PHONE SHOWCASE ── */}
    <div className="px-8 md:px-20 pb-32">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">

        {/* Copy block */}
        <div className="space-y-10">
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Activity size={16} className="text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Live Engine</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
            Compliance <br /><span className="text-[#38A3D8]">Engine</span><br />Running.
          </h2>
          <p className="text-slate-400 font-medium leading-relaxed max-w-sm">
            Real-time monitoring across all clients. Every deadline tracked. Every risk flagged. Every action logged.
          </p>
          <div className="space-y-3">
            {[
              { time: '14:32:01', action: 'Verify ID Docs', client: 'ABC Ltd', status: 'Success', color: 'text-emerald-400' },
              { time: '14:32:03', action: 'Streamline Data Streams', client: 'Def Co', status: 'Complete', color: 'text-emerald-400' },
              { time: '14:32:05', action: 'Analyze Client Risk', client: 'Ghi Inc', status: 'Moderate', color: 'text-amber-400' },
              { time: '14:32:08', action: 'Check Compliance', client: 'Jkl LLC', status: 'Verified', color: 'text-emerald-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/60 rounded-2xl border border-white/5 backdrop-blur">
                <span className="text-slate-500 font-mono text-[11px] shrink-0">{item.time}</span>
                <span className="text-white font-black text-xs flex-1 truncate">{item.action} — {item.client}</span>
                <span className={`text-[11px] font-black uppercase tracking-wider shrink-0 ${item.color}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone frame */}
        <div className="flex justify-center">
          <div className="w-[240px] bg-white rounded-[3.5rem] border-[14px] border-slate-800 shadow-[0_80px_160px_-30px_rgba(56,163,216,0.25)] overflow-hidden">
            {/* Phone header */}
            <div className="px-6 pt-8 pb-5 border-b border-slate-100 flex flex-col items-center gap-3">
              <FineGuardLogo className="h-7" />
              <h3 className="text-base font-black text-slate-900 tracking-tight leading-tight text-center">
                Compliance<br />Engine Running
              </h3>
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_16px_#10b981]" />
            </div>
            {/* Log entries */}
            <div className="px-5 py-4 space-y-3 bg-slate-50 min-h-[260px]">
              {[
                { t: '14:32:01', d: 'Verify ID Docs\n- ABC Ltd [cite: 9] - Success' },
                { t: '14:32:03', d: 'Streamline Data Streams\n- Def Co [cite: 9] - Complete' },
                { t: '14:32:05', d: 'Analyze Client Risk\n- Ghi Inc [cite: 9] - Moderate' },
                { t: '14:32:08', d: 'Check Compliance status\n- Jkl LLC [cite: 9] - Verified' },
                { t: '14:32:10', d: 'Update Compliance logs\n- Mno Plc [cite: 9] - Stored' },
                { t: '14:32:12', d: 'Verify Records\n- Pqr Ltd [cite: 9] - Active' },
              ].map((log, i) => (
                <p key={i} className="text-[9px] text-slate-600 font-medium leading-snug whitespace-pre-line">
                  <span className="font-black text-slate-800">{log.t}]</span> {log.d}
                </p>
              ))}
            </div>
            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 text-center bg-white">
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-wider">All deadlines monitored</p>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>
);

// ─── 2. INTAKE PAGE ───────────────────────────────────────────────────────────
const IntakePage = ({
  intakeStep, setIntakeStep, intakeData, setIntakeData, onComplete
}: Pick<ViewProps, 'intakeStep' | 'setIntakeStep' | 'intakeData' | 'setIntakeData'> & { onComplete: () => void }) => (
  <div className="min-h-[calc(100vh-80px)] bg-[#020617] flex items-center justify-center p-8 text-white">
    <div className="max-w-2xl w-full bg-slate-900 p-16 rounded-[4rem] border border-white/5 space-y-10">
      <h2 className="text-5xl font-black tracking-tighter leading-none">
        {intakeStep === 1 ? "Which practice are we protecting?" : "Where should we send the report?"}
      </h2>
      <div className="space-y-6">
        <input
          className="w-full px-10 py-8 bg-slate-950 border-none rounded-3xl font-black text-2xl text-white outline-none ring-4 ring-white/5 focus:ring-blue-600/40 transition"
          placeholder={intakeStep === 1 ? "Firm Name" : "Email Address"}
          value={intakeStep === 1 ? intakeData.firmName : intakeData.email}
          onChange={(e) =>
            intakeStep === 1
              ? setIntakeData({ ...intakeData, firmName: e.target.value })
              : setIntakeData({ ...intakeData, email: e.target.value })
          }
        />
        <button
          onClick={() => intakeStep === 1 ? setIntakeStep(2) : onComplete()}
          className="w-full py-8 bg-blue-600 text-white rounded-[3rem] font-black text-2xl flex items-center justify-center gap-6"
        >
          Continue <ArrowRight size={32} />
        </button>
      </div>
    </div>
  </div>
);

// ─── 3. SETUP SIMULATION ──────────────────────────────────────────────────────
const SetupSimulation = ({ setupProgress }: Pick<ViewProps, 'setupProgress'>) => (
  <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-8 bg-slate-50">
    <div className="max-w-3xl w-full bg-white p-20 rounded-[5rem] shadow-2xl border border-slate-100 text-center space-y-16">
      <h2 className="text-7xl font-black text-slate-900 tracking-tighter leading-none italic">Syncing <br />Practice</h2>
      <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden border-2 border-slate-50 p-1 shadow-inner">
        <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${setupProgress}%` }} />
      </div>
      <div className="bg-slate-950 rounded-[3rem] p-10 text-left h-56 font-mono text-emerald-400 text-xs overflow-hidden leading-relaxed">
        <p>[14:32:01] Auth Handshake: Verified</p>
        <p>[14:32:03] Mapping Document Libraries...</p>
        {setupProgress > 50 && <p className="text-white animate-pulse">LOG: Importing Statutory Deadlines from SharePoint</p>}
        {setupProgress > 80 && <p className="text-emerald-300">LOG: Success. Hub Active.</p>}
      </div>
    </div>
  </div>
);

// ─── 4. AGENCY HUB ────────────────────────────────────────────────────────────
const AgencyDash = ({ stats, setTenantId, onNavigate }: Pick<ViewProps, 'stats' | 'setTenantId' | 'onNavigate'>) => (
  <div className="space-y-12">
    <h1 className="text-7xl font-black tracking-tighter leading-none">Global Hub</h1>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <StatBlock title="Practices" val={stats?.totalFirms} icon={Building2} />
      <StatBlock title="Records" val={stats?.totalClients} icon={Briefcase} />
      <StatBlock title="Threats" val={stats?.totalRisks} icon={ShieldAlert} color="red" />
      <StatBlock title="Sync" val={stats?.uptime} icon={RefreshCw} color="emerald" />
    </div>
    <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-8">
      <h3 className="text-3xl font-black tracking-tighter italic">Partner Practices</h3>
      <div className="grid gap-4">
        {['FIRM123', 'ALPHA_TAX', 'OMEGA_UK'].map(id => (
          <div
            key={id}
            onClick={() => { setTenantId(id); onNavigate('firm-summary'); }}
            className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex justify-between items-center group cursor-pointer hover:border-blue-600 hover:bg-white transition-all duration-500 shadow-sm"
          >
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-sm text-xl border border-slate-50">
                {id[0]}
              </div>
              <p className="font-black text-slate-900 text-3xl tracking-tighter">{id}</p>
            </div>
            <ChevronRight className="text-slate-300 group-hover:text-blue-600 transition" size={48} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── 5. FIRM SUMMARY ──────────────────────────────────────────────────────────
const FirmSummary = ({ summary, clients, setIsEditing }: Pick<ViewProps, 'summary' | 'clients' | 'setIsEditing'>) => (
  <div className="space-y-12">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
      <BigStat title="Overdue" val={summary?.overdue} color="red" icon={AlertTriangle} />
      <BigStat title="Due Soon" val={summary?.dueSoon} color="amber" icon={Clock} />
      <BigStat title="Compliant" val={summary?.compliant} color="emerald" icon={CheckCircle2} />
    </div>
    <div className="bg-white rounded-[5rem] border border-slate-200 overflow-hidden shadow-sm">
      <div className="p-12 border-b bg-slate-50/50 flex justify-between items-center">
        <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.5em]">Critical Oversight</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {clients.map(c => (
          <div
            key={c.id}
            className="p-12 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer group"
            onClick={() => setIsEditing(c)}
          >
            <div className="flex items-center gap-10">
              <div className={`w-5 h-5 rounded-full ${c.Status === 'OVERDUE' ? 'bg-red-500' : 'bg-amber-400'}`} />
              <p className="font-black text-slate-900 text-3xl tracking-tighter">{c.CompanyName}</p>
            </div>
            <p className="text-sm font-black text-slate-400 font-mono tracking-tighter">{c.NextDeadline}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─── 6. PORTFOLIO MATRIX ──────────────────────────────────────────────────────
const PortfolioMatrix = ({ clients, setIsEditing }: Pick<ViewProps, 'clients' | 'setIsEditing'>) => (
  <div className="bg-white rounded-[5rem] border border-slate-200 shadow-sm overflow-hidden">
    <div className="p-16 border-b bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-10">
      <h2 className="text-7xl font-black text-slate-900 tracking-tighter leading-none italic underline decoration-blue-600 decoration-8 underline-offset-8">
        Matrix
      </h2>
      <div className="relative w-full md:w-96">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
        <input className="w-full pl-16 pr-8 py-6 bg-white border border-slate-200 rounded-[3rem] text-lg font-black shadow-sm" placeholder="Search entity..." />
      </div>
    </div>
    <table className="w-full text-left">
      <thead className="bg-slate-50/50 border-b">
        <tr className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em]">
          <th className="px-16 py-10">Client Entity</th>
          <th className="px-16 py-10">Compliance Status</th>
          <th className="px-16 py-10 text-right">Deadline</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {clients.map(c => (
          <tr key={c.id} className="hover:bg-slate-50/80 transition-all cursor-pointer group" onClick={() => setIsEditing(c)}>
            <td className="px-16 py-12 font-black text-slate-900 text-3xl leading-none tracking-tighter group-hover:text-blue-600 transition">
              {c.CompanyName}
            </td>
            <td className="px-16 py-12">
              <span className={`px-8 py-3 rounded-full text-[12px] font-black uppercase tracking-[0.3em] ${c.Status === 'OVERDUE' ? 'bg-red-600 text-white shadow-xl shadow-red-500/20' : 'bg-emerald-50 text-emerald-700'}`}>
                {c.Status}
              </span>
            </td>
            <td className="px-16 py-12 text-right font-mono text-sm text-slate-400 font-black tracking-tighter">{c.NextDeadline}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─── 7. RISK TRIAGE ───────────────────────────────────────────────────────────
const RiskTriage = ({ clients, setIsEditing }: Pick<ViewProps, 'clients' | 'setIsEditing'>) => (
  <div className="space-y-16">
    <h2 className="text-[10rem] font-black text-slate-900 tracking-tighter leading-[0.7] italic">Triage.</h2>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
      {clients.filter(c => c.Status !== 'COMPLIANT').map(risk => (
        <div
          key={risk.id}
          className={`p-16 rounded-[6rem] bg-white border border-slate-200 shadow-sm hover:shadow-2xl transition-all cursor-pointer border-l-[24px] ${risk.Status === 'OVERDUE' ? 'border-l-red-500' : 'border-l-amber-500'}`}
        >
          <div className="flex justify-between items-start mb-12">
            <div className="w-20 h-20 rounded-[2.5rem] flex items-center justify-center shadow-xl bg-slate-900 text-white">
              <AlertTriangle size={44} />
            </div>
            <button onClick={() => setIsEditing(risk)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-blue-600">
              <Edit2 size={24} />
            </button>
          </div>
          <h4 className="text-5xl font-black text-slate-900 mb-3 leading-none tracking-tighter italic">{risk.CompanyName}</h4>
          <p className="text-[14px] font-black text-slate-400 uppercase tracking-[0.5em] mb-12 leading-none">{risk.ServiceType}</p>
          <div className="pt-12 border-t border-slate-50 flex justify-between items-center text-sm font-black text-slate-500 italic">
            <span>Filing Date</span>
            <span>{risk.NextDeadline}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ─── MOBILE MOCKUPS ───────────────────────────────────────────────────────────
const StakeholderPortal = () => (
  <MobileDemoFrame title="Stakeholder" color="blue">
    <div className="bg-blue-600 p-12 rounded-[4rem] text-white space-y-12">
      <h3 className="text-4xl font-black tracking-tighter italic">ABC Ltd.</h3>
      <div className="h-px bg-white/20" />
      <div className="space-y-2">
        <p className="text-[11px] font-black text-blue-200 uppercase tracking-widest">Next Filing</p>
        <p className="text-2xl font-black">Annual Return FY24</p>
      </div>
      <div className="bg-white text-blue-600 px-8 py-4 rounded-[2rem] font-black text-sm w-fit shadow-2xl">3 Days Left</div>
    </div>
  </MobileDemoFrame>
);

const MobileAlerts = () => (
  <MobileDemoFrame title="Alerts" color="red">
    <div className="bg-red-50 border-4 border-red-100 p-10 rounded-[4rem] space-y-8">
      <AlertTriangle size={48} className="text-red-500" />
      <h3 className="text-3xl font-black text-red-600 tracking-tighter leading-none italic">Urgent <br />Compliance Alert</h3>
      <p className="text-sm font-bold text-slate-700">F&F Annual Return overdue.</p>
    </div>
  </MobileDemoFrame>
);

const MobileEngine = () => (
  <MobileDemoFrame title="Engine" color="slate">
    <div className="bg-slate-950 p-10 rounded-[4rem] font-mono text-[11px] text-emerald-400 h-96 overflow-hidden leading-relaxed space-y-4">
      <p>14:32:01 Verify ID - ABC Ltd</p>
      <p>14:32:03 Sync Stream - Success</p>
      <p>14:32:05 Risk Engine - Low</p>
      <p>14:32:08 Filing Log - Mapped</p>
      <div className="pt-10">
        <RefreshCw size={32} className="animate-spin text-emerald-500/20" />
      </div>
    </div>
  </MobileDemoFrame>
);

const MobileDemoFrame = ({ title, color, children }: { title: string; color: string; children: React.ReactNode }) => (
  <div className="min-h-[calc(100vh-80px)] bg-slate-950 flex flex-col items-center justify-center p-8 py-20">
    <div className="max-w-[400px] w-full bg-white rounded-[5.5rem] border-[24px] border-slate-900 shadow-[0_120px_240px_-60px_rgba(0,0,0,0.8)] aspect-[9/19.5] flex flex-col ring-[14px] ring-white/10 overflow-hidden">
      <div className="p-12 pt-24 border-b border-slate-50 flex flex-col items-center sticky top-0 bg-white z-20">
        <FineGuardLogo className="h-7 mb-8" />
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter leading-none italic">{title}</h2>
      </div>
      <div className="flex-1 p-10 space-y-12 overflow-y-auto">{children}</div>
    </div>
  </div>
);

// ─── DIRECTORY & SETTINGS ─────────────────────────────────────────────────────
const SiteMapHub = ({ onNavigate }: Pick<ViewProps, 'onNavigate'>) => (
  <div className="bg-white min-h-[calc(100vh-80px)] p-12 space-y-24">
    <h1 className="text-[10rem] font-black text-slate-900 tracking-tighter leading-[0.7] italic">Index.</h1>
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
      <IndexCard title="Acquisition" items={[{ l: 'Marketing', v: 'marketing' }, { l: 'Intake', v: 'intake' }, { l: 'Onboarding', v: 'setup' }]} onNav={onNavigate} />
      <IndexCard title="Governance" items={[{ l: 'Agency Hub', v: 'agency-dash' }, { l: 'System Map', v: 'sitemap' }, { l: 'Config', v: 'settings' }]} onNav={onNavigate} />
      <IndexCard title="Operations" items={[{ l: 'Summary', v: 'firm-summary' }, { l: 'Portfolio', v: 'portfolio' }, { l: 'Risks', v: 'risks' }]} onNav={onNavigate} />
      <IndexCard title="Mobility" items={[{ l: 'Portal', v: 'portal' }, { l: 'Alerts', v: 'mobile-alerts' }, { l: 'Logs', v: 'mobile-engine' }]} onNav={onNavigate} />
    </div>
  </div>
);

const SettingsView = ({ tenantId }: Pick<ViewProps, 'tenantId'>) => (
  <div className="space-y-16 max-w-4xl">
    <h1 className="text-7xl font-black tracking-tighter italic">Settings.</h1>
    <div className="bg-white p-16 rounded-[5rem] border border-slate-200 space-y-12 shadow-sm">
      <div className="space-y-6">
        <label className="text-[12px] font-black uppercase text-slate-400 tracking-[0.4em]">Firm Identifier</label>
        <input className="w-full px-12 py-8 rounded-[3.5rem] bg-slate-50 border-none font-black text-slate-400 text-2xl shadow-inner" value={tenantId} readOnly />
      </div>
      <div className="p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100 flex items-center justify-between text-emerald-800 font-black">
        <div className="flex items-center gap-6">
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
            <Check size={24} />
          </div>
          SharePoint Connected
        </div>
        <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_20px_#10b981]" />
      </div>
    </div>
  </div>
);

// ─── ATOMIC UI COMPONENTS ─────────────────────────────────────────────────────
const MenuSection = ({
  title, items, onNav
}: {
  title: string;
  items: { label: string; v: ViewName; icon: React.ComponentType<{ size?: number }> }[];
  onNav: (v: ViewName) => void;
}) => (
  <div className="space-y-6">
    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] px-4">{title}</h3>
    <div className="bg-slate-50 rounded-[3rem] p-4 space-y-2 border border-slate-100">
      {items.map(i => {
        const Icon = i.icon;
        return (
          <button
            key={i.v}
            onClick={() => onNav(i.v)}
            className="w-full text-left p-6 bg-white rounded-[2rem] text-sm font-black text-slate-600 hover:bg-blue-600 hover:text-white transition shadow-sm flex justify-between items-center group"
          >
            <div className="flex items-center gap-4"><Icon size={20} /> {i.label}</div>
            <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition" />
          </button>
        );
      })}
    </div>
  </div>
);

const IndexCard = ({
  title, items, onNav
}: {
  title: string;
  items: { l: string; v: ViewName }[];
  onNav: (v: ViewName) => void;
}) => (
  <div className="space-y-6">
    <h3 className="text-xs font-black uppercase text-slate-400 tracking-[0.4em] px-4">{title}</h3>
    <div className="bg-slate-50 rounded-[3rem] p-4 space-y-2 border border-slate-100">
      {items.map(i => (
        <button
          key={i.v}
          onClick={() => onNav(i.v)}
          className="w-full text-left p-6 bg-white rounded-[2rem] text-sm font-black text-slate-600 hover:bg-blue-600 hover:text-white transition shadow-sm flex justify-between items-center group"
        >
          {i.l} <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 transition" />
        </button>
      ))}
    </div>
  </div>
);

const NavTab = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`text-xs font-black uppercase tracking-widest transition-all pb-1 border-b-2 ${active ? 'text-blue-600 border-blue-600' : 'text-slate-400 border-transparent hover:text-slate-900'}`}
  >
    {label}
  </button>
);

const StatBlock = ({
  title, val, icon: Icon, color = "blue"
}: {
  title: string;
  val: number | string | undefined;
  icon: React.ComponentType<{ size?: number }>;
  color?: string;
}) => (
  <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm group hover:shadow-2xl transition-all duration-700 hover:-translate-y-3">
    <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-10 transition duration-700 ${color === 'red' ? 'bg-red-50 text-red-600' : color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} shadow-2xl`}>
      <Icon size={36} />
    </div>
    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2 leading-none">{title}</p>
    <h3 className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{val}</h3>
  </div>
);

const BigStat = ({
  title, val, color, icon: Icon
}: {
  title: string;
  val: number | undefined;
  color: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}) => (
  <div className="bg-white p-16 rounded-[5rem] border border-slate-200 shadow-sm transition-all duration-1000 hover:shadow-2xl hover:-translate-y-4 group relative overflow-hidden">
    <div className="flex justify-between items-start mb-20 relative z-10">
      <div className={`p-14 rounded-[4rem] bg-${color}-50 text-${color}-600 group-hover:scale-110 group-hover:rotate-6 transition duration-700 shadow-2xl`}>
        <Icon size={80} strokeWidth={2.5} />
      </div>
    </div>
    <p className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-300 leading-none mb-6 relative z-10 italic">{title}</p>
    <h3 className="text-[11rem] font-black text-slate-900 tracking-tighter leading-none relative z-10">{val}</h3>
  </div>
);
