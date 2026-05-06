import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import LandingNav from '@/components/layout/LandingNav';
import {
  Shield,
  Lock,
  Eye,
  FileCheck,
  Clock,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'End-to-End Encryption',
    description:
      'All documents are encrypted in transit and at rest using AES-256. Only authorised users hold the keys — not even VaultLine staff can read your files.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access Control',
    description:
      'Granular permission policies let you assign viewer, editor, or admin rights at the folder or document level. Inheritance rules eliminate configuration drift.',
  },
  {
    icon: Eye,
    title: 'Audit Trail',
    description:
      'Every open, download, share, and deletion is recorded with a tamper-evident timestamp. Export full activity logs for forensic review in seconds.',
  },
  {
    icon: FileCheck,
    title: 'Compliance Ready (ISO 27001)',
    description:
      'VaultLine Cloud is certified under ISO 27001 and maps directly onto SOC 2 Type II controls. Pre-built report templates satisfy most audit questionnaires.',
  },
  {
    icon: Clock,
    title: 'Automated Retention Policies',
    description:
      'Set document lifecycles once and let the platform handle disposal or archival on schedule. Litigation holds can be applied with a single click.',
  },
  {
    icon: AlertTriangle,
    title: 'Real-Time Threat Detection',
    description:
      'Behavioural analytics flag anomalous access patterns — bulk downloads, off-hours logins, or unusual geographic locations — and alert your security team immediately.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Upload',
    description:
      'Drag-and-drop or connect existing cloud storage. Automated malware scanning runs on every ingest before the file enters your vault.',
  },
  {
    number: '02',
    title: 'Classify',
    description:
      'AI-assisted tagging applies sensitivity labels — Confidential, Internal, Public — based on content analysis, saving hours of manual effort.',
  },
  {
    number: '03',
    title: 'Protect',
    description:
      'Access policies, encryption keys, and retention rules activate automatically based on classification. Your documents are governed from day one.',
  },
];

const testimonials = [
  {
    quote:
      "VaultLine halved the time our legal team spends on document retrieval and cut our audit preparation from three weeks to two days.",
    author: 'Head of Compliance',
    company: 'Meridian Capital Group',
  },
  {
    quote:
      "We replaced four separate storage tools with VaultLine Cloud. The unified audit trail alone was worth the migration.",
    author: 'Chief Information Security Officer',
    company: 'Harrington Infrastructure PLC',
  },
  {
    quote:
      "ISO 27001 recertification used to be a six-month ordeal. With VaultLine's pre-built evidence packs, we passed in eight weeks.",
    author: 'IT Director',
    company: 'Blackwood Financial Services',
  },
];

export default function VaultLine() {
  return (
    <div className="min-h-screen bg-[#0F1014] text-white">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#5A4BFF]/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#5A4BFF]/40 bg-[#5A4BFF]/10 text-[#9B8FFF] text-sm font-medium mb-6">
            <Shield className="w-4 h-4" />
            Enterprise Secure Document Storage
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Zero-trust document vault
            <br />
            <span className="text-[#5A4BFF]">for enterprise</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Encrypt, classify, and govern every document your organisation creates — with an
            immutable audit trail that satisfies the most demanding regulators.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book-demo">
              <Button className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-base font-semibold h-auto">
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base font-semibold h-auto"
              >
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Everything security demands</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Six pillars that cover the full document security lifecycle, from first upload to
            compliant disposal.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#5A4BFF]/40 hover:bg-[#5A4BFF]/5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#5A4BFF]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white/[0.02] border-y border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Three steps from raw file to fully governed, encrypted, and auditable document.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative flex flex-col items-start">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px bg-gradient-to-r from-[#5A4BFF]/40 to-transparent -translate-y-1/2 z-0" />
                )}
                <div className="text-5xl font-black text-[#5A4BFF]/20 mb-3 select-none">
                  {step.number}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Trusted by UK enterprise</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Leading organisations rely on VaultLine Cloud to protect their most sensitive documents.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.company}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col gap-4"
            >
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <CheckCircle key={i} className="w-4 h-4 text-[#5A4BFF]" />
                ))}
              </div>
              <p className="text-gray-300 text-sm leading-relaxed italic">"{t.quote}"</p>
              <div className="mt-auto">
                <p className="text-white font-semibold text-sm">{t.author}</p>
                <p className="text-gray-500 text-xs">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-gradient-to-br from-[#5A4BFF]/10 via-transparent to-transparent py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to secure your documents?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Book a 30-minute demo and we'll show you how VaultLine can fit your organisation's
            specific compliance requirements.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book-demo">
              <Button className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-base font-semibold h-auto">
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5 px-8 py-6 text-base font-semibold h-auto"
              >
                See Pricing Plans
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
