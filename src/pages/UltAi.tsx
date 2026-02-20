import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  FileText, ArrowRight, Brain, Upload, Zap,
  GitBranch, CheckSquare, Code2, Search, Shield,
} from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

const steps = [
  {
    step: '01',
    title: 'Upload Client Matter',
    desc: 'Drag-and-drop intake forms, client documents, and supporting materials. Supports PDF, Word, Excel, and 40+ formats.',
  },
  {
    step: '02',
    title: 'AI Classifies & Extracts',
    desc: 'Our language model automatically classifies the matter type, extracts key entities, and populates structured fields — no manual data entry.',
  },
  {
    step: '03',
    title: 'Review & Route',
    desc: 'Compliance-ready data flows into your workflow. Assign to the right team, set deadlines, and track progress end-to-end.',
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI Classification',
    desc: 'Matter type detection powered by fine-tuned LLMs trained on legal and compliance documents across 50+ practice areas.',
  },
  {
    icon: Upload,
    title: 'Secure Uploads',
    desc: 'End-to-end encrypted file transfers with virus scanning, file-type validation, and automatic PII detection.',
  },
  {
    icon: Search,
    title: 'Smart Extraction',
    desc: 'Automatically extract names, dates, entities, and jurisdiction data from unstructured documents at 98% accuracy.',
  },
  {
    icon: GitBranch,
    title: 'Workflow Automation',
    desc: 'Route extracted matters to the right team, trigger checklists, and notify stakeholders — all without manual intervention.',
  },
  {
    icon: CheckSquare,
    title: 'Audit Ready',
    desc: 'Every intake, extraction decision, and routing action is logged with timestamps for full regulatory accountability.',
  },
  {
    icon: Code2,
    title: 'API Integration',
    desc: 'Connect to your existing practice management systems, CRM, or compliance tools via our REST API and webhooks.',
  },
];

const testimonials = [
  {
    quote: "Ult.AI cut our matter intake time from 45 minutes to under 4 minutes. The AI extraction accuracy is genuinely impressive — even on complex cross-border transactions.",
    author: 'Miranda Holt',
    role: 'Head of Legal Operations, Farringdon & Co',
  },
  {
    quote: "We integrated Ult.AI into our ACSP onboarding workflow in two days. New client files are now classified and routed automatically before a human even looks at them.",
    author: 'Priya Nair',
    role: 'Compliance Director, Shield Advisory LLP',
  },
];

export default function UltAi() {
  usePageTitle('Ult.AI');
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#0F1220] to-[#0B0C10]">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-sm font-semibold mb-8">
          <Brain className="w-4 h-4" /> AI-Powered Legal Intake
        </div>
        <h1 className="text-5xl sm:text-6xl font-black text-white mb-6 leading-tight">
          Intake Smarter with<br />
          <span className="text-cyan-400">AI That Understands</span> the Law
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
          Ult.AI automates client matter intake for law firms and compliance teams — extracting, classifying, and routing documents in seconds, not hours.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-base font-bold rounded-full shadow-lg shadow-cyan-500/25"
          >
            Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            onClick={() => setLocation('/intake-sheet')}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-bold rounded-full"
          >
            <FileText className="w-4 h-4 mr-2" /> Try Intake Sheet
          </Button>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">How It Works</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">From raw documents to structured, routed data — in three steps.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.step} className="bg-white/5 border border-white/10 rounded-3xl p-8 relative">
              <span className="text-5xl font-black text-cyan-400/20 absolute top-6 right-8 select-none">{s.step}</span>
              <div className="relative">
                <h3 className="text-lg font-bold text-white mb-3">{s.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Built for Legal & Compliance</h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">Every feature designed around the specific needs of regulated legal practice.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-cyan-400/30 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-cyan-400/10 flex items-center justify-center mb-5">
                <f.icon className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <h2 className="text-3xl font-black text-white text-center mb-10">Loved by Legal Teams</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((t) => (
            <div key={t.author} className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <p className="text-slate-300 text-lg leading-relaxed mb-6">"{t.quote}"</p>
              <div>
                <p className="text-white font-bold text-sm">{t.author}</p>
                <p className="text-slate-500 text-sm">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/5 border border-cyan-500/20 rounded-3xl p-12">
          <Shield className="w-10 h-10 text-cyan-400 mx-auto mb-5" />
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Start Automating Your Intake Today</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">Cut intake time by 90%, eliminate data entry errors, and keep your practice compliant — automatically.</p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              onClick={() => setLocation('/book-demo')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-base font-bold rounded-full shadow-lg shadow-cyan-500/25"
            >
              Book a Demo <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation('/intake-sheet')}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10 px-8 py-6 text-base font-bold rounded-full"
            >
              <Zap className="w-4 h-4 mr-2" /> Try Intake Sheet Free
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
