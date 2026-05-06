import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Sparkles, ShieldAlert, LockKeyhole, GitBranch, Scale, Plug } from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Extraction',
    description: 'Automatically extracts key matter details from client documents, cutting manual data entry to zero.',
  },
  {
    icon: ShieldAlert,
    title: 'Conflict Checking',
    description: 'Instant conflict of interest checks against your client database before a matter is accepted.',
  },
  {
    icon: LockKeyhole,
    title: 'Secure Submission',
    description: 'End-to-end encrypted intake with client-signed confirmation at every step of the process.',
  },
  {
    icon: GitBranch,
    title: 'Workflow Automation',
    description: 'Routes matters to the right team based on type and urgency — no manual triage required.',
  },
  {
    icon: Scale,
    title: 'SRA Compliant',
    description: 'Built to meet SRA Standards and Regulations requirements so your firm stays on the right side of the regulator.',
  },
  {
    icon: Plug,
    title: 'CRM Integration',
    description: 'Syncs directly with your practice management software to keep all client data in one place.',
  },
];

export default function UltAi() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-16 h-16 text-cyan-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            UltAi Secure Intake
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            AI-powered secure client matter intake for law firms
          </p>
          <Button
            onClick={() => setLocation('/intake-sheet')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Features */}
        <div className="mt-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Smarter intake from the very first touchpoint
          </h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto mb-12">
            UltAi combines AI extraction with rigorous security so your firm can onboard clients faster without cutting corners on compliance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-[#0F1318] border border-white/10 rounded-xl p-6 flex flex-col gap-4 hover:border-cyan-500/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-cyan-400" />
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
