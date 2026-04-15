const testimonials = [
  {
    quote:
      'FineGuard Pro caught a filing issue we would have missed entirely. Saved us from a £500 penalty and a lot of stress.',
    author: 'Laura M.',
    role: 'Business Owner',
    company: 'Bright Start Designs Ltd',
    initials: 'LM',
  },
  {
    quote:
      'As an accountant managing 30+ clients, FineGuard Pro has become essential. The early alerts give us plenty of time to act.',
    author: 'James K.',
    role: 'Chartered Accountant',
    company: 'KP & Partners LLP',
    initials: 'JK',
  },
  {
    quote:
      'Simple setup, reliable alerts. I no longer worry about forgetting our confirmation statement. Worth every penny.',
    author: 'Priya S.',
    role: 'Co-founder',
    company: 'Stackleaf Technologies Ltd',
    initials: 'PS',
  },
];

export function TestimonialBlock() {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">Trusted by UK businesses</p>
        <h2 className="text-3xl font-bold text-slate-900">What our customers say</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map(({ quote, author, role, company, initials }) => (
          <div key={author} className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col gap-4">
            <p className="text-amber-400 text-base tracking-widest">★★★★★</p>
            <p className="text-slate-700 text-sm leading-relaxed italic flex-1">&ldquo;{quote}&rdquo;</p>
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-blue-700">{initials}</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{author}</p>
                <p className="text-xs text-slate-500">
                  {role} · {company}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
