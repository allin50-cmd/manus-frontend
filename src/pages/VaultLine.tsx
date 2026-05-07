import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Lock, CheckCircle, Users } from 'lucide-react';
import Nav from '@/components/Nav';

const features = [
  {
    icon: Lock,
    title: 'Zero-Knowledge Encryption',
    description:
      "Documents encrypted client-side before upload. Even we can't read your files.",
  },
  {
    icon: CheckCircle,
    title: 'Compliance-Ready',
    description:
      'SOC 2, GDPR, and ISO 27001 aligned. Audit trails built in.',
  },
  {
    icon: Users,
    title: 'Enterprise Access Control',
    description:
      'Role-based permissions, SSO integration, and full audit logging.',
  },
];

const whyPoints = [
  'Client-side AES-256 encryption means your documents never leave your device unprotected.',
  'Immutable audit logs capture every access and change for regulatory inspections.',
  'Granular sharing links with expiry, watermarking, and view-only restrictions.',
  'Works alongside your existing DMS — no migration required to get started.',
];

export default function VaultLine() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'VaultLine Cloud — Secure Document Storage';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] pt-14">
      <Nav />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-[#5A4BFF]" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            VaultLine Cloud
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Enterprise-grade secure document storage and compliance management —
            built for teams that cannot afford a breach.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            Book a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-[#5A4BFF]/50 transition-colors"
            >
              <div className="w-12 h-12 bg-[#5A4BFF]/20 rounded-xl flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-[#5A4BFF]" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Why VaultLine? */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Why VaultLine?
          </h2>
          <ul className="space-y-5 max-w-2xl mx-auto">
            {whyPoints.map((point) => (
              <li key={point} className="flex items-start gap-4">
                <span className="mt-1 w-5 h-5 flex-shrink-0 rounded-full bg-[#5A4BFF]/30 border border-[#5A4BFF] flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#5A4BFF]" />
                </span>
                <span className="text-gray-300 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to secure your documents?
          </h2>
          <p className="text-gray-400 mb-8">
            Join hundreds of enterprises that trust VaultLine with their most
            sensitive data.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-10 py-6 text-lg"
          >
            Book a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
