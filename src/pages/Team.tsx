import { Users } from 'lucide-react';
import PublicNav from '@/components/layout/PublicNav';

export default function Team() {
  return (
    <div className="min-h-screen theme-light-default bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <PublicNav />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Users className="w-16 h-16 text-[#5A4BFF] mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Our Team</h1>
          <p className="text-xl text-gray-400">
            Meet the experts behind VaultLine Brand Suite
          </p>
        </div>
      </div>
    </div>
  );
}
