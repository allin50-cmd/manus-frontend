import Nav from '@/components/Nav';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface PlanFeature {
  text: string;
}

interface Plan {
  name: string;
  price: string;
  priceNote?: string;
  features: PlanFeature[];
  cta: string;
  ctaHref: string;
  accent: string;
  accentBg: string;
  accentBorder: string;
}

const plans: Plan[] = [
  {
    name: 'FineGuard',
    price: '£3',
    priceNote: '/month',
    features: [
      { text: 'Companies House monitoring' },
      { text: 'Real-time deadline alerts' },
      { text: 'Instant compliance reports' },
      { text: 'Cancel anytime' },
    ],
    cta: 'Get Started',
    ctaHref: '/compliance-bundle',
    accent: '#C9A64A',
    accentBg: 'rgba(201,166,74,0.10)',
    accentBorder: 'rgba(201,166,74,0.30)',
  },
  {
    name: 'UltAi Intake',
    price: 'Contact for pricing',
    features: [
      { text: 'AI-powered matter intake' },
      { text: 'End-to-end encryption' },
      { text: 'SRA compliance' },
      { text: 'Custom workflows' },
    ],
    cta: 'Book Demo',
    ctaHref: '/book-demo',
    accent: '#22D3EE',
    accentBg: 'rgba(34,211,238,0.10)',
    accentBorder: 'rgba(34,211,238,0.30)',
  },
  {
    name: 'VaultLine Cloud',
    price: 'Enterprise',
    features: [
      { text: 'Zero-knowledge storage' },
      { text: 'Unlimited documents' },
      { text: 'SSO + RBAC' },
      { text: 'Dedicated support' },
    ],
    cta: 'Book Demo',
    ctaHref: '/book-demo',
    accent: '#5A4BFF',
    accentBg: 'rgba(90,75,255,0.10)',
    accentBorder: 'rgba(90,75,255,0.30)',
  },
];

export default function Pricing() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'Pricing — VaultLine Suite';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <Nav />
      <div className="pt-14">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Pick the plan that fits your firm. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className="relative rounded-2xl p-8 flex flex-col"
                style={{
                  background: plan.accentBg,
                  border: `1px solid ${plan.accentBorder}`,
                }}
              >
                {/* Accent top bar */}
                <div
                  className="absolute top-0 left-8 right-8 h-0.5 rounded-full"
                  style={{ background: plan.accent }}
                />

                <div className="mb-6">
                  <h2
                    className="text-xl font-bold mb-3"
                    style={{ color: plan.accent }}
                  >
                    {plan.name}
                  </h2>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white">
                      {plan.price}
                    </span>
                    {plan.priceNote && (
                      <span className="text-gray-400 text-sm">{plan.priceNote}</span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-2 text-gray-300 text-sm">
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-xs font-bold"
                        style={{ background: plan.accentBorder, color: plan.accent }}
                      >
                        ✓
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => setLocation(plan.ctaHref)}
                  className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity hover:opacity-90"
                  style={{
                    background: plan.accent,
                    color: plan.name === 'UltAi Intake' ? '#0F1014' : '#fff',
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
