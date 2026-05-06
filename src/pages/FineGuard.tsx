import { useSwarm } from '@/contexts/SwarmContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Shield, ArrowRight } from 'lucide-react';

function SwarmStatusBadge() {
  const { snapshot } = useSwarm();
  const pct = Math.round(snapshot.swarmConfidence * 100);
  const ok = pct >= 70;
  if (snapshot.tick === 0) return null;
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/10 text-xs font-medium text-[#1A1A1A]/70">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      System {ok ? 'Operational' : 'Degraded'} · {pct}% confidence
    </div>
  );
}

export default function FineGuard() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-[#C9A64A]" />
          </div>
          <div className="flex justify-center mb-6">
            <SwarmStatusBadge />
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
