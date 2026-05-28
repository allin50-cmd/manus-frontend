import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/layout/PublicNav';
import { Shield, ArrowRight, Database, FileText, LockKeyhole, Users } from 'lucide-react';

const MODULES = [
  {
    title: 'Document Vault',
    description: 'Centralise matter documents, bundles, and evidence packs in a controlled workspace.',
    icon: Database,
  },
  {
    title: 'Permission Model',
    description: 'Keep access clear across internal teams, reviewers, and client-facing workflows.',
    icon: Users,
  },
  {
    title: 'Audit-Ready Records',
    description: 'Maintain a consistent trail for document review, handoff, and compliance checks.',
    icon: FileText,
  },
];

export default function VaultLine() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-14">
        <section className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#5A4BFF]/15 border border-[#5A4BFF]/30 px-3 py-1 text-xs font-semibold text-indigo-200 mb-6">
              <LockKeyhole className="w-3.5 h-3.5" />
              Secure document operations
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              VaultLine Cloud
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-8">
              Enterprise-grade document storage and compliance workflows for teams managing
              sensitive matters, bundles, and review-ready records.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation('/book-demo')}
                className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-7 py-6 text-base"
              >
                Book a Demo
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/about')}
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 px-7 py-6 text-base"
              >
                About Suite
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <Shield className="w-12 h-12 text-[#8B80FF] mb-5" />
            <p className="text-sm font-semibold text-white">Operational promise</p>
            <p className="text-3xl font-bold text-white mt-2">Secure by default</p>
            <p className="text-sm text-gray-400 mt-3 leading-relaxed">
              Built around controlled access, repeatable bundle preparation, and practical
              compliance visibility for high-sensitivity workflows.
            </p>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {MODULES.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/15 text-indigo-200 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-white">{title}</h2>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{description}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
