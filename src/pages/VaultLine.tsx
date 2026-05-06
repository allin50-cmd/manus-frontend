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
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 text-xs font-medium text-white/70">
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-400' : 'bg-amber-400'}`} />
      System {ok ? 'Operational' : 'Degraded'} · {pct}% confidence
    </div>
  );
}

export default function VaultLine() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-16 h-16 text-[#5A4BFF]" />
          </div>
          <div className="flex justify-center mb-6">
            <SwarmStatusBadge />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            VaultLine Cloud
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            Enterprise-grade secure document storage and compliance management
          </p>
          <Button
            onClick={() => setLocation('/book-demo')}
            className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white px-8 py-6 text-lg"
          >
            Book a Demo
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
