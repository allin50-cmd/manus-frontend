import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import LegalNav from '@/components/LegalNav';
import {
  FileText,
  Brain,
  ArrowRight,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Users,
  Activity,
} from 'lucide-react';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Client Submits',
    description:
      'Your client completes a branded, mobile-friendly form. No paper, no email attachments, no back-and-forth.',
  },
  {
    number: '02',
    icon: Brain,
    title: 'AI Extracts & Classifies',
    description:
      'UltAi reads the submission, extracts key entities, flags conflicts, and classifies the matter type in under 30 seconds.',
  },
  {
    number: '03',
    icon: ArrowRight,
    title: 'Auto-Routes to Right Team',
    description:
      'The fully-packaged matter brief lands in the correct team queue — ready to open, with no manual triage required.',
  },
];

const featureCards = [
  {
    icon: Brain,
    title: 'Smart Classification',
    description:
      'Trained on thousands of UK legal matters, UltAi correctly identifies matter type with 97% accuracy out of the box.',
  },
  {
    icon: Users,
    title: 'Conflict Checking',
    description:
      'Cross-references every new intake against your existing client and matter database before the file is even opened.',
  },
  {
    icon: Zap,
    title: 'Auto-Prioritisation',
    description:
      'Urgent matters — limitation dates, injunctions, custody hearings — are flagged immediately and escalated automatically.',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description:
      'Data processed and stored on UK servers. Full data-subject rights tooling built in, with automated retention policies.',
  },
  {
    icon: Clock,
    title: 'Instant Acknowledgement',
    description:
      'Clients receive a branded confirmation the moment they submit, with a reference number and expected next steps.',
  },
  {
    icon: Activity,
    title: 'Full Audit Trail',
    description:
      'Every intake event is logged — submission time, AI decisions, team assignments, and any manual overrides.',
  },
];

const stats = [
  { value: '94%', label: 'reduction in intake time' },
  { value: '£2,400', label: 'saved per matter' },
  { value: '< 30s', label: 'AI processing time' },
];

const pricingTiers = [
  {
    name: 'Professional',
    price: '£299',
    period: '/mo',
    description: 'For growing firms handling up to 50 matters per month.',
    features: [
      'Up to 50 matters / month',
      'Smart classification & conflict check',
      'Branded client intake forms',
      'Full audit trail (7 years)',
      'Email & chat support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Unlimited matters, custom integrations, dedicated onboarding.',
    features: [
      'Unlimited matters',
      'Practice management integrations',
      'White-label client portal',
      'Dedicated success manager',
      'SLA-backed uptime guarantee',
    ],
    cta: 'Book a Demo',
    highlighted: true,
  },
];

export default function UltAi() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1520] to-[#0B0C10] text-white">
      <LegalNav active="intake" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/25 rounded-full px-4 py-1.5 text-sm text-cyan-400 mb-8">
          <Zap className="w-3.5 h-3.5" />
          Trusted by 200+ UK law firms
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          AI-Powered Client Intake
          <br />
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            for Law Firms
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Eliminate paper forms, chase emails, and manual triage. UltAi turns every new enquiry
          into a structured, conflict-checked matter brief — in under 30 seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/intake-sheet')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg w-full sm:w-auto"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => setLocation('/book-demo')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto bg-transparent"
          >
            Book Demo
          </Button>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {stats.map(({ value, label }) => (
              <div key={label}>
                <div className="text-4xl font-extrabold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                  {value}
                </div>
                <div className="text-gray-400 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">How UltAi works</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Three steps from first contact to opened matter — all automated.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map(({ number, icon: Icon, title, description }) => (
            <div key={title} className="relative">
              <div className="text-7xl font-black text-white/5 absolute -top-4 -left-2 select-none">
                {number}
              </div>
              <div className="relative rounded-2xl border border-white/10 bg-white/5 p-7 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 py-8 pb-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything your intake process needs
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Built specifically for UK legal practice — not adapted from a generic CRM.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featureCards.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-7 hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-y border-white/10 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl text-cyan-400 mb-6 font-serif leading-none">&ldquo;</div>
          <blockquote className="text-xl sm:text-2xl font-medium leading-relaxed text-white mb-6">
            UltAi cut our intake time by 94%. What used to take our team the better part of a
            morning now happens overnight — and the matter briefs are more thorough than anything we
            produced manually.
          </blockquote>
          <div className="flex flex-col items-center gap-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm mb-2">
              SC
            </div>
            <span className="font-semibold text-white">Sarah Collins</span>
            <span className="text-gray-400 text-sm">Managing Partner, Collins &amp; Webb LLP — City Law Firm</span>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-gray-400">14-day free trial on Professional. No setup fee.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? 'bg-gradient-to-br from-cyan-600 to-blue-600 border border-cyan-500'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-xs font-bold px-4 py-1 rounded-full">
                  Best Value
                </div>
              )}
              <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                <span className={`pb-1 text-sm ${tier.highlighted ? 'text-cyan-100' : 'text-gray-400'}`}>
                  {tier.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${tier.highlighted ? 'text-cyan-100' : 'text-gray-400'}`}>
                {tier.description}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle
                      className={`w-4 h-4 mt-0.5 shrink-0 ${tier.highlighted ? 'text-white' : 'text-cyan-400'}`}
                    />
                    <span className={tier.highlighted ? 'text-cyan-50' : 'text-gray-300'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() =>
                  setLocation(tier.name === 'Enterprise' ? '/book-demo' : '/intake-sheet')
                }
                className={
                  tier.highlighted
                    ? 'bg-white text-blue-600 hover:bg-cyan-50 font-semibold'
                    : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
                }
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Legal Suite cross-link banner */}
      <section className="border-y border-[#C9A64A]/20 bg-[#0A0C12] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-[#C9A64A]">UltAi is part of the Legal Suite.</span>{' '}
              Intake submissions automatically appear in your Law Clerks dashboard for seamless brief management.
            </p>
          </div>
          <button
            onClick={() => setLocation('/clerk-dashboard')}
            className="flex-shrink-0 text-sm font-semibold text-[#C9A64A] hover:text-[#E0B96A] transition-colors whitespace-nowrap"
          >
            Open Clerk Dashboard →
          </button>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Ready to transform your intake process?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join 200+ UK law firms saving hours every day with AI-powered intake.
          </p>
          <Button
            onClick={() => setLocation('/intake-sheet')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-10 py-6 text-lg"
          >
            Try Intake Sheet Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
