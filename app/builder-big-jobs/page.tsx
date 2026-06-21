import Link from 'next/link'

export const metadata = {
  title: 'Builder Big Jobs — Planning-approved building leads',
  description: 'Get planning-approved extension, loft, renovation and refurbishment opportunities routed straight to your team.',
}

export default function BuilderBigJobsPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Nav */}
      <header className="px-6 py-5 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight">Builder Big Jobs</span>
        </div>
        <Link
          href="/intake/builder-big-jobs"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Get Builder Leads
        </Link>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="inline-block bg-orange-500/20 text-orange-400 text-xs font-semibold px-3 py-1 rounded-full mb-6 uppercase tracking-wide">
          Planning-approved leads
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Big building jobs,<br />not time-wasters.
        </h1>
        <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
          Get planning-approved extension, loft, renovation and refurbishment opportunities
          routed straight to your team — matched to your service area and job types.
        </p>
        <Link
          href="/intake/builder-big-jobs"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
        >
          Get Builder Leads →
        </Link>
        <p className="text-slate-500 text-sm mt-4">No commitment. Tell us what jobs you want.</p>
      </section>

      {/* Who it's for */}
      <section className="px-6 py-16 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">Built for serious contractors</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Extension specialists', icon: '🏠' },
              { title: 'Loft conversion companies', icon: '🏗️' },
              { title: 'Renovation firms', icon: '🔨' },
              { title: 'New build contractors', icon: '🏢' },
              { title: 'Structural work teams', icon: '⚙️' },
              { title: 'Commercial fit-out', icon: '🏪' },
            ].map((item) => (
              <div key={item.title} className="bg-slate-800 rounded-xl p-4 flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="font-medium text-slate-200">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Promise */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="bg-red-950/40 border border-red-900/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-red-400 mb-4">The problem</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              {[
                'Chasing weak leads that go nowhere',
                'Small jobs that don\'t cover your costs',
                'Tyre-kickers who aren\'t ready to commit',
                'Homeowners who haven\'t got planning yet',
                'Wasted site visits with no conversion',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-red-500 mt-0.5 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-orange-950/40 border border-orange-900/30 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-orange-400 mb-4">The Builder Big Jobs way</h3>
            <ul className="space-y-3 text-slate-300 text-sm">
              {[
                'Planning-approved opportunities only',
                'Matched to your minimum job size',
                'Filtered by your service area',
                'Scored by urgency and budget signals',
                'Routed to your team, not shared with 10 others',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-orange-400 mt-0.5 shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-16 bg-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { step: '1', title: 'Tell us what you want', body: 'Postcode areas, job types, minimum size. One form, two minutes.' },
              { step: '2', title: 'We match the leads', body: 'Planning activity, location, job type and budget are all checked before we route to you.' },
              { step: '3', title: 'You quote and convert', body: 'Receive qualified leads and follow up with confidence. No chasing warm air.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold mb-4">Ready for bigger jobs?</h2>
        <p className="text-slate-400 mb-8">Tell us what you're looking for. We'll start matching.</p>
        <Link
          href="/intake/builder-big-jobs"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
        >
          Get Builder Leads →
        </Link>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-800 text-center text-slate-500 text-xs">
        Builder Big Jobs · Part of the Ultratech group · hello@builderbigj obs.co.uk
      </footer>
    </div>
  )
}
