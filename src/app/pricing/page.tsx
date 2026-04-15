import Link from 'next/link';
import { CheckCircle, X, ArrowRight } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';

const plans = [
  {
    name: 'Starter',
    price: 1,
    description: 'Perfect for solo founders',
    features: [
      { text: '1 compliance service', included: true },
      { text: 'Email alerts (60/30/14/7 days)', included: true },
      { text: 'Dashboard access', included: true },
      { text: 'Official Companies House data', included: true },
      { text: 'Multi-company management', included: false },
      { text: 'Zapier integration', included: false },
    ],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: 'Essential',
    price: 2,
    description: 'Most popular for small businesses',
    features: [
      { text: '2 compliance services', included: true },
      { text: 'Email alerts (60/30/14/7 days)', included: true },
      { text: 'Dashboard access', included: true },
      { text: 'Official Companies House data', included: true },
      { text: 'Multi-company management', included: false },
      { text: 'Zapier integration', included: true },
    ],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Professional',
    price: 5,
    description: 'For accountants & advisors',
    features: [
      { text: 'All 3 compliance services', included: true },
      { text: 'Email alerts (60/30/14/7 days)', included: true },
      { text: 'Dashboard access', included: true },
      { text: 'Official Companies House data', included: true },
      { text: 'Multi-company management', included: true },
      { text: 'Zapier integration', included: true },
    ],
    cta: 'Get Started',
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    q: 'Can I change plans later?',
    a: 'Yes. You can add or remove services at any time from your dashboard. Changes take effect from the next billing cycle.',
  },
  {
    q: 'What counts as a "compliance service"?',
    a: 'Each monitoring type — annual accounts filing, confirmation statements, and strike-off notices — counts as one service.',
  },
  {
    q: 'Is there a free trial?',
    a: 'There is no free trial, but you can check your company\'s deadlines for free before subscribing.',
  },
  {
    q: 'How do I cancel?',
    a: 'Cancel from your dashboard at any time. Monitoring stays active until the end of the billing period.',
  },
];

export default function PricingPage() {
  return (
    <PageContainer>
      {/* Header */}
      <div className="text-center mb-14">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">Pricing</p>
        <h1 className="text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h1>
        <p className="text-slate-600 mt-3 max-w-xl mx-auto">
          Only pay for the services you need. No contracts, no hidden fees. Cancel anytime.
        </p>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl border p-8 flex flex-col gap-6 ${
              plan.highlighted
                ? 'border-blue-500 shadow-xl bg-blue-600 text-white'
                : 'bg-white shadow-sm'
            }`}
          >
            {plan.highlighted && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-amber-900">
                  Most Popular
                </span>
              </div>
            )}

            <div>
              <h3 className={`text-lg font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mt-0.5 ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>
                {plan.description}
              </p>
              <div className="mt-4 flex items-baseline gap-1">
                <span className={`text-5xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>
                  £{plan.price}
                </span>
                <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>/month</span>
              </div>
            </div>

            <ul className="space-y-3 flex-1">
              {plan.features.map(({ text, included }) => (
                <li key={text} className="flex items-start gap-2.5 text-sm">
                  {included ? (
                    <CheckCircle
                      className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`}
                    />
                  ) : (
                    <X
                      className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlighted ? 'text-blue-400' : 'text-slate-300'}`}
                    />
                  )}
                  <span className={included ? (plan.highlighted ? 'text-blue-100' : 'text-slate-700') : (plan.highlighted ? 'text-blue-300 line-through' : 'text-slate-400 line-through')}>
                    {text}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/check"
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-white text-blue-700 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {plan.cta}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Money-back note */}
      <div className="text-center mt-10 space-y-1">
        <p className="text-sm text-slate-600 font-medium">
          One avoided penalty pays for years of monitoring.
        </p>
        <p className="text-sm text-slate-400">Secure payments powered by Stripe. Cancel anytime from your dashboard.</p>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto mt-20">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-8">Pricing FAQs</h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map(({ q, a }) => (
            <details key={q} className="group rounded-xl border bg-white p-5 open:shadow-sm">
              <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-slate-900 marker:content-none">
                {q}
                <span className="ml-4 flex-shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
