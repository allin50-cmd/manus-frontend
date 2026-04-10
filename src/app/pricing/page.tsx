import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { PageContainer } from '@/components/shared/PageContainer';

const plans = [
  {
    name: 'Starter',
    price: 1,
    description: 'For small businesses',
    features: ['1 Service', 'Email Alerts', 'Dashboard Access', 'Compliance Monitoring'],
    cta: 'Get Started',
  },
  {
    name: 'Essential',
    price: 2,
    description: 'For growing businesses',
    features: ['2 Services', 'Email & In-App Alerts', 'Dashboard Access', 'Compliance Monitoring', 'Deadline Reminders'],
    cta: 'Get Started',
    highlighted: true,
  },
  {
    name: 'Professional',
    price: 5,
    description: 'For accountants & advisors',
    features: ['Up to 10 Services', 'Email & In-App Alerts', 'Multi-Company Management', 'Priority Support', 'Audit-Ready Reports'],
    cta: 'Get Started',
  },
];

export default function PricingPage() {
  return (
    <PageContainer>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Simple, Transparent Pricing</h1>
        <p className="text-slate-600 mt-3">Only pay for what you need. No contracts. Cancel anytime.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border p-6 space-y-5 ${
              plan.highlighted ? 'border-blue-500 shadow-lg bg-blue-600 text-white' : 'bg-white'
            }`}
          >
            {plan.highlighted && (
              <span className="text-xs font-semibold bg-white text-blue-600 px-2.5 py-1 rounded-full">Most Popular</span>
            )}
            <div>
              <h3 className={`text-lg font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
              <p className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>{plan.description}</p>
              <p className="mt-3">
                <span className={`text-4xl font-bold ${plan.highlighted ? 'text-white' : 'text-slate-900'}`}>£{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-500'}`}>/month</span>
              </p>
            </div>
            <ul className="space-y-2">
              {plan.features.map((f) => (
                <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-slate-600'}`}>
                  <CheckCircle className={`w-4 h-4 shrink-0 ${plan.highlighted ? 'text-blue-200' : 'text-green-500'}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/check"
              className={`block text-center rounded-lg py-2.5 text-sm font-semibold transition-colors ${
                plan.highlighted
                  ? 'bg-white text-blue-600 hover:bg-blue-50'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-sm text-slate-500 mt-8">
        One avoided penalty can outweigh the cost of monitoring.
      </p>
      <p className="text-center text-sm text-slate-400 mt-2">
        Secure payments powered by Stripe. Cancel anytime.
      </p>
    </PageContainer>
  );
}
