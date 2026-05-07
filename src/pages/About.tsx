import Nav from '@/components/Nav';
import { useEffect } from 'react';

export default function About() {
  useEffect(() => {
    document.title = 'About — VaultLine Suite';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <Nav />
      <div className="pt-14">
        <div className="max-w-3xl mx-auto px-4 py-20">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
            About VaultLine Brand Suite
          </h1>

          <p className="text-lg text-gray-300 leading-relaxed mb-16">
            VaultLine Brand Suite builds enterprise compliance and security tools for law firms,
            property managers, and regulated businesses. We believe compliance software should be
            fast, honest, and beautifully simple.
          </p>

          <div className="space-y-12">
            <div className="border-l-2 border-[#C9A64A] pl-6">
              <h2 className="text-xl font-bold text-[#C9A64A] mb-3">FineGuard</h2>
              <p className="text-gray-300 leading-relaxed">
                FineGuard automates Companies House compliance monitoring so you never miss a
                filing deadline again. It watches your registered entities around the clock,
                delivers real-time alerts the moment a deadline approaches, and generates
                instant compliance reports — giving you a clear audit trail without the manual
                overhead.
              </p>
            </div>

            <div className="border-l-2 border-cyan-400 pl-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-3">UltAi Intake</h2>
              <p className="text-gray-300 leading-relaxed">
                UltAi Intake is an AI-powered client onboarding platform purpose-built for
                law firms operating under SRA regulation. It captures matter details through
                intelligent, customisable workflows, encrypts every submission end-to-end,
                and surfaces the structured data your team needs — turning hours of admin
                into minutes.
              </p>
            </div>

            <div className="border-l-2 border-[#5A4BFF] pl-6">
              <h2 className="text-xl font-bold text-[#5A4BFF] mb-3">VaultLine Cloud</h2>
              <p className="text-gray-300 leading-relaxed">
                VaultLine Cloud is zero-knowledge document storage for regulated industries.
                Documents are encrypted client-side before they ever leave your device, meaning
                even we cannot read your files. With unlimited storage, enterprise SSO, role-based
                access control, and a dedicated support team, VaultLine Cloud is the secure
                backbone your firm can build on.
              </p>
            </div>
          </div>

          <p className="mt-16 text-sm text-gray-500">
            Built in the UK · Founded 2024
          </p>
        </div>
      </div>
    </div>
  );
}
