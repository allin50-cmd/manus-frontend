import AppShell from '@/components/os/layout/AppShell'
import Skeleton from '@/components/Skeleton'

// Loading fallback for the /os/* surface. Rendered inside AppShell so the dark
// sidebar + top bar stay put (matching how every /os page self-wraps in AppShell)
// while the page's server data loads. Mirrors the launcher layout: title, metric
// row, then a tile grid.
export default function OsLoading() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-64 bg-white/10" />
          <Skeleton className="h-4 w-40 bg-white/10" />
        </div>

        <Skeleton className="h-14 w-full rounded-2xl bg-white/10" />

        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-white/10" />
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-white/10" />
              <Skeleton className="h-5 w-24 bg-white/10" />
              <Skeleton className="h-3 w-28 bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
