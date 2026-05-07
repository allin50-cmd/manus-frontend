import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const PAIN_POINTS = [
  'Unbilled emails & calls',
  'Preparation time not captured',
  'Disbursements not recharged',
  'Late billing write-offs',
];

export default function AuditLanding() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [chamberSize, setChamberSize] = useState('');
  const [selectedPains, setSelectedPains] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function togglePain(p: string) {
    setSelectedPains(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/audit-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          chamberSize: chamberSize || undefined,
          painPoints: selectedPains.length > 0 ? selectedPains : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? 'Signup failed');
      }

      setSubmitted(true);
      toast.success('Audit request submitted! Check your inbox for your personalised report.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white">
      {/* Hero */}
      <div className="container mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-block rounded-full bg-blue-600/20 px-4 py-1 text-sm text-blue-400 ring-1 ring-blue-500/30">
          Free AI Revenue Audit
        </div>

        <h1 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Find out how much revenue<br />your chambers is missing
        </h1>

        <p className="mb-10 text-lg text-gray-400">
          Our AI analyses your billing patterns and identifies unbilled work.
          Most chambers recover <strong className="text-white">£3k–£12k/month</strong> they didn't know they were losing.
        </p>

        {submitted ? (
          <div className="rounded-xl border border-green-700/40 bg-green-900/20 px-8 py-10">
            <div className="mb-3 text-4xl">✅</div>
            <h2 className="mb-2 text-2xl font-bold text-green-400">Check your inbox</h2>
            <p className="text-gray-400">
              Your personalised audit report is on its way to <strong className="text-white">{email}</strong>.
              It takes about 2 minutes to review.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-white/10 bg-white/5 px-6 py-8 text-left backdrop-blur sm:px-10"
          >
            <div className="mb-5 grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-gray-300">
                  Your name
                </Label>
                <Input
                  id="name"
                  placeholder="Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-gray-300">
                  Work email <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@chambers.co.uk"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="border-white/20 bg-white/5 text-white placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="mb-5 space-y-1">
              <Label htmlFor="chamber-size" className="text-gray-300">
                Chamber size (approximate)
              </Label>
              <select
                id="chamber-size"
                value={chamberSize}
                onChange={e => setChamberSize(e.target.value)}
                className="w-full rounded-md border border-white/20 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="bg-gray-900">Select…</option>
                <option value="1-10" className="bg-gray-900">1–10 barristers</option>
                <option value="11-30" className="bg-gray-900">11–30 barristers</option>
                <option value="31-60" className="bg-gray-900">31–60 barristers</option>
                <option value="60+" className="bg-gray-900">60+ barristers</option>
              </select>
            </div>

            <div className="mb-7 space-y-2">
              <Label className="text-gray-300">
                Where do you think you're losing revenue? (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {PAIN_POINTS.map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePain(p)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      selectedPains.includes(p)
                        ? 'border-blue-500 bg-blue-600/30 text-blue-300'
                        : 'border-white/20 text-gray-400 hover:border-white/40 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 py-3 text-base font-semibold hover:bg-blue-500 disabled:opacity-60"
            >
              {loading ? 'Generating your audit…' : 'Start Free Audit →'}
            </Button>

            <p className="mt-3 text-center text-xs text-gray-500">
              No credit card. No commitment. Results in under 2 minutes.
            </p>
          </form>
        )}
      </div>

      {/* Social proof strip */}
      <div className="border-y border-white/10 bg-white/5 py-8 text-center">
        <p className="mb-4 text-sm text-gray-400 uppercase tracking-widest">Trusted by chambers across England & Wales</p>
        <div className="flex flex-wrap justify-center gap-8 text-gray-500 text-sm">
          <span>Average recovery: <strong className="text-white">£6,400/month</strong></span>
          <span>Setup time: <strong className="text-white">&lt; 1 day</strong></span>
          <span>No workflow changes required</span>
        </div>
      </div>

      {/* How it works */}
      <div className="container mx-auto max-w-3xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">How the audit works</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            { step: '1', title: 'Enter your email', body: 'We create your private audit report in seconds.' },
            { step: '2', title: 'Review your leakage', body: 'See exactly where revenue is slipping through the cracks.' },
            { step: '3', title: 'Recover it', body: 'VaultLine automates recovery — no extra work for your team.' },
          ].map(({ step, title, body }) => (
            <div key={step} className="rounded-lg border border-white/10 bg-white/5 p-5">
              <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-bold">
                {step}
              </div>
              <h3 className="mb-1 font-semibold">{title}</h3>
              <p className="text-sm text-gray-400">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
