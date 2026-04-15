import { HeroSearch } from '@/components/marketing/HeroSearch';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { RiskCards } from '@/components/marketing/RiskCards';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { TestimonialBlock } from '@/components/marketing/TestimonialBlock';
import { CTASection } from '@/components/marketing/CTASection';
import { SectionHeading } from '@/components/shared/SectionHeading';

const FAQ_ITEMS = [
  {
    q: 'What does FineGuard Pro monitor?',
    a: 'FineGuard Pro monitors your Companies House filing obligations including annual accounts, confirmation statements, and strike-off notices. We track your deadlines and send you alerts well in advance so you never face a late-filing penalty.',
  },
  {
    q: 'How quickly will I be alerted before a deadline?',
    a: 'You receive your first alert 60 days before a deadline, a follow-up at 30 days, an urgent notice at 14 days, and a final warning at 7 days. Each alert is sent by email and, if configured, via Zapier to your preferred channel.',
  },
  {
    q: 'What happens if my billing lapses?',
    a: 'Your monitoring is paused and outbound alerts are suspended until payment resumes. No data is deleted — when payment is restored your monitoring automatically reactivates from where it left off.',
  },
  {
    q: 'Can I monitor multiple companies?',
    a: 'Yes. Each company is monitored under a separate subscription. You can add companies from the dashboard at any time, and each gets its own independent deadline tracking and alert schedule.',
  },
  {
    q: 'How is my company number verified?',
    a: "We validate your company number against the Companies House API in real time at checkout and whenever we fetch deadline data. Only live, registered UK companies can be activated for monitoring.",
  },
  {
    q: 'Is my payment data secure?',
    a: 'All payments are processed by Stripe — we never store your card details. Our servers receive only tokenised subscription references. Stripe is PCI DSS Level 1 certified.',
  },
  {
    q: 'Can I cancel at any time?',
    a: 'Yes. Cancel from the dashboard at any time. Your monitoring remains active until the end of the current billing period, after which it stops automatically.',
  },
];

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-50/80 via-slate-50/60 to-transparent"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full bg-blue-100/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4 pt-24 pb-20 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Live monitoring · Official Companies House data
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-5 leading-[1.1]">
            Never miss a{' '}
            <span className="text-blue-600">Companies House</span>{' '}
            deadline again.
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automated compliance monitoring for UK businesses. Get alerts before every filing deadline and avoid costly fines.
          </p>

          <HeroSearch />
          <TrustStrip />
        </div>
      </section>

      {/* Problems */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-20">
        <SectionHeading
          title="Stop Problems Before They Cost You."
          subtitle="FineGuard Pro monitors your Companies House obligations so you never miss a deadline."
        />
        <RiskCards />
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title="How It Works." subtitle="Three simple steps from search to protection." />
          <HowItWorks />
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <TestimonialBlock />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <CTASection />
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl px-4 py-20">
        <SectionHeading title="Frequently Asked Questions" />
        <div className="mt-8 space-y-4">
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
      </section>
    </div>
  );
}
