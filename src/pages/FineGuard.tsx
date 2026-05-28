import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/layout/PublicNav';
import { Shield, ArrowRight } from 'lucide-react';

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <PublicNav variant="light" />
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Shield className="w-16 h-16 text-[#C9A64A]" />
          </div>
          <h1 className="text-5xl font-bold text-[#1A1A1A] mb-6">
            FineGuard Compliance Cloud
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Automated Companies House compliance tracking and alerts
          </p>
          <Button
            onClick={() => setLocation('/compliance-bundle')}
            className="bg-[#C9A64A] hover:bg-[#B8954A] text-white px-8 py-6 text-lg"
          >
            Get Compliance Bundle
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
