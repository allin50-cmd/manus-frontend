import PublicNav from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign, LayoutDashboard, Mic, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';

const PLANS = [
  {
    name: 'FineGuard Service',
    price: '3',
    unit: '/company/mo',
    description: 'For company filing risk, monitored status, and compliance checks.',
    features: ['Company protection status', 'Compliance bundle access', 'Deadline and overdue filing checks', 'Audit-ready service handoff'],
    cta: 'Start Compliance Check',
    href: '/compliance-bundle',
    accent: 'gold',
  },
  {
    name: 'Advanced AI Voice Reception',
    price: 'Custom',
    unit: '',
    description: 'For teams that want call capture, intent routing, and human escalation.',
    features: ['Inbound transcript processing', 'Intent and risk classification', 'Policy gate before actions', 'Urgent legal/compliance escalation'],
    cta: 'Open AI Reception',
    href: '/voice-reception',
    accent: 'cyan',
  },
  {
    name: 'ClerkOS Control Surface',
    price: 'Custom',
    unit: '',
    description: 'For teams that need an operational console behind FineGuard Service.',
    features: ['Case and queue dashboard', 'Document and bundle workflow', 'Service routing rules', 'Escalation review workspace'],
    cta: 'Open ClerkOS',
    href: '/clerkos',
    accent: 'indigo',
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <DollarSign className="w-16 h-16 text-[#C9A64A] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">FineGuard Service Pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start with company monitoring, then add AI voice reception when calls need structured triage.
          </p>
        </div>

        <div className="mb-6 grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <ShieldCheck className="w-5 h-5 text-[#C9A64A] mb-3" />
            <h2 className="text-base font-semibold text-white">One service brand</h2>
            <p className="text-sm text-gray-400 mt-2">FineGuard Service now covers monitoring, checks, intake, and audit-ready handoff.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <LayoutDashboard className="w-5 h-5 text-cyan-300 mb-3" />
            <h2 className="text-base font-semibold text-white">ClerkOS included as a service</h2>
            <p className="text-sm text-gray-400 mt-2">ClerkOS is the control surface for reviewing checks, calls, cases, and handoffs.</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5 md:col-span-2">
            <Mic className="w-5 h-5 text-cyan-300 mb-3" />
            <h2 className="text-base font-semibold text-white">Advanced AI reception</h2>
            <p className="text-sm text-gray-400 mt-2">Voice transcripts are classified, gated by policy, and escalated before irreversible actions.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {PLANS.map(({ name, price, unit, description, features, cta, href, accent }) => {
            const accentClass =
              accent === 'gold'
                ? 'text-[#C9A64A] bg-[#C9A64A]/10'
                : accent === 'cyan'
                  ? 'text-cyan-300 bg-cyan-400/10'
                  : 'text-indigo-200 bg-[#5A4BFF]/15';

            return (
              <div key={name} className="rounded-xl border border-white/10 bg-white/5 p-6 flex flex-col">
                <div className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${accentClass}`}>
                  {name}
                </div>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-white">{price}</span>
                  {unit && <span className="text-sm text-gray-400 ml-1">{unit}</span>}
                </div>
                <p className="text-sm text-gray-400 mt-3 leading-relaxed">{description}</p>
                <div className="space-y-3 mt-6 flex-1">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={() => setLocation(href)}
                  className="mt-6 bg-white text-[#10131B] hover:bg-gray-200"
                >
                  {cta}
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
