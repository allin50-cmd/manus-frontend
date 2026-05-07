export default function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F1014] p-6 space-y-6">
      {/* Fake nav bar */}
      <div className="h-14 w-full rounded bg-white/5 animate-pulse" />

      {/* Hero skeleton */}
      <div className="h-40 w-full rounded-2xl bg-white/5 animate-pulse" />

      {/* 3-column card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
        <div className="h-32 rounded-xl bg-white/5 animate-pulse" />
      </div>
    </div>
  );
}
