import { Check, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const tiers = [
  {
    name: 'Starter',
    price: '£49',
    period: '/mo',
    description: 'Perfect for small teams getting started with secure document management.',
    features: [
      'Single product access',
      '1 user seat',
      'Basic compliance alerts',
      '5 GB document storage',
      'Email support',
      'Standard audit trail',
    ],
    cta: 'Get Started',
    highlight: false,
    badge: null,
  },
  {
    name: 'Professional',
    price: '£149',
    period: '/mo',
    description: 'Full suite access for growing firms that need real-time visibility and fast support.',
    features: [
      'All 3 products (VaultLine, UltAi, FineGuard)',
      '5 user seats',
      'Real-time compliance alerts',
      '100 GB document storage',
      'Priority support',
      'Advanced audit trail',
      'API access',
      'Custom workflows',
    ],
    cta: 'Start Free Trial',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored for large organisations with complex compliance needs and bespoke requirements.',
    features: [
      'Unlimited user seats',
      'White-label branding',
      'Dedicated account manager',
      'Enterprise SLA (99.9% uptime)',
      'Unlimited document storage',
      'SSO & advanced security controls',
      'Custom integrations',
      'On-boarding & training',
    ],
    cta: 'Contact Sales',
    highlight: false,
    badge: null,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <DollarSign className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Flexible plans for businesses of all sizes. Start small and scale as your firm grows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col border ${
                tier.highlight
                  ? 'border-[#5A4BFF] bg-[#1A1D28] shadow-[0_0_40px_rgba(90,75,255,0.25)]'
                  : 'border-white/10 bg-[#14161F]'
              }`}
            >
              {tier.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[#5A4BFF] text-white px-4 py-1 text-sm font-semibold">
                    {tier.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="pt-8 pb-4">
                <CardTitle className="text-2xl font-bold text-white mb-1">
                  {tier.name}
                </CardTitle>
                <div className="flex items-end gap-1 mt-2 mb-3">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  {tier.period && (
                    <span className="text-gray-400 text-lg mb-1">{tier.period}</span>
                  )}
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{tier.description}</p>
              </CardHeader>

              <CardContent className="flex flex-col flex-1 pt-0">
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check
                        className={`w-4 h-4 mt-0.5 shrink-0 ${
                          tier.highlight ? 'text-[#5A4BFF]' : 'text-emerald-400'
                        }`}
                      />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full py-5 text-base font-semibold ${
                    tier.highlight
                      ? 'bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {tier.cta}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-gray-500 text-sm mt-10">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}
