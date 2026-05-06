import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Zap, ArrowRight, Building2 } from 'lucide-react';

interface PricingTier {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
  icon: React.ElementType;
}

const tiers: PricingTier[] = [
  {
    name: 'Starter',
    price: '£299',
    period: '/mo',
    description: 'Everything a growing team needs to get compliant and stay there.',
    features: [
      'Up to 50 users',
      '10 GB secure storage',
      'Email support (business hours)',
      'Basic compliance reporting',
      'Audit-ready document vault',
    ],
    cta: 'Get started',
    featured: false,
    icon: Zap,
  },
  {
    name: 'Professional',
    price: '£799',
    period: '/mo',
    description: 'The complete compliance suite for mid-market enterprises.',
    features: [
      'Up to 250 users',
      '100 GB secure storage',
      'Priority support (4-hour SLA)',
      'Full compliance suite & templates',
      'REST API & webhook access',
      'SSO / SAML integration',
    ],
    cta: 'Start free trial',
    featured: true,
    icon: Star,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'Tailored for large, complex organisations with bespoke requirements.',
    features: [
      'Unlimited users',
      'Unlimited storage',
      'Dedicated customer success manager',
      'Custom SLA (up to 99.99% uptime)',
      'Custom integrations & professional services',
    ],
    cta: 'Contact sales',
    featured: false,
    icon: Building2,
  },
];

const faqs = [
  {
    question: 'How does billing work?',
    answer:
      'Starter and Professional plans are billed monthly or annually — annual billing saves you 15%. Enterprise pricing is agreed per contract. All prices exclude VAT. Invoices are issued on the first of each month.',
  },
  {
    question: 'Is there a free trial?',
    answer:
      'Professional comes with a 14-day free trial — no credit card required. At the end of your trial you can subscribe or downgrade to Starter. Starter plans do not include a trial period but can be cancelled any time.',
  },
  {
    question: 'Can I cancel at any time?',
    answer:
      "Monthly plans can be cancelled with 30 days' written notice and take effect at the end of your billing period. Annual plans can be cancelled before the renewal date; we do not offer pro-rata refunds on annual subscriptions.",
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            No hidden fees. No per-module add-ons. Pick the plan that fits your team and scale
            as you grow.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          {tiers.map(({ name, price, period, description, features, cta, featured, icon: Icon }) => (
            <div
              key={name}
              className={[
                'relative rounded-2xl p-8 flex flex-col',
                featured
                  ? 'bg-[#5A4BFF]/10 border-2 border-[#5A4BFF]'
                  : 'bg-white/5 border border-white/10',
              ].join(' ')}
            >
              {featured && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#5A4BFF] text-white text-xs font-semibold px-4 py-1 rounded-full uppercase tracking-wider">
                  Most popular
                </div>
              )}

              <div className="mb-6">
                <Icon
                  className={`w-8 h-8 mb-4 ${featured ? 'text-[#5A4BFF]' : 'text-gray-400'}`}
                />
                <h2 className="text-2xl font-bold text-white mb-1">{name}</h2>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-bold text-white">{price}</span>
                  {period && <span className="text-gray-400 text-lg mb-1">{period}</span>}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-gray-300">
                    <CheckCircle className="w-4 h-4 text-[#5A4BFF] mt-0.5 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => setLocation('/book-demo')}
                className={
                  featured
                    ? 'bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white w-full'
                    : 'bg-white/10 hover:bg-white/20 text-white w-full border border-white/20'
                }
              >
                {cta}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="mb-24">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {faqs.map(({ question, answer }) => (
              <div
                key={question}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <h3 className="text-white font-semibold mb-3">{question}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Building2 className="w-10 h-10 text-[#5A4BFF] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Not sure which plan is right?</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            Book a 30-minute call with our team. We will walk you through your requirements and
            recommend the plan that delivers the best ROI for your compliance programme.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            Book a demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

      </div>
    </div>
  );
}
