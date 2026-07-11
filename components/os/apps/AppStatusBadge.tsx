const STYLES: Record<string, string> = {
  live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  beta: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  coming_soon: 'bg-white/10 text-white/50 border-white/10',
}

const LABELS: Record<string, string> = {
  live: 'Live',
  beta: 'Beta',
  coming_soon: 'Coming soon',
}

export default function AppStatusBadge({ status }: { status: string }) {
  const style = STYLES[status] ?? STYLES.coming_soon
  const label = LABELS[status] ?? status

  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${style}`}>
      {label}
    </span>
  )
}
