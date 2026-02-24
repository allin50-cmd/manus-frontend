import React from 'react';
import { useLocation } from 'wouter';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';
import { cn } from '@/lib/utils';

interface TeamMember {
  initials: string;
  name: string;
  role: string;
  bio: string;
  gradient: string;
}

const TEAM: TeamMember[] = [
  {
    initials: 'SH',
    name: 'Sophie Harrison',
    role: 'Chief Executive Officer',
    bio: 'Former Head of Legal Technology at a Magic Circle firm. 12 years building compliance systems for FTSE 100 legal departments before founding VaultLine.',
    gradient: 'from-[#5A4BFF] to-[#9B8FFF]',
  },
  {
    initials: 'JM',
    name: 'James Morley',
    role: 'Chief Technology Officer',
    bio: 'Ex-AWS infrastructure engineer. Led the architecture of VaultLine\'s WORM storage layer and real-time compliance pipeline. Open-source contributor to several legal tech standards.',
    gradient: 'from-cyan-500 to-blue-600',
  },
  {
    initials: 'RP',
    name: 'Rachel Patel',
    role: 'Head of Compliance',
    bio: 'Qualified solicitor with a decade of SRA and FCA regulatory practice. Rachel ensures every VaultLine product maps precisely to UK legal and regulatory obligations.',
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    initials: 'TN',
    name: 'Tom Nakamura',
    role: 'Lead Engineer',
    bio: 'Full-stack engineer specialising in secure document processing and AI integration. Architect of the UltAi document analysis pipeline and the FineGuard monitoring engine.',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    initials: 'AK',
    name: 'Amara Kone',
    role: 'Product Designer',
    bio: 'Brings 8 years of enterprise UX experience to VaultLine. Amara\'s research-led design process ensures our products are intuitive for fee earners and compliance managers alike.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    initials: 'DW',
    name: 'Daniel Walsh',
    role: 'Customer Success Lead',
    bio: 'Former practice manager at a multi-office regional firm. Daniel\'s on-the-ground experience informs our onboarding process and ensures every client realises full value quickly.',
    gradient: 'from-yellow-500 to-amber-500',
  },
];

export default function Team() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <LandingNav theme="dark" />

      {/* Hero */}
      <section className="pt-32 pb-16 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-6">Meet the team</h1>
          <p className="text-xl text-gray-400">
            We're lawyers, engineers, designers, and compliance specialists united by a single mission:
            making compliance effortless for the businesses that need it most.
          </p>
        </div>
      </section>

      {/* Team grid */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-5',
                    member.gradient
                  )}
                >
                  <span className="text-white font-bold text-xl">{member.initials}</span>
                </div>
                <h3 className="font-semibold text-white text-lg mb-0.5">{member.name}</h3>
                <p className="text-sm text-[#7B6FFF] font-medium mb-3">{member.role}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-white/5 border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-3">Join our team</h2>
            <p className="text-gray-400 mb-6">
              We're growing and always looking for exceptional people who care deeply about compliance,
              security, and building software that genuinely helps professionals do their best work.
            </p>
            <Button
              onClick={() => setLocation('/book-demo')}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-3"
            >
              Get in Touch
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <LandingFooter theme="dark" />
    </div>
  );
}
