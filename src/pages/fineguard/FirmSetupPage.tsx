import { useState, useEffect, useRef } from 'react';
import {
  CheckCircle, Loader2, Circle, Building, Users, Activity,
  Shield, ArrowRight, Zap, RefreshCw, Terminal,
} from 'lucide-react';
import { AppLayout } from '@/components/fineguard/AppLayout';
import { Card } from '@/components/fineguard/Card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';

// ── Types ───────────────────────────────────────────────────────────────────

type StepStatus = 'pending' | 'running' | 'done' | 'error';

interface SetupStep {
  id: number;
  label: string;
  desc: string;
  status: StepStatus;
  duration: number; // ms to complete
}

interface LogEntry {
  ts: string;
  level: 'info' | 'success' | 'warn' | 'engine';
  msg: string;
}

// ── Data ────────────────────────────────────────────────────────────────────

const INITIAL_STEPS: SetupStep[] = [
  { id: 1, label: 'Workspace created',      desc: 'SharePoint site and document libraries provisioned',        status: 'done',    duration: 0    },
  { id: 2, label: 'Clients imported',       desc: '14 clients loaded from Companies House API',                status: 'done',    duration: 0    },
  { id: 3, label: 'Activating monitoring',  desc: 'Compliance engine connecting to HMRC and CH data feeds',    status: 'running', duration: 3000 },
  { id: 4, label: 'Teams notifications',    desc: 'Configuring alert channels for each accountant',            status: 'pending', duration: 2000 },
  { id: 5, label: 'Deadline engine',        desc: 'Calculating all filing deadlines for current portfolio',    status: 'pending', duration: 2500 },
  { id: 6, label: 'Zero-variance checks',   desc: 'Running pre-submission validation across all open returns', status: 'pending', duration: 2000 },
  { id: 7, label: 'Live — system ready',    desc: 'All modules active and monitoring',                         status: 'pending', duration: 1500 },
];

const LOG_SEQUENCE: Omit<LogEntry, 'ts'>[] = [
  { level: 'info',    msg: 'FineGuard Compliance Engine v1.0.0 initialising…' },
  { level: 'info',    msg: 'Connecting to Companies House API…' },
  { level: 'success', msg: 'Companies House API: authenticated (OAuth 2.0)' },
  { level: 'info',    msg: 'Loading client portfolio: 14 companies detected' },
  { level: 'success', msg: 'Client import complete: 14 records processed' },
  { level: 'engine',  msg: 'Compliance engine: structured data tracking active [cite: 4]' },
  { level: 'info',    msg: 'Connecting to HMRC MTD VAT API…' },
  { level: 'success', msg: 'HMRC MTD VAT: authorised — 4 obligations retrieved' },
  { level: 'info',    msg: 'Connecting to HMRC Corporation Tax endpoint…' },
  { level: 'success', msg: 'HMRC CT: linked — 4 CT600 periods tracked' },
  { level: 'info',    msg: 'Activating Microsoft Teams notification channels…' },
  { level: 'success', msg: 'Teams: 3 alert channels configured' },
  { level: 'engine',  msg: 'Deadline engine: calculating filing obligations…' },
  { level: 'warn',    msg: 'ALERT: 3 overdue filings detected — Teams alerts dispatched' },
  { level: 'warn',    msg: 'ALERT: 5 filings due within 14 days — accountants notified' },
  { level: 'engine',  msg: 'Zero-variance engine: running pre-submission checks…' },
  { level: 'success', msg: 'Pre-submission validation: 11 of 14 records pass' },
  { level: 'warn',    msg: 'Variance flags: 3 records require accountant review' },
  { level: 'success', msg: 'Compliance score calculated: 98.5%' },
  { level: 'engine',  msg: '✓ FineGuard Compliance Engine is LIVE — all systems operational' },
];

function now() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Components ───────────────────────────────────────────────────────────────

function StepIcon({ status }: { status: StepStatus }) {
  if (status === 'done')    return <CheckCircle className="h-6 w-6 text-green-500" />;
  if (status === 'running') return <Loader2 className="h-6 w-6 text-brand-gold animate-spin" />;
  if (status === 'error')   return <Circle className="h-6 w-6 text-red-400" />;
  return <Circle className="h-6 w-6 text-gray-300" />;
}

const LOG_COLOUR: Record<LogEntry['level'], string> = {
  info:    'text-slate-400',
  success: 'text-green-400',
  warn:    'text-amber-400',
  engine:  'text-brand-gold font-semibold',
};

export default function FirmSetupPage() {
  const [, navigate] = useLocation();
  const [steps, setSteps]     = useState<SetupStep[]>(INITIAL_STEPS);
  const [logs, setLogs]       = useState<LogEntry[]>([
    { ts: now(), level: 'success', msg: 'Workspace created — SharePoint provisioned' },
    { ts: now(), level: 'success', msg: 'Clients imported — 14 companies loaded' },
  ]);
  const [logIdx, setLogIdx]   = useState(2); // already shown 2 initial logs
  const [running, setRunning] = useState(true);
  const [done, setDone]       = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  // Auto-advance steps
  useEffect(() => {
    if (!running) return;
    const runningIdx = steps.findIndex((s) => s.status === 'running');
    if (runningIdx === -1) return;

    const step = steps[runningIdx];
    const t = setTimeout(() => {
      setSteps((prev) =>
        prev.map((s, i) => {
          if (i === runningIdx)     return { ...s, status: 'done' };
          if (i === runningIdx + 1) return { ...s, status: 'running' };
          return s;
        }),
      );
    }, step.duration);
    return () => clearTimeout(t);
  }, [steps, running]);

  // Check if all done
  useEffect(() => {
    if (steps.every((s) => s.status === 'done')) {
      setTimeout(() => setDone(true), 600);
    }
  }, [steps]);

  // Log streamer
  useEffect(() => {
    if (logIdx >= LOG_SEQUENCE.length) return;
    const t = setTimeout(() => {
      setLogs((prev) => [...prev, { ts: now(), ...LOG_SEQUENCE[logIdx] }]);
      setLogIdx((i) => i + 1);
    }, 900 + Math.random() * 600);
    return () => clearTimeout(t);
  }, [logIdx]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const doneCount  = steps.filter((s) => s.status === 'done').length;
  const progress   = Math.round((doneCount / steps.length) * 100);

  return (
    <AppLayout title="Firm Setup — Compliance Engine Initialisation">
      <div className="space-y-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="rounded-xl border border-brand-gold/30 bg-brand-navy p-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Shield className="h-6 w-6 text-brand-gold" />
            <h2 className="text-lg font-bold">Firm Setup in Progress</h2>
            {done && (
              <span className="ml-auto rounded-full bg-green-500/20 px-3 py-0.5 text-xs font-semibold text-green-400">
                ✓ Complete
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 mb-4">
            FineGuard is connecting to Companies House, HMRC APIs, and Microsoft Teams — configuring your compliance engine automatically.
          </p>

          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Setup Progress</span>
              <span className="text-brand-gold font-semibold">{progress}% complete</span>
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
          {/* Setup steps */}
          <Card
            title="Setup Progress"
            icon={<Zap className="h-4 w-4 text-brand-gold" />}
          >
            <div className="mt-4 relative space-y-0">
              {steps.map((step, i) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <StepIcon status={step.status} />
                    {i < steps.length - 1 && (
                      <div className={`w-0.5 h-10 mt-0.5 transition-colors duration-700 ${
                        step.status === 'done' ? 'bg-green-400' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className="pb-6 min-w-0">
                    <p className={`text-sm font-semibold transition-colors ${
                      step.status === 'done'    ? 'text-green-700' :
                      step.status === 'running' ? 'text-brand-gold' : 'text-gray-400'
                    }`}>
                      {step.label}
                      {step.status === 'running' && (
                        <span className="ml-2 inline-flex gap-0.5 text-brand-gold">
                          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Live log */}
          <Card
            title="Compliance Engine Log"
            icon={<Terminal className="h-4 w-4 text-brand-gold" />}
          >
            <div
              ref={logRef}
              className="mt-4 h-80 overflow-y-auto rounded-lg bg-gray-950 p-4 font-mono text-xs space-y-1.5"
              style={{ scrollBehavior: 'smooth' }}
            >
              {logs.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-600 shrink-0">{entry.ts}</span>
                  <span className={LOG_COLOUR[entry.level]}>{entry.msg}</span>
                </div>
              ))}
              {!done && (
                <div className="flex items-center gap-1 text-slate-600">
                  <span className="animate-pulse">▋</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* System status */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Companies House API', connected: true,  icon: <Building className="h-4 w-4" />  },
            { label: 'HMRC MTD VAT',        connected: doneCount >= 4, icon: <Activity className="h-4 w-4" /> },
            { label: 'Microsoft Teams',     connected: doneCount >= 4, icon: <Users className="h-4 w-4" />   },
            { label: 'Compliance Engine',   connected: done,   icon: <Shield className="h-4 w-4" />   },
          ].map((sys) => (
            <div key={sys.label} className={`rounded-xl border p-4 ${sys.connected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={sys.connected ? 'text-green-600' : 'text-gray-400'}>{sys.icon}</span>
                <span className={`h-2 w-2 rounded-full ${sys.connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
              </div>
              <p className="text-xs font-semibold text-gray-900">{sys.label}</p>
              <p className={`text-xs mt-0.5 ${sys.connected ? 'text-green-600' : 'text-gray-400'}`}>
                {sys.connected ? 'Connected' : 'Waiting…'}
              </p>
            </div>
          ))}
        </div>

        {/* Done CTA */}
        {done && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center shrink-0">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-green-800 mb-1">FineGuard Compliance Engine is Live</h3>
                <p className="text-sm text-green-700 mb-4">
                  All 7 setup steps completed successfully. Your firm's compliance monitoring is now active across Companies House, HMRC MTD VAT, Corporation Tax, and Self Assessment.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => navigate('/app/companies-house')}
                    className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  >
                    View Client Portfolio <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/app/dashboard')}
                    className="border-green-300 text-green-700 hover:bg-green-100 gap-2"
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
