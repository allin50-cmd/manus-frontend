'use client'

interface AppLaunchButtonProps {
  appId: string
  launchUrl: string
  label?: string
  className?: string
}

export default function AppLaunchButton({ appId, launchUrl, label = 'Open', className }: AppLaunchButtonProps) {
  return (
    <a
      href={launchUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        // Best-effort usage log — never blocks navigation.
        fetch(`/api/apps/${appId}/launch`, { method: 'POST' }).catch(() => {})
      }}
      aria-label={`${label} — opens in a new tab`}
      className={
        className ??
        'inline-flex items-center gap-1.5 rounded-lg bg-white text-black px-3 py-1.5 text-sm font-medium transition hover:bg-white/90'
      }
    >
      {label}
      <span aria-hidden="true">↗</span>
    </a>
  )
}
