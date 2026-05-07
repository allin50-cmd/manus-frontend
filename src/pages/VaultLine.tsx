import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import MainNav from '@/components/MainNav';
import {
  Lock,
  GitBranch,
  Activity,
  Users,
  FileText,
  Eye,
  ArrowRight,
  Shield,
  Check,
} from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description:
      'Every document is encrypted in transit and at rest using AES-256, ensuring only authorised parties can access your files.',
  },
  {
    icon: GitBranch,
    title: 'Version Control',
    description:
      'Full document history with branching and rollback. Never lose a revision, and always know who changed what and when.',
  },
  {
    icon: Activity,
    title: 'Audit Trails',
    description:
      'Tamper-evident, timestamped logs of every view, edit, share, and deletion — ready for regulator requests in seconds.',
  },
  {
    icon: Users,
    title: 'Access Control',
    description:
      'Granular role-based permissions at folder, document, and field level. Revoke access instantly with a single click.',
  },
  {
    icon: FileText,
    title: 'Compliance Reporting',
    description:
      'Pre-built report templates for SOC 2, ISO 27001, and GDPR. Schedule automated reports to your compliance team.',
  },
  {
    icon: Eye,
    title: 'Zero-Knowledge Architecture',
    description:
      'VaultLine never holds your encryption keys. Your data is mathematically inaccessible to us — and to attackers who breach our servers.',
  },
];

const integrations = ['Salesforce', 'SharePoint', 'DocuSign', 'Google Drive'];

const pricingTiers = [
  {
    name: 'Starter',
    price: '£499',
    period: '/mo',
    description: 'For growing teams getting serious about security.',
    features: [
      'Up to 25 users',
      '500 GB encrypted storage',
      'Basic audit trails (90 days)',
      'Email support',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: 'Business',
    price: '£1,499',
    period: '/mo',
    description: 'The full VaultLine experience for mid-market teams.',
    features: [
      'Up to 200 users',
      '5 TB encrypted storage',
      'Full audit trails (7 years)',
      'Compliance reporting suite',
      'Priority support + SLA',
    ],
    cta: 'Book a Demo',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Bespoke deployment with dedicated infrastructure.',
    features: [
      'Unlimited users',
      'Unlimited storage',
      'On-premise or private cloud',
      'Dedicated compliance officer',
    ],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function VaultLine() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] text-white">
      <MainNav active="VaultLine" />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 rounded-full px-4 py-1.5 text-sm text-[#9B8FFF] mb-8">
          <Lock className="w-3.5 h-3.5" />
          Zero-Knowledge · SOC 2 Type II Certified
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight mb-6">
          Enterprise Document Security,
          <br />
          <span className="text-[#5A4BFF]">Reimagined</span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          VaultLine provides tamper-proof document storage, automated compliance reporting, and
          immutable audit trails — so your legal and finance teams stay audit-ready around the
          clock.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg w-full sm:w-auto"
          >
            Book a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => setLocation('/audit')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-lg w-full sm:w-auto bg-transparent"
          >
            Get Free Audit
          </Button>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Security that never sleeps
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Six pillars of protection, built for regulated industries.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-white/10 bg-white/5 p-7 hover:border-[#5A4BFF]/50 hover:bg-[#5A4BFF]/5 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-[#5A4BFF]/20 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-[#5A4BFF]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Integrations */}
      <section className="border-y border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center gap-6">
          <span className="text-gray-500 text-sm font-medium shrink-0">Integrates with</span>
          <div className="flex flex-wrap items-center gap-3">
            {integrations.map((name) => (
              <span
                key={name}
                className="bg-white/8 border border-white/10 rounded-lg px-5 py-2 text-sm font-medium text-gray-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-400">Start with a 30-day free trial. No credit card required.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl p-8 flex flex-col ${
                tier.highlighted
                  ? 'bg-[#5A4BFF] border border-[#5A4BFF]'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-white text-[#5A4BFF] text-xs font-bold px-4 py-1 rounded-full">
                  Most Popular
                </div>
              )}
              <h3 className="text-lg font-bold mb-1">{tier.name}</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-4xl font-extrabold">{tier.price}</span>
                <span className={`pb-1 text-sm ${tier.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                  {tier.period}
                </span>
              </div>
              <p className={`text-sm mb-6 ${tier.highlighted ? 'text-indigo-200' : 'text-gray-400'}`}>
                {tier.description}
              </p>
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className={`w-4 h-4 mt-0.5 shrink-0 ${tier.highlighted ? 'text-white' : 'text-[#5A4BFF]'}`} />
                    <span className={tier.highlighted ? 'text-indigo-100' : 'text-gray-300'}>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => setLocation(tier.name === 'Enterprise' ? '/book-demo' : '/book-demo')}
                className={
                  tier.highlighted
                    ? 'bg-white text-[#5A4BFF] hover:bg-indigo-50 font-semibold'
                    : 'bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white'
                }
              >
                {tier.cta}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-t border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-sm tracking-wide">
            SOC 2 Type II Certified &nbsp;·&nbsp; ISO 27001 &nbsp;·&nbsp; GDPR Compliant &nbsp;·&nbsp; UK GDPR
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-5">
            Start your 30-day free trial
          </h2>
          <p className="text-gray-400 mb-8 text-lg">
            No credit card. No commitments. Full platform access from day one.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-10 py-6 text-lg"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>
    </div>
  );
}
