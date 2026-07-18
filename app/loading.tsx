import Skeleton from '../components/Skeleton'

// Root loading fallback — shown inside the root <main> (below the NavBar) while a
// server component page fetches. Kept shape-neutral (header + a few blocks + rows)
// so it reads as generic "content loading" across dashboards, lists and forms
// rather than implying one page's specific layout.
export default function Loading() {
  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-56 bg-slate-200" />
        <Skeleton className="h-4 w-72 bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl bg-slate-200" />
        ))}
      </div>

      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-200" />
        ))}
      </div>
    </div>
  )
}
