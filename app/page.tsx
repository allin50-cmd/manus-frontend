import type { Metadata } from 'next'
import CompanyChecker from '@/components/CompanyChecker'

export const metadata: Metadata = {
  title: 'FineGuard — Check Your Companies House Status',
  description:
    'Check your UK company status in 30 seconds. FineGuard monitors Companies House deadlines so you never miss a filing or face an avoidable penalty.',
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="border-b border-slate-200 first:border-t py-5 group">
      <summary className="flex items-center justify-between cursor-pointer list-none text-slate-900 font-semibold text-base pr-1 gap-4">
        <span>{q}</span>
        <svg
          className="w-5 h-5 text-slate-400 shrink-0 transition-transform group-open:rotate-180"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <p className="mt-3 text-slate-600 text-sm leading-relaxed pr-6">{a}</p>
    </details>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── ANNOUNCEMENT BANNER ── */}
      <div className="bg-amber-400 text-[#0B1F3A] text-center text-sm font-semibold py-2.5 px-4">
        UK directors: avoid £150–£1,500 in penalties · FineGuard protection from just £4.99/month
      </div>

      {/* ── HEADER ── */}
      <header className="bg-[#0B1F3A] px-5 lg:px-10 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-[#00A86B] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FineGuard</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a href="#pricing" className="text-slate-300 hover:text-white font-medium transition-colors">Pricing</a>
          <a href="#how-it-works" className="text-slate-300 hover:text-white font-medium transition-colors">How It Works</a>
          <a href="#team" className="text-slate-300 hover:text-white font-medium transition-colors">About</a>
          <a href="#faq" className="text-slate-300 hover:text-white font-medium transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="/login" className="text-slate-300 hover:text-white text-sm font-medium transition-colors hidden sm:block">Login</a>
          <a href="/login" className="bg-[#00A86B] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#009960] transition-colors whitespace-nowrap">
            Get Protected
          </a>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════
          SCREEN 1 — STATUS CHECK
          Core question: "Am I OK?"
      ══════════════════════════════════════════════════════ */}
      <section id="checker" className="bg-[#0B1F3A] px-5 pt-14 pb-16 md:pt-24 md:pb-28">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
            Stop worrying about Companies House penalties.
          </h1>
          <p className="text-slate-300 text-lg md:text-xl mb-10">
            Check your company status in 30 seconds.
          </p>

          <CompanyChecker />

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {[
              { icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', label: 'No sign-up required' },
              { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', label: '30-second check' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Free forever' },
            ].map(({ icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 bg-white/10 text-slate-300 text-xs px-3 py-1.5 rounded-full">
                <svg className="w-3 h-3 text-[#00A86B] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SCREEN 3 — CONVERSION
          "Would you like us to keep watching this?"
      ══════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-[#F7F8FA] px-5 py-16 md:py-24">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-md px-8 py-10 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
              Would you like us to keep watching this?
            </p>

            <div className="mb-2">
              <span className="text-5xl font-bold text-[#0B1F3A]">£4.99</span>
              <span className="text-slate-400 text-lg font-normal ml-1">/ month</span>
            </div>
            <p className="text-slate-400 text-sm mb-8">Less than a coffee. More than worth it.</p>

            <ul className="text-left space-y-3 mb-8">
              {[
                'Companies House monitoring — live',
                'Deadline alerts via email',
                'Green / Amber / Red status updates',
                'Human support when required',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                  <div className="w-5 h-5 bg-[#00A86B] rounded-full flex items-center justify-center shrink-0">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  {f}
                </li>
              ))}
            </ul>

            <a
              href="/login"
              className="block w-full text-center py-4 bg-[#00A86B] text-white font-bold rounded-xl text-lg hover:bg-[#009960] transition-colors shadow-lg"
            >
              Protect My Company
            </a>
            <p className="text-slate-400 text-xs mt-3">Cancel any time. No setup fees. No contracts.</p>

            <div className="mt-10 flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-red-500 font-bold text-2xl">£150–£1,500</p>
                <p className="text-slate-500 text-xs mt-0.5">Companies House penalty</p>
              </div>
              <p className="text-slate-400 font-bold text-xl">vs</p>
              <div className="text-center">
                <p className="text-[#00A86B] font-bold text-2xl">£4.99</p>
                <p className="text-slate-500 text-xs mt-0.5">FineGuard per month</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          SCREEN 4 — HUMAN REASSURANCE
          "Nobody Gets Ignored"
      ══════════════════════════════════════════════════════ */}
      <section className="bg-white px-5 py-16 md:py-24">
        <div className="max-w-md mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0B1F3A] mb-8">Nobody Gets Ignored</h2>

          <div className="space-y-4 text-left mb-8">
            <div className="flex items-start gap-3">
              <span className="shrink-0 bg-[#00A86B] text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mt-0.5">GREEN</span>
              <p className="text-slate-600 text-sm leading-relaxed">You receive monthly reassurance. You know you&apos;re fine.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 bg-amber-400 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mt-0.5">AMBER</span>
              <p className="text-slate-600 text-sm leading-relaxed">We tell you exactly what&apos;s due and when. Guidance included.</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-widest mt-0.5">RED</span>
              <p className="text-slate-600 text-sm leading-relaxed">Alissa reviews your case every morning and contacts you directly.</p>
            </div>
          </div>

          <p className="text-slate-500 text-sm italic mb-1">
            &ldquo;Alissa reviews every Amber and Red case, every morning. No customer is ever left wondering what to do.&rdquo;
          </p>
          <p className="text-slate-400 text-xs mb-8">— George Thomas, Founder</p>

          <a
            href="/login"
            className="inline-block bg-[#0B1F3A] text-white font-bold px-8 py-4 rounded-xl hover:bg-[#1a3a6b] transition-colors"
          >
            Get Protected →
          </a>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS — below the fold
      ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white px-5 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">How FineGuard Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: 1, title: 'Check', desc: 'Enter your company name or number. Instant results, no sign-up.' },
              { n: 2, title: 'See Your Status', desc: 'Green, Amber or Red. Exactly where you stand today.' },
              { n: 3, title: 'Get Protected', desc: 'FineGuard monitors every deadline automatically for £4.99/month.' },
              { n: 4, title: 'Stay Stress-Free', desc: 'Alerts before anything is due. Zero surprises. Zero penalties.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="w-12 h-12 bg-[#00A86B] text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          TEAM — below the fold
      ══════════════════════════════════════════════════════ */}
      <section id="team" className="bg-[#F7F8FA] px-5 py-16 md:py-24">
        <div className="max-w-4xl mx-auto">
          <div className="max-w-xl mx-auto text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 leading-tight">
              We built FineGuard because our name is your peace of mind.
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              A team of compliance and technology professionals who believe UK directors deserve real support — not just software.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { name: 'George Thomas', title: 'Founder & CEO', bio: 'Built FineGuard after watching too many directors face avoidable penalties. George personally oversees every customer relationship.', bg: '#0B1F3A' },
              { name: 'Alissa Kent', title: 'Head of Customer Success', bio: 'Reviews every amber and red status every morning. No customer is ever left wondering what to do next.', bg: '#00A86B' },
              { name: 'Daygon White', title: 'Head of Technology', bio: 'Keeps the Companies House data connection live and the alerts flowing. Your deadlines are never missed on his watch.', bg: '#334155' },
            ].map(({ name, title, bio, bg }) => (
              <div key={name} className="text-center">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg ring-4 ring-white overflow-hidden"
                  style={{ background: bg }}
                >
                  <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                    {/* head */}
                    <circle cx="50" cy="38" r="22" fill="rgba(255,255,255,0.80)" />
                    {/* shoulders / torso */}
                    <path d="M4 120 C4 80 20 68 50 68 C80 68 96 80 96 120 Z" fill="rgba(255,255,255,0.80)" />
                  </svg>
                </div>
                <h3 className="font-bold text-slate-900 text-base">{name}</h3>
                <p className="text-[#00A86B] text-xs font-semibold mb-2">{title}</p>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{bio}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 pt-8 border-t border-slate-200 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span>FineGuard Limited</span><span>·</span>
            <span>Registered in England &amp; Wales</span><span>·</span>
            <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FAQ — below the fold
      ══════════════════════════════════════════════════════ */}
      <section id="faq" className="bg-white px-5 py-16 md:py-24">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-10">Common Questions</h2>
          <FaqItem q="Am I compliant right now?" a="Enter your company name or number above and we'll tell you within 30 seconds — no account needed. We pull live data directly from Companies House." />
          <FaqItem q="What happens if I miss a deadline?" a="Companies House issues automatic penalties for late accounts — from £150 for up to one month late, rising to £1,500 for more than six months. Confirmation statement failures can lead to prosecution. FineGuard ensures you never reach that point." />
          <FaqItem q="Can you monitor multiple companies?" a="Yes. Contact us to discuss multi-company monitoring. We'll arrange a plan that works for your portfolio." />
          <FaqItem q="Can my accountant use FineGuard?" a="Yes. Your accountant can be added as an authorised user. They'll see the same status and receive the same alerts." />
          <FaqItem q="What if my company is already overdue?" a="Don't panic. Enter your company name or number and we'll show you exactly where things stand. If you're overdue, a real member of our team will contact you directly to help you understand your options." />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0B1F3A] border-t border-white/10 px-5 py-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 bg-[#00A86B] rounded-md flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-white font-bold">FineGuard</span>
            </div>
            <p className="text-slate-400 text-xs">FineGuard Limited · Registered in England &amp; Wales</p>
            <p className="text-slate-500 text-xs mt-1">© {new Date().getFullYear()} FineGuard Ltd. All rights reserved.</p>
          </div>

          <div className="flex gap-8 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Product</p>
              <a href="#checker" className="text-slate-400 hover:text-white transition-colors text-xs">Check My Company</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors text-xs">Pricing</a>
              <a href="#faq" className="text-slate-400 hover:text-white transition-colors text-xs">FAQ</a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Company</p>
              <a href="#team" className="text-slate-400 hover:text-white transition-colors text-xs">About</a>
              <a href="mailto:hello@fineguard.co.uk" className="text-slate-400 hover:text-white transition-colors text-xs">Contact</a>
              <a href="/login" className="text-slate-400 hover:text-white transition-colors text-xs">Login</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
