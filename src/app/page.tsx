import { HeroSearch } from '@/components/marketing/HeroSearch';
import { TrustStrip } from '@/components/marketing/TrustStrip';
import { RiskCards } from '@/components/marketing/RiskCards';
import { HowItWorks } from '@/components/marketing/HowItWorks';
import { TestimonialBlock } from '@/components/marketing/TestimonialBlock';
import { CTASection } from '@/components/marketing/CTASection';
import { SectionHeading } from '@/components/shared/SectionHeading';

export default function HomePage() {
  return (
    <div className="bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold tracking-tight text-slate-900 mb-4">
          Stay Compliant. Avoid Penalties.
        </h1>
        <p className="text-xl text-slate-600 mb-8">
          Automated deadline monitoring for UK businesses.
        </p>
        <HeroSearch />
        <TrustStrip />
      </section>

      {/* Problems */}
      <section id="features" className="mx-auto max-w-6xl px-4 py-16">
        <SectionHeading
          title="Stop Problems Before They Cost You."
          subtitle="FineGuard Pro monitors your Companies House obligations so you never miss a deadline."
        />
        <RiskCards />
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <SectionHeading title="How It Works." />
          <HowItWorks />
        </div>
      </section>

      {/* Testimonial */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <TestimonialBlock />
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 pb-24">
        <CTASection />
      </section>

      {/* FAQ anchor */}
      <div id="faq" />
    </div>
  );
}
