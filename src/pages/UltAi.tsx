import { useSwarm } from '@/contexts/SwarmContext';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { FileText, ArrowRight } from 'lucide-react';

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

export default function UltAi() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10]">
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <FileText className="w-16 h-16 text-cyan-400" />
          </div>
          <div className="flex justify-center mb-6">
            <SwarmStatusBadge />
          </div>
          <h1 className="text-5xl font-bold text-white mb-6">
            UltAi Secure Intake
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
            AI-powered secure client matter intake for law firms
          </p>
          <Button
            onClick={() => setLocation('/intake-sheet')}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-lg"
          >
            Try Intake Sheet
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
