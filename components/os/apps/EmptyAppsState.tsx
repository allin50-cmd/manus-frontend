export default function EmptyAppsState({ message }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center">
      <p className="text-white/60">{message ?? 'No applications installed yet.'}</p>
    </div>
  )
}
