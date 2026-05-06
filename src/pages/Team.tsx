import { ExternalLink, ArrowRight, Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';

const TEAM = [
  {
    name: 'Alexandra Chen',
    role: 'CEO & Co-founder',
    bio: 'Ex-barrister of 12 years at Gray\'s Inn; led landmark commercial litigation before co-founding VaultLine.',
    initials: 'AC',
    color: 'from-[#5A4BFF] to-[#7C3AED]',
  },
  {
    name: 'James Okafor',
    role: 'CTO & Co-founder',
    bio: 'Former Google Staff Engineer and ML specialist who built large-scale NLP systems before turning his focus to legal AI.',
    initials: 'JO',
    color: 'from-[#0EA5E9] to-[#6366F1]',
  },
  {
    name: 'Sarah Mitchell',
    role: 'Chief Legal Officer',
    bio: 'Former solicitor at a top-100 firm with a decade of expertise in financial regulation and data protection law.',
    initials: 'SM',
    color: 'from-[#10B981] to-[#0EA5E9]',
  },
  {
    name: 'Ravi Patel',
    role: 'Head of Product',
    bio: 'Legal tech veteran with 8 years building practitioner-focused software across litigation, conveyancing, and compliance.',
    initials: 'RP',
    color: 'from-[#F59E0B] to-[#EF4444]',
  },
  {
    name: 'Emma Thornton',
    role: 'Head of Security',
    bio: 'Former GCHQ contractor and CISO who architected security frameworks for critical national infrastructure.',
    initials: 'ET',
    color: 'from-[#EC4899] to-[#8B5CF6]',
  },
  {
    name: 'Daniel Walsh',
    role: 'Head of Growth',
    bio: 'Ex-LegalZoom commercial director with 10 years scaling legal SaaS businesses across the UK and US markets.',
    initials: 'DW',
    color: 'from-[#14B8A6] to-[#3B82F6]',
  },
];

const ADVISORS = [
  {
    name: 'Rt. Hon. Sir Geoffrey Patel KC',
    title: 'Former Court of Appeal Judge; Legal AI Ethics Advisor',
  },
  {
    name: 'Professor Diana Ashworth',
    title: 'Chair of Legal Technology, University of Cambridge',
  },
  {
    name: 'Marcus Halliday',
    title: 'Partner, Halliday Ventures — B2B SaaS & LegalTech investor',
  },
];

function TeamCard({ member }: { member: (typeof TEAM)[0] }) {
  return (
    <div className="group flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#5A4BFF]/50 hover:bg-white/[0.07] transition-all duration-200">
      {/* Avatar */}
      <div className="mb-5">
        <div
          className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center shadow-lg`}
        >
          <span className="text-xl font-bold text-white tracking-wide">{member.initials}</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-white leading-tight">{member.name}</h3>
        <p className="text-[#8B82FF] text-sm font-medium mt-0.5 mb-3">{member.role}</p>
        <p className="text-gray-400 text-sm leading-relaxed">{member.bio}</p>
      </div>

      {/* LinkedIn icon */}
      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-xs text-gray-600 uppercase tracking-wider font-medium">
          Connect
        </span>
        <button
          aria-label={`LinkedIn profile of ${member.name}`}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-[#0A66C2]/20 border border-white/10 hover:border-[#0A66C2]/40 flex items-center justify-center transition-all duration-150"
        >
          <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-[#0A66C2]" />
        </button>
      </div>
    </div>
  );
}

export default function Team() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0F1014] text-white">

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-block rounded-full border border-[#5A4BFF]/40 bg-[#5A4BFF]/10 px-4 py-1 text-sm text-[#8B82FF] font-medium mb-6">
          The people behind the platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold mb-5 tracking-tight leading-tight">
          Meet the Team
        </h1>
        <p className="text-xl text-gray-400 leading-relaxed">
          Ex-barristers, engineers, and legal tech veterans — united by a conviction that the legal
          industry deserves far better software.
        </p>
      </section>

      {/* Team grid */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {TEAM.map((member) => (
            <TeamCard key={member.name} member={member} />
          ))}
        </div>
      </section>

      {/* Join the team */}
      <section className="border-t border-white/10 bg-white/[0.02] py-20 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          <div className="max-w-lg">
            <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 border border-green-500/20 px-3 py-1 text-xs text-green-400 font-semibold uppercase tracking-wider mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              We're Hiring
            </div>
            <h2 className="text-3xl font-bold mb-3">Join the Team</h2>
            <p className="text-gray-400 leading-relaxed">
              We're looking for people who are as obsessed with legal technology as we are. Whether
              you're an engineer, a lawyer, a designer, or a growth specialist — if you want to
              reshape how the legal industry works, we'd love to hear from you.
            </p>
          </div>
          <div className="shrink-0">
            <Button
              onClick={() => navigate('/book-demo')}
              className="bg-[#5A4BFF] hover:bg-[#4a3bef] text-white px-8 py-3 text-base font-semibold shadow-lg shadow-[#5A4BFF]/30 inline-flex items-center gap-2"
            >
              Get in touch
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Advisory board */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">Advisory Board</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              Guided by some of the most respected voices in law, academia, and technology.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {ADVISORS.map((advisor) => (
              <div
                key={advisor.name}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 flex flex-col gap-3 hover:border-[#5A4BFF]/30 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-[#5A4BFF]/15 flex items-center justify-center">
                  <Star className="w-4 h-4 text-[#5A4BFF]" />
                </div>
                <h3 className="font-semibold text-white text-sm leading-snug">{advisor.name}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{advisor.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="relative overflow-hidden border-t border-white/10 bg-gradient-to-br from-[#5A4BFF]/10 via-transparent to-transparent py-20 px-4 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-[#5A4BFF]/10 blur-3xl rounded-full" />
        </div>
        <div className="relative max-w-lg mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to meet us properly?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Book a demo and speak directly with one of our founders or product specialists.
          </p>
          <Button
            onClick={() => navigate('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#4a3bef] text-white px-10 py-3 text-base font-semibold shadow-lg shadow-[#5A4BFF]/30"
          >
            Book a Demo
          </Button>
        </div>
      </section>
    </div>
  );
}
