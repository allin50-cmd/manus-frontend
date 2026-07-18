import Skeleton from '../components/Skeleton'

// Root loading fallback — shown inside the root <main> (below the NavBar) while a
// server component page fetches. Light surface to match the default bg-slate-50
// pages (dashboard, portfolio, today, etc.).
export default function Loading() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56 bg-slate-200" />
        <Skeleton className="h-4 w-72 bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
            <Skeleton className="h-4 w-20 bg-slate-200" />
            <Skeleton className="h-8 w-16 bg-slate-200" />
            <Skeleton className="h-3 w-24 bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-slate-200" />
              <Skeleton className="h-3 w-1/2 bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
