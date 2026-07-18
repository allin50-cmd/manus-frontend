import AppShell from '@/components/os/layout/AppShell'
import Skeleton from '@/components/Skeleton'

// Loading fallback scoped to the launcher — the /os page that both uses AppShell
// and loads installed-apps data server-side. Placed at this depth (not app/os/)
// on purpose: most /os pages are light and sidebar-less, so a shared AppShell
// skeleton would flash a fake dark sidebar on them. Here it matches the
// launcher's real chrome and shape (header, command bar, metric row, tile grid);
// the other /os pages fall back to the neutral light root app/loading.tsx.
export default function LauncherLoading() {
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
            <Skeleton key={i} className="h-40 rounded-2xl bg-white/10" />
          ))}
        </div>
      </div>
    </AppShell>
  )
}
