import PublicNav from '@/components/layout/PublicNav';
import { Button } from '@/components/ui/button';
import { CheckCircle, DollarSign } from 'lucide-react';
import { useLocation } from 'wouter';

const PLANS = [
  {
    name: 'FineGuard Monitor',
    price: '3',
    unit: '/company/mo',
    description: 'For company filing risk and compliance monitoring.',
    features: ['Company protection status', 'Compliance bundle access', 'Deadline and overdue filing checks'],
    cta: 'Start Compliance Check',
    href: '/compliance-bundle',
    accent: 'gold',
  },
  {
    name: 'UltAi Intake',
    price: '49',
    unit: '/seat/mo',
    description: 'For teams capturing structured matter intake.',
    features: ['Matter intake workflow', 'Urgency triage', 'Reference creation and routing'],
    cta: 'Try Intake Sheet',
    href: '/intake-sheet',
    accent: 'cyan',
  },
  {
    name: 'VaultLine Cloud',
    price: 'Custom',
    unit: '',
    description: 'For secure document operations and compliance workspaces.',
    features: ['Document vault workflow', 'Team access model', 'Audit-ready handoff support'],
    cta: 'Book Demo',
    href: '/book-demo',
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
          <DollarSign className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Pick the workflow you need today, then expand across the suite when the operation grows.
          </p>
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
