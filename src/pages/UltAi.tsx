import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/layout/PublicNav';
import { FileText, ArrowRight, AlertTriangle, CheckCircle, ClipboardList, Sparkles } from 'lucide-react';

const WORKFLOW = [
  {
    title: 'Collect',
    description: 'Capture client, matter, urgency, and claim details through a structured secure form.',
    icon: ClipboardList,
  },
  {
    title: 'Triage',
    description: 'Flag critical or high-priority matters so the team can respond with the right speed.',
    icon: AlertTriangle,
  },
  {
    title: 'Record',
    description: 'Create a matter reference and route the intake to the operational dashboard.',
    icon: CheckCircle,
  },
];

export default function UltAi() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10]">
      <PublicNav />
      <div className="max-w-7xl mx-auto px-4 py-16 space-y-14">
        <section className="grid lg:grid-cols-[1fr_1fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 px-3 py-1 text-xs font-semibold text-cyan-200 mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Secure intake workflow
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              UltAi Secure Intake
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mb-8">
              A structured first-contact flow for legal and compliance teams that need faster
              triage, cleaner matter records, and fewer missing fields.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => setLocation('/intake-sheet')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-7 py-6 text-base"
              >
                Try Intake Sheet
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/book-demo')}
                variant="outline"
                className="bg-transparent border-white/20 text-white hover:bg-white/10 px-7 py-6 text-base"
              >
                Book Demo
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-white mb-5">Matter intake snapshot</p>
            <div className="space-y-3">
              {['Client details', 'Matter type', 'Urgency level', 'Claim value', 'Matter description'].map((item) => (
                <div key={item} className="flex items-center justify-between rounded-lg bg-[#0B0C10]/60 border border-white/10 px-4 py-3">
                  <span className="text-sm text-gray-300">{item}</span>
                  <FileText className="w-4 h-4 text-cyan-300" />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          {WORKFLOW.map(({ title, description, icon: Icon }) => (
            <div key={title} className="rounded-xl border border-white/10 bg-white/5 p-5">
              <div className="w-10 h-10 rounded-lg bg-cyan-400/10 text-cyan-300 flex items-center justify-center mb-4">
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
