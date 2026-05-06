import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import LandingNav from '@/components/layout/LandingNav';
import {
  Brain,
  Zap,
  FileText,
  Search,
  Globe,
  CheckCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Contract Analysis',
    description:
      'Upload any contract and receive a structured summary of obligations, parties, and key dates within seconds. Handles PDFs, Word docs, and scanned images.',
  },
  {
    icon: Zap,
    title: 'Risk Extraction',
    description:
      'Automatic risk flagging surfaces uncapped liability clauses, missing indemnity provisions, and non-standard termination rights — highlighted for immediate review.',
  },
  {
    icon: FileText,
    title: 'Clause Comparison',
    description:
      'Compare clauses across versions or against your standard playbook. Deviations are scored by materiality so your team focuses on what matters most.',
  },
  {
    icon: CheckCircle,
    title: 'Obligation Tracking',
    description:
      'Every commitment extracted from your contracts is added to a live obligations register with owners and deadlines, integrated into your calendar and task systems.',
  },
  {
    icon: Globe,
    title: 'Multi-jurisdiction Support',
    description:
      'UltAi understands legal concepts across English, Scottish, Irish, EU, and US law frameworks. Jurisdiction detection is automatic based on governing law clauses.',
  },
  {
    icon: Search,
    title: 'Natural Language Search',
    description:
      'Ask questions like "Which contracts expire in the next 90 days?" or "Where have we accepted unlimited liability?" and get precise, cited answers instantly.',
  },
];

const demoLines = [
  { label: 'Parties', value: 'Harrington PLC / Meridian Consulting Ltd' },
  { label: 'Governing law', value: 'England & Wales' },
  { label: 'Expiry', value: '14 March 2027' },
  { label: 'Liability cap', value: '⚠ Uncapped — review recommended' },
  { label: 'Auto-renewal', value: 'Yes — 30-day notice window' },
  { label: 'Risk score', value: '73 / 100 — Medium-High' },
];

const riskItems = [
  { text: 'Uncapped liability in clause 8.2', level: 'high' },
  { text: 'Non-standard IP assignment (clause 12)', level: 'medium' },
  { text: 'Auto-renewal notice period shorter than policy minimum', level: 'medium' },
  { text: 'Jurisdiction clause acceptable', level: 'ok' },
  { text: 'Payment terms within standard range', level: 'ok' },
];

const levelConfig: Record<string, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-500/15 border-red-500/30', text: 'text-red-400', label: 'High' },
  medium: { bg: 'bg-yellow-500/15 border-yellow-500/30', text: 'text-yellow-400', label: 'Medium' },
  ok: { bg: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400', label: 'OK' },
};

export default function UltAi() {
  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#00D4FF]/8 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Legal Document Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Transform legal documents into
            <br />
            <span className="text-[#00D4FF]">actionable intelligence</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            UltAi reads your contracts, extracts every obligation, flags every risk, and keeps your
            legal team ahead of every deadline — automatically.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/book-demo">
              <Button className="bg-[#00D4FF] hover:bg-[#00BFEA] text-[#0B0C10] px-8 py-6 text-base font-semibold h-auto">
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
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Intelligence at every stage</h2>
          <p className="text-gray-400 max-w-xl mx-auto">
            Six capabilities that cover the full contract intelligence lifecycle — from first
            analysis to ongoing obligation management.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-[#00D4FF]" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI in action demo */}
      <section className="bg-white/[0.02] border-y border-white/10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">AI in action</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              A live analysis in under 10 seconds. Here's what UltAi extracts from a typical
              commercial services agreement.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Document preview pane */}
            <div className="rounded-2xl border border-white/10 bg-[#0F1014] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <FileText className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-sm text-gray-300 font-medium">
                  Services_Agreement_v3_FINAL.pdf
                </span>
                <Badge className="ml-auto bg-[#00D4FF]/15 text-[#00D4FF] border-[#00D4FF]/30 text-xs">
                  Analysing…
                </Badge>
              </div>

              {/* Simulated document text */}
              <div className="space-y-2 flex-1">
                {[
                  'This Agreement is entered into as of 14 March 2025 between',
                  'Harrington PLC ("Client") and Meridian Consulting Ltd ("Provider").',
                  '',
                  'The Provider shall deliver professional services as described',
                  'in Schedule 1. Fees are payable within 30 days of invoice.',
                  '',
                  '8.2 LIABILITY — Neither party shall be liable for indirect',
                  'losses. Provider liability shall not be limited in aggregate.',
                ].map((line, i) => (
                  <div
                    key={i}
                    className={`h-3 rounded text-xs font-mono ${
                      line === ''
                        ? 'h-2'
                        : i === 6 || i === 7
                        ? 'bg-red-500/20 border border-red-500/30 px-2 flex items-center text-red-400'
                        : 'bg-white/5'
                    }`}
                    style={{ width: line === '' ? 0 : undefined }}
                  >
                    {(i === 6 || i === 7) && line}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                <div className="w-2 h-2 rounded-full bg-[#00D4FF] animate-pulse" />
                <span className="text-xs text-gray-500">Processing clause 8 of 24…</span>
              </div>
            </div>

            {/* Results pane */}
            <div className="rounded-2xl border border-white/10 bg-[#0F1014] p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                <Brain className="w-4 h-4 text-[#00D4FF]" />
                <span className="text-sm text-gray-300 font-medium">Extraction Results</span>
              </div>

              <div className="space-y-2">
                {demoLines.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 text-sm">
                    <span className="text-gray-500 shrink-0">{row.label}</span>
                    <span
                      className={`text-right text-xs font-medium ${
                        row.value.startsWith('⚠')
                          ? 'text-red-400'
                          : row.label === 'Risk score'
                          ? 'text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-3">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wide">
                  Risk flags
                </p>
                <div className="space-y-2">
                  {riskItems.map((item) => {
                    const cfg = levelConfig[item.level];
                    return (
                      <div
                        key={item.text}
                        className={`rounded-lg border px-3 py-2 text-xs flex items-center justify-between gap-2 ${cfg.bg}`}
                      >
                        <span className="text-gray-300">{item.text}</span>
                        <span className={`font-semibold shrink-0 ${cfg.text}`}>{cfg.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-gray-400 mb-4">
          Flexible plans from solo practitioners to global law firms.
        </p>
        <Link href="/pricing">
          <Button
            variant="outline"
            className="border-[#00D4FF]/30 text-[#00D4FF] hover:bg-[#00D4FF]/10 hover:border-[#00D4FF]/50"
          >
            Compare plans &amp; pricing
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-white/10 bg-gradient-to-br from-[#00D4FF]/8 via-transparent to-transparent py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Your contracts are talking.
            <br />
            Are you listening?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Book a personalised demo and see how UltAi analyses your own contracts — live, in the
            session.
          </p>
          <Link href="/book-demo">
            <Button className="bg-[#00D4FF] hover:bg-[#00BFEA] text-[#0B0C10] px-8 py-6 text-base font-semibold h-auto">
              Book a Demo
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
