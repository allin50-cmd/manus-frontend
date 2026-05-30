const TEAM = [
  {
    name: 'Daygon White',
    role: 'Founder & CEO',
    bio: 'Operator building AI-powered compliance and intake tools for UK professional services. Former legal sector technologist with a focus on automation and penalty prevention.',
    initials: 'DW',
    color: 'bg-[#5A4BFF]',
  },
  {
    name: 'Product Team',
    role: 'Engineering & Product',
    bio: 'A distributed team of engineers and product specialists focused on building reliable, secure, and compliant software for UK legal and financial professionals.',
    initials: 'PT',
    color: 'bg-[#C9A64A]',
  },
  {
    name: 'Compliance Advisory',
    role: 'Legal & Regulatory',
    bio: 'External legal advisors ensuring our products meet UK GDPR, SRA, and Companies House regulatory requirements for law firms and directors.',
    initials: 'CA',
    color: 'bg-cyan-400',
  },
];

export default function Team() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Meet the team</h1>
            <p className="text-xl text-gray-400 max-w-xl mx-auto">
              The people building compliance, intake, and document intelligence for UK professional services.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8 mb-16">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="bg-[#13151C] border border-white/10 rounded-xl p-8 flex flex-col items-center text-center hover:border-white/20 transition-colors"
              >
                <div className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center text-white text-xl font-bold mb-5`}>
                  {member.initials}
                </div>
                <h3 className="text-white font-bold text-lg mb-1">{member.name}</h3>
                <p className="text-[#5A4BFF] text-sm font-medium mb-4">{member.role}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#13151C] border border-white/10 rounded-xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-3">Join us</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-md mx-auto">
              We're a small, focused team building important tools for UK legal professionals. If that sounds like your kind of work, get in touch.
            </p>
            <a
              href="/contact"
              className="inline-block px-6 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Get in touch
            </a>
          </div>
        </div>
    </div>
  );
}
