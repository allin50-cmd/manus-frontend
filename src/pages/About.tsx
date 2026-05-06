import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Building2, Shield, Globe, Zap, CheckCircle } from 'lucide-react';

const values = [
  {
    icon: Shield,
    title: 'Security First',
    description:
      'Every product we build starts with a threat model. We hold ISO 27001 certification and undergo independent penetration testing twice a year.',
  },
  {
    icon: Zap,
    title: 'Compliance Automation',
    description:
      'We eliminate manual compliance workflows by encoding regulatory requirements directly into software, reducing audit preparation time by up to 80%.',
  },
  {
    icon: Globe,
    title: 'Enterprise Scale',
    description:
      'Our infrastructure is designed for the demands of global enterprises — multi-region data residency, 99.9% uptime SLAs, and support for tens of thousands of concurrent users.',
  },
];

const stats = [
  { value: '500+', label: 'Enterprise clients' },
  { value: '99.9%', label: 'Uptime' },
  { value: 'ISO 27001', label: 'Certified' },
  { value: '24/7', label: 'Support' },
];

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-6xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="text-center mb-20">
          <Building2 className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-5xl font-bold text-white mb-4">VaultLine Brand Suite</h1>
          <p className="text-2xl text-[#5A4BFF] font-medium mb-6">
            Securing the future of enterprise compliance
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            We build the compliance and security infrastructure that regulated industries rely on —
            so their teams can focus on the work that matters.
          </p>
        </div>

        {/* Mission / Value cards */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-white text-center mb-10">What we stand for</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="bg-white/5 border border-white/10 rounded-2xl p-6"
              >
                <Icon className="w-10 h-10 text-[#5A4BFF] mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company story */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-20">
          <h2 className="text-3xl font-bold text-white mb-6">Our story</h2>
          <p className="text-gray-400 leading-relaxed text-lg">
            VaultLine was founded in 2018 by a team of former financial-services technology leaders
            who had spent years watching compliance teams drown in spreadsheets, email trails, and
            last-minute audit scrambles. After repeated conversations with CISOs and General Counsels
            at FTSE 250 firms, one message was unmistakable: the tooling simply had not kept pace
            with the regulatory burden. We set out to change that. Starting with a single secure
            document-vault product aimed at UK financial institutions, we grew through word of mouth
            among compliance officers. Today the VaultLine Brand Suite spans three products —
            VaultLine Cloud, UltAi, and FineGuard — serving over 500 enterprises across financial
            services, healthcare, and professional services. We remain headquartered in London and
            are backed by leading European enterprise-software investors.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center"
            >
              <p className="text-3xl font-bold text-[#5A4BFF] mb-2">{value}</p>
              <p className="text-gray-400">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join our mission</h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            Discover how VaultLine can transform compliance from a cost centre into a competitive
            advantage for your organisation.
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            <CheckCircle className="w-5 h-5 mr-2" />
            Book a Demo
          </Button>
        </div>
      </div>
    </div>
  );
}
