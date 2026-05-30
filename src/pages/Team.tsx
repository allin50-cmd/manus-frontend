import { Link } from 'wouter';
import { Phone, Mail } from 'lucide-react';

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  phone?: string;
  email?: string;
  initials: string;
  accentColor: string;
}

function TeamMember({ name, role, bio, phone, email, initials, accentColor }: TeamMemberProps) {
  return (
    <div className="bg-[#13151C] border border-[#2A2D3A] rounded-xl p-8">
      <div className={`w-16 h-16 rounded-full ${accentColor} flex items-center justify-center text-xl font-bold text-white mb-6`}>
        {initials}
      </div>
      <h3 className="text-xl font-bold text-white mb-1">{name}</h3>
      <p className="text-sm text-[#5A4BFF] font-medium mb-4">{role}</p>
      <p className="text-sm text-gray-400 leading-relaxed mb-6">{bio}</p>
      <div className="space-y-2">
        {phone && (
          <a
            href={`tel:${phone.replace(/\s/g, '')}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <Phone className="w-4 h-4" />
            {phone}
          </a>
        )}
        {email && (
          <a
            href={`mailto:${email}`}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <Mail className="w-4 h-4" />
            {email}
          </a>
        )}
      </div>
    </div>
  );
}

export default function Team() {
  return (
    <div className="bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014] min-h-full">
      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          The team behind UltAi Group
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          We're a small, focused team passionate about making compliance and legal automation accessible to every UK professional.
        </p>
      </section>

      {/* Founders */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 className="text-2xl font-bold text-white mb-8">Founders</h2>
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          <TeamMember
            name="Daygon White"
            role="Founder &amp; CEO — Operations &amp; Strategy"
            bio="Daygon founded Accuracy Developments Ltd with the goal of eliminating compliance failures for UK businesses through technology. With a background in operations and business process automation, he leads product vision and go-to-market strategy."
            phone="+44 7825 600471"
            email="daygon@ultai.group"
            initials="DW"
            accentColor="bg-[#5A4BFF]"
          />
          <TeamMember
            name="Alex Mercer"
            role="CTO — Engineering &amp; Infrastructure"
            bio="Alex leads the engineering team, responsible for the architecture behind FineGuard's real-time Companies House integration, VaultLine's encryption layer, and UltAi's AI pipeline. 10+ years building production SaaS systems."
            initials="AM"
            accentColor="bg-[#C9A64A]"
          />
        </div>

        <h2 className="text-2xl font-bold text-white mb-8">Team</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TeamMember
            name="Sarah Okafor"
            role="Head of Compliance"
            bio="Sarah ensures our products remain aligned with UK regulatory requirements. Former compliance officer at a top-100 law firm, she brings practical expertise in GDPR, SRA regulations, and Companies Act obligations."
            initials="SO"
            accentColor="bg-cyan-500"
          />
          <TeamMember
            name="James Liu"
            role="Lead Engineer"
            bio="James builds and maintains the core platform, from API integrations with Companies House to the real-time alerting system powering FineGuard. Specialist in TypeScript, PostgreSQL, and distributed systems."
            initials="JL"
            accentColor="bg-purple-600"
          />
          <div className="bg-[#13151C] border border-dashed border-[#2A2D3A] rounded-xl p-8 flex flex-col items-center justify-center text-center">
            <p className="text-gray-500 text-sm mb-3">We're hiring</p>
            <p className="text-gray-600 text-xs max-w-xs">
              Interested in joining the team? See the note below.
            </p>
          </div>
        </div>
      </section>

      {/* Advisory */}
      <section className="border-y border-white/10 bg-white/5 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-6">Advisory network</h2>
            <p className="text-gray-400 leading-relaxed">
              We work closely with a network of compliance specialists, UK solicitors, and Companies House experts to keep our products accurate and up-to-date with the latest regulatory changes. Our advisors include qualified barristers, chartered accountants, and former regulatory staff who review our data models and product assumptions on an ongoing basis.
            </p>
          </div>
        </div>
      </section>

      {/* Hiring */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">We're growing</h2>
        <p className="text-gray-400 mb-8 max-w-lg mx-auto">
          If you're passionate about compliance automation, UK legal technology, or building developer infrastructure, we'd love to hear from you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="mailto:team@ultai.group"
            className="px-8 py-3 bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white font-semibold rounded-lg transition-colors"
          >
            team@ultai.group
          </a>
          <Link
            href="/contact"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-lg transition-colors"
          >
            Send a message
          </Link>
        </div>
      </section>
    </div>
  );
}
