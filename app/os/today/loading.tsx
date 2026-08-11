export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-7 w-48 bg-slate-200 rounded" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-xl p-3 h-20" />
        ))}
      </div>

      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-9 w-28 bg-slate-100 border border-slate-200 rounded-full" />
        ))}
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-32 bg-slate-200 rounded" />
          <div className="h-14 bg-white border border-slate-200 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
