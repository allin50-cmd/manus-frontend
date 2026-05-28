import PublicNav from '@/components/layout/PublicNav';
import { Building2 } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Building2 className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">About VaultLine Brand Suite</h1>
          <p className="text-xl text-gray-400">
            Enterprise compliance and security solutions
          </p>
        </div>
      </div>
    </div>
  );
}
