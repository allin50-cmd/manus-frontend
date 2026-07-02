'use client'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
}

export default function MetricCard({
  title,
  value,
  subtitle,
}: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm text-white/60">{title}</p>

      <h2 className="mt-2 text-3xl font-bold text-white">
        {value}
      </h2>

      {subtitle && (
        <p className="mt-2 text-xs text-white/40">
          {subtitle}
        </p>
      )}
    </div>
  )
}

