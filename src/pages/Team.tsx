import { Link } from 'wouter';
import { Users, Linkedin, Mail, ArrowRight, Globe, Award, Building2 } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  initials: string;
  color: string;
}

const leadership: TeamMember[] = [
  { name: 'James Whitfield', role: 'CEO & Co-Founder', bio: 'Former compliance director at a top-20 UK accountancy firm. 15 years in corporate governance.', initials: 'JW', color: 'from-blue-500 to-indigo-600' },
  { name: 'Sarah Chen', role: 'CTO & Co-Founder', bio: 'Previously led engineering at Revolut and Monzo. Expert in real-time data systems.', initials: 'SC', color: 'from-purple-500 to-pink-600' },
  { name: 'Michael Okonkwo', role: 'Head of Product', bio: 'Product leader from GoCardless and Xero. Making compliance accessible to every business.', initials: 'MO', color: 'from-emerald-500 to-teal-600' },
  { name: 'Emma Richardson', role: 'Head of Partnerships', bio: 'Built partner networks at Sage and FreeAgent. Connects firms across the UK.', initials: 'ER', color: 'from-amber-500 to-orange-600' },
];

const team: TeamMember[] = [
  { name: 'David Park', role: 'Senior Backend Engineer', bio: 'Companies House API integration specialist.', initials: 'DP', color: 'from-cyan-500 to-blue-600' },
  { name: 'Priya Sharma', role: 'Frontend Engineer', bio: 'Builds the dashboards clients rely on daily.', initials: 'PS', color: 'from-rose-500 to-red-600' },
  { name: 'Tom Blackwell', role: 'Compliance Analyst', bio: 'ACCA-qualified. Designs compliance rules and alert logic.', initials: 'TB', color: 'from-violet-500 to-purple-600' },
  { name: 'Aisha Fatima', role: 'Customer Success Lead', bio: 'Onboards partner firms for maximum value.', initials: 'AF', color: 'from-lime-500 to-green-600' },
  { name: 'Robert Liu', role: 'Security Engineer', bio: 'SOC 2 and ISO 27001 specialist.', initials: 'RL', color: 'from-sky-500 to-indigo-600' },
  { name: 'Hannah Moore', role: 'UX Designer', bio: 'Designs compliance experiences people enjoy using.', initials: 'HM', color: 'from-fuchsia-500 to-pink-600' },
];

function MemberCard({ member, large }: { member: TeamMember; large?: boolean }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.07] transition-colors group">
      <div className={`${large ? 'w-20 h-20 text-2xl' : 'w-14 h-14 text-lg'} rounded-2xl bg-gradient-to-br ${member.color} flex items-center justify-center text-white font-bold mb-4 shadow-lg`}>
        {member.initials}
      </div>
      <h3 className={`${large ? 'text-xl' : 'text-base'} font-bold text-white mb-0.5`}>{member.name}</h3>
      <p className={`${large ? 'text-sm' : 'text-xs'} text-[#5A4BFF] font-medium mb-3`}>{member.role}</p>
      <p className={`${large ? 'text-sm' : 'text-xs'} text-slate-400 leading-relaxed mb-4`}>{member.bio}</p>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"><Linkedin className="w-4 h-4" /></span>
        <span className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"><Mail className="w-4 h-4" /></span>
      </div>
    </div>
  );
}

export default function Team() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5A4BFF]/10 border border-[#5A4BFF]/20 text-[#5A4BFF] text-sm font-medium mb-8">
            <Users className="w-4 h-4" /> Our Team
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
            The people behind <span className="text-[#5A4BFF]">FineGuard</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A team of compliance experts, engineers, and product builders working to eliminate filing failures for every UK company.
          </p>
        </div>
      </section>

      {/* Leadership */}
      <section className="pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Award className="w-6 h-6 text-[#5A4BFF]" /> Leadership
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {leadership.map((m) => <MemberCard key={m.name} member={m} large />)}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white/[0.02] border-y border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
            <Building2 className="w-6 h-6 text-[#5A4BFF]" /> Engineering & Operations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((m) => <MemberCard key={m.name} member={m} />)}
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-[#5A4BFF]/10 to-indigo-600/10 border border-[#5A4BFF]/20 rounded-3xl p-8 sm:p-12 text-center">
            <Globe className="w-12 h-12 text-[#5A4BFF] mx-auto mb-6" />
            <h2 className="text-3xl font-black text-white mb-4">Join Our Team</h2>
            <p className="text-lg text-slate-300 mb-8 max-w-xl mx-auto">
              We're always looking for talented people who care about making compliance simpler. Fully remote across the UK.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {['Remote-First', 'Equity Options', '30 Days Holiday', 'Learning Budget', 'Flexible Hours'].map((perk) => (
                <span key={perk} className="px-3 py-1.5 bg-white/10 border border-white/10 rounded-full text-sm text-slate-300 font-medium">{perk}</span>
              ))}
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 px-8 py-4 bg-[#5A4BFF] text-white rounded-full font-bold hover:bg-[#6B5BFF] transition-colors shadow-lg shadow-[#5A4BFF]/25">
              View Open Positions <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
