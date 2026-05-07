import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Zap, Shield, FileText, BookOpen } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MainNav from '@/components/MainNav';
import SEO from '@/components/SEO';

const PRODUCTS = [
  {
    name: 'VaultLine Cloud',
    description: 'Secure document storage and management for legal teams',
    icon: Shield,
    color: 'from-[#5A4BFF]/20 to-[#5A4BFF]/5',
    borderColor: 'border-[#5A4BFF]/30',
    accent: '#5A4BFF',
    plans: [
      {
        name: 'Starter',
        monthlyPrice: 499,
        features: [
          'Up to 10 users',
          '500 GB encrypted storage',
          'Automated document tagging',
          'Standard UK data residency',
        ],
        cta: 'Get Started',
        highlight: false,
      },
      {
        name: 'Business',
        monthlyPrice: 1499,
        features: [
          'Up to 50 users',
          '5 TB encrypted storage',
          'AI-powered search & OCR',
          'Priority UK data residency & SLA',
        ],
        cta: 'Get Started',
        highlight: true,
      },
      {
        name: 'Enterprise',
        monthlyPrice: null,
        features: [
          'Unlimited users',
          'Unlimited storage',
          'Custom AI integrations',
          'Dedicated account manager',
        ],
        cta: 'Talk to Sales',
        highlight: false,
      },
    ],
  },
  {
    name: 'UltAi Intake',
    description: 'AI-driven client intake and matter opening automation',
    icon: Zap,
    color: 'from-[#7C3AED]/20 to-[#7C3AED]/5',
    borderColor: 'border-[#7C3AED]/30',
    accent: '#7C3AED',
    plans: [
      {
        name: 'Professional',
        monthlyPrice: 299,
        features: [
          'Up to 200 intakes/month',
          'Smart conflict checking',
          'Branded intake forms',
          'CRM sync integrations',
        ],
        cta: 'Get Started',
        highlight: false,
      },
      {
        name: 'Enterprise',
        monthlyPrice: null,
        features: [
          'Unlimited intakes',
          'Custom AI model fine-tuning',
          'White-label portal',
          'Dedicated success team',
        ],
        cta: 'Talk to Sales',
        highlight: false,
      },
    ],
  },
  {
    name: 'FineGuard Compliance',
    description: 'Automated regulatory compliance monitoring and reporting',
    icon: FileText,
    color: 'from-[#059669]/20 to-[#059669]/5',
    borderColor: 'border-[#059669]/30',
    accent: '#10B981',
    plans: [
      {
        name: 'Per Company',
        monthlyPrice: 29,
        features: [
          'Single entity monitoring',
          'Real-time regulatory alerts',
          'Monthly compliance reports',
          'SRA & FCA rule mapping',
        ],
        cta: 'Get Started',
        highlight: false,
      },
      {
        name: 'Bundle (5 companies)',
        monthlyPrice: 99,
        features: [
          'Up to 5 entities',
          'Centralised dashboard',
          'Bulk report generation',
          'Priority email support',
        ],
        cta: 'Get Started',
        highlight: true,
      },
      {
        name: 'Enterprise',
        monthlyPrice: null,
        features: [
          'Unlimited entities',
          'Custom rule libraries',
          'API access & webhooks',
          'Dedicated compliance advisor',
        ],
        cta: 'Talk to Sales',
        highlight: false,
      },
    ],
  },
  {
    name: 'Law Clerks',
    description: 'AI legal research and drafting assistant for chambers',
    icon: BookOpen,
    color: 'from-[#DC2626]/20 to-[#DC2626]/5',
    borderColor: 'border-[#DC2626]/30',
    accent: '#F87171',
    plans: [
      {
        name: 'Chambers Starter',
        monthlyPrice: 149,
        features: [
          'Up to 5 barristers',
          '50 AI research briefs/month',
          'Case law summarisation',
          'Secure chambers workspace',
        ],
        cta: 'Get Started',
        highlight: false,
      },
      {
        name: 'Full Chambers',
        monthlyPrice: 349,
        features: [
          'Up to 25 barristers',
          'Unlimited research briefs',
          'AI skeleton argument drafting',
          'Advanced citation verification',
        ],
        cta: 'Get Started',
        highlight: true,
      },
      {
        name: 'Multi-Chambers',
        monthlyPrice: null,
        features: [
          'Multiple chambers sets',
          'Custom AI workflows',
          'Pupillage management tools',
          'Dedicated account team',
        ],
        cta: 'Talk to Sales',
        highlight: false,
      },
    ],
  },
];

const FAQS = [
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. All monthly plans can be cancelled at any time with no exit fees. Your data remains accessible for 30 days after cancellation, giving you time to export everything you need.',
  },
  {
    question: 'Do you offer a free trial?',
    answer:
      'We offer a 14-day free trial on all Starter and Professional plans — no credit card required. Enterprise plans include a tailored proof-of-concept period arranged with your account manager.',
  },
  {
    question: 'Is data stored in the UK?',
    answer:
      'Absolutely. All data is stored exclusively in UK-based data centres certified to ISO 27001. We never transfer personal or legal data outside the UK or EEA without explicit client consent.',
  },
  {
    question: 'Are your products GDPR compliant?',
    answer:
      'Yes. Our entire platform is built with privacy by design. We are registered with the ICO, maintain a full record of processing activities, and provide Data Processing Agreements (DPAs) for all business customers.',
  },
  {
    question: 'Can I switch plans later?',
    answer:
      'You can upgrade at any time and the change takes effect immediately, prorated to your billing cycle. Downgrades take effect at the next renewal date. Contact support and we will handle the transition seamlessly.',
  },
  {
    question: 'Do you offer discounts for charities or non-profits?',
    answer:
      'Yes. We offer up to 30% discount for registered charities, pro-bono practices, and legal aid organisations. Please get in touch with our sales team with your registered charity number to apply.',
  },
];

function PricingCard({
  plan,
  annual,
  accent,
}: {
  plan: (typeof PRODUCTS)[0]['plans'][0];
  annual: boolean;
  accent: string;
}) {
  const [, navigate] = useLocation();

  const displayPrice =
    plan.monthlyPrice !== null
      ? annual
        ? Math.round(plan.monthlyPrice * 0.8)
        : plan.monthlyPrice
      : null;

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 transition-all duration-200 hover:scale-[1.01] ${
        plan.highlight
          ? 'border-[#5A4BFF] bg-[#5A4BFF]/10 shadow-xl shadow-[#5A4BFF]/20'
          : 'border-white/10 bg-white/5 hover:border-white/20'
      }`}
    >
      {plan.highlight && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#5A4BFF] px-4 py-1 text-xs font-semibold text-white shadow-lg">
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>

      <div className="mt-4 mb-6">
        {displayPrice !== null ? (
          <>
            <div className="flex items-end gap-1">
              <span className="text-4xl font-bold text-white">
                £{displayPrice.toLocaleString()}
              </span>
              <span className="text-gray-400 mb-1.5 text-sm">/mo</span>
            </div>
            {annual && plan.monthlyPrice !== null && (
              <p className="text-xs text-green-400 mt-1.5 font-medium">
                Save £{(plan.monthlyPrice * 0.2 * 12).toLocaleString()} per year
              </p>
            )}
          </>
        ) : (
          <div>
            <span className="text-2xl font-bold text-white">Custom pricing</span>
            <p className="text-xs text-gray-500 mt-1.5">Tailored to your organisation</p>
          </div>
        )}
      </div>

      <ul className="flex-1 space-y-3 mb-6">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
            <Check className="w-4 h-4 mt-0.5 shrink-0" style={{ color: accent }} />
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={() => navigate('/book-demo')}
        className={
          plan.highlight
            ? 'w-full bg-[#5A4BFF] hover:bg-[#4a3bef] text-white font-semibold'
            : 'w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium'
        }
      >
        {plan.cta}
      </Button>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left text-white font-medium hover:text-[#8B82FF] transition-colors group"
      >
        <span className="pr-4">{question}</span>
        {open ? (
          <ChevronUp className="w-5 h-5 shrink-0 text-[#5A4BFF]" />
        ) : (
          <ChevronDown className="w-5 h-5 shrink-0 text-gray-500 group-hover:text-[#5A4BFF] transition-colors" />
        )}
      </button>
      {open && (
        <p className="pb-5 text-gray-400 text-sm leading-relaxed -mt-1">{answer}</p>
      )}
    </div>
  );
}

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      <SEO title="Pricing" description="Simple, transparent pricing for FineGuard, VaultLine, UltAi, and Law Clerks. Monthly and annual plans for every practice size." />
      <MainNav active="Pricing" />

      {/* Hero */}
      <section className="pt-24 pb-14 px-4 text-center">
        <div className="inline-block rounded-full border border-[#5A4BFF]/40 bg-[#5A4BFF]/10 px-4 py-1 text-sm text-[#8B82FF] font-medium mb-6">
          4 products. One platform.
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-5 tracking-tight leading-tight">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-400 max-w-xl mx-auto mb-10">
          No hidden fees. No lock-in. Choose the plan that fits your firm — and scale as you grow.
        </p>

        {/* Monthly / Annual toggle */}
        <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-5 py-2.5">
          <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setAnnual(!annual)}
            aria-label="Toggle annual billing"
            className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#5A4BFF] ${
              annual ? 'bg-[#5A4BFF]' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
                annual ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
          <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-gray-500'}`}>
            Annual
            <span className="ml-2 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-full px-2 py-0.5 font-semibold">
              Save 20%
            </span>
          </span>
        </div>
      </section>

      {/* Product sections */}
      <div className="max-w-7xl mx-auto px-4 space-y-16 pb-24">
        {PRODUCTS.map((product) => {
          const Icon = product.icon;
          return (
            <section key={product.name}>
              <div
                className={`rounded-3xl bg-gradient-to-br ${product.color} border ${product.borderColor} p-8 sm:p-10`}
              >
                {/* Product header */}
                <div className="flex items-start gap-4 mb-8">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${product.accent}22` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: product.accent }} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white leading-tight">{product.name}</h2>
                    <p className="text-gray-400 mt-0.5 text-sm">{product.description}</p>
                  </div>
                </div>

                {/* Plan cards */}
                <div
                  className={`grid gap-6 ${
                    product.plans.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  }`}
                >
                  {product.plans.map((plan) => (
                    <PricingCard
                      key={plan.name}
                      plan={plan}
                      annual={annual}
                      accent={product.accent}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 pb-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Frequently Asked Questions</h2>
          <p className="text-gray-400">Everything you need to know before getting started.</p>
        </div>
        <div className="rounded-2xl bg-white/5 border border-white/10 px-6 sm:px-8">
          {FAQS.map((faq) => (
            <FAQItem key={faq.question} {...faq} />
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#5A4BFF]/15 via-[#5A4BFF]/5 to-transparent border-t border-[#5A4BFF]/20 py-20 px-4 text-center">
        {/* Decorative glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#5A4BFF]/10 blur-3xl" />
        </div>
        <div className="relative">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Not sure which plan is right for you?
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto text-lg">
            Our team will help you find the perfect fit — no hard sell, just honest advice tailored to your practice.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => navigate('/book-demo')}
              className="bg-[#5A4BFF] hover:bg-[#4a3bef] text-white px-8 py-3 text-base font-semibold shadow-lg shadow-[#5A4BFF]/30"
            >
              Talk to Sales
            </Button>
            <Button
              onClick={() => navigate('/book-demo')}
              className="bg-transparent hover:bg-white/5 text-white border border-white/20 px-8 py-3 text-base font-medium"
            >
              Book a Demo
            </Button>
          </div>
          <p className="text-gray-600 text-sm mt-6">
            Average response time: under 2 hours on business days
          </p>
        </div>
      </section>
    </div>
  );
}
