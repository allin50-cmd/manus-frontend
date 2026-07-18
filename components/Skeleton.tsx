// Reusable animated placeholder. Callers set the surface colour via className
// (e.g. `bg-slate-200` on light pages, `bg-white/10` on the dark OS shell) so the
// same primitive works on both surfaces.
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md ${className}`} />
}
