import { useState } from 'react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';
import { CheckCircle, ChevronRight, ChevronLeft, Cpu, Building2, Layers, Target, BarChart3, Zap } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1 – Business Information
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  industry: string;
  companySize: string;
  website: string;
  // Step 2 – Business Context
  businessDescription: string;
  targetMarket: string;
  currentRevenue: string;
  // Step 3 – Current Challenges
  challenges: string;
  aiExperience: string;
  // Step 4 – Technology Stack
  techStack: string;
  currentTools: string;
  cloudPlatform: string;
  // Step 5 – Goals & Timeline
  primaryGoals: string;
  timeline: string;
  budget: string;
  additionalNotes: string;
}

const EMPTY: FormData = {
  companyName: '', contactName: '', email: '', phone: '',
  industry: '', companySize: '', website: '',
  businessDescription: '', targetMarket: '', currentRevenue: '',
  challenges: '', aiExperience: '',
  techStack: '', currentTools: '', cloudPlatform: '',
  primaryGoals: '', timeline: '', budget: '', additionalNotes: '',
};

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Business Info',    Icon: Building2,  short: '01' },
  { label: 'Business Context', Icon: BarChart3,   short: '02' },
  { label: 'Challenges',       Icon: Zap,         short: '03' },
  { label: 'Tech Stack',       Icon: Layers,      short: '04' },
  { label: 'Goals & Timeline', Icon: Target,      short: '05' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({
  label, required, children,
}: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold tracking-widest text-slate-400 uppercase">
        {label}{required && <span className="text-cyan-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 outline-none transition backdrop-blur-sm';

const selectCls = inputCls + ' appearance-none cursor-pointer';

const textareaCls =
  'w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/40 outline-none transition backdrop-blur-sm resize-none min-h-[100px]';

// ─── Step components ──────────────────────────────────────────────────────────

function Step1({ d, set }: { d: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <Field label="Company Name" required>
        <input className={inputCls} placeholder="Acme Corp" value={d.companyName}
          onChange={e => set('companyName', e.target.value)} />
      </Field>
      <Field label="Contact Name" required>
        <input className={inputCls} placeholder="Jane Smith" value={d.contactName}
          onChange={e => set('contactName', e.target.value)} />
      </Field>
      <Field label="Email Address" required>
        <input className={inputCls} type="email" placeholder="jane@acme.com" value={d.email}
          onChange={e => set('email', e.target.value)} />
      </Field>
      <Field label="Phone Number">
        <input className={inputCls} type="tel" placeholder="+44 7700 900000" value={d.phone}
          onChange={e => set('phone', e.target.value)} />
      </Field>
      <Field label="Industry">
        <select className={selectCls} value={d.industry} onChange={e => set('industry', e.target.value)}>
          <option value="">Select industry…</option>
          {['Technology','Finance','Healthcare','Legal','Manufacturing','Retail','Education','Real Estate','Other']
            .map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      <Field label="Company Size">
        <select className={selectCls} value={d.companySize} onChange={e => set('companySize', e.target.value)}>
          <option value="">Select size…</option>
          {['1–10','11–50','51–200','201–500','500+'].map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Website">
          <input className={inputCls} placeholder="https://acme.com" value={d.website}
            onChange={e => set('website', e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Step2({ d, set }: { d: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Business Description">
        <textarea className={textareaCls} placeholder="Describe what your business does and your core value proposition…"
          value={d.businessDescription} onChange={e => set('businessDescription', e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Target Market">
          <input className={inputCls} placeholder="e.g. SMB UK financial services" value={d.targetMarket}
            onChange={e => set('targetMarket', e.target.value)} />
        </Field>
        <Field label="Current Annual Revenue">
          <select className={selectCls} value={d.currentRevenue} onChange={e => set('currentRevenue', e.target.value)}>
            <option value="">Select range…</option>
            {['Pre-revenue','Under £1M','£1M – £10M','£10M – £50M','£50M – £250M','£250M+']
              .map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
      </div>
    </div>
  );
}

function Step3({ d, set }: { d: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Primary Challenges">
        <textarea className={textareaCls} style={{ minHeight: 120 }}
          placeholder="What operational, growth, or efficiency challenges are you trying to solve with AI?…"
          value={d.challenges} onChange={e => set('challenges', e.target.value)} />
      </Field>
      <Field label="AI Experience">
        <select className={selectCls} value={d.aiExperience} onChange={e => set('aiExperience', e.target.value)}>
          <option value="">Select experience level…</option>
          {['None — exploring for the first time','Early exploration — researching options',
            'Some tools — using basic AI tools (e.g. ChatGPT)','Actively using — deployed in select workflows',
            'Advanced — AI is core to our operations']
            .map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
    </div>
  );
}

function Step4({ d, set }: { d: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Current Technology Stack">
        <textarea className={textareaCls}
          placeholder="e.g. React, Node.js, PostgreSQL, Python microservices…"
          value={d.techStack} onChange={e => set('techStack', e.target.value)} />
      </Field>
      <Field label="Current AI / Automation Tools">
        <textarea className={textareaCls}
          placeholder="e.g. Zapier, Make, OpenAI API, Azure Cognitive Services…"
          value={d.currentTools} onChange={e => set('currentTools', e.target.value)} />
      </Field>
      <Field label="Primary Cloud Platform">
        <select className={selectCls} value={d.cloudPlatform} onChange={e => set('cloudPlatform', e.target.value)}>
          <option value="">Select platform…</option>
          {['Microsoft Azure','Amazon Web Services','Google Cloud Platform','On-Premise','Mixed / Hybrid','None / Not Yet Decided']
            .map(x => <option key={x} value={x}>{x}</option>)}
        </select>
      </Field>
    </div>
  );
}

function Step5({ d, set }: { d: FormData; set: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="flex flex-col gap-5">
      <Field label="Primary Goals with AI">
        <textarea className={textareaCls} style={{ minHeight: 120 }}
          placeholder="What outcomes do you want to achieve? e.g. reduce manual processing by 60%, automate client onboarding…"
          value={d.primaryGoals} onChange={e => set('primaryGoals', e.target.value)} />
      </Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Implementation Timeline">
          <select className={selectCls} value={d.timeline} onChange={e => set('timeline', e.target.value)}>
            <option value="">Select timeline…</option>
            {['As soon as possible','1–3 months','3–6 months','6–12 months','12+ months']
              .map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
        <Field label="Indicative Budget">
          <select className={selectCls} value={d.budget} onChange={e => set('budget', e.target.value)}>
            <option value="">Select range…</option>
            {['Under £10K','£10K – £50K','£50K – £100K','£100K – £500K','£500K+','To be determined']
              .map(x => <option key={x} value={x}>{x}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Additional Notes">
        <textarea className={textareaCls}
          placeholder="Anything else we should know before our call?…"
          value={d.additionalNotes} onChange={e => set('additionalNotes', e.target.value)} />
      </Field>
    </div>
  );
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ intakeId, onReset }: { intakeId: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8 text-center">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-2xl scale-150" />
        <CheckCircle className="relative w-20 h-20 text-cyan-400" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white mb-3">Request Received</h2>
        <p className="text-slate-400 max-w-md text-sm leading-relaxed">
          Your consultation intake has been securely submitted. A member of the UltAi team will review your brief and reach out within one business day.
        </p>
      </div>
      <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-8 py-5 backdrop-blur-sm">
        <p className="text-xs text-slate-500 tracking-widest uppercase mb-1">Reference ID</p>
        <p className="text-xl font-mono font-semibold text-cyan-400">{intakeId}</p>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-slate-500 hover:text-slate-300 transition underline underline-offset-4"
      >
        Submit another intake
      </button>
    </div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function UltAiIntakeWizard() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);

  const set = (k: keyof FormData, v: string) => setData(prev => ({ ...prev, [k]: v }));

  const validateStep = (): string | null => {
    if (step === 0) {
      if (!data.companyName.trim()) return 'Company name is required.';
      if (!data.contactName.trim()) return 'Contact name is required.';
      if (!data.email.trim() || !EMAIL_RE.test(data.email.trim())) return 'A valid email address is required.';
    }
    return null;
  };

  const next = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep(s => Math.max(s - 1, 0));

  const submit = async () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/ultai-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Submission failed');
      setSuccessId(json.intakeId);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setData(EMPTY);
    setStep(0);
    setSuccessId(null);
  };

  const stepContent = [
    <Step1 key={0} d={data} set={set} />,
    <Step2 key={1} d={data} set={set} />,
    <Step3 key={2} d={data} set={set} />,
    <Step4 key={3} d={data} set={set} />,
    <Step5 key={4} d={data} set={set} />,
  ];

  const isLast = step === STEPS.length - 1;

  return (
    <div className="min-h-screen bg-[#0B0C10] text-white overflow-x-hidden">
      {/* Grid overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(6,182,212,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,0.03) 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Header bar */}
      <header className="relative border-b border-slate-800/60 bg-[#0B0C10]/80 backdrop-blur-xl z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">UltAi</span>
            <span className="hidden sm:inline text-slate-600 text-sm">/ Consultation Intake</span>
          </div>
          <button
            onClick={() => setLocation('/')}
            className="text-xs text-slate-500 hover:text-slate-300 transition tracking-wide"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-cyan-500 uppercase mb-3">
            AI Consultation
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Tell us about your&nbsp;
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              business
            </span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
            Complete the intake form below and an UltAi strategist will prepare a tailored AI roadmap for your consultation call.
          </p>
        </div>

        {/* Card */}
        <div className="relative rounded-2xl border border-slate-700/40 bg-slate-950/70 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden">
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent" />

          {!successId && (
            <>
              {/* Step progress */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-800/50">
                <div className="flex items-center gap-0">
                  {STEPS.map((s, i) => {
                    const done = i < step;
                    const active = i === step;
                    return (
                      <div key={i} className="flex items-center flex-1 last:flex-none">
                        <div className={`flex flex-col items-center gap-1.5 group cursor-default`}>
                          <div className={`
                            w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all
                            ${done
                              ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-400'
                              : active
                              ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                              : 'bg-slate-800/60 border border-slate-700/50 text-slate-600'}
                          `}>
                            {done ? <CheckCircle className="w-4 h-4" /> : s.short}
                          </div>
                          <span className={`hidden sm:block text-[10px] tracking-wide font-medium transition-colors
                            ${active ? 'text-cyan-400' : done ? 'text-slate-500' : 'text-slate-700'}`}>
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className={`h-[1px] flex-1 mx-2 transition-colors
                            ${i < step ? 'bg-cyan-500/40' : 'bg-slate-800/60'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step title */}
              <div className="px-8 pt-7 pb-2">
                <div className="flex items-center gap-3 mb-1">
                  {(() => { const { Icon } = STEPS[step]; return <Icon className="w-5 h-5 text-cyan-400" />; })()}
                  <h2 className="text-xl font-semibold text-white">{STEPS[step].label}</h2>
                </div>
                <p className="text-xs text-slate-600 ml-8">Step {step + 1} of {STEPS.length}</p>
              </div>

              {/* Form content */}
              <div className="px-8 py-6">{stepContent[step]}</div>

              {/* Navigation */}
              <div className="px-8 pb-8 flex items-center justify-between gap-4">
                <button
                  onClick={prev}
                  disabled={step === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700/50 text-sm text-slate-400 hover:text-white hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>

                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-300
                      ${i === step ? 'w-6 h-1.5 bg-cyan-500' : i < step ? 'w-1.5 h-1.5 bg-cyan-500/40' : 'w-1.5 h-1.5 bg-slate-700'}`} />
                  ))}
                </div>

                {isLast ? (
                  <button
                    onClick={submit}
                    disabled={submitting}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition shadow-lg shadow-cyan-500/20"
                  >
                    {submitting ? 'Submitting…' : 'Submit Intake'}
                    {!submitting && <CheckCircle className="w-4 h-4" />}
                  </button>
                ) : (
                  <button
                    onClick={next}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 transition shadow-lg shadow-cyan-500/20"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </>
          )}

          {successId && <SuccessScreen intakeId={successId} onReset={reset} />}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-slate-700 mt-8">
          Your information is encrypted in transit and stored securely. UltAi will never share your data with third parties.
        </p>
      </main>
    </div>
  );
}
