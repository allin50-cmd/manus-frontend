import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, ArrowRight, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';
import { cn } from '@/lib/utils';

interface PricingTier {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  tagline: string;
  features: string[];
  cta: string;
  highlight?: boolean;
}

const TIERS: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: 49,
    annualPrice: 39,
    tagline: 'For small practices getting started with compliance automation.',
    features: [
      'Up to 5 users',
      '1,000 documents / month',
      'VaultLine Cloud storage',
      'Companies House monitoring (10 companies)',
      'Email deadline alerts',
      'Standard audit trail',
      'Email support',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 119,
    tagline: 'Everything you need to run a fully compliant practice.',
    features: [
      'Up to 25 users',
      '10,000 documents / month',
      'VaultLine Cloud + WORM lock',
      'UltAi Secure Intake (unlimited)',
      'FineGuard monitoring (100 companies)',
      'Full audit trail with cryptographic hashes',
      'AI risk classification',
      'Priority email & chat support',
      'Azure AD / SSO integration',
    ],
    cta: 'Start Free Trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: null,
    annualPrice: null,
    tagline: 'Custom infrastructure for large firms and corporate secretarial providers.',
    features: [
      'Unlimited users',
      'Unlimited documents',
      'All Professional features',
      'Unlimited companies monitored',
      'Custom SLA (99.99% uptime)',
      'Dedicated Customer Success Manager',
      'On-premise or private cloud deployment',
      'Custom API rate limits',
      'Compliance audit support',
    ],
    cta: 'Contact Sales',
  },
];

const COMPARISON_ROWS = [
  { feature: 'VaultLine document storage', starter: true,   pro: true,  enterprise: true },
  { feature: 'UltAi AI intake',            starter: false,  pro: true,  enterprise: true },
  { feature: 'FineGuard monitoring',       starter: '10',   pro: '100', enterprise: 'Unlimited' },
  { feature: 'WORM-compliant storage',     starter: false,  pro: true,  enterprise: true },
  { feature: 'Cryptographic audit trail',  starter: false,  pro: true,  enterprise: true },
  { feature: 'SSO / Azure AD',             starter: false,  pro: true,  enterprise: true },
  { feature: 'Dedicated CSM',              starter: false,  pro: false, enterprise: true },
  { feature: 'Custom SLA',                 starter: false,  pro: false, enterprise: true },
];

const FAQS = [
  {
    q: 'Is there a free trial?',
    a: 'Yes — Starter and Professional plans include a 14-day free trial with no credit card required. Enterprise trials are arranged via a discovery call with our sales team.',
  },
  {
    q: 'Can I switch plans later?',
    a: 'Absolutely. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the start of your next billing cycle.',
  },
  {
    q: 'How does annual billing work?',
    a: 'Annual plans are billed upfront for 12 months and come with a ~20% discount versus monthly. You can still cancel at any time — unused months are refunded pro-rata.',
  },
  {
    q: 'What happens to my data if I cancel?',
    a: 'Your documents and audit logs remain accessible in read-only mode for 30 days after cancellation. You can export everything in that window. After 30 days, data is securely deleted per our retention policy.',
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-4 h-4 text-[#5A4BFF] mx-auto" />;
  if (value === false) return <span className="text-gray-600 mx-auto block text-center">—</span>;
  return <span className="text-sm text-white mx-auto block text-center">{value}</span>;
}

export default function Pricing() {
  const [, setLocation] = useLocation();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <LandingNav theme="dark" />

      {/* Hero */}
      <section className="pt-32 pb-12 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-400 mb-8">
            Start free. Scale as you grow. No hidden fees.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setAnnual(false)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-colors',
                !annual ? 'bg-[#5A4BFF] text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                annual ? 'bg-[#5A4BFF] text-white' : 'text-gray-400 hover:text-white'
              )}
            >
              Annual
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                annual ? 'bg-white/20 text-white' : 'bg-green-500/20 text-green-400'
              )}>
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TIERS.map((tier) => (
              <div
                key={tier.name}
                className={cn(
                  'rounded-2xl border p-7 flex flex-col',
                  tier.highlight
                    ? 'bg-[#5A4BFF]/10 border-[#5A4BFF]/60 shadow-xl shadow-[#5A4BFF]/10 relative'
                    : 'bg-white/5 border-white/10'
                )}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-[#5A4BFF] text-white text-xs font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-lg font-bold text-white mb-1">{tier.name}</h3>
                  <p className="text-sm text-gray-400">{tier.tagline}</p>
                </div>

                <div className="mb-6">
                  {tier.monthlyPrice !== null ? (
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-white">
                        £{annual ? tier.annualPrice : tier.monthlyPrice}
                      </span>
                      <span className="text-gray-400 mb-1">/mo</span>
                    </div>
                  ) : (
                    <span className="text-3xl font-bold text-white">Custom</span>
                  )}
                  {tier.monthlyPrice !== null && annual && (
                    <p className="text-xs text-green-400 mt-1">Billed annually (£{(tier.annualPrice! * 12).toLocaleString()}/yr)</p>
                  )}
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-[#5A4BFF] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => setLocation(tier.monthlyPrice === null ? '/book-demo' : '/book-demo')}
                  className={cn(
                    'w-full',
                    tier.highlight
                      ? 'bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white'
                      : 'border border-white/20 bg-transparent text-gray-300 hover:text-white hover:border-white/40'
                  )}
                >
                  {tier.cta}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Full feature comparison</h2>
          <div className="rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/3">
                  <th className="text-left px-5 py-3 text-gray-400 font-medium">Feature</th>
                  {TIERS.map((t) => (
                    <th key={t.name} className="px-4 py-3 text-center text-white font-semibold">{t.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={cn('border-b border-white/5', i % 2 === 0 ? 'bg-transparent' : 'bg-white/2')}
                  >
                    <td className="px-5 py-3 text-gray-300">{row.feature}</td>
                    <td className="px-4 py-3"><FeatureCell value={row.starter} /></td>
                    <td className="px-4 py-3"><FeatureCell value={row.pro} /></td>
                    <td className="px-4 py-3"><FeatureCell value={row.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 border-t border-white/10">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-white/3 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left flex items-center justify-between px-5 py-4 gap-3"
                >
                  <span className="font-medium text-white">{faq.q}</span>
                  <HelpCircle className={cn(
                    'w-4 h-4 shrink-0 transition-colors',
                    openFaq === i ? 'text-[#5A4BFF]' : 'text-gray-500'
                  )} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4 text-sm text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter theme="dark" />
    </div>
  );
}
