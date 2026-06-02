import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/layout/PublicNav';
import {
  Shield,
  ArrowRight,
  Bell,
  CheckCircle,
  Clock,
  FileSearch,
  Building2,
  AlertTriangle,
  LockKeyhole,
  ScanSearch,
  LayoutDashboard,
  Mic,
  MessageSquare,
} from 'lucide-react';

const FEATURES = [
  {
    title: 'Deadline Watch',
    description: 'Track filing windows, overdue accounts, and confirmation statement risk in one place.',
    icon: Clock,
  },
  {
    title: 'Alert Routing',
    description: 'Surface at-risk companies for review before penalties or enforcement issues escalate.',
    icon: Bell,
  },
  {
    title: 'Compliance Bundle',
    description: 'Generate a structured company report with status, deadlines, risk, and next actions.',
    icon: FileSearch,
  },
];

const CHECKS = [
  'Companies House status and filing deadlines',
  'Penalty risk indicators for overdue filings',
  'Protection status for monitored companies',
];

const SIGNALS = [
  { label: 'Companies monitored', value: 'Live', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  { label: 'Deadline risk', value: 'Tracked', tone: 'text-blue-700 bg-blue-50 border-blue-200' },
  { label: 'Human review', value: 'Escalates', tone: 'text-rose-700 bg-rose-50 border-rose-200' },
];

const ENTRY_POINTS = [
  {
    title: 'Company Check',
    description: 'Run a Companies House compliance check and create a bundle for review.',
    href: '/compliance-bundle',
    cta: 'Start check',
    icon: FileSearch,
  },
  {
    title: 'AI Voice Reception',
    description: 'Process caller transcripts, classify intent, and escalate urgent matters.',
    href: '/voice-reception',
    cta: 'Open reception',
    icon: Mic,
  },
  {
    title: 'ClerkOS',
    description: 'Open the operational control surface for cases, documents, queues, and bundles.',
    href: '/clerkos',
    cta: 'Open ClerkOS',
    icon: LayoutDashboard,
  },
  {
    title: 'Talk to an Operator',
    description: 'Book a setup call for monitoring, routing rules, or managed service support.',
    href: '/book-demo',
    cta: 'Book demo',
    icon: MessageSquare,
  },
];

const ROUTES = [
  {
    title: 'South London contractors',
    description: 'Construction and property enquiries route to Accuracy Developments Ltd for follow-up.',
    icon: Building2,
  },
  {
    title: 'Compliance urgency',
    description: 'Legal, filing, and penalty-risk language escalates before any irreversible action.',
    icon: AlertTriangle,
  },
  {
    title: 'Audit-ready handoff',
    description: 'Every meaningful intake and monitoring event is ready for the FineGuard audit log.',
    icon: LockKeyhole,
  },
];

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen theme-light-default bg-[#F8F8F8]">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 py-10 sm:py-14 space-y-12">
        <section className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#C9A64A]/30 px-3 py-1 text-xs font-semibold text-[#8A6D1F] mb-6">
              <Shield className="w-3.5 h-3.5" />
              SME compliance monitoring
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1A1A1A] mb-6">
              FineGuard Service keeps company risk visible before it becomes expensive.
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mb-8">
              A simple front door for SMEs: check a company, receive calls through AI reception,
              open ClerkOS for operations, and escalate urgent legal or compliance matters to a human.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation('/compliance-bundle')}
                className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-7 py-6 text-base"
              >
                Run Compliance Check
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/voice-reception')}
                variant="outline"
                className="border-[#1A1A1A]/20 px-7 py-6 text-base"
              >
                AI Voice Reception
              </Button>
              <Button
                onClick={() => setLocation('/clerkos')}
                variant="outline"
                className="border-[#1A1A1A]/20 px-7 py-6 text-base"
              >
                Open ClerkOS
              </Button>
            </div>
            <div className="mt-8 grid sm:grid-cols-3 gap-3 max-w-2xl">
              {SIGNALS.map((signal) => (
                <div key={signal.label} className={`rounded-lg border px-4 py-3 ${signal.tone}`}>
                  <p className="text-xs font-medium">{signal.label}</p>
                  <p className="text-sm font-bold mt-1">{signal.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#1A1A1A]/10 rounded-lg p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A]">Live check preview</p>
                <p className="text-xs text-gray-500 mt-1">Deterministic routing, no fake outcomes.</p>
              </div>
              <div className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                Ready
              </div>
            </div>
            <div className="space-y-4">
              {CHECKS.map((check) => (
                <div key={check} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#C9A64A] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{check}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-slate-200 overflow-hidden">
              {[
                ['Company status', 'Active'],
                ['Accounts deadline', 'Checked'],
                ['Next action', 'Monitor or escalate'],
              ].map(([label, value], index) => (
                <div
                  key={label}
                  className={[
                    'flex items-center justify-between gap-4 px-4 py-3 text-sm',
                    index === 1 ? 'bg-slate-50' : 'bg-white',
                  ].join(' ')}
                >
                  <span className="text-gray-600">{label}</span>
                  <span className="font-semibold text-[#1A1A1A]">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-label="FineGuard control surface" className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {ENTRY_POINTS.map(({ title, description, href, cta, icon: Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => setLocation(href)}
              className="group text-left bg-white border border-[#1A1A1A]/10 rounded-lg p-5 shadow-sm hover:border-[#C9A64A]/60 hover:shadow-md transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 text-[#A98427] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">{title}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed min-h-[62px]">{description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#8A6D1F]">
                {cta}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {FEATURES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="bg-white border border-[#1A1A1A]/10 rounded-xl p-5">
              <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 text-[#A98427] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-[#1A1A1A]">{title}</h2>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>
            </div>
          ))}
        </section>

        <section className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start border-t border-slate-200 pt-12">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#C9A64A]/10 text-[#A98427] flex items-center justify-center mb-4">
              <ScanSearch className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold text-[#1A1A1A]">Built for the stack you already started.</h2>
            <p className="text-gray-600 mt-3 leading-relaxed">
              FineGuard Service sits in front of the existing compliance bundle, AI voice reception, and audit
              pipeline. It presents the business-facing entry point while the back office keeps the full
              operational control surface.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {ROUTES.map(({ title, description, icon: Icon }) => (
              <div key={title} className="bg-white border border-[#1A1A1A]/10 rounded-lg p-5">
                <Icon className="w-5 h-5 text-[#A98427] mb-4" />
                <h3 className="text-sm font-semibold text-[#1A1A1A]">{title}</h3>
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
