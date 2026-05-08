import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Brain, ArrowLeft, FileText, Upload, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CONTRACT_TYPES = [
  'NDA / Confidentiality Agreement',
  'Services Agreement',
  'Employment Contract',
  'SaaS / Software Licence',
  'Consultancy Agreement',
  'Lease Agreement',
  'Supply Chain Agreement',
  'Partnership Deed',
  'Shareholders Agreement',
  'Loan Agreement',
  'Other',
];

const AGENT_STEPS = [
  { label: 'Ingesting contract…', delay: 0 },
  { label: 'Extracting metadata & parties…', delay: 1800 },
  { label: 'Scanning for risk clauses…', delay: 4000 },
  { label: 'Cataloguing obligations & dates…', delay: 7000 },
  { label: 'Calculating risk score…', delay: 10000 },
  { label: 'Generating recommendations…', delay: 12000 },
];

function AgentRunning() {
  const [stepIndex, setStepIndex] = useState(0);

  useState(() => {
    AGENT_STEPS.forEach(({ delay }, i) => {
      setTimeout(() => setStepIndex(i), delay);
    });
  });

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Pulsing brain */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00D4FF]/20" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00D4FF]/10 border border-[#00D4FF]/30">
          <Brain className="h-8 w-8 text-[#00D4FF]" />
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-white">UltAi Agent Running</h2>
        <p className="mt-1 text-sm text-gray-400">Claude is analysing your contract…</p>
      </div>

      {/* Step list */}
      <div className="w-full max-w-sm space-y-2">
        {AGENT_STEPS.map(({ label }, i) => (
          <div
            key={label}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all ${
              i < stepIndex
                ? 'border-[#00D4FF]/20 bg-[#00D4FF]/5 text-[#00D4FF]'
                : i === stepIndex
                ? 'border-[#00D4FF]/40 bg-[#00D4FF]/10 text-white'
                : 'border-white/5 bg-white/[0.02] text-gray-600'
            }`}
          >
            {i < stepIndex ? (
              <span className="h-4 w-4 flex items-center justify-center rounded-full bg-[#00D4FF] text-black text-[9px] font-bold shrink-0">
                ✓
              </span>
            ) : i === stepIndex ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00D4FF]" />
            ) : (
              <span className="h-4 w-4 rounded-full border border-white/10 shrink-0" />
            )}
            <span className="text-sm">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function UltAiIntake() {
  const [, navigate] = useLocation();
  const [contractText, setContractText] = useState('');
  const [fileName, setFileName] = useState('');
  const [contractType, setContractType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setContractText(text ?? '');
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contractText.trim().length < 20) {
      setError('Please paste or upload a contract (at least 20 characters).');
      return;
    }
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/ultai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: fileName || contractType || 'Contract',
          contractText: contractText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Server error');
      navigate(`/ultai-analysis/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors focus:border-[#00D4FF]/50 focus:ring-1 focus:ring-[#00D4FF]/30';

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0B0C10]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-3">
          <Link href="/ultai-dashboard">
            <button className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
          </Link>
          <div className="flex items-center gap-2 ml-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#00D4FF]/10">
              <Brain className="h-4 w-4 text-[#00D4FF]" />
            </div>
            <span className="font-bold tracking-tight">UltAi</span>
          </div>
          <span className="ml-auto text-xs text-gray-500">Powered by Claude claude-sonnet-4-6</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        {submitting ? (
          <AgentRunning />
        ) : (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-bold">Analyse a Contract</h1>
              <p className="mt-2 text-gray-400">
                Paste your contract text or upload a .txt / .md file. The UltAi agent will run a
                four-step analysis: metadata extraction, risk identification, obligation mapping, and
                risk scoring.
              </p>
            </div>

            {error && (
              <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File name + type row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Contract Name
                  </label>
                  <input
                    type="text"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    placeholder="e.g. NDA_Harrington_v2.pdf"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400">
                    Contract Type (optional)
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className={inputClass + ' appearance-none'}
                  >
                    <option value="">— Let the agent decide —</option>
                    {CONTRACT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Text area */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400">
                  Contract Text *
                </label>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={16}
                  placeholder="Paste the full contract text here…

Example: THIS AGREEMENT is made between Acme Ltd ('Client') and Widgets Co Ltd ('Supplier') on 1 January 2026. 1. Services: The Supplier shall provide software development services... 2. Payment: The Client shall pay £10,000 per month..."
                  className={inputClass + ' resize-none font-mono text-xs leading-relaxed'}
                />
                <p className="mt-1.5 text-xs text-gray-600">
                  {contractText.length > 0
                    ? `${contractText.length.toLocaleString()} characters · ~${Math.round(contractText.length / 4).toLocaleString()} tokens`
                    : 'Supports any plain-text contract. For PDFs, copy and paste the text content.'}
                </p>
              </div>

              {/* Upload alternative */}
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t border-white/10" />
                <span className="text-xs text-gray-600">or upload a text file</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-5 transition-colors hover:border-[#00D4FF]/30 hover:bg-[#00D4FF]/5">
                <Upload className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-400">
                  {fileName ? (
                    <span className="text-[#00D4FF] flex items-center gap-2">
                      <FileText className="h-4 w-4" /> {fileName}
                    </span>
                  ) : (
                    'Click to upload .txt or .md file'
                  )}
                </span>
                <input
                  type="file"
                  accept=".txt,.md,.text"
                  onChange={handleFile}
                  className="hidden"
                />
              </label>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2">
                <Link href="/ultai-dashboard">
                  <button
                    type="button"
                    className="rounded-xl border border-white/10 px-5 py-2.5 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </Link>
                <Button
                  type="submit"
                  disabled={contractText.trim().length < 20}
                  className="rounded-xl bg-[#00D4FF] px-6 py-2.5 text-sm font-semibold text-black hover:bg-[#00bce8] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Run UltAi Analysis
                </Button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}
