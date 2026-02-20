import { useState } from 'react';
import { Link } from 'wouter';
import {
  Check, X, ArrowRight, Shield, Building2,
  Zap, HelpCircle, Star, Crown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePageTitle } from '../hooks/usePageTitle';

type BillingPeriod = 'monthly' | 'annual';

interface PlanFeature { text: string; included: boolean }

interface Plan {
  name: string;
  icon: typeof Shield;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: PlanFeature[];
  cta: string;
  href: string;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    name: 'Starter',
    icon: Shield,
    description: 'For individual directors and small businesses managing their own compliance.',
    monthlyPrice: 0, annualPrice: 0,
    features: [
      { text: 'Monitor up to 3 companies', included: true },
      { text: 'Email alerts for deadlines', included: true },
      { text: 'Companies House lookup', included: true },
      { text: 'Basic compliance dashboard', included: true },
      { text: 'Priority support', included: false },
      { text: 'Team access', included: false },
      { text: 'API access', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Get Started Free', href: '/signup',
  },
  {
    name: 'Professional',
    icon: Building2,
    description: 'For accountants, company secretaries, and advisors managing client portfolios.',
    monthlyPrice: 49, annualPrice: 39,
    features: [
      { text: 'Monitor up to 100 companies', included: true },
      { text: 'Real-time alerts (email + SMS)', included: true },
      { text: 'Companies House deep lookup', included: true },
      { text: 'Advanced compliance dashboard', included: true },
      { text: 'Priority email support', included: true },
      { text: 'Up to 5 team members', included: true },
      { text: 'API access', included: false },
      { text: 'Custom branding', included: false },
    ],
    cta: 'Start 14-Day Trial', href: '/signup', popular: true,
  },
  {
    name: 'Enterprise',
    icon: Crown,
    description: 'For large firms and formation agents needing unlimited monitoring and white-label options.',
    monthlyPrice: 199, annualPrice: 159,
    features: [
      { text: 'Unlimited companies', included: true },
      { text: 'All alert channels', included: true },
      { text: 'Full Companies House integration', included: true },
      { text: 'Enterprise dashboard + analytics', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Full API access', included: true },
      { text: 'White-label branding', included: true },
    ],
    cta: 'Contact Sales', href: '/book-demo',
  },
];

const faqs = [
  { q: 'Can I switch plans at any time?', a: 'Yes. Upgrade instantly or downgrade at the end of your billing period. No lock-in contracts.' },
  { q: 'What happens when my trial ends?', a: "You'll be moved to the free Starter plan. No charges unless you actively upgrade." },
  { q: 'Do you offer discounts for charities?', a: 'Yes. Contact us for 50% off any paid plan for registered charities and CICs.' },
  { q: 'How does Companies House monitoring work?', a: 'We poll Companies House records multiple times daily and cross-reference filing deadlines, director changes, and compliance events automatically.' },
  { q: 'Is my data secure?', a: 'All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We are SOC 2 compliant and GDPR-ready.' },
  { q: 'Can I export my compliance data?', a: 'Professional and Enterprise plans include CSV/PDF export for all compliance reports and alert histories.' },
];

export default function Pricing() {
  usePageTitle('Pricing');
  const [billing, setBilling] = useState<BillingPeriod>('annual');

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-medium mb-8">
            <Zap className="w-4 h-4" /> Simple, Transparent Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            Protect your companies <br className="hidden sm:block" />
            <span className="text-[#5A4BFF]">at any scale</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Start free. Upgrade when you need more. No hidden fees. Cancel any time.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setBilling('monthly')}
              className={clsx('px-5 py-2 rounded-full text-sm font-medium transition-all', billing === 'monthly' ? 'bg-[#5A4BFF] text-white' : 'text-slate-400 hover:text-white')}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={clsx('px-5 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5', billing === 'annual' ? 'bg-[#5A4BFF] text-white' : 'text-slate-400 hover:text-white')}
            >
              Annual <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {plans.map((plan) => {
              const price = billing === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
              return (
                <div key={plan.name} className={clsx('relative rounded-3xl p-8 flex flex-col', plan.popular ? 'bg-[#5A4BFF]/10 border-2 border-[#5A4BFF]/40 shadow-xl shadow-[#5A4BFF]/10' : 'bg-white/5 border border-white/10')}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#5A4BFF] text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>
                  )}
                  <div className="mb-6">
                    <plan.icon className={clsx('w-10 h-10 mb-4', plan.popular ? 'text-[#5A4BFF]' : 'text-slate-400')} />
                    <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
                    <p className="text-sm text-slate-400 mt-2">{plan.description}</p>
                  </div>
                  <div className="mb-8">
                    {price === 0 ? (
                      <div className="text-4xl font-black text-white">Free</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-black text-white">&pound;{price}</span>
                        <span className="text-slate-400">/ month</span>
                      </div>
                    )}
                    {billing === 'annual' && price > 0 && (
                      <p className="text-sm text-green-400 mt-1">Billed &pound;{price * 12}/year</p>
                    )}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-3">
                        {f.included ? <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" /> : <X className="w-5 h-5 text-slate-600 flex-shrink-0 mt-0.5" />}
                        <span className={clsx('text-sm', f.included ? 'text-slate-300' : 'text-slate-600')}>{f.text}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.href} className={clsx('w-full py-3 rounded-full text-center font-bold text-sm transition-colors flex items-center justify-center gap-2', plan.popular ? 'bg-[#5A4BFF] text-white hover:bg-[#6B5BFF] shadow-lg shadow-[#5A4BFF]/25' : 'bg-white/10 text-white hover:bg-white/15 border border-white/20')}>
                    {plan.cta} <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-black text-white text-center mb-12">Compare All Features</h2>
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 text-sm font-medium text-slate-400 w-1/3">Feature</th>
                  <th className="text-center py-4 text-sm font-bold text-white">Starter</th>
                  <th className="text-center py-4 text-sm font-bold text-[#5A4BFF]">Professional</th>
                  <th className="text-center py-4 text-sm font-bold text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {([
                  ['Companies', '3', '100', 'Unlimited'],
                  ['Team Members', '1', '5', 'Unlimited'],
                  ['Email Alerts', true, true, true],
                  ['SMS Alerts', false, true, true],
                  ['API Access', false, false, true],
                  ['CSV/PDF Export', false, true, true],
                  ['Custom Branding', false, false, true],
                  ['Dedicated Support', false, false, true],
                ] as Array<[string, string | boolean, string | boolean, string | boolean]>).map((row) => (
                  <tr key={row[0]} className="border-b border-white/5">
                    <td className="py-3 text-slate-300">{row[0]}</td>
                    {[1, 2, 3].map((col) => (
                      <td key={col} className="py-3 text-center">
                        {typeof row[col] === 'boolean' ? (
                          row[col] ? <Check className="w-4 h-4 text-green-400 mx-auto" /> : <X className="w-4 h-4 text-slate-600 mx-auto" />
                        ) : (
                          <span className="text-white font-medium">{row[col]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <HelpCircle className="w-10 h-10 text-[#5A4BFF] mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-base font-bold text-white mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Still have questions?</h2>
          <p className="text-lg text-slate-400 mb-8">Talk to our team and find the right plan for your firm.</p>
          <Link href="/book-demo" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5A4BFF] text-white rounded-full font-bold text-lg hover:bg-[#6B5BFF] transition-colors shadow-lg shadow-[#5A4BFF]/25">
            Book a Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
