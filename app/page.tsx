import type { Metadata } from 'next'
import Image from 'next/image'
import CompanyChecker from '@/components/CompanyChecker'

export const metadata: Metadata = {
  title: 'FineGuard — We Handle the Deadlines. You Handle the Business.',
  description:
    'FineGuard monitors your Companies House obligations so UK directors never miss a deadline or face an avoidable penalty.',
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="border-b border-slate-200 first:border-t py-5 group">
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

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── ANNOUNCEMENT BANNER ── */}
      <div className="bg-amber-400 text-[#0B1F3A] text-center text-xs font-bold uppercase tracking-widest py-2 px-4">
        Stop worrying about Companies House penalties
      </div>

      {/* ── HEADER ── */}
      <header className="bg-[#0B1F3A] px-6 lg:px-12 py-4 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <a href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-[#00A86B] rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FineGuard</span>
        </a>

        <nav className="hidden lg:flex items-center gap-6">
          <a href="#checker" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Check My Company</a>
          <a href="#how-it-works" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">How It Works</a>
          <a href="#pricing" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">Pricing</a>
          <a href="#team" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">About</a>
          <a href="#faq" className="text-slate-300 hover:text-white text-sm font-medium transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="/login" className="text-slate-500 hover:text-slate-300 text-xs transition-colors hidden sm:block">Sign in</a>
          <a href="/check" className="bg-[#00A86B] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#009960] transition-colors whitespace-nowrap">
            Get Protected
          </a>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════════════════════ */}
      <section id="checker" className="bg-[#0B1F3A] px-6 lg:px-12 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              We handle the deadlines.<br />
              <span className="text-[#00A86B]">You handle the business.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-lg">
              FineGuard monitors your Companies House obligations so UK directors never miss a deadline or face an avoidable penalty.
            </p>

            <CompanyChecker />

            <div className="mt-6 flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-[#00B67A]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <span className="text-white font-semibold text-sm">Excellent</span>
              <span className="text-slate-400 text-sm">4.8 out of 5 · 5 stars on Trustpilot</span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-md rounded-2xl border-2 border-white shadow-2xl overflow-hidden">
              <Image
                src="/illustrations/check-my-company.png"
                alt="Check your company status instantly"
                width={768}
                height={512}
                className="w-full h-auto block"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 2 — DIRECTOR ANXIETY
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="w-full max-w-md rounded-2xl border-2 border-white shadow-xl overflow-hidden">
              <Image
                src="/illustrations/director-anxiety.png"
                alt="Director stressed about Companies House deadlines"
                width={768}
                height={512}
                className="w-full h-auto block"
              />
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-red-500 rounded-full" />
              The risk of doing nothing
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
              Missed deadlines cost directors <span className="text-red-600">£150–£1,500</span> in avoidable penalties.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              Companies House issues automatic fines for late accounts and confirmation statements. Most directors only find out when the penalty letter arrives. By then, the damage is done.
            </p>
            <div className="space-y-3">
              {[
                'Late accounts: £150 to £1,500 depending on delay',
                'Confirmation statement failures can lead to prosecution',
                'Repeat offences trigger strike-off proceedings',
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 3 — BENEFIT BOXES
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F7F8FA] px-6 lg:px-12 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">The obvious £4.99 decision</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Would you risk a £150–£1,500 penalty to save £4.99/month? We didn&apos;t think so.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                title: 'Avoid £150–£3,045 in penalties',
                desc: 'Automatic fines for late filings. FineGuard makes sure you never reach that point.',
              },
              {
                icon: <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
                title: "We monitor so you don't have to",
                desc: 'Every Companies House deadline tracked for your company, around the clock.',
              },
              {
                icon: <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
                title: 'We alert you in plenty of time',
                desc: 'Email alerts weeks before any deadline. Always time to act.',
              },
              {
                icon: <svg className="w-6 h-6 text-[#00A86B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                title: 'Human support when you need it',
                desc: 'Real people review every amber and red status. Never left to figure it out alone.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-11 h-11 bg-[#E6F7F1] rounded-xl flex items-center justify-center mb-4">{icon}</div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 4 — HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="bg-white px-6 lg:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">How FineGuard Works</h2>
            <p className="text-slate-500 max-w-lg mx-auto">From your first check to complete peace of mind — in four steps.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: 1, title: 'Check', desc: 'Enter your company number. Instant results, no sign-up.', img: '/illustrations/step-1-check.png', alt: 'Enter company number to check status' },
              { n: 2, title: 'See Your Status', desc: 'Green, Amber or Red. Exactly where you stand today.', img: '/illustrations/step-2-status.png', alt: 'View your Green Amber Red compliance status' },
              { n: 3, title: 'Get Protected', desc: 'FineGuard monitors every deadline automatically.', img: '/illustrations/step-3-monitors.png', alt: 'FineGuard monitors your deadlines' },
              { n: 4, title: 'Stay Stress-Free', desc: 'Alerts before anything is due. Zero surprises.', img: '/illustrations/step-4-worry-free.png', alt: 'Peace of mind — no more compliance worry' },
            ].map(({ n, title, desc, img, alt }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-full mb-5 rounded-2xl border-2 border-white shadow-xl overflow-hidden">
                  <Image src={img} alt={alt} width={480} height={320} className="w-full h-auto block" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0B1F3A] text-white text-base font-bold flex items-center justify-center mb-3 shrink-0">
                  {n}
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed max-w-[180px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 5 — NOBODY GETS IGNORED
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#F7F8FA] px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
              Nobody Gets Ignored
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-8">
              Every customer receives the right level of attention — automatically. Whether you&apos;re green, amber, red or critical, there is a defined response waiting for you.
            </p>
            <div className="space-y-4">
              {[
                { color: 'bg-[#00A86B]', label: 'GREEN', desc: "Monthly confirmation. You know you're fine without checking." },
                { color: 'bg-amber-400', label: 'AMBER', desc: "We tell you exactly what's due and when. Guidance included." },
                { color: 'bg-red-500', label: 'RED', desc: 'A real person reviews your situation and contacts you directly.' },
                { color: 'bg-[#0B1F3A]', label: 'CRITICAL', desc: 'Immediate escalation to our senior team. We act on your behalf.' },
              ].map(({ color, label, desc }) => (
                <div key={label} className="flex items-start gap-4">
                  <span className={`shrink-0 ${color} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mt-0.5`}>{label}</span>
                  <p className="text-slate-600 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-2xl border-2 border-white shadow-xl overflow-hidden">
              <Image
                src="/illustrations/nobody-gets-ignored.png"
                alt="Every customer status gets the right response — Green, Amber, Red or Critical"
                width={768}
                height={512}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 6 — HUMAN SUPPORT
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-white px-6 lg:px-12 py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="flex justify-center">
            <div className="w-full max-w-md rounded-2xl border-2 border-white shadow-xl overflow-hidden">
              <Image
                src="/illustrations/human-intervention.png"
                alt="Human support team ready to help"
                width={768}
                height={512}
                className="w-full h-auto block"
              />
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 bg-[#E6F7F1] text-[#00A86B] text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-[#00A86B] rounded-full" />
              Real People. Real Support.
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-5">
              When your company enters Amber or Red status, a real person reviews your case.
            </h2>
            <p className="text-slate-600 text-base leading-relaxed mb-6">
              No chatbots. No automated replies. Alissa and the customer success team personally review every amber and red status every morning. If you need to talk, there&apos;s a real person on the other end.
            </p>
            <a href="mailto:hello@fineguard.co.uk" className="inline-flex items-center gap-2 text-[#00A86B] font-semibold text-sm hover:underline">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              hello@fineguard.co.uk
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 7 — TEAM
      ═══════════════════════════════════════════════════════════ */}
      <section id="team" className="bg-[#F7F8FA] px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 leading-tight">
              We built FineGuard because<br />our name is your peace of mind.
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              A team of compliance and technology professionals who believe UK directors deserve real support — not just software. Every member personally answers for the service we provide.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { initials: 'GT', name: 'George', title: 'Founder & CEO', bio: 'Built FineGuard after watching too many directors face avoidable penalties. George personally oversees every customer relationship.', color: 'bg-[#0B1F3A]' },
              { initials: 'A', name: 'Alissa', title: 'Head of Customer Success', bio: 'Reviews every amber and red status every morning. No customer is ever left wondering what to do next.', color: 'bg-[#00A86B]' },
              { initials: 'D', name: 'Daygon', title: 'Head of Technology', bio: 'Keeps the Companies House data connection live and the alerts flowing. Your deadlines are never missed on his watch.', color: 'bg-slate-600' },
            ].map(({ initials, name, title, bio, color }) => (
              <div key={name} className="text-center">
                <div className={`w-28 h-28 rounded-full ${color} text-white text-2xl font-bold flex items-center justify-center mx-auto mb-4 shadow-md`}>
                  {initials}
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{name}</h3>
                <p className="text-[#00A86B] text-sm font-semibold mb-2">{title}</p>
                <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">{bio}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-10 border-t border-slate-200 flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span>FineGuard Limited</span><span>·</span>
            <span>Registered in England &amp; Wales</span><span>·</span>
            <a href="mailto:hello@fineguard.co.uk" className="text-[#00A86B] hover:underline">hello@fineguard.co.uk</a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 8 — STATS
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0B1F3A] px-6 lg:px-12 py-16">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '450+', label: 'Companies Monitored' },
            { value: '98.7%', label: 'On-Time Filing Rate' },
            { value: '£1.2M+', label: 'In Penalties Avoided' },
            { value: '5/5', label: 'Customer Satisfaction' },
          ].map(({ value, label }) => (
            <div key={label}>
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">{value}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 9 — PRICING
      ═══════════════════════════════════════════════════════════ */}
      <section id="pricing" className="bg-white px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 leading-tight">
              Protect Your Company For Less Than A Coffee Per Week
            </h2>
            <p className="text-slate-500 text-lg mb-8 leading-relaxed">
              Avoid missed deadlines, unnecessary penalties and compliance anxiety.
            </p>

            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-center">
                <p className="text-red-600 font-bold text-lg">£150–£1,500</p>
                <p className="text-red-500 text-xs font-medium">Companies House penalties</p>
              </div>
              <span className="text-slate-400 font-bold text-xl">vs</span>
              <div className="bg-[#E6F7F1] border border-[#00A86B] rounded-xl px-5 py-3 text-center">
                <p className="text-[#00A86B] font-bold text-lg">£4.99/month</p>
                <p className="text-[#00A86B] text-xs font-medium">FineGuard protection</p>
              </div>
            </div>

            <div className="border-2 border-[#00A86B] rounded-2xl p-7 bg-[#E6F7F1] relative">
              <div className="absolute -top-3 left-6">
                <span className="bg-[#00A86B] text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
                  FineGuard Protection
                </span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-slate-900">£4.99</span>
                <span className="text-slate-400">/month</span>
              </div>
              <p className="text-slate-500 text-sm mb-5">Less than a cup of coffee. Worth more than you know.</p>
              <ul className="space-y-2.5 mb-6">
                {[
                  'Companies House monitoring — live',
                  'Green / Amber / Red status alerts',
                  'Deadline reminders via email at 30, 14 & 7 days',
                  'Human support when required',
                  'Peace of mind, guaranteed',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-slate-700 font-medium">
                    <div className="w-5 h-5 bg-[#00A86B] rounded-full flex items-center justify-center shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              <a href="/check" className="block w-full text-center py-3.5 bg-[#00A86B] text-white font-bold rounded-xl hover:bg-[#009960] transition-colors">
                Protect My Company
              </a>
              <p className="text-center text-slate-400 text-xs mt-3">Cancel any time. No contracts. No setup fees.</p>
            </div>

            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-900 font-bold text-sm mb-1">Would you risk a £150–£1,500 penalty to save £4.99/month?</p>
              <p className="text-amber-700 text-sm">We didn&apos;t think so. That&apos;s why FineGuard exists.</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border-2 border-white shadow-xl overflow-hidden">
              <Image
                src="/illustrations/fineguard-cover.png"
                alt="FineGuard protection covering your company"
                width={768}
                height={512}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 10 — FAQ
      ═══════════════════════════════════════════════════════════ */}
      <section id="faq" className="bg-[#F7F8FA] px-6 lg:px-12 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">Common Questions</h2>
          </div>
          <FaqItem q="Am I compliant right now?" a="Enter your company number above and we'll tell you within 30 seconds — no account needed. We pull live data directly from Companies House." />
          <FaqItem q="What happens if I miss a deadline?" a="Companies House issues automatic penalties for late accounts — from £150 for up to one month late, rising to £1,500 for more than six months. Confirmation statement failures can lead to prosecution. FineGuard ensures you never reach that point." />
          <FaqItem q="Can you monitor multiple companies?" a="Yes. Contact us to discuss multi-company monitoring. We'll arrange a plan that works for your portfolio." />
          <FaqItem q="Can my accountant use FineGuard?" a="Yes. Your accountant can be added as an authorised user. They'll see the same status and receive the same alerts." />
          <FaqItem q="What if my company is already overdue?" a="Don't panic. Enter your company number and we'll show you exactly where things stand. If you're overdue, a real member of our team will contact you directly to help you understand your options." />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          SECTION 11 — FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="bg-[#0B1F3A] px-6 lg:px-12 py-24">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-5">
              We&apos;ve got it covered.
            </h2>
            <p className="text-slate-300 text-lg leading-relaxed mb-8">
              Check your company status in 30 seconds. Then let FineGuard handle everything that comes next.
            </p>
            <a
              href="#checker"
              className="inline-block bg-[#00A86B] text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-[#009960] transition-colors shadow-xl"
            >
              Check My Company
            </a>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-2xl border-2 border-white shadow-2xl overflow-hidden">
              <Image
                src="/illustrations/peace-of-mind.png"
                alt="We've got it covered — FineGuard peace of mind"
                width={768}
                height={512}
                className="w-full h-auto block"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0B1F3A] border-t border-white/10 px-6 lg:px-12 py-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 bg-[#00A86B] rounded-md flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="text-white font-bold">FineGuard</span>
            </div>
            <p className="text-slate-400 text-sm">Registered in England &amp; Wales</p>
            <p className="text-slate-500 text-xs mt-1">© {new Date().getFullYear()} FineGuard Ltd. All rights reserved.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 sm:gap-12 text-sm">
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Product</p>
              <a href="#checker" className="text-slate-400 hover:text-white transition-colors">Check My Company</a>
              <a href="#how-it-works" className="text-slate-400 hover:text-white transition-colors">How It Works</a>
              <a href="#pricing" className="text-slate-400 hover:text-white transition-colors">Pricing</a>
              <a href="#faq" className="text-slate-400 hover:text-white transition-colors">FAQ</a>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-slate-500 text-xs uppercase tracking-widest font-semibold mb-1">Company</p>
              <a href="#team" className="text-slate-400 hover:text-white transition-colors">About</a>
              <a href="mailto:hello@fineguard.co.uk" className="text-slate-400 hover:text-white transition-colors">Contact</a>
              <a href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
