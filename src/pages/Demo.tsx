import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import {
  Shield, CheckCircle, AlertCircle, Clock, Calendar, Bell,
  FileCheck, GitBranch, ChevronRight, ArrowRight, Play,
  Rocket, History, LayoutDashboard, Settings, Users,
  X, Zap, Lock, TrendingUp, Activity, Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// ── Demo data ──────────────────────────────────────────────────────────────

const CLIENTS = [
  { id: 1, name: 'Smithson & Co Accountants',    vat: 'Q1',  ct: 'Apr 25',  sa: 'Jan 26', status: 'ok'      as const },
  { id: 2, name: 'Patel Advisory Services',      vat: 'Q2',  ct: 'Sep 25',  sa: 'Jan 26', status: 'warning' as const },
  { id: 3, name: 'Northern Tax Partners',         vat: 'Q1',  ct: 'Mar 25',  sa: 'Jan 26', status: 'overdue' as const },
  { id: 4, name: 'Greenfield Accountancy Ltd',   vat: 'Q3',  ct: 'Dec 25',  sa: 'Jan 26', status: 'ok'      as const },
  { id: 5, name: 'Lancaster Finance Group',       vat: 'Q4',  ct: 'Jun 25',  sa: 'Jan 26', status: 'warning' as const },
  { id: 6, name: 'Birchwood Tax & Advisory',     vat: 'Q2',  ct: 'Nov 25',  sa: 'Jan 26', status: 'ok'      as const },
];

const DEADLINES = [
  { id: 1, label: 'VAT Return — Q1',            client: 'Smithson & Co',          due: '7 Mar',  daysLeft: 8,  type: 'vat'  },
  { id: 2, label: 'CT600 Corporation Tax',       client: 'Patel Advisory',         due: '14 Mar', daysLeft: 15, type: 'ct'   },
  { id: 3, label: 'Self Assessment — 2024/25',   client: 'Northern Tax Partners',  due: '31 Jan', daysLeft: -5, type: 'sa'   },
  { id: 4, label: 'PAYE Monthly RTI',            client: 'Lancaster Finance',       due: '19 Mar', daysLeft: 20, type: 'paye' },
  { id: 5, label: 'VAT Return — Q2',            client: 'Patel Advisory',         due: '7 May',  daysLeft: 69, type: 'vat'  },
];

const ALERTS = [
  { id: 1, icon: <AlertCircle className="h-4 w-4 text-red-500" />,    bg: 'bg-red-50 border-red-200',    title: 'Overdue: Self Assessment',   body: 'Northern Tax Partners — 5 days overdue. Action required.',       time: '2h ago' },
  { id: 2, icon: <Clock className="h-4 w-4 text-amber-500" />,         bg: 'bg-amber-50 border-amber-200', title: 'Due in 8 days: VAT Return',  body: 'Smithson & Co — Q1 VAT return due 7 March.',                      time: '4h ago' },
  { id: 3, icon: <CheckCircle className="h-4 w-4 text-green-500" />,   bg: 'bg-green-50 border-green-200', title: 'Filed: CT600',               body: 'Greenfield Accountancy — CT600 filed successfully.',               time: '1d ago' },
  { id: 4, icon: <Bell className="h-4 w-4 text-blue-500" />,           bg: 'bg-blue-50 border-blue-200',   title: 'MTD ITSA Reminder',          body: 'Quarterly MTD update due for 3 clients before 5 April.',           time: '2d ago' },
];

const WORKFLOW_STEPS = [
  { id: 1, label: 'Deadline detected',           desc: 'Engine calculates filing due dates for all clients',      done: true  },
  { id: 2, label: 'Client data collated',        desc: 'SharePoint pulls latest figures and prior-year comparisons', done: true  },
  { id: 3, label: 'Teams alert dispatched',      desc: 'Responsible accountant notified in their Teams channel',   done: true  },
  { id: 4, label: 'Return prepared',             desc: 'Staff marks return as prepared in the filing dashboard',   done: false },
  { id: 5, label: 'Partner review',              desc: 'Partner approves and signs off via Power Automate flow',   done: false },
  { id: 6, label: 'Filed & audit trail recorded', desc: 'Submission confirmed, immutable log entry created',      done: false },
];

const DEPLOY_STEPS = [
  { label: 'Validating Azure credentials',  done: true,  running: false },
  { label: 'Provisioning SharePoint site',  done: true,  running: false },
  { label: 'Installing Power Automate flows', done: true, running: false },
  { label: 'Configuring Teams notifications', done: false, running: true },
  { label: 'Setting up Entra ID roles',     done: false, running: false },
  { label: 'Running smoke tests',           done: false, running: false },
];

const TABS = [
  { id: 'dashboard',  label: 'Dashboard',    icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: 'clients',    label: 'Clients',      icon: <Users className="h-4 w-4" /> },
  { id: 'calendar',   label: 'Calendar',     icon: <Calendar className="h-4 w-4" /> },
  { id: 'workflow',   label: 'Workflow',     icon: <GitBranch className="h-4 w-4" /> },
  { id: 'alerts',     label: 'Alerts',       icon: <Bell className="h-4 w-4" /> },
  { id: 'deploy',     label: 'Installer',    icon: <Rocket className="h-4 w-4" /> },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'ok' | 'warning' | 'overdue' }) {
  if (status === 'ok')      return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"><CheckCircle className="h-3 w-3" /> On track</span>;
  if (status === 'warning') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"><Clock className="h-3 w-3" /> Due soon</span>;
  return                           <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><AlertCircle className="h-3 w-3" /> Overdue</span>;
}

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    vat:  'bg-purple-100 text-purple-700',
    ct:   'bg-blue-100 text-blue-700',
    sa:   'bg-orange-100 text-orange-700',
    paye: 'bg-teal-100 text-teal-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase ${map[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {type.toUpperCase()}
    </span>
  );
}

function useCountUp(target: number, duration = 1200) {
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

// ── Sub-views ──────────────────────────────────────────────────────────────

function DashboardView() {
  const total   = useCountUp(147);
  const success = useCountUp(138);
  const pending = useCountUp(6);
  const alerts  = useCountUp(3);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Filings',   value: total,   icon: <History className="h-5 w-5" />,              colour: 'text-brand-gold' },
          { label: 'Filed',           value: success,  icon: <CheckCircle className="h-5 w-5 text-green-500" />, colour: 'text-green-600' },
          { label: 'Pending',         value: pending,  icon: <Clock className="h-5 w-5 text-amber-500" />,       colour: 'text-amber-600' },
          { label: 'Alerts',          value: alerts,   icon: <AlertCircle className="h-5 w-5 text-red-400" />,   colour: 'text-red-500'   },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{s.label}</span>
              {s.icon}
            </div>
            <p className={`text-3xl font-bold ${s.colour}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming deadlines */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
          <div className="space-y-3">
            {DEADLINES.slice(0, 3).map((d) => (
              <div key={d.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <TypeBadge type={d.type} />
                  <span className="text-gray-700 truncate max-w-[180px]">{d.client}</span>
                </div>
                <span className={`font-medium ${d.daysLeft < 0 ? 'text-red-600' : d.daysLeft < 14 ? 'text-amber-600' : 'text-gray-500'}`}>
                  {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : d.due}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Filing Activity (last 6 months)</h3>
          <div className="flex items-end gap-2 h-24">
            {[38, 55, 42, 68, 72, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-brand-gold/70 transition-all duration-700"
                  style={{ height: `${h}%` }}
                />
                <span className="text-[10px] text-gray-400">
                  {['Sep','Oct','Nov','Dec','Jan','Feb'][i]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MTD readiness */}
      <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <Zap className="h-5 w-5 text-brand-gold" />
          <h3 className="font-semibold">MTD ITSA Readiness</h3>
          <span className="ml-auto rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-medium text-green-400">94% compliant</span>
        </div>
        <div className="w-full rounded-full bg-white/10 h-2 mb-3">
          <div className="h-2 rounded-full bg-brand-gold" style={{ width: '94%' }} />
        </div>
        <p className="text-sm text-slate-400">8 of 147 clients require action before the 5 April deadline. <span className="text-brand-gold underline cursor-pointer">View list →</span></p>
      </div>
    </div>
  );
}

function ClientsView() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Client Register</h3>
        <span className="text-sm text-gray-400">{CLIENTS.length} clients</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-brand-surface text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Client</th>
              <th className="px-5 py-3 text-left">VAT</th>
              <th className="px-5 py-3 text-left">CT600</th>
              <th className="px-5 py-3 text-left">SA</th>
              <th className="px-5 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {CLIENTS.map((c) => (
              <tr key={c.id} className="hover:bg-brand-surface/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{c.name}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.vat}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.ct}</td>
                <td className="px-5 py-3.5 text-gray-500">{c.sa}</td>
                <td className="px-5 py-3.5"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalendarView() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Filing Calendar — March 2026</h3>
        <div className="space-y-3">
          {DEADLINES.map((d) => (
            <div
              key={d.id}
              className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                d.daysLeft < 0
                  ? 'border-red-200 bg-red-50'
                  : d.daysLeft < 14
                  ? 'border-amber-200 bg-amber-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <TypeBadge type={d.type} />
                <div>
                  <p className="text-sm font-medium text-gray-900">{d.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{d.client}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-700">{d.due}</p>
                <p className={`text-xs mt-0.5 ${
                  d.daysLeft < 0 ? 'text-red-600' : d.daysLeft < 14 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {d.daysLeft < 0 ? `${Math.abs(d.daysLeft)}d overdue` : `${d.daysLeft}d left`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white text-sm">
        <p className="font-semibold text-brand-gold mb-1">Automated deadline calculation</p>
        <p className="text-slate-400 leading-relaxed">
          FineGuard's compliance engine automatically calculates VAT, CT, SA, PAYE, and MTD
          deadlines for all clients — accounting for weekends, bank holidays, and accounting period
          adjustments.
        </p>
      </div>
    </div>
  );
}

function WorkflowView() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    if (activeStep >= WORKFLOW_STEPS.length - 1) return;
    const t = setTimeout(() => setActiveStep((s) => s + 1), 1400);
    return () => clearTimeout(t);
  }, [activeStep]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="h-5 w-5 text-brand-gold" />
          <h3 className="font-semibold text-gray-900">Live Workflow: VAT Return — Smithson & Co</h3>
          <span className="ml-auto rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">In progress</span>
        </div>
        <div className="relative space-y-0">
          {WORKFLOW_STEPS.map((step, i) => {
            const isCompleted = i < activeStep;
            const isActive    = i === activeStep;
            return (
              <div key={step.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    isCompleted ? 'bg-green-500 border-green-500'
                    : isActive  ? 'bg-brand-gold border-brand-gold animate-pulse'
                    : 'bg-white border-gray-300'
                  }`}>
                    {isCompleted
                      ? <CheckCircle className="h-4 w-4 text-white" />
                      : isActive
                      ? <span className="h-2 w-2 rounded-full bg-white" />
                      : <span className="h-2 w-2 rounded-full bg-gray-300" />
                    }
                  </div>
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className={`w-0.5 h-8 transition-all duration-700 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-medium ${isCompleted ? 'text-green-700' : isActive ? 'text-brand-gold' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white text-sm">
        <p className="font-semibold text-brand-gold mb-1">Power Automate-driven workflows</p>
        <p className="text-slate-400 leading-relaxed">
          Every step is orchestrated by Power Automate flows running inside your Microsoft 365
          tenant. Approvals, notifications, and audit logs happen automatically — no manual
          chasing required.
        </p>
      </div>
    </div>
  );
}

function AlertsView() {
  const [dismissed, setDismissed] = useState<number[]>([]);
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Teams Alert Feed</h3>
        <span className="text-xs text-gray-400">{ALERTS.length - dismissed.length} active</span>
      </div>
      {ALERTS.filter((a) => !dismissed.includes(a.id)).map((a) => (
        <div
          key={a.id}
          className={`rounded-xl border p-4 flex items-start gap-3 ${a.bg}`}
        >
          <div className="mt-0.5 shrink-0">{a.icon}</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">{a.title}</p>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{a.body}</p>
            <p className="text-xs text-gray-400 mt-1">{a.time}</p>
          </div>
          <button
            onClick={() => setDismissed((prev) => [...prev, a.id])}
            className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      {dismissed.length === ALERTS.length && (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">
          <CheckCircle className="mx-auto h-8 w-8 text-green-400 mb-2" />
          All alerts cleared — great work!
          <br />
          <button className="mt-2 text-brand-gold underline text-xs" onClick={() => setDismissed([])}>
            Reset demo
          </button>
        </div>
      )}
      <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white text-sm">
        <p className="font-semibold text-brand-gold mb-1">Microsoft Teams-native alerts</p>
        <p className="text-slate-400 leading-relaxed">
          Alerts are delivered directly to the relevant Teams channel or personal chat — no
          email inbox to monitor, no separate portal to log into.
        </p>
      </div>
    </div>
  );
}

function DeployView() {
  const [started, setStarted] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    if (!started) return;
    if (stepIdx >= DEPLOY_STEPS.length) return;
    const t = setTimeout(() => setStepIdx((i) => i + 1), 1200);
    return () => clearTimeout(t);
  }, [started, stepIdx]);

  const steps = DEPLOY_STEPS.map((s, i) => ({
    ...s,
    done:    i < stepIdx,
    running: started && i === stepIdx,
  }));

  const allDone = stepIdx >= DEPLOY_STEPS.length;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Rocket className="h-5 w-5 text-brand-gold" />
          <h3 className="font-semibold text-gray-900">FineGuard Installer Portal — Demo Run</h3>
        </div>
        <p className="text-sm text-gray-500 mb-5">
          Simulated deployment into <span className="font-mono text-gray-700">demo-tenant.onmicrosoft.com</span>
        </p>

        {!started ? (
          <Button onClick={() => setStarted(true)} className="gap-2">
            <Play className="h-4 w-4" /> Run demo deployment
          </Button>
        ) : (
          <div className="font-mono text-xs space-y-2 bg-brand-navy rounded-lg p-4">
            {steps.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 ${
                s.done    ? 'text-green-400'
                : s.running ? 'text-brand-gold animate-pulse'
                : 'text-slate-600'
              }`}>
                {s.done    ? '✓' : s.running ? '›' : '○'}
                <span>{s.label}</span>
                {s.running && <span className="ml-1 inline-flex gap-0.5"><span className="animate-bounce" style={{animationDelay:'0ms'}}>.</span><span className="animate-bounce" style={{animationDelay:'150ms'}}>.</span><span className="animate-bounce" style={{animationDelay:'300ms'}}>.</span></span>}
              </div>
            ))}
            {allDone && (
              <div className="mt-3 pt-3 border-t border-white/10 text-green-400 font-semibold">
                ✓ Deployment complete — FineGuard is live in your tenant!
              </div>
            )}
          </div>
        )}

        {allDone && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
            <p className="text-sm text-green-800">
              Deployment finished in <strong>4m 12s</strong>. All 6 steps passed smoke tests.
            </p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-5 text-white text-sm">
        <p className="font-semibold text-brand-gold mb-1">One-click tenant deployment</p>
        <p className="text-slate-400 leading-relaxed">
          The real Installer Portal deploys FineGuard into any Microsoft 365 tenant in under an
          hour, with live step logging, rollback support, and multi-tenant management for
          partners.
        </p>
      </div>
    </div>
  );
}

// ── Main Demo Page ─────────────────────────────────────────────────────────

export default function Demo() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showBanner, setShowBanner] = useState(true);

  return (
    <div className="min-h-screen bg-brand-surface">
      {/* ── Demo Banner ── */}
      {showBanner && (
        <div className="bg-brand-navy border-b border-brand-gold/30 px-4 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Star className="h-4 w-4 text-brand-gold shrink-0" />
            <span className="text-white">
              <strong className="text-brand-gold">Interactive Demo</strong> — all data is simulated.
              Ready to see FineGuard in your own tenant?
            </span>
            <Button
              size="sm"
              className="ml-2 bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold text-xs h-7 px-3 hidden sm:inline-flex"
              onClick={() => navigate('/book-demo')}
            >
              Book a live demo
            </Button>
          </div>
          <button onClick={() => setShowBanner(false)} className="text-slate-400 hover:text-white shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── App Shell ── */}
      <div className="flex h-[calc(100vh-theme(spacing.11))]" style={showBanner ? {} : { height: '100vh' }}>
        {/* Sidebar */}
        <aside className="hidden lg:flex w-56 shrink-0 flex-col bg-brand-navy border-r border-white/5">
          <div
            className="flex items-center gap-2.5 px-4 py-5 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Shield className="h-6 w-6 text-brand-gold" />
            <span className="text-base font-bold text-white tracking-tight">FineGuard</span>
          </div>
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
            <button
              onClick={() => navigate('/app/settings/domains')}
              className="w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          </nav>
          <div className="px-4 py-4 border-t border-white/10 space-y-2">
            <Button
              size="sm"
              className="w-full bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold text-xs"
              onClick={() => navigate('/book-demo')}
            >
              Book live demo
            </Button>
            <p className="text-xs text-slate-600 text-center">v1.0.0 — Demo mode</p>
          </div>
        </aside>

        {/* Content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex h-14 items-center gap-4 border-b border-gray-200 bg-white px-6 shrink-0">
            <Shield className="h-5 w-5 text-brand-gold lg:hidden" />
            <h1 className="text-base font-semibold text-gray-900">
              {TABS.find((t) => t.id === activeTab)?.label ?? 'FineGuard Demo'}
            </h1>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="text-xs border-brand-gold/40 text-brand-gold hidden sm:inline-flex">
                Demo mode
              </Badge>
              <Button
                size="sm"
                className="bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold text-xs"
                onClick={() => navigate('/book-demo')}
              >
                Get started <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </header>

          {/* Mobile tab bar */}
          <div className="lg:hidden flex overflow-x-auto gap-1 bg-white border-b border-gray-200 px-4 py-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-brand-navy text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Main */}
          <main className="flex-1 overflow-y-auto p-6">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'clients'   && <ClientsView />}
            {activeTab === 'calendar'  && <CalendarView />}
            {activeTab === 'workflow'  && <WorkflowView />}
            {activeTab === 'alerts'    && <AlertsView />}
            {activeTab === 'deploy'    && <DeployView />}
          </main>
        </div>
      </div>

      {/* ── Bottom CTA strip (mobile) ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-brand-gold/30 px-4 py-3 flex items-center justify-between">
        <div className="text-xs text-slate-400">Like what you see?</div>
        <Button
          size="sm"
          className="bg-brand-gold hover:bg-brand-gold-dark text-brand-navy font-semibold text-xs"
          onClick={() => navigate('/book-demo')}
        >
          Book a live demo <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
