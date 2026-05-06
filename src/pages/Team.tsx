import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Mail } from 'lucide-react';

const teamMembers = [
  {
    initials: 'SC',
    name: 'Sarah Chen',
    title: 'Chief Executive Officer',
    bio: 'Sarah led enterprise compliance transformation at Barclays before co-founding VaultLine in 2018.',
  },
  {
    initials: 'JO',
    name: 'James Okafor',
    title: 'Chief Technology Officer',
    bio: 'James brings 15 years of distributed-systems experience from AWS and Goldman Sachs Technology.',
  },
  {
    initials: 'EW',
    name: 'Emma Williams',
    title: 'Chief Product Officer',
    bio: 'Emma previously led product at Encompass Corporation and holds an MBA from London Business School.',
  },
  {
    initials: 'RP',
    name: 'Ravi Patel',
    title: 'Head of Security',
    bio: 'Ravi is a CISSP and former GCHQ-affiliated security researcher specialising in financial-sector threat intelligence.',
  },
  {
    initials: 'LS',
    name: 'Laura Schmidt',
    title: 'Head of Sales',
    bio: 'Laura spent a decade growing enterprise SaaS revenue across EMEA for Salesforce and Workiva.',
  },
  {
    initials: 'TB',
    name: 'Tom Bradley',
    title: 'Head of Engineering',
    bio: 'Tom built and scaled the engineering function at a RegTech unicorn before joining VaultLine in 2021.',
  },
];

const advisors = [
  {
    initials: 'MH',
    name: 'Margaret Hartley',
    title: 'Former FCA Director, Independent Advisor',
  },
  {
    initials: 'DL',
    name: 'David Loughrey',
    title: 'Partner, Advent International — Board Observer',
  },
];

export default function Team() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-16">
          <Users className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-white mb-4">Meet the Team</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            We are a tight-knit group of engineers, product designers, and compliance specialists
            united by the belief that security should never slow a business down.
          </p>
        </div>

        {/* Team grid — 2 columns × 3 rows */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
          {teamMembers.map(({ initials, name, title, bio }) => (
            <div
              key={name}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-5 items-start"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-[#5A4BFF]/20 border border-[#5A4BFF]/40 flex items-center justify-center">
                <span className="text-[#5A4BFF] font-bold text-lg">{initials}</span>
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">{name}</h3>
                <div className="flex items-center gap-1 text-[#5A4BFF] text-sm mb-2">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{title}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{bio}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Advisors */}
        <div className="mb-20">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Advisory Board</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {advisors.map(({ initials, name, title }) => (
              <div
                key={name}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 flex gap-4 items-center"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-gray-300 font-semibold">{initials}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{name}</p>
                  <p className="text-gray-400 text-sm">{title}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Join the team CTA */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
          <Mail className="w-10 h-10 text-[#5A4BFF] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-3">Join the team</h2>
          <p className="text-gray-400 mb-6 max-w-lg mx-auto">
            We are always looking for curious, driven people who want to make compliance
            infrastructure that enterprises can genuinely rely on.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            Get in touch
          </Button>
          <p className="text-gray-500 text-sm mt-4">
            Or browse open roles at{' '}
            <Link href="/book-demo" className="text-[#5A4BFF] hover:underline">
              careers@vaultline.io
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
