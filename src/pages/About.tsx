import { Lock, Cpu, Scale, MapPin, ArrowRight, TrendingUp, Users, FileCheck, Activity } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MainNav from '@/components/MainNav';
import SEO from '@/components/SEO';

const STATS = [
  { value: '500+', label: 'Law Firms', icon: Users },
  { value: '12,000+', label: 'Briefs Processed', icon: FileCheck },
  { value: '£4.2M', label: 'Fees Recovered', icon: TrendingUp },
  { value: '98.7%', label: 'Uptime', icon: Activity },
];

const VALUES = [
  {
    icon: Lock,
    title: 'Security First',
    description:
      'Every product is built on a foundation of ISO 27001-certified infrastructure, UK data residency, and end-to-end encryption. Legal data is among the most sensitive in existence — we treat it that way.',
  },
  {
    icon: Cpu,
    title: 'AI That Works',
    description:
      'We build AI that earns trust through accuracy, not hype. Our models are fine-tuned on UK legal corpora, rigorously tested against real-world case law, and always kept under human oversight.',
  },
  {
    icon: Scale,
    title: 'Built for Law',
    description:
      'Our founders practiced law. Our engineers shadowed barristers. The result is software that maps to how legal professionals actually think and work — not a generic SaaS tool wearing a wig.',
  },
];

const TIMELINE = [
  {
    period: '2023 Q1',
    event: 'Company founded in London by Alexandra Chen and James Okafor, with a mission to democratise access to world-class legal technology.',
    milestone: true,
  },
  {
    period: '2023 Q3',
    event: 'FineGuard Compliance launched — first product to market, adopted by 40 firms in 90 days.',
    milestone: false,
  },
  {
    period: '2024 Q1',
    event: 'VaultLine Cloud enters general availability; ISO 27001 certification awarded.',
    milestone: false,
  },
  {
    period: '2024 Q2',
    event: 'UltAi Intake released, reducing average client onboarding time by 68%.',
    milestone: false,
  },
  {
    period: '2024 Q4',
    event: 'Law Clerks launched for barristers; adopted by three of the top-10 chambers sets in England & Wales.',
    milestone: false,
  },
  {
    period: '2025',
    event: 'Series A funding secured. Expansion to Manchester and Edinburgh offices. Platform surpasses 500 law firm clients.',
    milestone: true,
  },
];

const OFFICES = [
  {
    city: 'London',
    detail: 'Chancery Lane, EC4A',
    isHQ: true,
    description: 'Our headquarters, steps from the Royal Courts of Justice.',
  },
  {
    city: 'Manchester',
    detail: 'Spinningfields, M3',
    isHQ: false,
    description: 'Serving the Northern Circuit and growing North West legal market.',
  },
  {
    city: 'Edinburgh',
    detail: 'Charlotte Square, EH2',
    isHQ: false,
    description: "Covering Scots law practices and Edinburgh's thriving legal community.",
  },
];

export default function About() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0F1014] to-[#1A1D28] text-white">
      <SEO title="About Us" description="Founded in London by ex-barristers and AI engineers. Building the future of legal technology for UK law firms and chambers." />
      <MainNav active="About" />

      {/* Hero */}
      <section className="pt-24 pb-20 px-4 text-center max-w-4xl mx-auto">
        <div className="inline-block rounded-full border border-[#5A4BFF]/40 bg-[#5A4BFF]/10 px-4 py-1 text-sm text-[#8B82FF] font-medium mb-6">
          Founded in London, 2023
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6 tracking-tight">
          Built for the Future
          <br />
          <span className="text-[#5A4BFF]">of Legal Tech</span>
        </h1>
        <p className="text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
          VaultLine Brand Suite was founded in London in 2023 by Alexandra Chen — a former barrister
          of 12 years at Gray's Inn — and James Okafor, an ex-Google machine learning engineer.
          Frustrated by the archaic tools available to legal professionals, they set out with a
          single mission: to democratise access to world-class legal technology. What started as a
          compliance monitoring tool has grown into a four-product platform trusted by over 500 law
          firms and chambers across England, Wales, and Scotland.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <Button
            onClick={() => navigate('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#4a3bef] text-white px-8 py-3 text-base font-semibold"
          >
            Get in touch
          </Button>
          <Button
            onClick={() => navigate('/book-demo')}
            className="bg-transparent hover:bg-white/5 text-gray-300 border border-white/20 px-8 py-3 text-base"
          >
            Book a Demo
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.03] py-14 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#5A4BFF]" />
                </div>
                <div>
                  <p className="text-4xl font-bold text-white mb-0.5">{stat.value}</p>
                  <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-24 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Mission & Values</h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
            Three principles guide every product decision, every line of code, and every
            conversation we have with clients.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className="relative rounded-2xl border border-white/10 bg-white/5 p-8 flex flex-col gap-4 hover:border-[#5A4BFF]/50 hover:bg-white/[0.07] transition-all duration-200 group"
            >
              {/* Step number */}
              <span className="absolute top-6 right-6 text-5xl font-bold text-white/5 select-none group-hover:text-[#5A4BFF]/10 transition-colors">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="w-12 h-12 rounded-xl bg-[#5A4BFF]/15 flex items-center justify-center">
                <v.icon className="w-6 h-6 text-[#5A4BFF]" />
              </div>
              <h3 className="text-xl font-semibold">{v.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{v.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-4 bg-[#0F1014]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Our Journey</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              From a two-person founding team to a Series A company in under three years.
            </p>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-gradient-to-b from-[#5A4BFF]/60 via-[#5A4BFF]/30 to-transparent" />
            <div className="space-y-10">
              {TIMELINE.map((item, i) => (
                <div key={i} className="flex items-start gap-6 group">
                  <div className="w-20 shrink-0 text-right pt-0.5">
                    <span className="text-xs font-semibold text-[#5A4BFF] uppercase tracking-wider">
                      {item.period}
                    </span>
                  </div>
                  <div className="relative flex-1">
                    {/* Dot */}
                    <div
                      className={`absolute -left-[1.85rem] top-1.5 w-3 h-3 rounded-full border-2 border-[#0F1014] transition-all duration-200 ${
                        item.milestone
                          ? 'bg-[#5A4BFF] shadow-lg shadow-[#5A4BFF]/50 group-hover:scale-125'
                          : 'bg-gray-600 group-hover:bg-[#5A4BFF]'
                      }`}
                    />
                    <p
                      className={`text-sm leading-relaxed transition-colors ${
                        item.milestone ? 'text-gray-200 font-medium' : 'text-gray-400'
                      }`}
                    >
                      {item.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Office locations */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Where We Are</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Three offices. One team. All data stored on UK soil.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {OFFICES.map((office) => (
              <div
                key={office.city}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3 hover:border-[#5A4BFF]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-[#5A4BFF]" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{office.city}</span>
                    {office.isHQ && (
                      <span className="text-xs bg-[#5A4BFF]/20 text-[#8B82FF] border border-[#5A4BFF]/30 rounded-full px-2 py-0.5 font-medium">
                        HQ
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[#8B82FF] text-sm font-medium">{office.detail}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{office.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative overflow-hidden py-24 px-4 text-center bg-gradient-to-br from-[#5A4BFF]/10 via-transparent to-[#1A1D28] border-t border-white/10">
        {/* Decorative blob */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5A4BFF]/10 blur-3xl rounded-full" />
        </div>
        <div className="relative max-w-xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Want to learn more?</h2>
          <p className="text-gray-400 mb-8 text-lg leading-relaxed">
            Meet the team, see a live product demo, or just have a conversation. We are always
            happy to talk.
          </p>
          <Button
            onClick={() => navigate('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#4a3bef] text-white px-10 py-3 text-base font-semibold shadow-lg shadow-[#5A4BFF]/30 inline-flex items-center gap-2"
          >
            Get in touch
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </section>
    </div>
  );
}
