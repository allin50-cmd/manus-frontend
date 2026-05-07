import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MainNav from '@/components/MainNav';
import {
  Shield,
  ArrowRight,
  Bell,
  FileText,
  Users,
  AlertTriangle,
  Building2,
  TrendingDown,
  Check,
  Clock,
  Search,
} from 'lucide-react';

const alertTypes = [
  {
    icon: FileText,
    title: 'Confirmation Statement Due',
    description:
      'We track your annual confirmation statement deadline and alert you 60, 30, and 7 days before it falls due.',
  },
  {
    icon: AlertTriangle,
    title: 'Annual Accounts Late',
    description:
      'Instant notification the moment your accounts filing window opens — and escalating alerts if the deadline approaches unfiled.',
  },
  {
    icon: Users,
    title: 'Director Changes',
    description:
      'Any appointment, resignation, or detail change logged at Companies House triggers an immediate alert to your team.',
  },
  {
    icon: Shield,
    title: 'PSC Changes',
    description:
      'People with Significant Control register changes are high-risk. We flag every update within minutes of it appearing.',
  },
  {
    icon: Building2,
    title: 'Mortgage Charges',
    description:
      'Track every charge registration, satisfaction, or alteration affecting your company — or companies you monitor for clients.',
  },
  {
    icon: TrendingDown,
    title: 'Dissolution Risk',
    description:
      'Early-warning alerts if a company you monitor receives a compulsory strike-off notice or enters administration.',
  },
];

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Register Your Company Number',
    description:
      'Enter your Companies House registration number. We pull your current filing history instantly — no forms to fill.',
  },
  {
    number: '02',
    icon: Clock,
    title: 'We Monitor 24/7',
    description:
      'Our system checks the Companies House API continuously, tracking every filing window, deadline, and registry change.',
  },
  {
    number: '03',
    icon: Bell,
    title: 'Instant Alert + Action Plan',
    description:
      'When something needs attention, you receive a plain-English alert with a clear action plan — and links to file directly.',
  },
];

const pricingTiers = [
  {
    name: 'Solo',
    price: '£29',
    period: '/mo',
    description: 'One company, complete peace of mind.',
    features: [
      '1 company monitored',
      'All 6 alert types',
      'Email & SMS alerts',
      '12-month deadline calendar',
    ],
    cta: 'Get Started',
    highlighted: false,
    ctaPath: '/compliance-bundle',
  },
  {
    name: 'Portfolio',
    price: '£99',
    period: '/mo',
    description: 'Up to 5 companies — ideal for groups and accountants.',
    features: [
      'Up to 5 companies',
      'All 6 alert types',
      'Email, SMS & Slack alerts',
      'Shared team dashboard',
      'Priority support',
    ],
    cta: 'Get Compliance Bundle',
    highlighted: true,
    ctaPath: '/compliance-bundle',
  },
  {
    name: 'Enterprise',
    price: 'Contact us',
    period: '',
    description: 'Unlimited companies for accountancy firms and law practices.',
    features: [
      'Unlimited companies',
      'API access',
      'White-label portal',
      'Dedicated account manager',
    ],
    cta: 'Talk to Sales',
    highlighted: false,
    ctaPath: '/compliance-bundle',
  },
];

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8] text-[#1A1A1A]">
      <MainNav active="FineGuard" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#C9A64A]/15 border border-[#C9A64A]/30 rounded-full px-4 py-1.5 text-sm text-[#C9A64A] font-medium mb-8">
          <Bell className="w-3.5 h-3.5" />
          Trusted by 1,200+ UK companies
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6 text-[#1A1A1A]">
          Never Miss a Companies House
          <br />
          <span className="text-[#C9A64A]">Filing Again</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          FineGuard monitors your company's filing obligations around the clock and sends instant
          alerts with a clear action plan — before the fine lands on your desk.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/compliance-bundle')}
            className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-lg w-full sm:w-auto"
          >
            Get Compliance Bundle
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="border-[#1A1A1A]/20 text-[#1A1A1A] hover:bg-[#1A1A1A]/5 px-8 py-6 text-lg w-full sm:w-auto bg-transparent"
          >
            Check Your Company
          </Button>
        </div>
      </section>

      {/* Risk Calculator Teaser */}
      <section className="bg-[#1A1A1A] py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
            <div>
              <p className="text-[#C9A64A] text-sm font-semibold uppercase tracking-widest mb-2">
                The cost of missing a deadline
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Companies House fines start at{' '}
                <span className="text-[#C9A64A]">£150/day</span> late
              </h2>
              <p className="text-gray-400 max-w-xl">
                A single missed confirmation statement can cost your company hundreds in penalties
                — before any legal or reputational fallout. FineGuard's monthly subscription pays
                for itself the first time it saves you from a fine.
              </p>
            </div>
            <div className="shrink-0 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-center min-w-[200px]">
              <div className="text-4xl font-extrabold text-[#C9A64A] mb-1">£150</div>
              <div className="text-sm text-gray-400 mb-4">penalty per day late</div>
              <div className="text-4xl font-extrabold text-white mb-1">£29</div>
              <div className="text-sm text-gray-400">FineGuard per month</div>
            </div>
          </div>
        </div>
      </section>

      {/* Alert Type Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A1A]">
            Six risks. Zero missed deadlines.
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            FineGuard monitors every major Companies House obligation so you don't have to.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {alertTypes.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-gray-200 bg-white p-7 hover:border-[#C9A64A]/50 hover:shadow-md transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#C9A64A]/15 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#C9A64A]" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-[#1A1A1A]">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white border-y border-gray-200 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A1A]">
              Up and running in 60 seconds
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              No integration work. No accountant required. Just your company number.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ number, icon: Icon, title, description }) => (
              <div key={title} className="relative">
                <div className="text-7xl font-black text-[#1A1A1A]/5 absolute -top-4 -left-2 select-none">
                  {number}
                </div>
                <div className="relative rounded-2xl border border-gray-200 bg-[#F8F8F8] p-7 hover:border-[#C9A64A]/40 hover:shadow-sm transition-all duration-300">
                  <div className="w-11 h-11 rounded-xl bg-[#C9A64A]/15 flex items-center justify-center mb-5">
                    <Icon className="w-5 h-5 text-[#C9A64A]" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[#1A1A1A]">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo / Check Your Company */}
      <section id="demo" className="max-w-7xl mx-auto px-6 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#1A1A1A]">
            Check your company's filing status
          </h2>
          <p className="text-gray-500 mb-8">
            Enter your Companies House number to see your upcoming deadlines — free, no sign-up
            required.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. 12345678"
              className="flex-1 px-5 py-4 rounded-xl border border-gray-300 bg-white text-[#1A1A1A] placeholder-gray-400 focus:outline-none focus:border-[#C9A64A] text-base"
            />
            <Button
              onClick={() => setLocation('/compliance-bundle')}
              className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-4 text-base font-semibold whitespace-nowrap"
            >
              Check Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Free lookup · No account needed · Results in seconds
          </p>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-[#1A1A1A] py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Simple, honest pricing
            </h2>
            <p className="text-gray-400">Cancel anytime. No setup fee. 14-day free trial.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingTiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-2xl p-8 flex flex-col ${
                  tier.highlighted
                    ? 'bg-[#C9A64A] border border-[#C9A64A]'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-[#C9A64A] text-xs font-bold px-4 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3
                  className={`text-lg font-bold mb-1 ${
                    tier.highlighted ? 'text-[#1A1A1A]' : 'text-white'
                  }`}
                >
                  {tier.name}
                </h3>
                <div className="flex items-end gap-1 mb-2">
                  <span
                    className={`text-4xl font-extrabold ${
                      tier.highlighted ? 'text-[#1A1A1A]' : 'text-white'
                    }`}
                  >
                    {tier.price}
                  </span>
                  <span
                    className={`pb-1 text-sm ${
                      tier.highlighted ? 'text-[#1A1A1A]/70' : 'text-gray-400'
                    }`}
                  >
                    {tier.period}
                  </span>
                </div>
                <p
                  className={`text-sm mb-6 ${
                    tier.highlighted ? 'text-[#1A1A1A]/80' : 'text-gray-400'
                  }`}
                >
                  {tier.description}
                </p>
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          tier.highlighted ? 'text-[#1A1A1A]' : 'text-[#C9A64A]'
                        }`}
                      />
                      <span
                        className={tier.highlighted ? 'text-[#1A1A1A]' : 'text-gray-300'}
                      >
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => setLocation(tier.ctaPath)}
                  className={
                    tier.highlighted
                      ? 'bg-[#1A1A1A] text-white hover:bg-[#333] font-semibold'
                      : 'bg-[#C9A64A] hover:bg-[#B8954A] text-white'
                  }
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-[#F8F8F8]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5 text-[#1A1A1A]">
            Stop worrying. Start monitoring.
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Get the full compliance bundle — monitoring, alerts, and action plans — and never face
            a Companies House fine again.
          </p>
          <Button
            onClick={() => setLocation('/compliance-bundle')}
            className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-10 py-6 text-lg"
          >
            Get Compliance Bundle
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-sm text-gray-400 mt-4">14-day free trial · No credit card required</p>
        </div>
      </section>
    </div>
  );
}
