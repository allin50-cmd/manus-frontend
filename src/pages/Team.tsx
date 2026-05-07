import Nav from '@/components/Nav';
import { useLocation } from 'wouter';
import { useEffect } from 'react';

interface TeamMember {
  initials: string;
  role: string;
  description: string;
  color: string;
  bg: string;
}

const members: TeamMember[] = [
  {
    initials: 'JR',
    role: 'Founder & CEO',
    description: 'Driving product vision and strategy across the VaultLine suite.',
    color: '#C9A64A',
    bg: 'rgba(201,166,74,0.15)',
  },
  {
    initials: 'AK',
    role: 'Head of Engineering',
    description: 'Leading architecture, security infrastructure, and platform reliability.',
    color: '#22D3EE',
    bg: 'rgba(34,211,238,0.15)',
  },
  {
    initials: 'SP',
    role: 'Compliance Lead',
    description: 'Ensuring every product meets SRA, FCA, and Companies House requirements.',
    color: '#5A4BFF',
    bg: 'rgba(90,75,255,0.15)',
  },
];

export default function Team() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    document.title = 'Team — VaultLine Suite';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <Nav />
      <div className="pt-14">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            Our Team
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed mb-16 max-w-2xl">
            We're a small, focused team of engineers, lawyers, and compliance specialists
            who believe great software and rigorous regulation aren't mutually exclusive.
            Everyone here ships code, talks to customers, and cares deeply about getting
            the details right.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
            {members.map((m) => (
              <div
                key={m.role}
                className="rounded-2xl p-6 flex flex-col items-center text-center"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Initials avatar */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-4 shrink-0"
                  style={{ background: m.bg, color: m.color }}
                >
                  {m.initials}
                </div>

                <h2 className="text-white font-semibold text-base mb-1">{m.role}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{m.description}</p>
              </div>
            ))}
          </div>

          {/* We're hiring CTA */}
          <div
            className="rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
            style={{
              background: 'rgba(90,75,255,0.08)',
              border: '1px solid rgba(90,75,255,0.25)',
            }}
          >
            <div>
              <h3 className="text-white font-bold text-xl mb-1">We're hiring</h3>
              <p className="text-gray-400 text-sm">
                Interested in joining a team building compliance tools that actually work?
                Get in touch — we'd love to hear from you.
              </p>
            </div>
            <button
              onClick={() => setLocation('/book-demo')}
              className="shrink-0 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Get in touch
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
