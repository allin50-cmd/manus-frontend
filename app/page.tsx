import type { Metadata } from 'next'
import CompanyChecker from '@/components/CompanyChecker'

export const metadata: Metadata = {
  title: 'FineGuard — Know Your Company Status',
  description:
    'Check your company status with Companies House in 30 seconds. FineGuard monitors your obligations so UK directors never miss a deadline.',
}

// ─── Reusable section primitives ─────────────────────────────────────────────

function StatusCard({ status, headline, sub }: { status: 'green' | 'amber' | 'red'; headline: string; sub: string }) {
  const cfg = {
    green: { bg: 'bg-[#E6F7F1]', border: 'border-[#00A86B]', dot: 'bg-[#00A86B]', label: 'GREEN', text: 'text-[#00A86B]' },
    amber: { bg: 'bg-amber-50',   border: 'border-amber-400',  dot: 'bg-amber-400',  label: 'AMBER', text: 'text-amber-600' },
    red:   { bg: 'bg-red-50',     border: 'border-red-500',    dot: 'bg-red-500',    label: 'RED',   text: 'text-red-600' },
  }[status]

  return (
    <div className={`rounded-2xl border-l-4 p-6 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
        <span className={`text-xs font-bold uppercase tracking-widest ${cfg.text}`}>{cfg.label}</span>
      </div>
      <p className="text-xl font-bold text-slate-900 mb-1">{headline}</p>
      <p className="text-slate-600 text-sm leading-relaxed">{sub}</p>
    </div>
  )
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#0B1F3A] text-white text-xl font-bold flex items-center justify-center mb-4 shadow-lg">
        {n}
      </div>
      <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed max-w-[160px]">{desc}</p>
    </div>
  )
}

function TierCard({ color, label, who, what }: { color: 'green' | 'amber' | 'red' | 'critical'; label: string; who: string; what: string }) {
  const cfg = {
    green:    { border: 'border-[#00A86B]', badge: 'bg-[#00A86B]' },
    amber:    { border: 'border-amber-400',  badge: 'bg-amber-400'  },
    red:      { border: 'border-red-500',    badge: 'bg-red-500'    },
    critical: { border: 'border-[#0B1F3A]', badge: 'bg-[#0B1F3A]' },
  }[color]

  return (
    <div className={`bg-white rounded-2xl border-t-4 p-6 shadow-sm ${cfg.border}`}>
      <span className={`inline-block text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 ${cfg.badge}`}>
        {label}
      </span>
      <p className="font-bold text-slate-900 mb-1">{who}</p>
      <p className="text-slate-500 text-sm leading-relaxed">{what}</p>
    </div>
  )
}

function TeamMember({ initials, name, title, bio }: { initials: string; name: string; title: string; bio: string }) {
  return (
    <div className="text-center">
      <div className="w-24 h-24 rounded-full bg-[#0B1F3A] text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-md">
        {initials}
      </div>
      <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
      <p className="text-[#00A86B] text-sm font-semibold mb-2">{title}</p>
      <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{bio}</p>
    </div>
  )
}

function TrustBadge({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#0B1F3A] flex items-center justify-center shadow">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-700 leading-tight">{label}</span>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="border-b border-slate-200 py-5 group">
      <summary className="flex items-center justify-between cursor-pointer list-none text-slate-900 font-semibold text-base pr-1 gap-4">
        <span>{q}</span>
        <svg className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed pr-6">{a}</p>
    </details>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans" style={{ fontFamily: 'var(--font-inter, Inter, system-ui, sans-serif)' }}>

      {/* ── HEADER ── */}
      <header className="bg-[#0B1F3A] px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <a href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00A86B] rounded-lg flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FineGuard</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#how-it-works" className="text-slate-300 hover:text-white text-sm transition-colors">How it works</a>
          <a href="#team"         className="text-slate-300 hover:text-white text-sm transition-colors">Team</a>
          <a href="#pricing"      className="text-slate-300 hover:text-white text-sm transition-colors">Pricing</a>
          <a href="#faq"          className="text-slate-300 hover:text-white text-sm transition-colors">FAQ</a>
        </nav>
        <a href="/login" className="bg-[#00A86B] text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#009960] transition-colors">
          Sign in
        </a>
      </header>

      {/* ── SECTION 1: HERO ── */}
      <section className="bg-[#0B1F3A] px-6 lg:px-12 pt-20 pb-28 md:pt-28 md:pb-36">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
            <span className="w-2 h-2 bg-[#00A86B] rounded-full" />
            UK Company Directors
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
            Check Your Company Status<br className="hidden sm:block" /> In 30 Seconds
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-12 leading-relaxed max-w-xl mx-auto">
            See exactly where your company stands with Companies House and know when action is required.
          </p>
          <CompanyChecker />
          <p className="text-slate-500 text-sm mt-6">No sign-up required. No jargon.</p>
        </div>
      </section>

      {/* ── SECTION 2: STATUS EXAMPLES ── */}
      <section className="bg-[#F7F8FA] px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Instant Status</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One clear answer. Green, Amber or Red. No interpretation required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatusCard status="green" headline="You're OK"                  sub="172 days until next required action. No action required today." />
            <StatusCard status="amber" headline="Action Required Soon"        sub="28 days until confirmation statement." />
            <StatusCard status="red"   headline="Urgent Action Required"      sub="Accounts overdue. Potential penalties may apply." />
          </div>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ── */}
      <section id="how-it-works" className="bg-white px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">What Happens Next</h2>
            <p className="text-slate-500 max-w-xl mx-auto">From your first check to complete peace of mind — in four steps.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6">
            <Step n={1} title="Check Company"     desc="Enter your company number. Results in seconds." />
            <Step n={2} title="See Status"         desc="Green, Amber or Red. Exactly where you stand." />
            <Step n={3} title="FineGuard Monitors" desc="We watch every deadline so you don't have to." />
            <Step n={4} title="You Stop Worrying"  desc="Notifications before anything requires action." />
          </div>
        </div>
      </section>

      {/* ── SECTION 4: NOBODY GETS IGNORED ── */}
      <section className="bg-[#F7F8FA] px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Nobody Gets Ignored</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Every customer receives the right level of attention — automatically.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <TierCard color="green"    label="Green"    who="Regular Reassurance"  what="Monthly status confirmation. You know you're fine without having to check." />
            <TierCard color="amber"    label="Amber"    who="Guidance & Reminders"  what="We tell you exactly what's due and when. No guesswork." />
            <TierCard color="red"      label="Red"      who="Human Intervention"    what="A real person reviews your situation and contacts you directly." />
            <TierCard color="critical" label="Critical" who="Priority Attention"    what="Immediate escalation to our senior team. We act on your behalf." />
          </div>
        </div>
      </section>

      {/* ── SECTION 5: TEAM ── */}
      <section id="team" className="bg-white px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Meet The Team</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Real people. Real responsibility. We answer to you, not to a dashboard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <TeamMember initials="GT" name="George Thomas" title="Founder"
              bio="Vision and customer advocacy. George built FineGuard after watching too many directors miss deadlines they didn't know existed." />
            <TeamMember initials="A"  name="Alissa"        title="Customer Reassurance Lead"
              bio="Ensures no customer is left wondering. Alissa personally reviews every amber and red status every morning." />
            <TeamMember initials="DW" name="Daygon White"  title="Client Services"
              bio="Supports customers requiring additional help navigating Companies House requirements and filing processes." />
          </div>
        </div>
      </section>

      {/* ── SECTION 6: TRUST CENTRE ── */}
      <section className="bg-[#0B1F3A] px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Trust Centre</h2>
            <p className="text-slate-400 max-w-xl mx-auto">FineGuard is built to meet the standards you'd expect from a regulated professional service.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            <TrustBadge label="UK Registered Company" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M9 21V9l3-6 3 6v12M9 21H3M21 21h-6" />
              </svg>} />
            <TrustBadge label="GDPR Compliant" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>} />
            <TrustBadge label="Companies House Connected" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>} />
            <TrustBadge label="Real Human Support" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>} />
            <TrustBadge label="Professional Indemnity Cover" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>} />
            <TrustBadge label="Trustpilot Rated" icon={
              <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>} />
          </div>
          <div className="mt-14 pt-10 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-sm">
            <p>FineGuard Ltd · Registered in England &amp; Wales</p>
            <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: PRICING ── */}
      <section id="pricing" className="bg-white px-6 lg:px-12 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Compliance Peace Of Mind</h2>
            <p className="text-slate-500 max-w-xl mx-auto">One company, one price, one team looking after you.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">

            {/* Monthly */}
            <div className="border border-slate-200 rounded-2xl p-8">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Monthly Plan</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-slate-900">£29</span>
                <span className="text-slate-400">/month</span>
              </div>
              <ul className="space-y-3 mb-8">
                {['Real-time Companies House monitoring', 'Green, Amber & Red status alerts', 'Email & SMS deadline reminders', 'Human support for amber & red statuses', 'Up to 3 companies'].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/login" className="block w-full text-center py-3.5 border-2 border-[#0B1F3A] text-[#0B1F3A] font-semibold rounded-xl hover:bg-[#0B1F3A] hover:text-white transition-colors">
                Get started
              </a>
            </div>

            {/* Annual */}
            <div className="relative border-2 border-[#00A86B] rounded-2xl p-8 bg-[#E6F7F1]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#00A86B] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">Best value</span>
              </div>
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">Annual Plan</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-900">£249</span>
                <span className="text-slate-400">/year</span>
              </div>
              <p className="text-[#00A86B] text-sm font-semibold mb-6">Save £99 — two months free</p>
              <ul className="space-y-3 mb-8">
                {['Everything in Monthly', 'Priority human support', 'Annual compliance review call', 'Up to 10 companies', 'Accountant access included'].map((f) => (
                  <li key={f} className="flex items-start gap-3 text-sm text-slate-600">
                    <svg className="w-4 h-4 text-[#00A86B] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/login" className="block w-full text-center py-3.5 bg-[#00A86B] text-white font-semibold rounded-xl hover:bg-[#009960] transition-colors">
                Get started
              </a>
            </div>
          </div>
          <p className="text-center text-slate-400 text-sm mt-8">
            Need more than 10 companies?{' '}
            <a href="mailto:hello@fineguard.co.uk" className="text-[#0B1F3A] font-semibold hover:underline">Talk to us →</a>
          </p>
        </div>
      </section>

      {/* ── SECTION 8: FAQ ── */}
      <section id="faq" className="bg-[#F7F8FA] px-6 lg:px-12 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Common Questions</h2>
          </div>
          <FaqItem q="Am I compliant right now?"
            a="Enter your company number above and we'll tell you within 30 seconds — no account needed. We pull live data directly from Companies House." />
          <FaqItem q="What happens if I miss a deadline?"
            a="Companies House issues automatic penalties for late accounts — from £150 for up to one month late, rising to £1,500 for more than six months. Confirmation statement failures can lead to prosecution. FineGuard makes sure you never reach that point." />
          <FaqItem q="Can you monitor multiple companies?"
            a="Yes. Monthly plans cover up to 3 companies, Annual plans cover up to 10. If you need more, get in touch and we'll arrange something suitable." />
          <FaqItem q="Can my accountant use FineGuard?"
            a="Absolutely. Annual plan subscribers can add their accountant as an authorised user at no extra cost. Your accountant will see the same status you see and receive the same alerts." />
          <FaqItem q="What if my company is already overdue?"
            a="Don't panic. Enter your company number and we'll show you exactly where things stand. If you're overdue, a real member of our team will contact you to help you understand your options and what to do next." />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0B1F3A] px-6 lg:px-12 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-7 h-7 bg-[#00A86B] rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-white font-bold">FineGuard</span>
            </div>
            <p className="text-slate-400 text-sm">Registered in England &amp; Wales</p>
            <p className="text-slate-500 text-xs mt-1">© {new Date().getFullYear()} FineGuard Ltd. All rights reserved.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Product</p>
              <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How it works</a>
              <a href="#pricing"      className="text-slate-400 hover:text-white transition-colors">Pricing</a>
              <a href="#faq"          className="text-slate-400 hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Company</p>
              <a href="#team"                        className="text-slate-400 hover:text-white transition-colors">Team</a>
              <a href="mailto:hello@fineguard.co.uk" className="text-slate-400 hover:text-white transition-colors">Contact</a>
              <a href="/login"                        className="text-slate-400 hover:text-white transition-colors">Sign in</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
