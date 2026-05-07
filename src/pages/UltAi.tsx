import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import Nav from '@/components/Nav';

const features = [
  {
    icon: FileText,
    title: 'AI-Powered Intake',
    description:
      'Smart forms that extract key matter details automatically, reducing data entry time by 80%.',
  },
  {
    icon: ShieldCheck,
    title: 'End-to-End Encrypted',
    description:
      'Client matter data is encrypted in transit and at rest. GDPR and SRA compliant.',
  },
  {
    icon: Zap,
    title: 'Instant Triage',
    description:
      'Urgency scoring and matter routing happens automatically the moment a client submits.',
  },
];

const lawFirmPoints = [
  'Conflicts-check integration surfaces potential clashes before a matter is opened.',
  'Custom intake templates per practice area — PI, conveyancing, employment, and more.',
  'Secure client portal link can be embedded on your firm\'s website in minutes.',
];

export default function UltAi() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'UltAi — Secure Client Intake';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10] pt-14">
      <Nav />

      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-20">
          <div className="flex items-center justify-center mb-6">
            <FileText className="w-16 h-16 text-cyan-400" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            UltAi Secure Intake
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            AI-powered secure client matter intake for law firms — fewer forms,
            faster triage, zero compliance headaches.
          </p>
          <Button
            onClick={() => setLocation('/intake')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-cyan-400/40 transition-colors"
            >
              <div className="w-12 h-12 bg-cyan-400/10 rounded-xl flex items-center justify-center mb-5">
                <Icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Built for law firms */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 mb-20">
          <h2 className="text-3xl font-bold text-white mb-8 text-center">
            Built for law firms
          </h2>
          <ul className="space-y-5 max-w-2xl mx-auto">
            {lawFirmPoints.map((point) => (
              <li key={point} className="flex items-start gap-4">
                <span className="mt-1 w-5 h-5 flex-shrink-0 rounded-full bg-cyan-400/20 border border-cyan-400 flex items-center justify-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                </span>
                <span className="text-gray-300 leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start capturing better client data today
          </h2>
          <p className="text-gray-400 mb-8">
            No credit card required. Live in under 10 minutes.
          </p>
          <Button
            onClick={() => setLocation('/intake')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-10 py-6 text-lg"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
