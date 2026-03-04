import { useLocation } from 'wouter';
import {
  CheckCircle, ArrowRight, Zap, Lock,
  Bell, FileCheck, GitBranch, Users,
  Building2, Mail, Globe, Bot, AlertTriangle,
  Calendar, TrendingUp, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── Data ─────────────────────────────────────────────────────────────────── */

const WHY_ITEMS = [
  {
    icon: <CheckCircle className="h-5 w-5 text-brand-gold" />,
    heading: 'Built for UK accountancy',
    body: 'Tracks UK statutory deadlines, HMRC cycles, Companies House filings, payroll schedules, VAT windows, and more.',
  },
  {
    icon: <ArrowRight className="h-5 w-5 text-brand-gold" />,
    heading: 'A digital bridge for traditional practices',
    body: 'Move from paper and spreadsheets to automated workflows without disrupting how staff work today.',
  },
  {
    icon: <Building2 className="h-5 w-5 text-brand-gold" />,
    heading: 'Microsoft 365-native',
    body: 'Runs entirely inside your tenant using SharePoint, Teams, Power Automate, Azure Functions, and Entra ID. No external data storage.',
  },
  {
    icon: <FileCheck className="h-5 w-5 text-brand-gold" />,
    heading: 'MTD-ready',
    body: 'Provides the digital records, automation, and audit trail required for Making Tax Digital (MTD ITSA).',
  },
  {
    icon: <Zap className="h-5 w-5 text-brand-gold" />,
    heading: 'Deploys in minutes',
    body: 'The FineGuard Installer Portal deploys into any tenant in under an hour, with live logging and automation steps.',
  },
];

const FEATURES = [
  { icon: <Calendar className="h-6 w-6" />, title: 'Automated Compliance Engine', desc: 'Calculates deadlines, monitors obligations, and keeps filing calendars up to date automatically.' },
  { icon: <Bell className="h-6 w-6" />, title: 'Teams-based Alerts & Collaboration', desc: 'Instant reminders where staff already work — no new tools to learn.' },
  { icon: <TrendingUp className="h-6 w-6" />, title: 'Filing Calendar & Client Dashboards', desc: 'Real-time visibility across all clients and teams in a single view.' },
  { icon: <GitBranch className="h-6 w-6" />, title: 'Workflow Automation', desc: 'Standardised digital workflows streamline your practice end to end.' },
  { icon: <FileCheck className="h-6 w-6" />, title: 'Audit Trail', desc: 'Every compliance action recorded for complete transparency and regulatory readiness.' },
  { icon: <Bot className="h-6 w-6" />, title: 'Optional Copilot Integration', desc: 'Smart compliance insights powered by Microsoft AI — available on eligible plans.' },
];

const M365_TOOLS = ['SharePoint', 'Teams', 'Power Automate', 'Azure Functions', 'Entra ID (Azure AD)'];

const SECURITY_ITEMS = [
  'All data stays inside your Microsoft 365 tenant',
  'Uses Microsoft-grade identity and access controls',
  'Zero third-party data storage',
  'Full audit logs',
];

/* ─── Mock UI Screens ───────────────────────────────────────────────────────── */

/** Laptop frame containing the main dashboard mockup */
function DashboardMockup() {
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Laptop lid */}
      <div className="bg-gray-800 rounded-t-xl pt-4 px-4 pb-0 shadow-2xl">
        {/* Screen bezel */}
        <div className="bg-gray-900 rounded-t-lg p-1">
          {/* Screen content */}
          <div className="bg-[#0f172a] rounded-t-md overflow-hidden" style={{ minHeight: 320 }}>
            {/* Top bar */}
            <div className="flex items-center justify-between bg-[#1e293b] px-4 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <img src="/images/logo.svg" alt="FineGuard" className="h-6 w-auto" />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />Live</span>
                <span>Smith & Co Accountants</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-0 h-full">
              {/* Sidebar */}
              <div className="bg-[#1e293b] border-r border-white/10 p-3 space-y-1">
                {['Dashboard','Companies House','VAT','Corp Tax','Self Assessment'].map((item, i) => (
                  <div key={item} className={`text-xs px-2 py-1.5 rounded ${i === 0 ? 'bg-sky-500/20 text-sky-300' : 'text-slate-500 hover:text-slate-300'}`}>{item}</div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-2 p-3 space-y-3">
                <div className="text-xs font-semibold text-white">UK Compliance Status</div>
                {/* Stat cards */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Active Clients', value: '142', color: 'text-sky-400' },
                    { label: 'Due This Week', value: '12', color: 'text-amber-400' },
                    { label: 'Overdue', value: '3', color: 'text-red-400' },
                  ].map(s => (
                    <div key={s.label} className="bg-white/5 rounded p-2">
                      <div className={`text-base font-bold ${s.color}`}>{s.value}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Compliance bars */}
                <div className="space-y-1.5">
                  <div className="text-[10px] text-slate-400">Compliance Workflow</div>
                  {[
                    { label: 'VAT Returns', pct: 87, color: 'bg-sky-500' },
                    { label: 'Corp Tax', pct: 72, color: 'bg-violet-500' },
                    { label: 'Self Assessment', pct: 91, color: 'bg-green-500' },
                  ].map(b => (
                    <div key={b.label}>
                      <div className="flex justify-between text-[9px] text-slate-500 mb-0.5">
                        <span>{b.label}</span><span>{b.pct}%</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full ${b.color} rounded-full`} style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* Data stream row */}
                <div className="text-[10px] text-slate-400 mt-1">Data Stream Analysis</div>
                <div className="grid grid-cols-4 gap-1">
                  {[65, 80, 45, 90, 70, 55, 85, 60].map((h, i) => (
                    <div key={i} className="bg-white/5 rounded flex items-end justify-center p-1" style={{ height: 36 }}>
                      <div className="w-2 bg-sky-500/70 rounded-sm" style={{ height: `${h}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Laptop base */}
      <div className="bg-gray-700 h-3 rounded-b-xl shadow-xl mx-4" />
      <div className="bg-gray-600 h-1.5 rounded-b-xl shadow-lg mx-0" />
    </div>
  );
}

/** Phone frame with At-Risk Clients table */
function AtRiskClientsMockup() {
  const clients = [
    { name: 'Apex Trading Ltd', service: 'VAT Return', days: 3, status: 'urgent' },
    { name: 'Blue Sky Consulting', service: 'Corp Tax', days: 7, status: 'warning' },
    { name: 'Cedar Grove Ltd', service: 'Self Assessment', days: 14, status: 'ok' },
    { name: 'Delta Systems', service: 'Companies House', days: 1, status: 'overdue' },
  ];
  const badge: Record<string, string> = {
    urgent:  'bg-amber-500/20 text-amber-300',
    warning: 'bg-yellow-500/20 text-yellow-300',
    ok:      'bg-green-500/20 text-green-300',
    overdue: 'bg-red-500/20 text-red-300',
  };
  const label: Record<string, string> = { urgent: 'Urgent', warning: 'Due Soon', ok: 'On Track', overdue: 'Overdue' };

  return (
    <PhoneFrame>
      <div className="bg-[#0f172a] h-full flex flex-col">
        <div className="bg-[#1e293b] px-3 py-2 flex items-center justify-between border-b border-white/10">
          <span className="text-xs font-semibold text-white">At Risk Clients</span>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <div className="flex-1 overflow-hidden px-2 py-2 space-y-1.5">
          {clients.map(c => (
            <div key={c.name} className="bg-white/5 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-white truncate pr-1">{c.name}</span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${badge[c.status]}`}>{label[c.status]}</span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[9px] text-slate-500">{c.service}</span>
                <span className="text-[9px] text-slate-400">{c.days}d left</span>
              </div>
            </div>
          ))}
        </div>
        <div className="px-2 pb-2">
          <div className="bg-sky-500 text-white text-[10px] font-medium text-center py-1.5 rounded-lg">
            Take Action on All
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Phone frame with Compliance Alert */
function ComplianceAlertMockup() {
  return (
    <PhoneFrame>
      <div className="bg-[#0f172a] h-full flex flex-col">
        <div className="bg-red-900/40 border-b border-red-500/30 px-3 py-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
          <span className="text-[10px] font-semibold text-red-300">Urgent Compliance Alert</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-3">
          {/* Main alert */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-red-400">2</div>
            <div className="text-[10px] text-red-300 font-medium">Deadlines Due in 3 Days</div>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { label: 'Overdue', value: '1', color: 'text-red-400' },
              { label: 'Due Soon', value: '5', color: 'text-amber-400' },
              { label: 'Completed', value: '18', color: 'text-green-400' },
            ].map(s => (
              <div key={s.label} className="bg-white/5 rounded-lg p-2 text-center">
                <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[8px] text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
          {/* Alert items */}
          <div className="space-y-1.5">
            {[
              { co: 'Delta Systems', task: 'Companies House', due: 'Tomorrow' },
              { co: 'Apex Trading Ltd', task: 'VAT Return', due: 'In 3 days' },
            ].map(a => (
              <div key={a.co} className="bg-white/5 rounded-lg p-2 flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-medium text-white">{a.co}</div>
                  <div className="text-[9px] text-slate-500">{a.task}</div>
                </div>
                <span className="text-[8px] text-amber-400 font-medium">{a.due}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 pb-3">
          <div className="bg-red-500 text-white text-[10px] font-semibold text-center py-1.5 rounded-lg">
            Resolve Now
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Phone frame with Firm Setup wizard */
function FirmSetupMockup() {
  const steps = [
    { label: 'Connected to Microsoft 365', done: true },
    { label: 'SharePoint configured', done: true },
    { label: 'Teams channels created', done: true },
    { label: 'Power Automate flows live', done: false },
    { label: 'Live monitoring enabled', done: false },
  ];
  return (
    <PhoneFrame>
      <div className="bg-[#0f172a] h-full flex flex-col">
        <div className="bg-[#1e293b] px-3 py-2 border-b border-white/10">
          <span className="text-[10px] font-semibold text-white">Firm Setup in Progress</span>
        </div>
        <div className="flex-1 px-3 py-3 space-y-3">
          {/* Progress ring */}
          <div className="flex flex-col items-center py-2">
            <div className="relative h-16 w-16">
              <svg className="h-16 w-16 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#38bdf8" strokeWidth="3"
                  strokeDasharray="75, 100" strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-sky-400">75%</span>
            </div>
            <span className="mt-1 text-[9px] text-slate-400">Setup complete</span>
          </div>
          {/* Steps */}
          <div className="space-y-2">
            {steps.map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${s.done ? 'bg-green-500' : 'bg-white/10'}`}>
                  {s.done && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <span className={`text-[10px] ${s.done ? 'text-slate-300' : 'text-slate-600'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-3 pb-3">
          <div className="bg-sky-500 text-white text-[10px] font-semibold text-center py-1.5 rounded-lg">
            Continue Setup
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Phone frame with Client-Safe Portal */
function ClientPortalMockup() {
  return (
    <PhoneFrame>
      <div className="bg-[#0f172a] h-full flex flex-col">
        <div className="bg-[#1e293b] px-3 py-2 border-b border-white/10 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-white">Client Portal</span>
          <Shield className="h-3 w-3 text-sky-400" />
        </div>
        <div className="flex-1 px-3 py-3 space-y-2.5">
          <div className="bg-white/5 rounded-xl p-2.5">
            <div className="text-[10px] font-semibold text-white">ABC Ltd.</div>
            <div className="text-[9px] text-slate-500 mt-0.5">Company No. 12345678</div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 font-medium">Compliant</span>
              <span className="text-[8px] text-slate-500">Last updated today</span>
            </div>
          </div>
          <div className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Upcoming Deadlines</div>
          {[
            { task: 'VAT Return (Q4)', due: '7 Feb 2025', status: 'pending' },
            { task: 'Corporation Tax', due: '31 Mar 2025', status: 'ok' },
            { task: 'Confirmation Statement', due: '15 Apr 2025', status: 'ok' },
          ].map(d => (
            <div key={d.task} className="flex items-center justify-between bg-white/5 rounded-lg px-2 py-1.5">
              <div>
                <div className="text-[9px] font-medium text-white">{d.task}</div>
                <div className="text-[8px] text-slate-500">{d.due}</div>
              </div>
              <div className={`h-1.5 w-1.5 rounded-full ${d.status === 'pending' ? 'bg-amber-400' : 'bg-green-400'}`} />
            </div>
          ))}
          <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-2 py-2 text-center">
            <div className="text-[9px] text-sky-300">All filings managed by your accountant</div>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/** Reusable phone frame wrapper */
function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-40">
      <div className="bg-gray-800 rounded-3xl p-2 shadow-2xl border border-gray-700">
        {/* Notch */}
        <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-900 rounded-full z-10" />
        <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ height: 300 }}>
          {children}
        </div>
        {/* Home bar */}
        <div className="mt-1.5 mx-auto h-1 w-10 bg-gray-600 rounded-full" />
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────────────────────── */

export default function FineGuard() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Nav ── */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center">
            <img src="/images/logo.svg" alt="FineGuard" className="h-10 w-auto" />
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-gray-600 md:flex">
            <a href="#screens"   className="hover:text-brand-gold transition-colors">Product</a>
            <a href="#features"  className="hover:text-brand-gold transition-colors">Features</a>
            <a href="#security"  className="hover:text-brand-gold transition-colors">Security</a>
            <a href="#partners"  className="hover:text-brand-gold transition-colors">Partners</a>
            <a href="/about"     className="hover:text-brand-gold transition-colors">About</a>
            <button onClick={() => navigate('/demo')} className="font-semibold text-brand-gold hover:text-brand-gold-dark transition-colors">
              Try Demo
            </button>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/compliance-bundle')}>Get Bundle</Button>
            <Button size="sm" onClick={() => navigate('/app/deploy')}>Deploy Now</Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-brand-navy via-brand-navy-light to-[#0A2540] py-20 text-white overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/10 px-4 py-1.5 text-sm font-medium text-brand-gold">
                <Zap className="h-3.5 w-3.5" /> Microsoft 365-native · UK compliance
              </div>
              <h1 className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
                Complete Control &amp;<br />
                <span className="text-brand-gold">Efficiency for UK Firms</span>
              </h1>
              <p className="mb-8 max-w-lg text-lg text-slate-300 leading-relaxed">
                Replace manual spreadsheets with automated compliance — real-time deadlines,
                client alerts, and full audit trail, all running securely inside your
                Microsoft 365 tenant.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate('/app/deploy')}>
                  Deploy FineGuard <ArrowRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/demo')}
                  className="border-brand-gold/60 text-brand-gold hover:bg-brand-gold/10 hover:text-brand-gold">
                  Try Demo
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/book-demo')}
                  className="border-white/30 text-white hover:bg-white/10 hover:text-white">
                  Book a Demo
                </Button>
              </div>
            </div>
            {/* Hero mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Product Screens ── */}
      <section id="screens" className="py-24 bg-brand-surface overflow-hidden">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Everything Your Practice Needs</h2>
            <p className="mx-auto max-w-xl text-gray-500">
              From onboarding to daily compliance management — FineGuard covers every workflow.
            </p>
          </div>

          {/* Row 1 – Firm Setup + At Risk Clients */}
          <div className="grid md:grid-cols-2 gap-16 items-center mb-20">
            <div className="flex justify-center gap-6">
              <FirmSetupMockup />
              <AtRiskClientsMockup />
            </div>
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                Onboarding &amp; Risk Management
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Onboard Firms in Minutes,<br />Catch Risk Before It Becomes a Fine
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                The guided setup wizard connects your Microsoft 365 tenant step by step —
                SharePoint, Teams, Power Automate, live monitoring. Once live, FineGuard
                automatically surfaces clients with upcoming or overdue deadlines so
                nothing slips through.
              </p>
              <ul className="space-y-2">
                {['Guided 5-step setup wizard', 'Real-time setup progress tracking', 'At-risk client dashboard', 'Days-to-deadline indicators'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{i}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 2 – Compliance Alert + Client Portal */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                Alerts &amp; Client Transparency
              </div>
              <h3 className="mb-4 text-2xl font-bold text-gray-900">
                Proactive Alerts &amp;<br />Client-Safe Compliance Views
              </h3>
              <p className="text-gray-500 leading-relaxed mb-6">
                Urgent compliance alerts are surfaced instantly — days overdue, days remaining,
                and required actions all in one place. Clients get a clean, jargon-free portal
                showing their upcoming filing schedule without exposing internal workflow data.
              </p>
              <ul className="space-y-2">
                {['Push alerts for imminent deadlines', 'Priority-ranked action queue', 'Client-safe portal view', 'Zero-jargon compliance summary'].map(i => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />{i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-1 md:order-2 flex justify-center gap-6">
              <ComplianceAlertMockup />
              <ClientPortalMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── Why FineGuard ── */}
      <section id="features" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">Why Firms Choose FineGuard</h2>
            <p className="mx-auto max-w-xl text-gray-500">
              Built from the ground up for UK accountancy practices of every size.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_ITEMS.map((item) => (
              <div key={item.heading} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-gold/10">
                  {item.icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold text-gray-900">{item.heading}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
            {/* M365 card */}
            <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6 shadow-sm lg:col-span-1">
              <h3 className="mb-3 text-sm font-semibold text-white">Microsoft 365 Stack</h3>
              <ul className="space-y-2">
                {M365_TOOLS.map(t => (
                  <li key={t} className="flex items-center gap-2 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-brand-gold shrink-0" />{t}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-slate-500">No external data storage. No third-party silos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What FineGuard Delivers ── */}
      <section className="bg-brand-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <h2 className="mb-3 text-3xl font-bold text-gray-900">What FineGuard Delivers</h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl bg-white p-6 border border-gray-200 shadow-sm">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-gold/10 text-brand-gold">
                  {f.icon}
                </div>
                <h3 className="mb-1.5 font-semibold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section id="security" className="py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center gap-10 md:flex-row">
            <div className="flex-1">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-navy">
                <Lock className="h-7 w-7 text-brand-gold" />
              </div>
              <h2 className="mb-4 text-3xl font-bold text-gray-900">Security You Can Trust</h2>
              <p className="mb-6 text-gray-500 leading-relaxed">
                FineGuard never stores your data outside your own Microsoft 365 tenant. Your
                clients' information stays in your control, protected by Microsoft-grade security.
              </p>
              <ul className="space-y-3">
                {SECURITY_ITEMS.map(s => (
                  <li key={s} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="mt-0.5 h-4 w-4 text-green-500 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 rounded-2xl border border-brand-gold/30 bg-brand-navy p-8">
              <p className="mb-5 text-sm font-semibold uppercase tracking-widest text-brand-gold">
                Zero-trust architecture
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Identity and access is handled entirely by Entra ID (Azure AD). FineGuard inherits
                your organisation's existing conditional access policies, MFA requirements, and
                role-based access controls.
              </p>
              <div className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs font-mono text-slate-400">Authentication header</p>
                <p className="mt-1 text-xs font-mono text-green-400">x-ms-client-principal</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Partners ── */}
      <section id="partners" className="bg-brand-surface py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl rounded-2xl border border-brand-gold/30 bg-brand-navy p-10 text-center">
            <Users className="mx-auto mb-4 h-10 w-10 text-brand-gold" />
            <h2 className="mb-3 text-2xl font-bold text-white">For Partners</h2>
            <p className="mx-auto mb-6 max-w-xl text-slate-300 text-sm leading-relaxed">
              FineGuard offers multi-tenant management, deployment automation, and recurring revenue
              opportunities for Microsoft partners and accountancy technology providers.
            </p>
            <Button onClick={() => navigate('/app/partners')}>
              Explore the Partner Programme <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">Get Started Today</h2>
          <p className="mb-8 text-gray-500">
            Deploy FineGuard into your Microsoft 365 tenant in under an hour using the Installer
            Portal, or request a live demo from our team.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" onClick={() => navigate('/app/deploy')}>
              Open Installer Portal <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/book-demo')}>
              Request a Demo
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <img src="/images/logo.svg" alt="FineGuard" className="h-8 w-auto" />
            <div className="flex flex-wrap gap-5 text-sm text-gray-500">
              <a href="https://fineguard.co.uk" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Globe className="h-3.5 w-3.5" /> fineguard.co.uk
              </a>
              <a href="mailto:info@fineguard.co.uk"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Mail className="h-3.5 w-3.5" /> info@fineguard.co.uk
              </a>
              <a href="mailto:partners@fineguard.co.uk"
                className="flex items-center gap-1 hover:text-brand-gold transition-colors">
                <Users className="h-3.5 w-3.5" /> Partner Programme
              </a>
            </div>
          </div>
          <p className="mt-6 text-xs text-gray-400">
            © {new Date().getFullYear()} FineGuard. All rights reserved. Registered in England and Wales.
          </p>
        </div>
      </footer>
    </div>
  );
}
