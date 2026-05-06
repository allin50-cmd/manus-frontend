import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight, Lock, Users, ClipboardList, History, BadgeCheck, Search } from 'lucide-react';

const features = [
  {
    icon: Lock,
    title: 'AES-256 Encryption',
    description: 'Bank-grade encryption at rest and in transit keeps every document completely protected.',
  },
  {
    icon: Users,
    title: 'Role-Based Access',
    description: 'Granular permissions per user, folder, and document — right access for the right people.',
  },
  {
    icon: ClipboardList,
    title: 'Audit Trail',
    description: 'Immutable log of every access and change, tamper-proof and available on demand.',
  },
  {
    icon: History,
    title: 'Version Control',
    description: 'Full document history with one-click restore so no revision is ever truly lost.',
  },
  {
    icon: BadgeCheck,
    title: 'Compliance Ready',
    description: 'SOC 2, ISO 27001, and GDPR compliant out of the box — audit season made simple.',
  },
  {
    icon: Search,
    title: 'Smart Search',
    description: 'Full-text search across all stored documents so you find what you need in seconds.',
  },
];

export default function VaultLine() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-[#5A4BFF]" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            VaultLine Cloud
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Enterprise-grade secure document storage and compliance management
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            Book a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Everything you need to store documents securely
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            Built for legal and professional services firms that cannot afford to compromise on security or compliance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#14161F] border border-white/10 rounded-xl p-6 flex flex-col gap-4 hover:border-[#5A4BFF]/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-[#5A4BFF]" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg mb-1">{title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
