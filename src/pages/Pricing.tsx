import { Link } from 'wouter';
import { Check, Star } from 'lucide-react';

interface PlanCardProps {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  popular?: boolean;
  accentColor: string;
  borderColor: string;
}

function PlanCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  popular,
  accentColor,
  borderColor,
}: PlanCardProps) {
  return (
    <div
      className={`relative bg-[#13151C] border rounded-xl p-8 flex flex-col ${
        popular ? `border-2 ${borderColor}` : 'border-[#2A2D3A]'
      }`}
    >
      {popular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
          <span className={`flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${accentColor} text-[#0F1014]`}>
            <Star className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-white">{price}</span>
          {period && <span className="text-sm text-gray-500">{period}</span>}
        </div>
      </div>
      <ul className="space-y-3 flex-1 mb-8">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
            <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${accentColor.replace('bg-', 'text-')}`} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`block text-center px-6 py-3 rounded-lg font-semibold text-sm transition-colors ${
          popular
            ? `${accentColor} text-[#0F1014] hover:opacity-90`
            : 'border border-white/20 text-white hover:border-white/40'
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

interface ProductSectionProps {
  title: string;
  tagline: string;
  accentColor: string;
  borderColor: string;
  plans: Omit<PlanCardProps, 'accentColor' | 'borderColor'>[];
}

function ProductSection({ title, tagline, accentColor, borderColor, plans }: ProductSectionProps) {
  return (
    <div className="mb-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400">{tagline}</p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.name}
            {...plan}
            accentColor={accentColor}
            borderColor={borderColor}
          />
        ))}
      </div>
    </div>
  );
}

export default function Pricing() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-6">
            Three products. Pick what you need. Scale as you grow.
          </p>
          <p className="text-sm text-gray-500">
            All plans include 14-day free trial · No credit card required · Cancel any time
          </p>
        </div>

        {/* FineGuard */}
        <ProductSection
          title="FineGuard"
          tagline="Companies House compliance monitoring for UK directors"
          accentColor="bg-[#C9A64A]"
          borderColor="border-[#C9A64A]"
          plans={[
            {
              name: 'Starter',
              price: '£29',
              period: '/month',
              description: 'Perfect for sole directors',
              features: [
                '1 company monitored',
                'Monthly compliance alerts',
                'Basic compliance report',
                'Email notifications',
              ],
              cta: 'Start free trial',
              ctaHref: '/contact',
            },
            {
              name: 'Professional',
              price: '£79',
              period: '/month',
              description: 'For growing businesses',
              features: [
                'Up to 5 companies monitored',
                'Real-time alerts',
                'Director monitoring',
                'API access',
                'Priority support',
              ],
              cta: 'Start free trial',
              ctaHref: '/contact',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              description: 'For accountancy firms and groups',
              features: [
                'Unlimited companies',
                'Dedicated account manager',
                'Custom integrations',
                'White-label reporting',
                'SLA guarantee',
              ],
              cta: 'Contact us',
              ctaHref: '/contact',
            },
          ]}
        />

        {/* VaultLine */}
        <ProductSection
          title="VaultLine"
          tagline="Legal-grade secure document storage for law firms"
          accentColor="bg-[#5A4BFF]"
          borderColor="border-[#5A4BFF]"
          plans={[
            {
              name: 'Essential',
              price: '£49',
              period: '/month',
              description: 'For small practices',
              features: [
                '50GB secure storage',
                '3 user seats',
                'Standard encryption',
                'Matter management',
              ],
              cta: 'Start free trial',
              ctaHref: '/book-demo',
            },
            {
              name: 'Professional',
              price: '£149',
              period: '/month',
              description: 'For established firms',
              features: [
                '500GB secure storage',
                'Unlimited users',
                'Legal-grade encryption',
                'Full audit trail',
                'Zapier integration',
              ],
              cta: 'Start free trial',
              ctaHref: '/book-demo',
              popular: true,
            },
            {
              name: 'Enterprise',
              price: 'Custom',
              description: 'For chambers and large firms',
              features: [
                'Unlimited storage',
                'White-label solution',
                'Custom integrations',
                'Dedicated support',
                'On-premise option',
              ],
              cta: 'Contact us',
              ctaHref: '/contact',
            },
          ]}
        />

        {/* UltAi */}
        <ProductSection
          title="UltAi"
          tagline="AI-powered client intake automation for law chambers"
          accentColor="bg-cyan-400"
          borderColor="border-cyan-400"
          plans={[
            {
              name: 'Free Audit',
              price: '£0',
              description: 'One-time revenue audit',
              features: [
                'AI revenue audit',
                'Unbilled time analysis',
                'Recovery opportunity report',
                'No commitment required',
              ],
              cta: 'Start free audit',
              ctaHref: '/audit',
            },
            {
              name: 'Starter',
              price: '£299',
              period: '/month',
              description: 'For smaller chambers',
              features: [
                '100 intakes per month',
                'Matter classification',
                'Email notifications',
                'Basic reporting dashboard',
              ],
              cta: 'Start free trial',
              ctaHref: '/contact',
              popular: true,
            },
            {
              name: 'Professional',
              price: '£799',
              period: '/month',
              description: 'For high-volume chambers',
              features: [
                'Unlimited intakes',
                'OpenAI integration',
                'Zapier webhooks',
                'Custom intake forms',
                'CRM integration',
              ],
              cta: 'Contact us',
              ctaHref: '/contact',
            },
          ]}
        />

        {/* Bottom CTA */}
        <div className="text-center border-t border-white/10 pt-16">
          <h2 className="text-2xl font-bold text-white mb-3">Not sure which plan is right?</h2>
          <p className="text-gray-400 mb-8">Book a 30-minute call and we'll recommend the best fit for your practice.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book-demo"
              className="px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors"
            >
              Book a demo
            </Link>
            <Link
              href="/contact"
              className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
            >
              Ask a question
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
