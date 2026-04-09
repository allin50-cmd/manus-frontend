import { Shield } from 'lucide-react';

export function TestimonialBlock() {
  return (
    <div className="flex flex-col md:flex-row items-center gap-8 rounded-2xl border bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-blue-600" />
          <span className="font-bold text-xl"><span className="text-blue-600">Fine</span>Guard Pro</span>
        </div>
        <div className="flex gap-2 text-xs text-slate-400 font-medium">
          <span className="border rounded px-1.5 py-0.5">CE</span>
          <span className="border rounded px-1.5 py-0.5">ISO</span>
          <span className="border rounded px-1.5 py-0.5">9001</span>
        </div>
      </div>
      <blockquote className="text-slate-700 italic text-base leading-relaxed">
        "FineGuard Pro caught a filing issue we would have missed. Saved us from a £500 penalty."
        <footer className="mt-2 text-sm font-semibold text-slate-800 not-italic">— Laura M., Business Owner</footer>
      </blockquote>
    </div>
  );
}
